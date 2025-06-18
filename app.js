require('dotenv').config();
const { setPosition, open, close, stop, initializeBlinds } = require('./utils/blinds');

(async () => {
    await initializeBlinds({
        mqtt: {
            host: process.env.MQTT_HOST,
            port: process.env.MQTT_PORT,
            topicPrefix: process.env.MQTT_TOPIC_PREFIX,
            username: process.env.MQTT_USERNAME,
            password: process.env.MQTT_PASSWORD
        },
        initialPosition: 0,
        travelTime: 19000,
        debounceTime: 1000,
        upCommand: 'esp8266/blinds/up',
        downCommand: 'esp8266/blinds/down',
        stopCommand: 'esp8266/blinds/stop',
        saveCommand: 'esp8266/blinds/save'
    });
    await setPosition(50);
    process.exit(0);
})();
