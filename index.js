const { initializeBlinds, setPosition, open, close, stop } = require('./utils/blinds');
const state = require('./utils/state');

let Accessory, Service, Characteristic;

class WindowBlindsAccessory {
    constructor(log, config, api) {
        this.log = log;
        this.config = config;
        this.api = api;
        this.name = config.name || 'Window Blinds';
        this.manufacturer = config.manufacturer || 'Custom';
        this.model = config.model || 'MQTT Blinds';
        this.serialNumber = config.serialNumber || 'BLINDS001';
        
        // Track movement state for HomeKit
        this.isMoving = false;
        this.movementDirection = null;
        this.targetPosition = null;
        this.startPosition = null;
        this.movementStartTime = null;
        
        // Store service references for faster updates
        this.windowCoveringService = null;
        this.targetPositionCharacteristic = null;
        this.currentPositionCharacteristic = null;
        this.positionStateCharacteristic = null;
        
        // Validate required configuration
        this.validateConfig(config);
        
        // Initialize blinds with configuration
        this.initializeBlindsWithConfig(config);
        
        this.log(`Window Blinds accessory "${this.name}" initialized`);
    }
    
    validateConfig(config) {
        const requiredFields = ['mqtt'];
        const requiredMqttFields = ['host', 'port', 'topicPrefix'];
        
        for (const field of requiredFields) {
            if (!config[field]) {
                throw new Error(`Missing required configuration field: ${field}`);
            }
        }
        
        for (const field of requiredMqttFields) {
            if (!config.mqtt[field]) {
                throw new Error(`Missing required MQTT configuration field: ${field}`);
            }
        }
    }
    
    initializeBlindsWithConfig(config) {
        const blindsConfig = {
            mqtt: {
                host: config.mqtt.host,
                port: config.mqtt.port || 1883,
                topicPrefix: config.mqtt.topicPrefix,
                username: config.mqtt.username,
                password: config.mqtt.password,
                clientId: config.mqtt.clientId || `blinds_${this.serialNumber}`
            },
            upCommand: config.upCommand || 'up',
            downCommand: config.downCommand || 'down',
            stopCommand: config.stopCommand || 'stop',
            saveCommand: config.saveCommand || 'save',
            initialPosition: config.initialPosition || 100,
            travelTimeUp: config.travelTimeUp || 30000,
            travelTimeDown: config.travelTimeDown || 30000,
            debounceTime: config.debounceTime || 1000
        };
        
        initializeBlinds(blindsConfig);
    }
    
    // Required methods for Homebridge compatibility
    getServices() {
        const services = [];
        
        // Accessory Information Service
        const accessoryInfo = new Service.AccessoryInformation();
        accessoryInfo
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serialNumber)
            .setCharacteristic(Characteristic.FirmwareRevision, '1.0.0')
            .setCharacteristic(Characteristic.Name, this.name);
        services.push(accessoryInfo);
        
        // Window Covering Service
        this.windowCoveringService = new Service.WindowCovering(this.name);
        
        // Target Position (0-100, where 0 is fully closed, 100 is fully open)
        this.targetPositionCharacteristic = this.windowCoveringService
            .getCharacteristic(Characteristic.TargetPosition);
        this.targetPositionCharacteristic
            .on('set', this.setTargetPosition.bind(this))
            .on('get', this.getTargetPosition.bind(this));
        
        // Current Position
        this.currentPositionCharacteristic = this.windowCoveringService
            .getCharacteristic(Characteristic.CurrentPosition);
        this.currentPositionCharacteristic
            .on('get', this.getCurrentPosition.bind(this));
        
        // Position State
        this.positionStateCharacteristic = this.windowCoveringService
            .getCharacteristic(Characteristic.PositionState);
        this.positionStateCharacteristic
            .on('get', this.getPositionState.bind(this));
        
        // Hold Position (optional - allows stopping)
        this.windowCoveringService
            .getCharacteristic(Characteristic.HoldPosition)
            .on('set', this.setHoldPosition.bind(this));
        
        services.push(this.windowCoveringService);
        
        return services;
    }
    
    async setTargetPosition(value, callback) {
        try {
            this.log(`Setting blinds to position: ${value}%`);
            
            // Store movement parameters
            this.targetPosition = value;
            this.startPosition = state.getCurrentPosition();
            this.movementStartTime = Date.now();
            
            // Set movement state (0 = closed, 100 = open)
            this.isMoving = true;
            this.movementDirection = value > this.startPosition ? 'up' : 'down';
            
            // Immediately update HomeKit state
            this.updateHomeKitState();
            
            // Start progressive position updates
            this.startProgressiveUpdates();
            
            // Use reversed position system (0 = fully closed, 100 = fully open)
            await setPosition(value);
            
            // Clear movement state
            this.isMoving = false;
            this.movementDirection = null;
            this.targetPosition = null;
            this.startPosition = null;
            this.movementStartTime = null;
            
            // Final state update
            this.updateHomeKitState();
            
            callback(null);
        } catch (error) {
            this.log.error(`Error setting target position: ${error.message}`);
            
            // Clear movement state on error
            this.isMoving = false;
            this.movementDirection = null;
            this.targetPosition = null;
            this.startPosition = null;
            this.movementStartTime = null;
            this.updateHomeKitState();
            
            callback(error);
        }
    }
    
    startProgressiveUpdates() {
        if (!this.isMoving || !this.targetPosition || !this.startPosition || !this.movementStartTime) {
            return;
        }
        
        const updateInterval = 500; // Update every 500ms
        const totalTravelTime = this.movementDirection === 'up' ? 
            this.config.travelTimeUp || 30000 : 
            this.config.travelTimeDown || 30000;
        
        const progressInterval = setInterval(() => {
            if (!this.isMoving) {
                clearInterval(progressInterval);
                return;
            }
            
            const elapsed = Date.now() - this.movementStartTime;
            const progress = Math.min(elapsed / totalTravelTime, 1);
            
            // Calculate current position based on progress
            const currentPosition = Math.round(
                this.startPosition + (this.targetPosition - this.startPosition) * progress
            );
            
            // Update state with calculated position
            state.setCurrentPosition(currentPosition);
            
            // Update HomeKit immediately
            this.updateHomeKitState();
            
            // Stop updates if movement is complete
            if (progress >= 1) {
                clearInterval(progressInterval);
            }
        }, updateInterval);
    }
    
    updateHomeKitState() {
        if (!this.targetPositionCharacteristic || !this.currentPositionCharacteristic || !this.positionStateCharacteristic) {
            return;
        }
        
        const currentPosition = state.getCurrentPosition();
        
        // Update characteristics immediately
        this.targetPositionCharacteristic.updateValue(currentPosition);
        this.currentPositionCharacteristic.updateValue(currentPosition);
        
        if (this.isMoving) {
            if (this.movementDirection === 'up') {
                this.positionStateCharacteristic.updateValue(Characteristic.PositionState.OPENING);
            } else {
                this.positionStateCharacteristic.updateValue(Characteristic.PositionState.CLOSING);
            }
        } else {
            this.positionStateCharacteristic.updateValue(Characteristic.PositionState.STOPPED);
        }
    }
    
    getTargetPosition(callback) {
        const homekitPosition = state.getCurrentPosition();
        this.log(`Getting target position: ${homekitPosition}%`);
        callback(null, homekitPosition);
    }
    
    getCurrentPosition(callback) {
        const homekitPosition = state.getCurrentPosition();
        this.log(`Getting current position: ${homekitPosition}%`);
        callback(null, homekitPosition);
    }
    
    getPositionState(callback) {
        if (this.isMoving) {
            if (this.movementDirection === 'up') {
                callback(null, Characteristic.PositionState.OPENING);
            } else {
                callback(null, Characteristic.PositionState.CLOSING);
            }
        } else {
            callback(null, Characteristic.PositionState.STOPPED);
        }
    }
    
    async setHoldPosition(value, callback) {
        try {
            if (value) {
                this.log('Stopping blinds movement');
                await stop();
                
                // Clear movement state
                this.isMoving = false;
                this.movementDirection = null;
                this.targetPosition = null;
                this.startPosition = null;
                this.movementStartTime = null;
                this.updateHomeKitState();
            }
            callback(null);
        } catch (error) {
            this.log.error(`Error stopping blinds: ${error.message}`);
            callback(error);
        }
    }
    
    // Identify method for HomeKit pairing
    identify(callback) {
        this.log(`Identify requested for ${this.name}`);
        callback();
    }
}

module.exports = function(homebridge) {
    // Store the homebridge API for later use
    Accessory = homebridge.platformAccessory;
    Service = homebridge.hap.Service;
    Characteristic = homebridge.hap.Characteristic;
    
    // Register the accessory
    homebridge.registerAccessory('homebridge-mqtt-window-blinds', 'WindowBlinds', WindowBlindsAccessory);
}; 