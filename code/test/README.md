# Test Suite for Resource Realms Board Game

This folder contains test scripts for verifying functionality of the Resource Realms board game.

## Available Tests

### Border Highlighting Tests

This test verifies that the border highlighting functionality correctly highlights the borders of tiles with matching dice roll numbers.

**test_border_highlighting.js** - Comprehensive test that validates the highlighting counts against expected values and provides pass/fail indicators for each dice number.

## How to Run Tests

### Option 1: Include in index.html

Add this line to your index.html after your main game scripts:
```html
<script type="module" src="./tests/test_border_highlighting.js"></script>
```

### Option 2: Run manually in browser console

1. Load your game in the browser
2. Open the browser console (F12 or right-click → Inspect → Console)
3. Run this command:
```javascript
import('./tests/test_border_highlighting.js')
```

## Expected Results

- For two adjacent tiles with the same number: should show 11 segments
- For two non-adjacent tiles: should show 12 segments
- For one tile: should show 6 segments

## When to Run Tests

Use these tests after making changes to the game board or highlighting logic to ensure functionality remains correct.
