// Road Testing and Debug Utilities
// This file contains all the debugging and testing functions for road connections and longest road calculations
//
// HOW TO USE:
// 1. Start your game in the browser
// 2. Open Developer Tools (F12 or right-click → Inspect)
// 3. Go to the Console tab
// 4. Paste any of the available function names to run them:
//    - testRoadConnectionLogic()
//    - analyzeActualRoads()
//    - checkLongestRoadAchievement()
//    - debugLongestRoadPath(playerIndex)
//    - testSpecificConnection(road1, road2)
//    - testFiveRoadChain()
//    - simulateRoadBuilding(playerIndex)
//    - addTestRoads() / clearTestRoads()
//
// Example: Type "analyzeActualRoads()" in the console and press Enter

import { calculateLongestRoad } from '../victoryPoints.js';

// Function to test road connection using the exact logic from victoryPoints.js
function testRoadConnectionActual(road1, road2) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge (different tile perspectives)
  const [nq1, nr1] = [road1.q + directions[road1.edge][0], road1.r + directions[road1.edge][1]];
  const oppositeEdge1 = (road1.edge + 3) % 6;
  
  if (nq1 === road2.q && nr1 === road2.r && oppositeEdge1 === road2.edge) {
    return true; // Same physical edge
  }
  
  const [nq2, nr2] = [road2.q + directions[road2.edge][0], road2.r + directions[road2.edge][1]];
  const oppositeEdge2 = (road2.edge + 3) % 6;
  
  if (nq2 === road1.q && nr2 === road1.r && oppositeEdge2 === road1.edge) {
    return true; // Same physical edge (other direction)
  }
  
  // Method 2: Adjacent roads on same tile (share a vertex)
  if (road1.q === road2.q && road1.r === road2.r) {
    const edgeDiff = Math.abs(road1.edge - road2.edge);
    if (edgeDiff === 1 || edgeDiff === 5) { // Adjacent edges (including wrap-around 0-5)
      return true;
    }
  }
  
  // Method 3: Roads on different tiles that share a vertex
  const vertices1 = getRoadVerticesSimple(road1);
  const vertices2 = getRoadVerticesSimple(road2);
  
  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqualSimple(v1, v2)) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to get vertices of a road
function getRoadVerticesSimple(road) {
  const vertices = [];
  
  // Each edge connects two vertices (corners of the hex)
  // Using the same logic as in victoryPoints.js
  const edgeToVertices = {
    0: [0, 1], // Top edge: top to top-right
    1: [1, 2], // Top-right edge: top-right to bottom-right
    2: [2, 3], // Bottom-right edge: bottom-right to bottom
    3: [3, 4], // Bottom edge: bottom to bottom-left
    4: [4, 5], // Bottom-left edge: bottom-left to top-left
    5: [5, 0]  // Top-left edge: top-left to top
  };
  
  const vertexIndices = edgeToVertices[road.edge] || [0, 1];
  
  for (const vertexIndex of vertexIndices) {
    vertices.push({
      q: road.q,
      r: road.r,
      corner: vertexIndex
    });
  }
  
  return vertices;
}

// Helper function to check if two vertices are equal
function areVerticesEqualSimple(v1, v2) {
  // First check if they're exactly the same
  if (v1.q === v2.q && v1.r === v2.r && v1.corner === v2.corner) {
    return true;
  }
  
  // Check for equivalent vertices (same vertex from different tile perspectives)
  const equivalents = getEquivalentVerticesSimple(v1);
  
  for (const equiv of equivalents) {
    if (equiv.q === v2.q && equiv.r === v2.r && equiv.corner === v2.corner) {
      return true;
    }
  }
  
  return false;
}

// Helper function to get equivalent vertices (same vertex from different tile perspectives)
function getEquivalentVerticesSimple(vertex) {
  const equivalents = [];
  const { q, r, corner } = vertex;
  
  // Based on axial coordinates, each vertex can be referenced from 3 different tiles
  // Using simplified logic for vertex equivalence
  
  // Corner 0 (top) equivalents
  if (corner === 0) {
    equivalents.push({ q: q, r: r - 1, corner: 3 });     // Bottom of tile above
    equivalents.push({ q: q - 1, r: r, corner: 2 });     // Bottom-right of tile to left
  }
  // Corner 1 (top-right) equivalents
  else if (corner === 1) {
    equivalents.push({ q: q + 1, r: r - 1, corner: 4 }); // Bottom-left of tile to top-right
    equivalents.push({ q: q, r: r - 1, corner: 5 });     // Top-left of tile above
  }
  // Corner 2 (bottom-right) equivalents
  else if (corner === 2) {
    equivalents.push({ q: q + 1, r: r, corner: 5 });     // Top-left of tile to right
    equivalents.push({ q: q + 1, r: r - 1, corner: 0 }); // Top of tile to top-right
  }
  // Corner 3 (bottom) equivalents
  else if (corner === 3) {
    equivalents.push({ q: q, r: r + 1, corner: 0 });     // Top of tile below
    equivalents.push({ q: q + 1, r: r, corner: 4 });     // Bottom-left of tile to right
  }
  // Corner 4 (bottom-left) equivalents
  else if (corner === 4) {
    equivalents.push({ q: q - 1, r: r + 1, corner: 1 }); // Top-right of tile to bottom-left
    equivalents.push({ q: q, r: r + 1, corner: 2 });     // Bottom-right of tile below
  }
  // Corner 5 (top-left) equivalents
  else if (corner === 5) {
    equivalents.push({ q: q - 1, r: r, corner: 1 });     // Top-right of tile to left
    equivalents.push({ q: q - 1, r: r + 1, corner: 3 }); // Bottom of tile to bottom-left
  }
  
  return equivalents;
}

// Helper function to calculate longest road from roads array
function calculateLongestRoadFromArray(roads) {
  if (!roads || roads.length === 0) return 0;
  
  // Create a temporary player object
  const tempPlayer = { roads };
  return calculateLongestRoad(tempPlayer);
}

// Helper function for DFS with path tracking
function dfsWithPath(adjacencyList, current, visited, path) {
  visited.add(current);
  path.push(current);
  
  let maxLength = 0;
  let bestPath = [...path];
  
  const neighbors = adjacencyList.get(current) || [];
  
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const result = dfsWithPath(adjacencyList, neighbor, visited, path);
      if (result.length > maxLength) {
        maxLength = result.length;
        bestPath = result.path;
      }
    }
  }
  
  visited.delete(current);
  path.pop();
  
  return { length: maxLength + 1, path: bestPath };
}

// Enhanced debug function to trace longest road path
function debugLongestRoadPath(playerIndex = null) {
  if (!window.players || window.players.length === 0) {
    console.log('No players available');
    return;
  }
  
  const player = playerIndex !== null ? window.players[playerIndex] : window.players[window.activePlayerIdx || 0];
  console.log(`\n=== DEBUG LONGEST ROAD PATH FOR ${player.name} ===`);
  
  if (!player.roads || player.roads.length === 0) {
    console.log('Player has no roads');
    return;
  }
  
  // Build adjacency list
  const adjacencyList = new Map();
  player.roads.forEach(road => {
    const key = `${road.q},${road.r},${road.edge}`;
    adjacencyList.set(key, []);
  });
  
  // Find connections
  player.roads.forEach((road1, i) => {
    const key1 = `${road1.q},${road1.r},${road1.edge}`;
    player.roads.forEach((road2, j) => {
      if (i === j) return;
      const connected = testRoadConnectionActual(road1, road2);
      if (connected) {
        const key2 = `${road2.q},${road2.r},${road2.edge}`;
        adjacencyList.get(key1).push(key2);
      }
    });
  });
  
  console.log('Adjacency list:');
  adjacencyList.forEach((neighbors, road) => {
    console.log(`  ${road}: [${neighbors.join(', ')}]`);
  });
  
  // Find longest path from each starting point
  let maxLength = 0;
  let bestPath = [];
  
  adjacencyList.forEach((neighbors, startRoad) => {
    console.log(`\nStarting DFS from ${startRoad}:`);
    const visited = new Set();
    const path = [];
    const result = dfsWithPath(adjacencyList, startRoad, visited, path);
    
    console.log(`  Path length: ${result.length}`);
    console.log(`  Path: ${result.path.join(' -> ')}`);
    
    if (result.length > maxLength) {
      maxLength = result.length;
      bestPath = result.path;
    }
  });
  
  console.log(`\nBest path found:`);
  console.log(`Length: ${maxLength}`);
  console.log(`Path: ${bestPath.join(' -> ')}`);
  
  console.log(`\n=== END DEBUG ===`);
  
  return { maxLength, bestPath };
}

// Function to simulate building roads one by one and track achievement changes
function simulateRoadBuilding(playerIndex = null) {
  if (!window.players || window.players.length === 0) {
    console.log('No players available');
    return;
  }
  
  const player = playerIndex !== null ? window.players[playerIndex] : window.players[window.activePlayerIdx || 0];
  const originalRoads = [...player.roads];
  
  console.log(`\n=== SIMULATING ROAD BUILDING FOR ${player.name} ===`);
  
  // Clear roads
  player.roads = [];
  
  // Add roads one by one
  originalRoads.forEach((road, i) => {
    console.log(`\nBuilding road ${i + 1}: {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
    player.roads.push(road);
    
    // Calculate longest road
    const longestLength = window.calculateLongestRoad ? window.calculateLongestRoad(player) : 0;
    console.log(`  Longest road after building: ${longestLength}`);
    
    // Update victory points
    if (window.updateLongestRoad) {
      window.updateLongestRoad(window.players);
    }
    
    const hasAchievement = player.victoryPoints?.longestRoad > 0;
    console.log(`  Has achievement: ${hasAchievement}`);
    
    if (hasAchievement && longestLength < 5) {
      console.log(`  ⚠️  WARNING: Has achievement but longest road is only ${longestLength}`);
    }
    if (!hasAchievement && longestLength >= 5) {
      console.log(`  ⚠️  WARNING: No achievement but longest road is ${longestLength}`);
    }
  });
  
  console.log(`\n=== SIMULATION COMPLETE ===`);
}

// Function to test specific road connection
function testSpecificConnection(road1, road2) {
  console.log(`\n=== TESTING SPECIFIC CONNECTION ===`);
  console.log(`Road 1: {q: ${road1.q}, r: ${road1.r}, edge: ${road1.edge}}`);
  console.log(`Road 2: {q: ${road2.q}, r: ${road2.r}, edge: ${road2.edge}}`);
  
  const connected = testRoadConnectionActual(road1, road2);
  console.log(`Connected: ${connected}`);
  
  // Show detailed analysis
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge
  const [nq1, nr1] = [road1.q + directions[road1.edge][0], road1.r + directions[road1.edge][1]];
  const oppositeEdge1 = (road1.edge + 3) % 6;
  const sameEdge1 = (nq1 === road2.q && nr1 === road2.r && oppositeEdge1 === road2.edge);
  
  const [nq2, nr2] = [road2.q + directions[road2.edge][0], road2.r + directions[road2.edge][1]];
  const oppositeEdge2 = (road2.edge + 3) % 6;
  const sameEdge2 = (nq2 === road1.q && nr2 === road1.r && oppositeEdge2 === road1.edge);
  
  console.log(`Same edge check 1: ${sameEdge1} (${road1.q},${road1.r},${road1.edge} -> neighbor (${nq1},${nr1}) vs (${road2.q},${road2.r},${road2.edge}) with opposite edge ${oppositeEdge1})`);
  console.log(`Same edge check 2: ${sameEdge2} (${road2.q},${road2.r},${road2.edge} -> neighbor (${nq2},${nr2}) vs (${road1.q},${road1.r},${road1.edge}) with opposite edge ${oppositeEdge2})`);
  
  // Method 2: Same tile adjacent
  const sameTile = (road1.q === road2.q && road1.r === road2.r);
  let adjacent = false;
  if (sameTile) {
    const edgeDiff = Math.abs(road1.edge - road2.edge);
    adjacent = (edgeDiff === 1 || edgeDiff === 5);
  }
  console.log(`Same tile adjacent: ${adjacent} (same tile: ${sameTile})`);
  
  // Method 3: Vertex sharing
  const vertices1 = getRoadVerticesSimple(road1);
  const vertices2 = getRoadVerticesSimple(road2);
  let sharedVertex = false;

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqualSimple(v1, v2)) {
        console.log(`Shared vertex found: {q: ${v1.q}, r: ${v1.r}, corner: ${v1.corner}}`);
        sharedVertex = true;
        break;
      }
    }
    if (sharedVertex) break;
  }

  console.log(`Vertex sharing: ${sharedVertex}`);
  console.log(`=== END TEST ===`);
}

// Function to analyze actual roads in the game
function analyzeActualRoads() {
  console.log('\n=== ANALYZING ACTUAL ROADS IN GAME ===');
  
  if (!window.players || !Array.isArray(window.players)) {
    console.log('No players array found');
    return;
  }
  
  window.players.forEach((player, i) => {
    console.log(`\nPlayer ${i + 1} (${player.name}):`);
    console.log(`  Roads: ${player.roads ? player.roads.length : 0}`);
    
    if (player.roads && player.roads.length > 0) {
      player.roads.forEach((road, j) => {
        console.log(`    ${j + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
      });
    }
  });
  
  console.log('\n=== END ANALYSIS ===');
}

// Function to test road connection logic
function testRoadConnectionLogic() {
  console.log('\n=== TESTING ROAD CONNECTION LOGIC ===');
  
  // Test case 1: Same physical edge from different tiles
  console.log('\n--- Test 1: Same physical edge ---');
  const road1 = { q: 0, r: 0, edge: 0 };
  const road2 = { q: 0, r: -1, edge: 3 };
  console.log(`Road 1: {q: ${road1.q}, r: ${road1.r}, edge: ${road1.edge}}`);
  console.log(`Road 2: {q: ${road2.q}, r: ${road2.r}, edge: ${road2.edge}}`);
  console.log(`Should connect: ${testRoadConnectionActual(road1, road2)}`);
  
  // Test case 2: Adjacent edges on same tile
  console.log('\n--- Test 2: Adjacent edges on same tile ---');
  const road3 = { q: 0, r: 0, edge: 0 };
  const road4 = { q: 0, r: 0, edge: 1 };
  console.log(`Road 3: {q: ${road3.q}, r: ${road3.r}, edge: ${road3.edge}}`);
  console.log(`Road 4: {q: ${road4.q}, r: ${road4.r}, edge: ${road4.edge}}`);
  console.log(`Should connect: ${testRoadConnectionActual(road3, road4)}`);
  
  // Test case 3: Roads that should NOT connect
  console.log('\n--- Test 3: Roads that should NOT connect ---');
  const road5 = { q: 0, r: 0, edge: 0 };
  const road6 = { q: 1, r: 1, edge: 3 };
  console.log(`Road 5: {q: ${road5.q}, r: ${road5.r}, edge: ${road5.edge}}`);
  console.log(`Road 6: {q: ${road6.q}, r: ${road6.r}, edge: ${road6.edge}}`);
  console.log(`Should NOT connect: ${testRoadConnectionActual(road5, road6)}`);
  
  console.log('\n=== END CONNECTION LOGIC TEST ===');
}

// Function to test a 5-road chain
function testFiveRoadChain() {
  console.log('\n=== TESTING 5-ROAD CHAIN ===');
  
  const testRoads = [
    { q: 0, r: 0, edge: 0 },  // Starting road
    { q: 0, r: 0, edge: 1 },  // Adjacent on same tile
    { q: 0, r: 0, edge: 2 },  // Adjacent on same tile
    { q: 1, r: 0, edge: 5 },  // Connected to edge 2 from neighbor tile
    { q: 1, r: 0, edge: 0 }   // Adjacent on same tile
  ];
  
  console.log('Test roads:');
  testRoads.forEach((road, i) => {
    console.log(`  ${i + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  // Test connections
  console.log('\nConnection tests:');
  for (let i = 0; i < testRoads.length - 1; i++) {
    const connected = testRoadConnectionActual(testRoads[i], testRoads[i + 1]);
    console.log(`  Road ${i + 1} -> Road ${i + 2}: ${connected}`);
  }
  
  // Calculate longest road
  const longestLength = calculateLongestRoadFromArray(testRoads);
  console.log(`\nLongest road length: ${longestLength}`);
  
  console.log('\n=== END 5-ROAD CHAIN TEST ===');
}

// Function to add test roads to current player
function addTestRoads() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== ADDING TEST ROADS ===');
  
  const testRoads = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 0, r: 0, edge: 2 },
    { q: 1, r: 0, edge: 5 },
    { q: 1, r: 0, edge: 0 }
  ];
  
  if (!window.currentPlayer.roads) {
    window.currentPlayer.roads = [];
  }
  
  testRoads.forEach((road, i) => {
    window.currentPlayer.roads.push(road);
    console.log(`Added road ${i + 1}: {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  console.log(`Total roads for ${window.currentPlayer.name}: ${window.currentPlayer.roads.length}`);
  console.log('\n=== TEST ROADS ADDED ===');
}

// Function to clear test roads
function clearTestRoads() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== CLEARING TEST ROADS ===');
  const originalCount = window.currentPlayer.roads ? window.currentPlayer.roads.length : 0;
  window.currentPlayer.roads = [];
  console.log(`Cleared ${originalCount} roads from ${window.currentPlayer.name}`);
  console.log('\n=== TEST ROADS CLEARED ===');
}

// Function to check longest road achievement
function checkLongestRoadAchievement() {
  console.log('\n=== CHECKING LONGEST ROAD ACHIEVEMENT ===');
  
  if (!window.players || !Array.isArray(window.players)) {
    console.log('No players array found');
    return;
  }
  
  let longestRoadHolder = null;
  let maxLength = 0;
  
  window.players.forEach((player, i) => {
    const roads = player.roads || [];
    const length = calculateLongestRoad(player);
    
    console.log(`Player ${i + 1} (${player.name}): ${length} roads`);
    console.log(`  Roads: ${roads.length}`);
    
    if (length > maxLength) {
      maxLength = length;
      longestRoadHolder = player;
    }
  });
  
  console.log(`\nLongest road: ${maxLength} roads`);
  console.log(`Holder: ${longestRoadHolder ? longestRoadHolder.name : 'None'}`);
  console.log(`Achievement threshold: 5 roads`);
  console.log(`Achievement earned: ${maxLength >= 5 ? 'YES' : 'NO'}`);
  
  console.log('\n=== END ACHIEVEMENT CHECK ===');
}

// Function to debug longest road path (alternative implementation)
function debugLongestRoadPathAlt() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== DEBUGGING LONGEST ROAD PATH ===');
  
  const roads = window.currentPlayer.roads || [];
  console.log(`Player: ${window.currentPlayer.name}`);
  console.log(`Total roads: ${roads.length}`);
  
  if (roads.length === 0) {
    console.log('No roads to analyze');
    return;
  }
  
  // Build adjacency list
  const adjacencyList = {};
  roads.forEach((road, i) => {
    adjacencyList[i] = [];
  });
  
  for (let i = 0; i < roads.length; i++) {
    for (let j = i + 1; j < roads.length; j++) {
      if (testRoadConnectionActual(roads[i], roads[j])) {
        adjacencyList[i].push(j);
        adjacencyList[j].push(i);
      }
    }
  }
  
  console.log('\nAdjacency list:');
  Object.keys(adjacencyList).forEach(i => {
    const road = roads[i];
    const connections = adjacencyList[i];
    console.log(`  Road ${i} {q: ${road.q}, r: ${road.r}, edge: ${road.edge}} -> [${connections.join(', ')}]`);
  });
  
  // Find longest path
  const longestLength = calculateLongestRoadFromArray(roads);
  console.log(`\nLongest road length: ${longestLength}`);
  
  console.log('\n=== END PATH DEBUG ===');
}

// Function to simulate road building (alternative implementation)
function simulateRoadBuildingAlt() {
  console.log('\n=== SIMULATING ROAD BUILDING ===');
  
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  // Clear existing roads
  window.currentPlayer.roads = [];
  
  const roadSequence = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 0, r: 0, edge: 2 },
    { q: 1, r: 0, edge: 5 },
    { q: 1, r: 0, edge: 0 }
  ];
  
  roadSequence.forEach((road, i) => {
    window.currentPlayer.roads.push(road);
    const currentLength = calculateLongestRoad(window.currentPlayer);
    
    console.log(`Step ${i + 1}: Added road {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
    console.log(`  Current longest road: ${currentLength}`);
    console.log(`  Total roads: ${window.currentPlayer.roads.length}`);
    
    if (currentLength >= 5) {
      console.log(`  🏆 ACHIEVEMENT UNLOCKED! Longest road (${currentLength} roads)`);
    }
  });
  
  console.log('\n=== SIMULATION COMPLETE ===');
}

// Initialize global debug functions
export function initRoadTestingUtils() {
  // Make all functions available globally for debugging
  window.debugLongestRoadPath = debugLongestRoadPath;
  window.simulateRoadBuilding = simulateRoadBuilding;
  window.testSpecificConnection = testSpecificConnection;
  window.analyzeActualRoads = analyzeActualRoads;
  window.testRoadConnectionLogic = testRoadConnectionLogic;
  window.testFiveRoadChain = testFiveRoadChain;
  window.addTestRoads = addTestRoads;
  window.clearTestRoads = clearTestRoads;
  window.checkLongestRoadAchievement = checkLongestRoadAchievement;
  
  // Alternative implementations
  window.debugLongestRoadPathAlt = debugLongestRoadPathAlt;
  window.simulateRoadBuildingAlt = simulateRoadBuildingAlt;
  
  console.log('Road testing utilities initialized. Available functions:');
  console.log('- debugLongestRoadPath(playerIndex)');
  console.log('- simulateRoadBuilding(playerIndex)');
  console.log('- testSpecificConnection(road1, road2)');
  console.log('- analyzeActualRoads()');
  console.log('- testRoadConnectionLogic()');
  console.log('- testFiveRoadChain()');
  console.log('- addTestRoads()');
  console.log('- clearTestRoads()');
  console.log('- checkLongestRoadAchievement()');
}

// Export the main functions for use in other modules
export {
  testRoadConnectionActual,
  getRoadVerticesSimple,
  areVerticesEqualSimple,
  getEquivalentVerticesSimple,
  calculateLongestRoadFromArray,
  debugLongestRoadPath,
  simulateRoadBuilding,
  testSpecificConnection,
  analyzeActualRoads,
  testRoadConnectionLogic,
  testFiveRoadChain,
  addTestRoads,
  clearTestRoads,
  checkLongestRoadAchievement
};
