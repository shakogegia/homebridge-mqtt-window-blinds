const path = require('path');
const { Accessory, Service, Characteristic } = require('hap-nodejs');

// Mock Homebridge API for testing
const mockHomebridge = {
    registerAccessory: function(pluginName, accessoryName, constructor) {
        console.log(`✅ Plugin registered: ${pluginName}`);
        console.log(`✅ Accessory registered: ${accessoryName}`);
        
        // Test creating an instance
        try {
            const mockLog = {
                info: console.log,
                error: console.error,
                warn: console.warn,
                debug: console.log
            };
            
            const mockConfig = {
                name: "Test Blinds",
                mqtt: {
                    host: "localhost",
                    port: 1883,
                    topicPrefix: "test"
                },
                upCommand: "test/up",
                downCommand: "test/down",
                stopCommand: "test/stop",
                saveCommand: "test/save",
                initialPosition: 100,
                travelTimeUp: 25000,
                travelTimeDown: 35000,
                debounceTime: 1000
            };
            
            const mockApi = {
                platformAccessory: Accessory
            };
            
            const accessory = new constructor(mockLog, mockConfig, mockApi);
            console.log('✅ Accessory instance created successfully');
            
            const services = accessory.getServices();
            console.log(`✅ Services created: ${services.length} services`);
            
            services.forEach((service, index) => {
                console.log(`  - Service ${index + 1}: ${service.displayName || service.UUID}`);
            });
            
        } catch (error) {
            console.error('❌ Error creating accessory instance:', error.message);
            process.exit(1);
        }
    }
};

console.log('🧪 Testing Homebridge MQTT Window Blinds Plugin...\n');

try {
    // Load the plugin
    const plugin = require('./index.js');
    plugin(mockHomebridge);
    
    console.log('\n✅ Plugin test completed successfully!');
    console.log('📝 The plugin should work correctly with Homebridge.');
    
} catch (error) {
    console.error('❌ Plugin test failed:', error.message);
    console.error(error.stack);
    process.exit(1);
} 