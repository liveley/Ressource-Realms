/*
 * BORDER HIGHLIGHTING TEST SCRIPT (DETAILED VERSION)
 * ------------------------------------------------
 * 
 * This script provides more detailed testing for border highlighting functionality.
 * It performs similar tests to test_highlight.js but with more verification logic.
 * 
 * HOW TO USE THIS SCRIPT:
 * 
 * Option 1: Add to index.html
 * ---------------------------
 * Add this line to your index.html after your main game scripts:
 * <script type="module" src="./tests/test_border_highlighting.js"></script>
 * 
 * Option 2: Run manually in browser console
 * ----------------------------------------
 * 1. Load your game in the browser
 * 2. Open the browser console (F12 or right-click → Inspect → Console)
 * 3. Run: import('./tests/test_border_highlighting.js')
 */

// Test script for border highlighting
import { testBorderHighlighting } from '../modules/game_board.js';

// Wait for the game to initialize fully
setTimeout(() => {
  console.log("%c===== BORDER HIGHLIGHTING TEST =====", "font-size: 16px; font-weight: bold; color: blue;");
  
  // Test for all possible dice numbers
  const diceNumbers = [2, 3, 4, 5, 6, 8, 9, 10, 11, 12];
  
  let allTestsPassed = true;
  
  diceNumbers.forEach(number => {
    const result = testBorderHighlighting(number);
    
    // Determine expected count
    let expectedCount = null;
    if (result.tilesWithNumber === 2) {
      expectedCount = result.areAdjacent ? 11 : 12;
    } else if (result.tilesWithNumber === 1) {
      expectedCount = 6;
    }
    
    const passed = expectedCount === null || result.highlightCount === expectedCount;
    
    console.log(
      `%cTest for number ${number}: ${passed ? 'PASSED' : 'FAILED'}\n` +
      `  Tiles with number: ${result.tilesWithNumber}\n` +
      `  Adjacent: ${result.areAdjacent}\n` +
      `  Highlight count: ${result.highlightCount}\n` +
      `  Expected: ${expectedCount || 'N/A (multiple tiles)'}\n`,
      `color: ${passed ? 'green' : 'red'}; font-weight: ${passed ? 'normal' : 'bold'}`
    );
    
    if (!passed) {
      allTestsPassed = false;
    }
  });
  
  console.log(
    `%c${allTestsPassed ? 'ALL TESTS PASSED!' : 'SOME TESTS FAILED!'}`,
    `font-size: 16px; font-weight: bold; color: ${allTestsPassed ? 'green' : 'red'}`
  );
}, 3000); // Wait 3 seconds for game board to initialize
