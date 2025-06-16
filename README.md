# Voronoi Wallpaper - Wallpaper Engine Integration

A real-time animated Voronoi diagram wallpaper with **Wallpaper Engine** user property integration.

## Features

- **Real-time Voronoi Diagram**: Dynamically generated and animated Voronoi cells
- **Fully Customizable**: Organized user properties with collapsible groups
- **Fading Outline Effect**: Optional fading outline with customizable color
- **Smooth Animation**: Frame-rate aware animation with configurable speed
- **Responsive Design**: Adapts to any screen resolution
- **Wallpaper Engine Integration**: Full support for scheme colors and property grouping

## File Structure

**Installation Path:** Place this project folder in `C:\Program Files (x86)\Steam\steamapps\common\wallpaper_engine\projects\myprojects\` for Wallpaper Engine to detect it automatically.

```
voronoi/
├── index.html                          # Main HTML file
├── styles.css                          # CSS styles
├── project.json                        # Wallpaper Engine project configuration
├── preview.gif                         # Preview animation
├── README.md                           # This file
└── js/
    ├── p5.min.js                      # p5.js library
    ├── d3-delaunay.min.js             # Delaunay triangulation library
    ├── sketch.js                      # Main animation logic
    └── wallpaper-engine-properties.js # Wallpaper Engine integration
```

## How It Works

The wallpaper generates a grid of animated points that move randomly around the screen. These points are used to create a Voronoi diagram using the d3-delaunay library. The resulting cells are drawn with smooth, rounded corners and can be fully customized through Wallpaper Engine's property system.

## Usage in Wallpaper Engine

1. Import this folder as a new wallpaper in Wallpaper Engine
2. Properties are organized into collapsible groups for easy navigation
3. Use the **Scheme Color** to match your system theme
4. Changes are applied in real-time as you adjust the sliders and options

## Property Groups & Reference

**Note**: Some properties are conditionally visible - they only appear when their parent toggle is enabled. For example, the repulsion distance slider only appears when "Enable Dot Repulsion" is checked.

| Property Key         | Type     | Description                                     | Range/Options    | Default |
| -------------------- | -------- | ----------------------------------------------- | ---------------- | ------- |
| **Group: General**   |          |                                                 |                  |         |
| `schemecolor`        | Color    | Background color (uses Wallpaper Engine scheme) | RGB Color Picker | Black   |
| **Group: Animation** |          |                                                 |                  |         |
| `dotdensity`         | Slider   | Number of dots per 10,000 pixels (100x100)      | 0.1 - 2.0        | 0.3     |
| `animationspeed`     | Slider   | Animation speed multiplier                      | 0.1 - 5.0        | 1.0     |
| `enablerepulsion`    | Checkbox | Enable dot repulsion feature                    | True/False       | True    |
| `repulsion`          | Slider   | Distance at which dots repel each other         | 0 - 100 pixels   | 20      |
| `dotspread`          | Slider   | Random spread of dot initial positions          | 0 - 300 pixels   | 100     |
| **Group: Visual**    |          |                                                 |                  |         |
| `bordercolor`        | Color    | Color of the cell borders                       | RGB Color Picker | White   |
| `borderwidth`        | Slider   | Width of the cell borders                       | 1 - 10 pixels    | 3       |
| `enablesmoothing`    | Checkbox | Enable corner smoothing feature                 | True/False       | True    |
| `smoothing`          | Slider   | Amount of corner rounding                       | 0 - 100 pixels   | 40      |
| `blurradius`         | Slider   | Background blur effect                          | 0 - 20 pixels    | 2       |
| `showfadingoutline`  | Checkbox | Enable fading outline effect                    | True/False       | True    |
| `fadingoutlinecolor` | Color    | Color of the fading outline                     | RGB Color Picker | Black   |
| **Group: Debug**     |          |                                                 |                  |         |
| `debugfps`           | Checkbox | Show FPS counter and statistics                 | True/False       | False   |

## Integration Details

The Wallpaper Engine integration is handled through the `wallpaperPropertyListener` object which provides three main event handlers:

### `applyUserProperties(properties)`
Triggered when user properties change or when the wallpaper loads. Handles all custom property updates including:
- **Animation parameters**: Dot density, speed, repulsion toggle and distance, and spread
- **Visual styling**: Border colors, width, smoothing toggle and amount, blur effects
- **Fading outline**: Show/hide and color customization
- **Debug options**: FPS counter display

### `applyGeneralProperties(properties)`
Handles Wallpaper Engine's general settings, particularly the FPS limit to ensure the wallpaper respects the user's performance preferences.

### `setPaused(isPaused)`
Handles pause/unpause events from Wallpaper Engine by stopping or resuming the animation loop.

## Property Grouping

The wallpaper uses Wallpaper Engine's **Group** property type to organize settings into collapsible sections:

- **Animation Group**: Controls dot behavior and movement
- **Visual Group**: Controls appearance, colors, and effects
- **Debug Group**: Development and performance tools

Groups are created using special `"type": "group"` properties that act as section headers. All properties following a group property are automatically placed in that group until the next group is encountered.

## Extending the Integration

To add new properties:

1. Add the property definition to `project.json` in the `properties` section
2. Add the corresponding handler in `wallpaper-engine-properties.js`
3. Update the config object in `sketch.js` if needed
4. Test the property in Wallpaper Engine

### Example: Adding a new property to a group

**project.json:**
```json
"newvisualprop": {
    "order": 15,
    "text": "New Visual Property",
    "type": "slider",
    "value": 50,
    "min": 0,
    "max": 100
}
```
*Note: Place this after the "visualgroup" but before "debuggroup" to include it in the Visual group*

**wallpaper-engine-properties.js:**
```javascript
if (properties.newvisualprop) {
    config.newVisualProperty = properties.newvisualprop.value;
}
```

### Adding a new group

To create a new property group, add a group property followed by your properties:

```json
"newgroup": {
    "order": 16,
    "text": "New Group Name",
    "type": "group"
},
"newgroupprop": {
    "order": 17,
    "text": "Property in New Group",
    "type": "bool",
    "value": false
}
```

## Performance Notes

- The wallpaper automatically adapts to Wallpaper Engine's FPS limit
- Animation is frame-rate independent using delta time calculations
- Dot count scales with screen resolution to maintain consistent visual density
- Uses Wallpaper Engine's scheme color system for better theme integration
- Debug FPS counter can be toggled to monitor performance impact of different settings
