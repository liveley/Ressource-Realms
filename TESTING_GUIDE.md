# Victory Points System - Testing Guide

## 🎯 How to Test the Victory Points Implementation

### 1. Start the Game
1. Open the browser and navigate to `http://localhost:5176/`
2. Click "Spiel starten" to begin
3. Look for the "VP Debug" button in the top-right corner

### 2. Basic Victory Points Testing

#### Test Settlement Victory Points (1 VP each):
1. Click a corner on the game board to build a settlement
2. Check that victory points increase by 1 in the player overview
3. Verify the debug panel shows correct settlement count

#### Test City Victory Points (2 VP each):
1. Build a settlement first
2. Click the same corner to upgrade to a city  
3. Check that victory points increase by 1 (from 1 to 2 total for that location)
4. Verify the debug panel shows correct city count

#### Test Victory Point Cards (Hidden VP):
1. Ensure you have resources: 1 wheat, 1 wool, 1 ore
2. Click "Entwicklungskarte kaufen"
3. If you get a victory point card, you should see:
   - Your victory points increase immediately
   - Format changes to show hidden VP: "3 (+1)" 
   - Other player still sees only your public VP
4. Click "VP Debug" to verify hiddenVP count increased

### 3. Advanced Testing

#### Test Longest Road (2 VP):
1. Build at least 5 connected roads
2. Check that victory points increase by 2
3. Verify crown icon (👑) appears next to road count
4. Test with second player - longest road should transfer

#### Test Largest Army (2 VP):
1. Buy development cards until you get knight cards
2. Play 3 knight cards (use "Karten-Übersicht" to play them)
3. Check that victory points increase by 2
4. Verify crown icon appears next to development cards

#### Test Win Condition:
1. Use resource cheat codes (1-5 keys) to get resources quickly
2. Build enough settlements/cities to reach 10 VP
3. Game should automatically display win screen
4. Check that all actions are disabled after win

### 4. UI Testing

#### Player Overview Display:
- **Active player**: Should see format like "5 (+2)" where +2 are hidden VP
- **Inactive player**: Should see only public VP like "5"
- **Achievement holders**: Should see glowing crown icons (👑)
- **Color coding**: Victory points should be highlighted in gold

#### Debug Panel Testing:
1. Click "VP Debug" button
2. Verify all VP sources are calculated correctly:
   - Settlements: 1 VP each
   - Cities: 2 VP each  
   - Hidden VP: From victory point cards
   - Longest Road: 2 VP if qualifying
   - Largest Army: 2 VP if qualifying
3. Check that "Display" field matches what's shown in player overview

### 5. Resource Cheat Codes (for quick testing)

Press these keys to add resources:
- `1` = Add wheat
- `2` = Add sheep  
- `3` = Add wood
- `4` = Add clay
- `5` = Add ore

Use `Shift + number` to remove resources.

### 6. Expected Behavior

#### Building Actions:
- Settlement: +1 VP immediately
- City upgrade: +1 VP (total +2 for that location)
- Roads: Longest road calculation triggers

#### Development Cards:
- Victory Point card: +1 hidden VP immediately
- Knight card: Increases knight count, triggers largest army check
- Road Building card: Enables free road building, triggers longest road check

#### Win Condition:
- At 10 total VP (public + hidden): Game ends automatically
- Win overlay shows breakdown of VP sources
- All game actions disabled

### 7. Common Issues to Check

❌ **If victory points don't update:**
- Check browser console for JavaScript errors
- Ensure all modules are properly imported
- Verify `window.players` array exists

❌ **If hidden VP don't show correctly:**
- Check if player is marked as active
- Verify `getVictoryPointsForDisplay` function works
- Check debug panel for accurate hidden VP count

❌ **If longest road/largest army don't work:**
- Ensure minimum requirements (5 roads, 3 knights)
- Check for ties (no bonus on ties)
- Verify knight count increases when playing knights

❌ **If win condition doesn't trigger:**
- Check total VP calculation includes hidden VP
- Verify `checkWinCondition` is called after VP changes
- Check browser console for errors

### 8. Performance Notes

The victory points system updates in real-time but includes debouncing to prevent excessive calculations. The debug panel updates every 500ms for performance reasons.

### 9. Browser Compatibility

Tested and working in:
- Chrome/Edge (recommended)
- Firefox
- Safari

### 10. Development Tools

Use browser developer tools (F12) to:
- Check console for errors
- Inspect player objects: `window.players[0]`
- Manually trigger updates: `window.updateAllVictoryPoints(window.players[0], window.players)`
- Check win condition: `window.checkWinCondition(window.players[0])`
