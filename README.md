# Homebridge MQTT Window Blinds

A Homebridge plugin for controlling window blinds via MQTT. This plugin allows you to integrate MQTT-controlled blinds into Apple HomeKit through Homebridge.

## Features

- Control window blinds through MQTT
- Full HomeKit integration with position control
- Support for opening, closing, and stopping blinds
- Configurable travel time and initial position
- Real-time position feedback

## Installation

### Prerequisites

- Node.js (v14 or higher)
- Homebridge installed and configured
- MQTT broker (like Mosquitto)

### Plugin Installation

1. Install the plugin globally:
```bash
npm install -g homebridge-mqtt-window-blinds
```

2. Or install from source:
```bash
git clone https://github.com/shakogegia/homebridge-mqtt-window-blinds.git
cd homebridge-mqtt-window-blinds
npm install
npm link
```

### Configuration

1. Add the accessory to your Homebridge configuration file (`~/.homebridge/config.json`):

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "accessories": [
    {
      "accessory": "WindowBlinds",
      "name": "Living Room Blinds",
      "manufacturer": "Custom",
      "model": "MQTT Blinds",
      "serialNumber": "BLINDS001",
      "mqtt": {
        "host": "192.168.1.100",
        "port": 1883,
        "topicPrefix": "blinds",
        "username": "your_mqtt_username",
        "password": "your_mqtt_password",
        "clientId": "blinds_BLINDS001"
      },
      "initialPosition": 70,
      "travelTime": 30000
    }
  ],
  "platforms": []
}
```

### Configuration Options

| Parameter | Type | Required | Default | Description |
|-----------|------|----------|---------|-------------|
| `name` | string | Yes | "Window Blinds" | Display name in HomeKit |
| `manufacturer` | string | No | "Custom" | Manufacturer name |
| `model` | string | No | "MQTT Blinds" | Model name |
| `serialNumber` | string | No | "BLINDS001" | Unique serial number |
| `mqtt.host` | string | Yes | - | MQTT broker hostname/IP |
| `mqtt.port` | number | No | 1883 | MQTT broker port |
| `mqtt.topicPrefix` | string | Yes | - | MQTT topic prefix |
| `mqtt.username` | string | No | - | MQTT username |
| `mqtt.password` | string | No | - | MQTT password |
| `mqtt.clientId` | string | No | auto-generated | MQTT client ID |
| `initialPosition` | number | No | 70 | Initial blinds position (0-100) |
| `travelTime` | number | No | 30000 | Travel time in milliseconds |

### MQTT Topics

The plugin uses the following MQTT topics (where `{topicPrefix}` is your configured prefix):

- `{topicPrefix}/position` - Set blinds position (0-100)
- `{topicPrefix}/position/state` - Current position feedback
- `{topicPrefix}/command` - Command topic (open, close, stop)

## Usage

1. Restart Homebridge after configuration:
```bash
sudo systemctl restart homebridge
```

2. Add the accessory to HomeKit using the Home app
3. Control your blinds through the Home app or Siri

## Troubleshooting

### Common Issues

1. **"Cannot generate setupURI on an accessory that isn't published yet!"**
   - Make sure the plugin is properly installed and configured
   - Check that the accessory is listed in your Homebridge config
   - Restart Homebridge after configuration changes

2. **MQTT Connection Issues**
   - Verify MQTT broker is running and accessible
   - Check username/password credentials
   - Ensure network connectivity to MQTT broker

3. **Blinds Not Responding**
   - Check MQTT topic configuration
   - Verify your blinds controller is listening to the correct topics
   - Check Homebridge logs for errors

### Debug Mode

Enable debug logging by setting the log level in your Homebridge config:

```json
{
  "bridge": {
    "name": "Homebridge",
    "username": "CC:22:3D:E3:CE:30",
    "port": 51826,
    "pin": "031-45-154"
  },
  "accessories": [...],
  "platforms": [],
  "log": "debug"
}
```

## Development

### Local Development

1. Clone the repository
2. Install dependencies: `npm install`
3. Link the plugin: `npm link`
4. Test with: `npm test`

### Testing

Run the test suite:
```bash
npm test
```

## License

ISC License

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Submit a pull request

## Support

For issues and questions:
- Create an issue on GitHub
- Check the troubleshooting section above
- Review Homebridge documentation 