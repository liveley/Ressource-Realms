// Test script for LongestRoadManager class
import { calculateLongestRoad, updateLongestRoad } from '../modules/victoryPoints.js';
import { LongestRoadManager } from '../modules/victoryPointSystem/LongestRoadManager.js';

// Test both the new class directly and the legacy functions

// Test player data with roads
const testPlayerWithRoads = {
  name: "PlayerWithRoads",
  roads: [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 1, r: 0, edge: 2 },
    { q: 1, r: 0, edge: 3 },
    { q: 2, r: 0, edge: 0 }
  ],
  victoryPoints: {
    longestRoad: 0
  }
};

const testPlayerFewRoads = {
  name: "PlayerFewRoads", 
  roads: [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 }
  ],
  victoryPoints: {
    longestRoad: 0
  }
};

const testPlayerNoRoads = {
  name: "PlayerNoRoads",
  roads: [],
  victoryPoints: {
    longestRoad: 0
  }
};

console.log("=== LongestRoadManager Test ===");

// Test longest road calculation
console.log("Player with roads - Longest road:", calculateLongestRoad(testPlayerWithRoads));
console.log("Player with few roads - Longest road:", calculateLongestRoad(testPlayerFewRoads));
console.log("Player with no roads - Longest road:", calculateLongestRoad(testPlayerNoRoads));

// Test direct class usage
console.log("\n=== Direct Class Test ===");
const roadManager = new LongestRoadManager();
console.log("Direct class - Longest road:", roadManager.calculateLongestRoad(testPlayerWithRoads));

// Test achievement update
console.log("\n=== Achievement Update Test ===");
const allPlayers = [testPlayerWithRoads, testPlayerFewRoads, testPlayerNoRoads];

console.log("Before update:");
allPlayers.forEach(p => console.log(`${p.name}: ${p.victoryPoints?.longestRoad || 0} VP`));

updateLongestRoad(allPlayers);

console.log("After update:");
allPlayers.forEach(p => console.log(`${p.name}: ${p.victoryPoints?.longestRoad || 0} VP`));

// Test road statistics
console.log("\n=== Road Statistics ===");
const stats = roadManager.getRoadStatistics(allPlayers);
stats.forEach(stat => {
  console.log(`${stat.player.name}: ${stat.length} roads, has achievement: ${stat.hasAchievement}`);
});

console.log("Current holder:", roadManager.getCurrentLongestRoadHolder(allPlayers)?.name || 'None');
