const { createCommands } = require("./constants");
const state = require("./state");
const { initializeMqtt, publishMessage } = require("./mqtt");

let commands = null;
let isInitialized = false;
let debounceTime = 1000; // Default 1 second
let travelTimeUp = 30000; // Default 30 seconds for up
let travelTimeDown = 30000; // Default 30 seconds for down

// Debounce tracking variables
let upTimeout = null;
let downTimeout = null;
let lastUpCall = 0;
let lastDownCall = 0;

function initializeBlinds(config) {
    if (isInitialized) {
        return; // Already initialized
    }

    // Initialize MQTT
    initializeMqtt(config.mqtt);
    
    // Initialize state with reversed position system (0 = closed, 100 = open)
    state.initializeState(config.initialPosition ?? 0, config.travelTimeUp || 30000);
    
    // Set debounce time from config
    debounceTime = config.debounceTime || 1000;
    
    // Set travel times from config
    travelTimeUp = config.travelTimeUp || 30000;
    travelTimeDown = config.travelTimeDown || 30000;
    
    // Create commands using the full config
    commands = createCommands(config);
    
    isInitialized = true;
}

// Custom debounce function that ensures latest call is executed
async function debouncedUp() {
    const now = Date.now();
    lastUpCall = now;
    
    // Clear existing timeout
    if (upTimeout) {
        clearTimeout(upTimeout);
    }
    
    // Set new timeout
    upTimeout = setTimeout(async () => {
        // Only execute if this is still the latest call
        if (lastUpCall === now) {
            await publishMessage(commands.UP);
        }
    }, debounceTime);
}

async function debouncedDown() {
    const now = Date.now();
    lastDownCall = now;
    
    // Clear existing timeout
    if (downTimeout) {
        clearTimeout(downTimeout);
    }
    
    // Set new timeout
    downTimeout = setTimeout(async () => {
        // Only execute if this is still the latest call
        if (lastDownCall === now) {
            await publishMessage(commands.DOWN);
        }
    }, debounceTime);
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
    
    console.log(`Position difference: ${positionDifference}`, JSON.stringify(state));

    // Calculate travel time based on the percentage difference and direction
    const travelTime = Math.abs(positionDifference) * (targetPosition > currentPosition ? travelTimeUp : travelTimeDown) / 100;
    
    // Determine direction and command (0 = closed, 100 = open)
    const direction = targetPosition > currentPosition ? 'up' : 'down';
    
    console.log(`Moving window ${direction} from ${currentPosition}% to ${targetPosition}%`);
    console.log(`Travel time: ${travelTime}ms (using ${direction === 'up' ? 'travelTimeUp' : 'travelTimeDown'})`);
    
    try {
        // Send the movement command with debouncing
        if (direction === 'up') {
            await debouncedUp();
        } else {
            await debouncedDown();
        }
        
        // Update the target position immediately
        state.setCurrentPosition(targetPosition);
        
        // Schedule the stop command after travel time (if needed)
        if (targetPosition !== 0 && targetPosition !== 100) {
            setTimeout(async () => {
                try {
                    await publishMessage(commands.STOP);
                    console.log('Sent stop command after travel time');
                } catch (error) {
                    console.error('Error sending stop command:', error);
                }
            }, travelTime);
        } else {
            console.log(`No stop command scheduled for ${targetPosition === 0 ? 'full closed' : 'full open'}`);
        }
        
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