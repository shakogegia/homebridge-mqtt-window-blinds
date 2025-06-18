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
      "initialPosition": 0,
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
| `mqtt.topicPrefix` | string | No | - | MQTT topic prefix (legacy) |
| `mqtt.username` | string | No | - | MQTT username |
| `mqtt.password` | string | No | - | MQTT password |
| `mqtt.clientId` | string | No | auto-generated | MQTT client ID |
| `upCommand` | string | No | "up" | MQTT topic for up command |
| `downCommand` | string | No | "down" | MQTT topic for down command |
| `stopCommand` | string | No | "stop" | MQTT topic for stop command |
| `saveCommand` | string | No | "save" | MQTT topic for save command |
| `initialPosition` | number | No | 100 | Initial blinds position (0-100, 0=closed, 100=open) |
| `travelTimeUp` | number | No | 30000 | Travel time for opening in milliseconds |
| `travelTimeDown` | number | No | 30000 | Travel time for closing in milliseconds |
| `debounceTime` | number | No | 1000 | Debounce time in milliseconds (prevents rapid commands) |

### MQTT Topics

The plugin publishes to the following MQTT topics based on your configuration:

- `{upCommand}` - Command to move blinds up
- `{downCommand}` - Command to move blinds down  
- `{stopCommand}` - Command to stop blinds movement
- `{saveCommand}` - Command to save current position

**Example configuration:**
```json
{
  "upCommand": "blinds/living_room/up",
  "downCommand": "blinds/living_room/down", 
  "stopCommand": "blinds/living_room/stop",
  "saveCommand": "blinds/living_room/save"
}
```

### Debouncing

The plugin includes a debouncing mechanism to prevent rapid command execution that could damage your blinds or cause erratic behavior:

- **Lodash debounce**: Uses lodash's proven debounce implementation
- **Default debounce time**: 1 second (1000ms)
- **Configurable**: Set `debounceTime` in milliseconds
- **Safety feature**: Stop commands are not debounced for immediate response
- **Per-command**: Each command type (up/down) has its own debounce timer

**Benefits:**
- Prevents motor damage from rapid start/stop cycles
- Reduces MQTT message spam
- Improves system stability
- Protects against accidental rapid commands from HomeKit

**Example debounce configuration:**
```json
{
  "debounceTime": 2000  // 2 second debounce
}
```

### Travel Times

The plugin supports different travel times for opening and closing operations:

- **travelTimeUp**: Time in milliseconds for opening blinds (0% to 100%)
- **travelTimeDown**: Time in milliseconds for closing blinds (100% to 0%)
- **Accurate positioning**: Uses appropriate travel time based on movement direction
- **Realistic behavior**: Accounts for different motor speeds in each direction

**Why different times?**
- Gravity affects closing speed (usually faster)
- Motor resistance affects opening speed (usually slower)
- Different gear ratios may be used for each direction
- Mechanical resistance varies by direction

**Example configuration:**
```json
{
  "travelTimeUp": 25000,    // 25 seconds to open
  "travelTimeDown": 35000   // 35 seconds to close
}
```

### HomeKit Loading States

The plugin provides real-time feedback to HomeKit about blinds movement:

- **Opening state**: Shows loading indicator when blinds are opening
- **Closing state**: Shows loading indicator when blinds are closing
- **Stopped state**: Shows when blinds are stationary
- **Real-time updates**: Position state updates automatically during movement

**HomeKit Integration:**
- Position slider shows current movement state
- Loading indicators appear during operation
- Immediate feedback for user actions
- Proper state management for automations

### Position System

The plugin uses a reversed position system to match your blinds hardware:

- **0%**: Fully closed (blinds completely closed)
- **100%**: Fully open (blinds completely open)
- **Direct mapping**: No position conversion required
- **Consistent behavior**: Matches your blinds hardware values

**Position Examples:**
- `0%` = Blinds fully closed
- `50%` = Blinds half open/half closed
- `100%` = Blinds fully open

### Position Optimization

The plugin includes intelligent position handling to optimize blinds operation:

- **Edge case handling**: Positions > 97% are treated as fully open (100%)
- **Edge case handling**: Positions < 3% are treated as fully closed (0%)
- **No stop commands**: Full closed (0%) and full open (100%) operations don't send stop commands
- **Automatic optimization**: Reduces unnecessary stop commands for better motor life

**Benefits:**
- Prevents motor damage from unnecessary stop commands at limits
- Handles slight position variations near open/close limits
- More natural behavior for full open/close operations
- Better compatibility with different blind types and limit switches

**Example behavior:**
- Position 98% → Treated as 100% (full open, no stop command)
- Position 2% → Treated as 0% (full closed, no stop command)
- Position 50% → Normal operation with stop command

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