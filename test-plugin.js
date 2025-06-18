const { initializeBlinds, setPosition, open, close, stop } = require('./utils/blinds');

// Test configuration - replace with your actual MQTT settings
const testConfig = {
    mqtt: {
        host: process.env.MQTT_HOST || 'localhost',
        port: parseInt(process.env.MQTT_PORT) || 1883,
        topicPrefix: process.env.MQTT_TOPIC_PREFIX || 'blinds',
        username: process.env.MQTT_USERNAME,
        password: process.env.MQTT_PASSWORD,
        clientId: process.env.MQTT_CLIENT_ID || 'test_blinds_controller'
    },
    initialPosition: 70,
    travelTime: parseInt(process.env.TRAVEL_TIME) || 30000
};

async function testPlugin() {
    console.log('🧪 Testing Homebridge Window Blinds Plugin...\n');
    
    try {
        // Initialize blinds with configuration
        console.log('Initializing blinds with configuration...');
        initializeBlinds(testConfig);
        console.log('✅ Blinds initialized successfully\n');
        
        // Test 1: Open blinds
        console.log('1. Testing open() function...');
        await open();
        console.log('✅ Open function works\n');
        
        // Test 2: Close blinds
        console.log('2. Testing close() function...');
        await close();
        console.log('✅ Close function works\n');
        
        // Test 3: Set position to 50%
        console.log('3. Testing setPosition(50)...');
        await setPosition(50);
        console.log('✅ Set position function works\n');
        
        // Test 4: Set position to 80%
        console.log('4. Testing setPosition(80)...');
        await setPosition(80);
        console.log('✅ Set position function works\n');
        
        // Test 5: Stop movement
        console.log('5. Testing stop() function...');
        await stop();
        console.log('✅ Stop function works\n');
        
        console.log('🎉 All tests passed! Your plugin should work correctly with Homebridge.');
        console.log('\n📝 Note: Make sure to configure your MQTT settings in the Homebridge config file.');
        
    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.log('\nPlease check your MQTT configuration:');
        console.log('- MQTT_HOST: MQTT broker IP address');
        console.log('- MQTT_PORT: MQTT broker port (default: 1883)');
        console.log('- MQTT_TOPIC_PREFIX: Topic prefix for blinds');
        console.log('- MQTT_USERNAME: MQTT username (if required)');
        console.log('- MQTT_PASSWORD: MQTT password (if required)');
        console.log('- TRAVEL_TIME: Blinds travel time in milliseconds');
    }
}

// Run tests
testPlugin(); 