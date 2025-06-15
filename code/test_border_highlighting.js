// Test script for border highlighting
import { testBorderHighlighting } from './modules/game_board.js';

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
