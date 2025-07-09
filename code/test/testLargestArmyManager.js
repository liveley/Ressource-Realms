// Test script for LargestArmyManager class
import { updateLargestArmy, playKnight } from '../modules/victoryPoints.js';
import { LargestArmyManager } from '../modules/victoryPointSystem/LargestArmyManager.js';

// Test both the new class directly and the legacy functions

// Test player data with knights
const testPlayerManyKnights = {
  name: "PlayerManyKnights",
  knightsPlayed: 5,
  victoryPoints: {
    largestArmy: 0
  }
};

const testPlayerFewKnights = {
  name: "PlayerFewKnights", 
  knightsPlayed: 2,
  victoryPoints: {
    largestArmy: 0
  }
};

const testPlayerNoKnights = {
  name: "PlayerNoKnights",
  knightsPlayed: 0,
  victoryPoints: {
    largestArmy: 0
  }
};

console.log("=== LargestArmyManager Test ===");

// Test direct class usage
const armyManager = new LargestArmyManager();

// Test knight counting
console.log("Knight counts:");
console.log(`${testPlayerManyKnights.name}: ${armyManager.getKnightCount(testPlayerManyKnights)} knights`);
console.log(`${testPlayerFewKnights.name}: ${armyManager.getKnightCount(testPlayerFewKnights)} knights`);
console.log(`${testPlayerNoKnights.name}: ${armyManager.getKnightCount(testPlayerNoKnights)} knights`);

// Test qualification
console.log("\nQualification for Largest Army:");
console.log(`${testPlayerManyKnights.name}: ${armyManager.qualifiesForLargestArmy(testPlayerManyKnights)}`);
console.log(`${testPlayerFewKnights.name}: ${armyManager.qualifiesForLargestArmy(testPlayerFewKnights)}`);
console.log(`${testPlayerNoKnights.name}: ${armyManager.qualifiesForLargestArmy(testPlayerNoKnights)}`);

// Test achievement update
console.log("\n=== Achievement Update Test ===");
const allPlayers = [testPlayerManyKnights, testPlayerFewKnights, testPlayerNoKnights];

console.log("Before update:");
allPlayers.forEach(p => console.log(`${p.name}: ${p.victoryPoints?.largestArmy || 0} VP`));

updateLargestArmy(allPlayers);

console.log("After update:");
allPlayers.forEach(p => console.log(`${p.name}: ${p.victoryPoints?.largestArmy || 0} VP`));

// Test knight playing
console.log("\n=== Knight Playing Test ===");
console.log(`${testPlayerFewKnights.name} plays 2 more knights:`);

playKnight(testPlayerFewKnights, allPlayers);
console.log(`Knights after 1st play: ${testPlayerFewKnights.knightsPlayed}`);

playKnight(testPlayerFewKnights, allPlayers);
console.log(`Knights after 2nd play: ${testPlayerFewKnights.knightsPlayed}`);

console.log("Victory points after knight plays:");
allPlayers.forEach(p => console.log(`${p.name}: ${p.victoryPoints?.largestArmy || 0} VP`));

// Test army statistics
console.log("\n=== Army Statistics ===");
const stats = armyManager.getArmyStatistics(allPlayers);
stats.forEach(stat => {
  console.log(`${stat.player.name}: ${stat.knights} knights, qualifies: ${stat.qualifies}, has achievement: ${stat.hasAchievement}`);
});

console.log("Current holder:", armyManager.getCurrentLargestArmyHolder(allPlayers)?.name || 'None');

// Test tie scenario
console.log("\n=== Tie Scenario Test ===");
const player1 = { name: "Player1", knightsPlayed: 3, victoryPoints: { largestArmy: 2 } }; // Current holder
const player2 = { name: "Player2", knightsPlayed: 3, victoryPoints: { largestArmy: 0 } }; // Tied
const tiePlayers = [player1, player2];

console.log("Before tie resolution:");
tiePlayers.forEach(p => console.log(`${p.name}: ${p.knightsPlayed} knights, ${p.victoryPoints.largestArmy} VP`));

armyManager.updateLargestArmy(tiePlayers);

console.log("After tie resolution (current holder should keep it):");
tiePlayers.forEach(p => console.log(`${p.name}: ${p.knightsPlayed} knights, ${p.victoryPoints.largestArmy} VP`));
