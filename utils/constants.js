const config = {
    broker: `mqtt://${process.env.MQTT_HOST}:${process.env.MQTT_PORT}`,
    clientId: process.env.MQTT_CLIENT_ID || 'blinds_controller_' + Math.random().toString(16).substr(2, 8),
    topicPrefix: process.env.MQTT_TOPIC_PREFIX,
    username: process.env.MQTT_USERNAME,
    password: process.env.MQTT_PASSWORD
  };
  
  // Command definitions
function createCommands(config) {
    return {
        'DOWN': config.downCommand || 'down',
        'UP': config.upCommand || 'up',
        'STOP': config.stopCommand || 'stop',
        'SAVE': config.saveCommand || 'save',
    };
}
  
module.exports = { createCommands, config };