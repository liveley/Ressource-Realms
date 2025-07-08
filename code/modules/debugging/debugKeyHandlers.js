// Debug Key Handlers
// This module handles all debug keyboard shortcuts and combinations

import { showDebugMessage } from './debugTools.js';
import { createDebugDiceIndicator, toggleDebugDiceMode } from './diceDebug.js';
import { analyzePlayerRoads, testRoadConnections, toggleRoadDebugTools } from './longestRoadDebug.js';

// Track pressed keys for combination detection
let pressedKeys = new Set();
let rdCombinationPressed = false;

// Initialize debug key handlers
export function initDebugKeyHandlers() {
  // Toggle dice debug mode when pressing 'D', and road debug when pressing R+D
  window.addEventListener('keydown', (e) => {
    // Add the pressed key to the set
    pressedKeys.add(e.key.toLowerCase());
    
    // Check for R+D combination for road debug (only trigger once per combination)
    if (pressedKeys.has('r') && pressedKeys.has('d') && !rdCombinationPressed) {
      rdCombinationPressed = true;
      
      // Toggle road debug tools
      const isVisible = toggleRoadDebugTools();
      
      console.log(isVisible ? '=== ROAD DEBUG TOOLS ACTIVATED ===' : '=== ROAD DEBUG TOOLS DEACTIVATED ===');
      
      if (isVisible) {
        // Show road debug tools
        if (window.players && window.players.length > 0) {
          const activePlayer = window.players[window.activePlayerIdx || 0];
          console.log(`\nAnalyzing roads for ${activePlayer.name}:`);
          analyzePlayerRoads(activePlayer);
          
          console.log('\nRunning road connection tests:');
          testRoadConnections();
        } else {
          console.log('No players found for road analysis');
        }
        
        // Show debug message
        showDebugMessage('Road Debug Tools Activated - Check Panel & Console', 3000);
      } else {
        // Show debug message
        showDebugMessage('Road Debug Tools Deactivated', 2000);
      }
      
      return;
    }
    
    // Original dice debug functionality (D key only)
    if (e.key === 'd' || e.key === 'D') {
      // Only trigger dice debug if R is not also pressed
      if (!pressedKeys.has('r')) {
        // Toggle between debug mode (7) and normal mode (null)
        window.debugDiceEnabled = toggleDebugDiceMode(7);
        
        // Show a message to the user about the current mode
        const message = window.debugDiceEnabled ? 
          "Debug mode enabled: Dice will always roll 7" : 
          "Debug mode disabled: Dice will roll randomly";
        
        // Display the debug message and indicator
        showDebugMessage(message, 3000);
        createDebugDiceIndicator(window.debugDiceEnabled, 7);
      }
    }
  });

  // Clean up pressed keys on keyup
  window.addEventListener('keyup', (e) => {
    pressedKeys.delete(e.key.toLowerCase());
    
    // Reset R+D combination flag when either key is released
    if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'd') {
      rdCombinationPressed = false;
    }
  });

  console.log('Debug key handlers initialized:');
  console.log('- Press D: Toggle dice debug mode (always roll 7)');
  console.log('- Press R+D: Toggle road debug tools');
}

// Export for cleanup if needed
export function removeDebugKeyHandlers() {
  // Note: In practice, removing specific event listeners is complex
  // This is mainly for completeness
  console.log('Debug key handlers would be removed here');
}
