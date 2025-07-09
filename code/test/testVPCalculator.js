// Test script for VictoryPointCalculator class
import { calculateVictoryPoints, calculatePublicVictoryPoints, getVictoryPointsBreakdown, getVictoryPointsForDisplay } from '../modules/victoryPoints.js';
import { VictoryPointCalculator } from '../modules/victoryPointSystem/VictoryPointCalculator.js';

// Test both the new class directly and the legacy functions

// Test player data
const testPlayer = {
  name: "TestPlayer",
  settlements: [
    { q: 0, r: 0, corner: 0 },
    { q: 1, r: 0, corner: 1 }
  ],
  cities: [
    { q: 2, r: 0, corner: 2 }
  ],
  victoryPoints: {
    settlements: 2,
    cities: 2,
    hiddenVP: 1,
    longestRoad: 2,
    largestArmy: 0
  }
};

console.log("=== VictoryPointCalculator Test ===");

// Test basic calculations
console.log("Total VP (with hidden):", calculateVictoryPoints(testPlayer, true));
console.log("Public VP (no hidden):", calculatePublicVictoryPoints(testPlayer));

// Test breakdown
const breakdown = getVictoryPointsBreakdown(testPlayer);
console.log("VP Breakdown:", breakdown);

// Test display format
const displayCurrent = getVictoryPointsForDisplay(testPlayer, true);
const displayOther = getVictoryPointsForDisplay(testPlayer, false);
console.log("Display for current player:", displayCurrent);
console.log("Display for other players:", displayOther);

// Test with minimal player
const minimalPlayer = {
  name: "MinimalPlayer",
  settlements: [{ q: 0, r: 0, corner: 0 }],
  cities: []
};

console.log("\n=== Minimal Player Test ===");
console.log("Total VP:", calculateVictoryPoints(minimalPlayer));
console.log("Breakdown:", getVictoryPointsBreakdown(minimalPlayer));

// Test the new VictoryPointCalculator class directly
console.log("\n=== Direct Class Test ===");
const vpCalculator = new VictoryPointCalculator();
console.log("Direct class - Total VP:", vpCalculator.calculateTotalVP(testPlayer, true));
console.log("Direct class - Public VP:", vpCalculator.calculatePublicVP(testPlayer));
console.log("Direct class - Basic VP:", vpCalculator.calculateBasicVP(testPlayer));
console.log("Direct class - Hidden VP:", vpCalculator.calculateHiddenVP(testPlayer));
console.log("Direct class - Special VP:", vpCalculator.calculateSpecialVP(testPlayer));
