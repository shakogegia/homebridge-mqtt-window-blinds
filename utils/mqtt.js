const mqtt = require('mqtt');

let client = null;
let config = null;

function initializeMqtt(mqttConfig) {
    config = {
        broker: `mqtt://${mqttConfig.host}:${mqttConfig.port}`,
        clientId: mqttConfig.clientId || 'blinds_controller_' + Math.random().toString(16).substr(2, 8),
        topicPrefix: mqttConfig.topicPrefix,
        username: mqttConfig.username,
        password: mqttConfig.password
    };

    const options = {
        clientId: config.clientId,
        clean: true,
        connectTimeout: 4000,
        reconnectPeriod: 1000,
        qos: 1
    };

    if (config.username && config.password) {
        options.username = config.username;
        options.password = config.password;
    }

    client = mqtt.connect(config.broker, options);

    client.on('connect', () => {
        console.log('Connected to MQTT broker');
    });

    client.on('error', (error) => {
        console.error('MQTT connection error:', error);
    });

    client.on('close', () => {
        console.log('MQTT connection closed');
    });

    client.on('reconnect', () => {
        console.log('Reconnecting to MQTT broker...');
    });

    return client;
}

async function publishMessage(command) {
    if (!client) {
        throw new Error('MQTT client not initialized. Call initializeMqtt() first.');
    }

    const message = {
        command: command,
        timestamp: new Date().toISOString(),
        clientId: config.clientId
    };

    
    return new Promise((resolve, reject) => {
        client.publish(command, JSON.stringify(message), { qos: 1 }, (error) => {
            if (error) {
                console.error('Error publishing message:', error);
                reject(error);
            } else {
                console.log(`Published to ${command}:`, message);
                resolve();
            }
        });
    });
}

function disconnect() {
    if (client) {
        client.end();
        client = null;
    }
}

module.exports = { initializeMqtt, publishMessage, disconnect };