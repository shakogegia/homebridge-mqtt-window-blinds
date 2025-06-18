const { createCommands } = require("./constants");
const state = require("./state");
const { initializeMqtt, publishMessage } = require("./mqtt");

let commands = null;
let isInitialized = false;

function initializeBlinds(config) {
    if (isInitialized) {
        return; // Already initialized
    }

    // Initialize MQTT
    initializeMqtt(config.mqtt);
    
    // Initialize state
    state.initializeState(config.initialPosition || 70, config.travelTime || 30000);
    
    // Create commands using the full config
    commands = createCommands(config);
    
    isInitialized = true;
}

async function open() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    await publishMessage(commands.UP);
}

async function close() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    await publishMessage(commands.DOWN);
}

async function stop() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    await publishMessage(commands.STOP);
}

async function setPosition(position) {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }

    if (position < 0 || position > 100) {
        throw new Error('Position must be between 0 and 100');
    }

    // Calculate the difference between current and target position
    const currentPosition = state.getCurrentPosition();
    const positionDifference = position - currentPosition;
    
    if (positionDifference === 0) {
        console.log(`Window is already at position ${position}%`);
        return;
    }

    // Calculate travel time based on the percentage difference
    const travelTime = Math.abs(positionDifference) * (state.getTotalTravelTime() / 100);
    
    // Determine direction and command
    const command = positionDifference > 0 ? commands.DOWN : commands.UP;
    const direction = positionDifference > 0 ? 'down' : 'up';
    
    console.log(`Moving window ${direction} from ${currentPosition}% to ${position}%`);
    console.log(`Travel time: ${travelTime}ms`);
    
    try {
        // Send the movement command
        await publishMessage(command);
        
        // Wait for the calculated travel time
        await new Promise(resolve => setTimeout(resolve, travelTime));
        
        // Stop the movement
        await publishMessage(commands.STOP);

        // Update the current position
        state.setCurrentPosition(position);
        
        console.log(`Window position set to ${position}%`);
    } catch (error) {
        console.error('Error setting window position:', error);
        // Try to stop movement in case of error
        try {
            await publishMessage(commands.STOP);
        } catch (stopError) {
            console.error('Error stopping window movement:', stopError);
        }
        throw error;
    }
}

module.exports = { initializeBlinds, open, close, stop, setPosition };