# Homebridge Window Blinds Plugin

A Homebridge plugin that creates a window blinds accessory for MQTT-controlled blinds using your existing `setPosition`, `open`, `close`, and `stop` functions.

## Features

- Control window blinds through HomeKit
- Set precise positions (0-100%)
- Open and close blinds
- Stop blinds movement
- MQTT integration for ESP8266-based blinds
- Configuration through Homebridge config (no .env files needed)

## Installation

### Method 1: npm (Recommended)

1. Install Homebridge if you haven't already:
   ```bash
   npm install -g homebridge
   ```

2. Install this plugin:
   ```bash
   npm install -g homebridge-mqtt-window-blinds
   ```

### Method 2: GitHub

If you prefer to install directly from GitHub:
   ```bash
   npm install -g https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
   ```

3. Create or edit your Homebridge configuration file (`~/.homebridge/config.json`):
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

4. Start Homebridge:
   ```bash
   homebridge
   ```

## Configuration Options

| Parameter | Type | Required | Description |
|-----------|------|----------|-------------|
| `name` | string | Yes | The name of your blinds accessory |
| `manufacturer` | string | No | Manufacturer name (default: "Custom") |
| `model` | string | No | Model name (default: "MQTT Blinds") |
| `serialNumber` | string | No | Serial number (default: "BLINDS001") |
| `mqtt.host` | string | Yes | MQTT broker IP address |
| `mqtt.port` | number | No | MQTT broker port (default: 1883) |
| `mqtt.topicPrefix` | string | Yes | Topic prefix for blinds (e.g., "blinds") |
| `mqtt.username` | string | No | MQTT username (if authentication required) |
| `mqtt.password` | string | No | MQTT password (if authentication required) |
| `mqtt.clientId` | string | No | MQTT client ID (auto-generated if not provided) |
| `initialPosition` | number | No | Initial blinds position 0-100 (default: 70) |
| `travelTime` | number | No | Full travel time in milliseconds (default: 30000) |

## Usage

Once configured, you can control your blinds through:

- **Home app** on iOS/macOS
- **Siri** voice commands
- **HomeKit automations**
- **Third-party HomeKit apps**

### HomeKit Controls

- **Position Slider**: Set blinds to any position between 0% (fully open) and 100% (fully closed)
- **Open/Close Buttons**: Quick open or close blinds
- **Stop**: Stop blinds movement at current position

### Position Mapping

The plugin automatically converts between HomeKit and your system's position values:

- **HomeKit**: 0% = fully open, 100% = fully closed
- **Your System**: 0% = fully closed, 100% = fully open

### MQTT Topics

The plugin will publish to these MQTT topics:
- `{topicPrefix}/up` - Move blinds up
- `{topicPrefix}/down` - Move blinds down
- `{topicPrefix}/stop` - Stop blinds movement

## Development

To run this plugin in development mode:

1. Clone this repository
2. Install dependencies:
   ```bash
   npm install
   ```
3. Test the plugin:
   ```bash
   npm test
   ```

## Troubleshooting

### Common Issues

1. **MQTT Connection Failed**
   - Check your MQTT broker settings in the Homebridge config
   - Verify network connectivity
   - Check MQTT credentials

2. **Blinds Not Responding**
   - Verify MQTT topics are correct
   - Check ESP8266 is connected and responding
   - Review Homebridge logs for errors

3. **Position Inaccuracy**
   - Adjust `travelTime` in your Homebridge config
   - The travel time should match your blinds' actual movement time

4. **Configuration Errors**
   - Ensure all required MQTT fields are provided
   - Check JSON syntax in config file
   - Verify topic prefix matches your ESP8266 setup

### Logs

Check Homebridge logs for detailed information:
```bash
homebridge -D
```

## License

ISC

## Contributing

Feel free to submit issues and enhancement requests! 