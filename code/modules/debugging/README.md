# Debug Modules Documentation

This directory contains all debug and testing utilities for the Catan 3D game, refactored out of the main game logic files.

## 🎯 Refactoring Summary

The debug and testing functionality has been successfully refactored and organized into dedicated modules:

### ✅ Completed Refactoring Tasks:

1. **Moved debug utilities out of main.js**:
   - Road testing and debug utilities → `roadTestingUtils.js`
   - Debug key handlers → `debugKeyHandlers.js`

2. **Cleaned up victoryPoints.js**:
   - Moved debug/testing functions → `victoryPointsTestingUtils.js`
   - Made console logging conditional (controlled by `window.DEBUG_VICTORY_POINTS`)

3. **Created centralized debug control system**:
   - `debugControls.js` - Centralized debug flag management
   - Global functions for enabling/disabling debug logging

4. **Consolidated test utilities**:
   - `testUtils.js` - Unified test runner and utilities
   - Organized tests from scattered test files

## 📁 Module Structure

### Core Debug Modules

- **`debugControls.js`** - Central debug control system
  - `initDebugControls()` - Initialize debug flags and global functions
  - `enableDebugLogging()` / `disableDebugLogging()` - Control debug output
  - `setDebugMode(category, enabled)` - Fine-grained debug control
  - `getDebugStatus()` - Show current debug settings

- **`debugKeyHandlers.js`** - Debug keyboard shortcuts
  - `initDebugKeyHandlers()` - Initialize keyboard handlers
  - D key: Toggle dice debug mode
  - R+D keys: Toggle road debug tools

- **`roadTestingUtils.js`** - Road connection testing and debugging
  - `initRoadTestingUtils()` - Make road debug functions globally available
  - `testRoadConnectionLogic()` - Test road connection logic
  - `analyzeActualRoads()` - Analyze current game roads
  - `testFiveRoadChain()` - Test specific 5-road scenario
  - `simulateRoadBuilding()` - Simulate road placement
  - Various other road testing functions (see file header for complete list)

- **`victoryPointsTestingUtils.js`** - Victory points and road connection debugging
  - `initVictoryPointsTestingUtils()` - Initialize VP debug functions
  - `debugRoadConnections()` - Debug road connections for a player
  - `getCanonicalRoad()` - Get canonical road representation
  - `testRoadConnections()` - Run comprehensive road connection tests

### Existing Debug Modules (already present)

- **`debugTools.js`** - General debug utilities
- **`diceDebug.js`** - Dice debugging tools
- **`longestRoadDebug.js`** - Longest road debugging UI
- **`victoryPointsDebug.js`** - Victory points debugging
- **`banditDebug.js`** - Bandit/robber debugging

## 🚀 How to Use

### 1. Enable Debug Logging

```javascript
// In browser console
enableDebugLogging();           // Enable all debug logging
disableDebugLogging();          // Disable all debug logging
setDebugMode('DICE', true);     // Enable specific category
getDebugStatus();               // Show current debug settings
```

### 2. Run Tests

```javascript
// In browser console
testRoadConnectionLogic();      // Test road connection logic
analyzeActualRoads();           // Analyze current game roads
testFiveRoadChain();            // Test 5-road scenario
debugRoadConnections(player.roads); // Debug specific player roads
testRoadConnections();          // Run comprehensive road tests
```

### 3. Debug Road Connections

```javascript
// In browser console
debugRoadConnections(player.roads);    // Debug a player's roads
testRoadConnectionLogic();             // Test road connection logic
analyzeActualRoads();                  // Analyze current game roads
```

### 4. Debug Key Shortcuts

- **D key**: Toggle dice debug mode
- **R+D keys**: Toggle road debug tools and run analysis

## 🔧 Debug Categories

The debug system supports the following categories:

- `VICTORY_POINTS` - Victory point calculations
- `ROAD_CONNECTIONS` - Road connection logic
- `DICE` - Dice rolling and physics
- `RESOURCES` - Resource distribution
- `BUILD` - Building placement
- `BANDIT` - Bandit/robber functionality
- `CARDS` - Card management
- `GENERAL` - General game logic

## 📝 Integration with Main Game

All debug modules are automatically initialized in `main.js`:

```javascript
// Debug module initialization
initDebugControls();                  // Debug control system
initDebugKeyHandlers();               // Keyboard shortcuts
initRoadTestingUtils();               // Road testing utilities
initVictoryPointsTestingUtils();      // Victory points testing utilities
```

## 🎯 Benefits of This Refactoring

1. **Cleaner Main Logic**: Game logic files are now focused on core functionality
2. **Better Organization**: Debug utilities are grouped by functionality
3. **Easier Maintenance**: Debug code is easier to find and modify
4. **Consistent Access**: All debug functions are available globally for console use
5. **Conditional Logging**: Debug output can be controlled without code changes
6. **Comprehensive Testing**: Unified test runner for all game components

## 🔮 Future Enhancements

Potential improvements for the debug system:

1. **Debug UI Panel**: Create a visual debug panel for easier control
2. **Test Automation**: Automated test running on game startup
3. **Performance Monitoring**: Add performance profiling utilities
4. **Save/Load Debug States**: Save debug configurations
5. **Debug Replay System**: Record and replay game states for debugging

## 📋 Commit Suggestions

For version control, consider these commit messages:

```
feat: refactor debug utilities into dedicated modules

- Move road testing utils from main.js to roadTestingUtils.js
- Create debugKeyHandlers.js for keyboard shortcuts
- Extract VP debug functions to victoryPointsTestingUtils.js
- Add centralized debug control system in debugControls.js
- Consolidate test utilities in testUtils.js
- Make debug logging conditional throughout the codebase
- Update main.js to import and initialize all debug modules

This refactoring improves code organization and makes debug
functionality more accessible and maintainable.
```

## 📚 File Dependencies

```
main.js
├── debugControls.js
├── debugKeyHandlers.js
├── roadTestingUtils.js
├── victoryPointsTestingUtils.js
└── existing debug modules/
    ├── debugTools.js
    ├── diceDebug.js
    ├── longestRoadDebug.js
    ├── victoryPointsDebug.js
    └── banditDebug.js
```

All debug modules are self-contained and can be used independently, with clear documentation for usage in the browser console.
