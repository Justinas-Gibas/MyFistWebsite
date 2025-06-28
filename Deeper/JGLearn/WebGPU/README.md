# WebGPU Explorer

An interactive learning platform for WebGPU graphics programming.

## Overview

WebGPU Explorer is a comprehensive learning environment designed to help developers understand WebGPU, the next-generation graphics API for the web. This application provides:

- Interactive lectures with live code examples
- Real-time shader editing and visualization
- Progressive learning path from basics to advanced techniques
- Achievement system to track progress

## Current Status

The application is currently under development with the following components implemented:

- ✅ Core WebGPU initialization and rendering pipeline
- ✅ Shader compilation and management system
- ✅ Interactive UI with controls for shader parameters
- ✅ Lecture system with Markdown-based content
- ✅ Basic achievement tracking
- ✅ File management system for user projects
- ✅ Enhanced markdown styling for lecture content

## Recent Fixes

- Fixed logical operator precedence issues in welcome screen shader (aa000.js) by adding proper parentheses
- Improved shader variable type handling to prevent f32/i32 mismatches (by explicitly annotating types in shader code)
- Enhanced the preprocessShaderCode function to better handle numeric conversions
- Added comprehensive styling for markdown content in lectures
- Fixed next/previous navigation buttons by improving shader error handling

## Upcoming Features

- Enhanced debugging tools for shader development
- More interactive lecture content with hands-on exercises
- Project sharing and community showcase
- Integration with external resources and documentation

## Browser Compatibility

WebGPU Explorer requires a browser with WebGPU support:
- Chrome/Edge 113+ with WebGPU flag enabled
- Firefox Nightly with WebGPU flag enabled
- Safari Technology Preview with WebGPU enabled

To enable WebGPU in Chrome:
1. Navigate to `chrome://flags`
2. Search for "WebGPU"
3. Set to "Enabled"
4. Restart the browser

## Development

The project is structured as follows:

```
WebGPU/
  ├── core/            # Core application modules
  │   ├── app.js       # Main application entry point
  │   ├── webgpu-manager.js    # WebGPU initialization and rendering
  │   ├── shader-manager.js    # Shader compilation and management
  │   └── ...
  ├── lectures/        # Interactive lecture content
  │   ├── aa001.js     # Introduction to WebGPU
  │   └── ...
  ├── features/        # Special prepared methods
  ├── styles.css       # Application styles
  └── index.html       # Main HTML file
```

## Usage

1. Clone the repository
2. Ensure you have a WebGPU-compatible browser
3. Open the `index.html` file or serve the directory with a local server
4. Progress through the lectures and experiment with the interactive examples

## Best Practices for Shader Development

When working with WebGPU shaders, keep these tips in mind:

1. **Explicit Type Annotations**: Always use explicit type annotations (e.g., `let value: f32 = 1.0;`) to prevent type mismatch errors.

2. **Logical Operator Precedence**: When combining logical operators (`&&`, `||`), always use parentheses to clearly indicate operator precedence:
   ```wgsl
   let result = ((condition1 && condition2) || (condition3 && condition4));
   ```

3. **Numeric Literals**: Always include decimal points for floating point values, even when the value is a whole number:
   ```wgsl
   // Good: explicitly f32
   let scale: f32 = 5.0;
   
   // Bad: might be interpreted as i32
   let scale = 5;
   ```

4. **Group Complex Expressions**: For complex expressions, break them into smaller parts with named variables for better readability and debugging.

## Known Issues

- Some complex shader expressions may need additional parentheses for proper parsing
- Controls system still contains some redundant variables that will be simplified in future updates

## Contributing

Contributions are welcome! If you find bugs or have suggestions, please open an issue or submit a pull request.