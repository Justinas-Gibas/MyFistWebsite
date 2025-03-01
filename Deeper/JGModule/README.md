# JGModule - Modular Web Application Framework

## Project Overview
A modular web application framework for building complex applications with reusable components.

## Architecture
```
/components
  /core
    - window.js       # Base window component
    - container.js    # Component container system
    - draggable.js    # Drag functionality mixin
  /ui
    - button.js       # Basic button component
    - menu.js         # Menu system
    - toolbar.js      # Toolbar component
  /modules
    - devTools/       # Developer tools module
    - settings/       # Settings window module
    - vrGallery/      # VR Art Gallery module
    - moduleLoader/   # Dynamic module loader
```

## Development Roadmap

### Phase 1: Core Components ✓
- [x] Basic Button
- [x] Component System
- [ ] Window Base Class
- [ ] Drag & Drop System

### Phase 2: Advanced UI (In Progress)
1. Window System
   - Draggable windows
   - Minimize/Maximize
   - Window manager
   ```javascript
   // Usage example:
   const window = new Window({
     title: 'Settings',
     width: 400,
     height: 300,
     draggable: true
   });
   ```

2. Menu System
   - Context menus
   - Dropdown menus
   - Menu bars

### Phase 3: Module System
1. Module Loader
   ```javascript
   // Example usage
   await ModuleLoader.import('devTools');
   await ModuleLoader.import('vrGallery');
   ```

2. Core Modules
   - DevTools
     - Console
     - Inspector
     - Performance monitor
   - Settings
     - Theme customization
     - Keyboard shortcuts
     - Module management
   - VR Art Gallery
     - 3D space navigation
     - Art display system
     - Virtual exhibitions

### Phase 4: Integration Features
1. Module Communication
   ```javascript
   // Event system example
   EventBus.subscribe('gallery.artwork.selected', (artwork) => {
     DevTools.inspect(artwork);
   });
   ```

2. State Management
   - Module state
   - Global state
   - State persistence

## Testing Strategy
1. Unit Tests
   - Component rendering
   - Event handling
   - State management

2. Integration Tests
   - Module communication
   - System stability
   - Resource management

3. Performance Tests
   - Module loading times
   - Memory usage
   - Animation performance

## Usage Examples

### Creating a Custom Module
```javascript
// modules/myModule/index.js
export class MyModule extends BaseModule {
  constructor() {
    super('myModule');
    this.window = new Window({
      title: 'My Module',
      content: this.createContent()
    });
  }

  async init() {
    // Module initialization
  }
}
```

### Importing Modules
```javascript
// Dynamic module loading
const devTools = await ModuleLoader.import('devTools');
devTools.show();

// VR Gallery example
const gallery = await ModuleLoader.import('vrGallery');
gallery.loadExhibition('modern-art-2023');
```

## Best Practices
1. Module Design
   - Self-contained
   - Event-driven communication
   - Lazy loading
   - Clear documentation

2. Component Design
   - Single responsibility
   - Reusable
   - Configurable
   - Performance optimized

## Future Enhancements
- [ ] Plugin system
- [ ] Theme engine
- [ ] Accessibility features
- [ ] Mobile support
- [ ] WebGL integration
- [ ] Collaborative features

## Interactive Testing Game
A gamified approach to testing UI components and features.

### Game Concept
- Each feature unlocks as players discover and test components
- Progressive complexity from basic to advanced interactions
- Score system for completed feature testing

### Level Structure
1. **Level 1: Window Basics**
   - Create windows
   - Drag windows
   - Resize windows
   - Points: +10 for each tested feature

2. **Level 2: UI Controls**
   - Buttons with counters
   - Sliders controlling visual elements
   - Toggle switches affecting the environment
   - Points: +20 for each interaction

3. **Level 3: Advanced Controls**
   ```javascript
   // Example window with controls
   const gameWindow = new Window({
     title: 'Control Panel',
     content: `
       <div class="control-panel">
         <div class="score">Score: <span id="score">0</span></div>
         <input type="range" min="0" max="100" class="slider">
         <button class="test-btn">Test Feature</button>
         <div class="dropdown">
           <select>
             <option>Feature 1</option>
             <option>Feature 2</option>
           </select>
         </div>
       </div>
     `
   });
   ```

4. **Level 4: Complex Interactions**
   - Tab systems
   - Nested windows
   - Drag-and-drop between windows
   - Points: +50 for complex interactions

### Achievement System
- 🏆 Window Master: Create 10 windows
- 🎯 Perfect Layout: Arrange windows in a grid
- 🎨 Style Guru: Customize window appearances
- ⚡ Speed Runner: Test all features under 1 minute

### Next Planned Features
- [ ] Score persistence
- [ ] Achievement notifications
- [ ] Level progression system
- [ ] Visual feedback for interactions
- [ ] Tutorial system

## Contributing
1. Fork the repository
2. Create feature branch
3. Submit pull request
4. Follow coding standards

# Window Master Game

An interactive game to learn window management and UI controls.

## Quick Start
1. Open index.html in a modern browser
2. Click the start button
3. Follow the quest instructions

## Game Structure

### Level 0: Start Screen
- Big green start button
- Click to begin the game
- Introduces basic window interaction

### Level 1: Window Basics
Simple tasks to learn window manipulation:
- Create a window
- Move a window
- Resize a window

### Level 2: Control Panel
Learn to use different UI controls:
- RGB color sliders
- Theme toggle switch
- Click counter

### Level 3: Advanced Windows
Master complex window features:
- Tab management
- Split panels
- Window groups

## Project Structure
```
/components
  /controls        # UI control components
  /core           # Core functionality
  /levels         # Game levels
  Window.js       # Base window component
  QuestWindow.js  # Progress tracking
```

## Development

### Prerequisites
- Modern web browser
- Local web server (recommended)

### Running the Project
1. Start a local server in the project root
2. Open `index.html`
3. Game starts automatically

### Adding New Levels
1. Create new level file in `/levels`
2. Extend BaseLevel class
3. Add level conditions to QuestWindow
4. Register level in main.js

## Technical Notes
- Uses ES6 modules
- No external dependencies
- Component-based architecture