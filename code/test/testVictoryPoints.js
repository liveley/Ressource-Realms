// test/testVictoryPoints.js
// Simple test file to check victory points implementation

import { 
  initializeVictoryPoints, 
  calculateVictoryPoints, 
  updateAllVictoryPoints,
  addVictoryPointCard,
  getVictoryPointsForDisplay,
  playKnight,
  updateLongestRoad,
  updateLargestArmy
} from '../modules/victoryPoints.js';

// Test players
const testPlayers = [
  {
    name: 'Test Player 1',
    settlements: [{ q: 0, r: 0, corner: 0 }],
    cities: [{ q: 1, r: 1, corner: 1 }],
    roads: [
      { q: 0, r: 0, edge: 0 },
      { q: 0, r: 0, edge: 1 },
      { q: 1, r: 0, edge: 2 },
      { q: 1, r: 0, edge: 3 },
      { q: 1, r: 0, edge: 4 }
    ],
    knightsPlayed: 0
  },
  {
    name: 'Test Player 2',
    settlements: [],
    cities: [],
    roads: [
      { q: 2, r: 0, edge: 0 },
      { q: 2, r: 0, edge: 1 },
      { q: 2, r: 1, edge: 2 }
    ],
    knightsPlayed: 0
  }
];

console.log('Testing Victory Points System...');

// Initialize
initializeVictoryPoints(testPlayers);
console.log('Initialized:', testPlayers[0].victoryPoints);

// Update all VPs
updateAllVictoryPoints(testPlayers[0], testPlayers);
console.log('After update:', testPlayers[0].victoryPoints);

// Test longest road
console.log('\n=== Testing Longest Road ===');
updateLongestRoad(testPlayers);
console.log('Player 1 longest road VP:', testPlayers[0].victoryPoints.longestRoad);
console.log('Player 1 longest road length:', testPlayers[0].longestRoadLength);

// Test knights
console.log('\n=== Testing Largest Army ===');
// Play 3 knights for player 1
playKnight(testPlayers[0], testPlayers);
playKnight(testPlayers[0], testPlayers);
playKnight(testPlayers[0], testPlayers);
console.log('After 3 knights - Player 1 largest army VP:', testPlayers[0].victoryPoints.largestArmy);
console.log('Player 1 knights played:', testPlayers[0].knightsPlayed);

// Add victory point card
addVictoryPointCard(testPlayers[0]);
console.log('After VP card:', testPlayers[0].victoryPoints);

// Calculate total
const total = calculateVictoryPoints(testPlayers[0]);
console.log('Total VP:', total);

// Get display
const display = getVictoryPointsForDisplay(testPlayers[0], true);
console.log('Display:', display);

console.log('Victory Points Test Complete!');
