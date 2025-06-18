const { createCommands } = require("./constants");
const state = require("./state");
const { initializeMqtt, publishMessage } = require("./mqtt");
const { debounce } = require("lodash");

let commands = null;
let isInitialized = false;
let debouncedUp = null;
let debouncedDown = null;
let debounceTime = 1000; // Default 1 second

function initializeBlinds(config) {
    if (isInitialized) {
        return; // Already initialized
    }

    // Initialize MQTT
    initializeMqtt(config.mqtt);
    
    // Initialize state with reversed position system (0 = closed, 100 = open)
    state.initializeState(config.initialPosition || 100, config.travelTime || 30000);
    
    // Set debounce time from config
    debounceTime = config.debounceTime || 1000;
    
    // Create debounced functions
    debouncedUp = debounce(async () => {
        await publishMessage(commands.UP);
    }, debounceTime);
    
    debouncedDown = debounce(async () => {
        await publishMessage(commands.DOWN);
    }, debounceTime);
    
    // Create commands using the full config
    commands = createCommands(config);
    
    isInitialized = true;
}

async function open() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    console.log('Opening blinds completely (no stop command will be sent)');
    await debouncedUp();
}

async function close() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    console.log('Closing blinds completely (no stop command will be sent)');
    await debouncedDown();
}

async function stop() {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }
    // Stop command should not be debounced as it's critical for safety
    await publishMessage(commands.STOP);
}

async function setPosition(position) {
    if (!isInitialized) {
        throw new Error('Blinds not initialized. Call initializeBlinds() first.');
    }

    if (position < 0 || position > 100) {
        throw new Error('Position must be between 0 and 100');
    }

    // Handle edge cases: treat >97% as fully open and <3% as fully closed
    let targetPosition = position;
    if (position > 97) {
        targetPosition = 100;
        console.log(`Position ${position}% treated as fully open (100%)`);
    } else if (position < 3) {
        targetPosition = 0;
        console.log(`Position ${position}% treated as fully closed (0%)`);
    }

    // Calculate the difference between current and target position
    const currentPosition = state.getCurrentPosition();
    const positionDifference = targetPosition - currentPosition;
    
    if (positionDifference === 0) {
        console.log(`Window is already at position ${targetPosition}%`);
        return;
    }

    // Calculate travel time based on the percentage difference
    const travelTime = Math.abs(positionDifference) * (state.getTotalTravelTime() / 100);
    
    // Determine direction and command (0 = closed, 100 = open)
    const direction = positionDifference > 0 ? 'up' : 'down';
    
    console.log(`Moving window ${direction} from ${currentPosition}% to ${targetPosition}%`);
    console.log(`Travel time: ${travelTime}ms`);
    
    try {
        // Send the movement command with debouncing
        if (positionDifference > 0) {
            await debouncedUp();
        } else {
            await debouncedDown();
        }
        
        // Wait for the calculated travel time
        await new Promise(resolve => setTimeout(resolve, travelTime));
        
        // Only send stop command if not going to full closed (0%) or full open (100%)
        if (targetPosition !== 0 && targetPosition !== 100) {
            await publishMessage(commands.STOP);
            console.log('Sent stop command');
        } else {
            console.log(`No stop command sent for ${targetPosition === 0 ? 'full closed' : 'full open'}`);
        }

        // Update the current position
        state.setCurrentPosition(targetPosition);
        
        console.log(`Window position set to ${targetPosition}%`);
    } catch (error) {
        console.error('Error setting window position:', error);
        // Try to stop movement in case of error (always safe to stop)
        try {
            await publishMessage(commands.STOP);
        } catch (stopError) {
            console.error('Error stopping window movement:', stopError);
        }
        throw error;
    }
}

module.exports = { initializeBlinds, open, close, stop, setPosition };