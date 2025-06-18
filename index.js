const { Accessory, Service, Characteristic, Categories } = require('hap-nodejs');
const { initializeBlinds, setPosition, open, close, stop } = require('./utils/blinds');
const state = require('./utils/state');

class WindowBlindsAccessory {
    constructor(log, config) {
        this.log = log;
        this.config = config;
        this.name = config.name || 'Window Blinds';
        this.manufacturer = config.manufacturer || 'Custom';
        this.model = config.model || 'MQTT Blinds';
        this.serialNumber = config.serialNumber || 'BLINDS001';
        
        // Validate required configuration
        this.validateConfig(config);
        
        // Initialize blinds with configuration
        this.initializeBlindsWithConfig(config);
        
        // Create the accessory
        this.accessory = new Accessory(this.name, this.serialNumber);
        this.accessory.category = Categories.WINDOW_COVERING;
        
        // Add accessory information
        const accessoryInfo = this.accessory.getService(Service.AccessoryInformation);
        accessoryInfo
            .setCharacteristic(Characteristic.Manufacturer, this.manufacturer)
            .setCharacteristic(Characteristic.Model, this.model)
            .setCharacteristic(Characteristic.SerialNumber, this.serialNumber);
        
        // Create the window covering service
        this.windowCoveringService = this.accessory.addService(Service.WindowCovering, this.name);
        
        // Set up characteristics
        this.setupCharacteristics();
        
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
            initialPosition: config.initialPosition || 70,
            travelTime: config.travelTime || 30000
        };
        
        initializeBlinds(blindsConfig);
    }
    
    setupCharacteristics() {
        // Target Position (0-100, where 0 is fully open, 100 is fully closed)
        this.windowCoveringService
            .getCharacteristic(Characteristic.TargetPosition)
            .on('set', this.setTargetPosition.bind(this))
            .on('get', this.getTargetPosition.bind(this));
        
        // Current Position
        this.windowCoveringService
            .getCharacteristic(Characteristic.CurrentPosition)
            .on('get', this.getCurrentPosition.bind(this));
        
        // Position State
        this.windowCoveringService
            .getCharacteristic(Characteristic.PositionState)
            .on('get', this.getPositionState.bind(this));
        
        // Hold Position (optional - allows stopping)
        this.windowCoveringService
            .getCharacteristic(Characteristic.HoldPosition)
            .on('set', this.setHoldPosition.bind(this));
    }
    
    async setTargetPosition(value, callback) {
        try {
            this.log(`Setting blinds to position: ${value}%`);
            
            // Convert HomeKit position (0-100) to our system
            // HomeKit: 0 = fully open, 100 = fully closed
            // Our system: 0 = fully closed, 100 = fully open
            const targetPosition = 100 - value;
            
            await setPosition(targetPosition);
            
            // Update current position characteristic
            this.windowCoveringService
                .getCharacteristic(Characteristic.CurrentPosition)
                .updateValue(value);
            
            callback(null);
        } catch (error) {
            this.log.error(`Error setting target position: ${error.message}`);
            callback(error);
        }
    }
    
    getTargetPosition(callback) {
        // Convert our position to HomeKit format
        const homekitPosition = 100 - state.getCurrentPosition();
        this.log(`Getting target position: ${homekitPosition}%`);
        callback(null, homekitPosition);
    }
    
    getCurrentPosition(callback) {
        // Convert our position to HomeKit format
        const homekitPosition = 100 - state.getCurrentPosition();
        this.log(`Getting current position: ${homekitPosition}%`);
        callback(null, homekitPosition);
    }
    
    getPositionState(callback) {
        // For now, we'll return STOPPED as we don't track movement state
        // You could enhance this by tracking movement state in your state.js
        callback(null, Characteristic.PositionState.STOPPED);
    }
    
    async setHoldPosition(value, callback) {
        try {
            if (value) {
                this.log('Stopping blinds movement');
                await stop();
            }
            callback(null);
        } catch (error) {
            this.log.error(`Error stopping blinds: ${error.message}`);
            callback(error);
        }
    }
    
    getAccessory() {
        return this.accessory;
    }
}

module.exports = function(homebridge) {
    // Register the accessory
    homebridge.registerAccessory('homebridge-mqtt-window-blinds', 'WindowBlinds', WindowBlindsAccessory);
}; 