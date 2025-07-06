// longestRoadDebug.js
// Debug script to analyze longest road calculation issues

import { debugRoadConnections, diagnoseCoordinateSystem } from './victoryPoints.js';

/**
 * Enable debug logging for road connections
 */
export function enableRoadDebug() {
  window.DEBUG_ROAD_CONNECTIONS = true;
  console.log('Road debugging enabled');
}

/**
 * Disable debug logging for road connections
 */
export function disableRoadDebug() {
  window.DEBUG_ROAD_CONNECTIONS = false;
  console.log('Road debugging disabled');
}

/**
 * Analyze current player's roads and find potential issues
 */
export function analyzePlayerRoads(player) {
  console.log('\n=== ROAD ANALYSIS ===');
  console.log(`Player: ${player.name}`);
  console.log(`Total roads: ${player.roads ? player.roads.length : 0}`);
  
  if (!player.roads || player.roads.length === 0) {
    console.log('No roads to analyze');
    return;
  }
  
  // List all roads
  console.log('\nAll roads:');
  player.roads.forEach((road, index) => {
    console.log(`${index + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  // Run debug analysis
  debugRoadConnections(player.roads);
}

/**
 * Test road connection detection with specific examples
 */
export function testRoadConnections() {
  console.log('\n=== TESTING ROAD CONNECTIONS ===');
  
  // Test case 1: Two roads that should connect
  const testRoads1 = [
    { q: 0, r: 0, edge: 0 },  // Top edge of center tile
    { q: 1, r: 0, edge: 3 }   // Bottom edge of adjacent tile
  ];
  
  console.log('Test 1: Adjacent tiles, connecting edges');
  console.log('Roads:', testRoads1);
  debugRoadConnections(testRoads1);
  
  // Test case 2: Roads around a single tile
  const testRoads2 = [
    { q: 0, r: 0, edge: 0 },  // Top edge
    { q: 0, r: 0, edge: 1 },  // Top-right edge
    { q: 0, r: 0, edge: 2 }   // Bottom-right edge
  ];
  
  console.log('\nTest 2: Sequential edges around same tile');
  console.log('Roads:', testRoads2);
  debugRoadConnections(testRoads2);
  
  // Test case 3: A typical 5-road chain
  const testRoads3 = [
    { q: 0, r: 0, edge: 0 },  // Center tile, edge 0
    { q: 0, r: 0, edge: 1 },  // Center tile, edge 1 (connects to edge 0)
    { q: 1, r: 0, edge: 4 },  // Right tile, edge 4 (connects to center edge 1)
    { q: 1, r: 0, edge: 5 },  // Right tile, edge 5 (connects to edge 4)
    { q: 1, r: 0, edge: 0 }   // Right tile, edge 0 (connects to edge 5)
  ];
  
  console.log('\nTest 3: 5-road chain across tiles');
  console.log('Roads:', testRoads3);
  debugRoadConnections(testRoads3);
}

/**
 * Test specific problematic road configurations
 */
export function testProblematicRoads() {
  console.log('\n=== TESTING PROBLEMATIC ROADS ===');
  
  // Test the specific failing case from original Test 3
  const road1 = { q: 1, r: 0, edge: 3 }; // Should connect to road2?
  const road2 = { q: 1, r: 1, edge: 4 }; // Should connect to road1?
  
  console.log('Testing connection between:');
  console.log('Road 1:', road1);
  console.log('Road 2:', road2);
  
  // Use the global test function
  if (window.testRoadConnection) {
    const sharedEdge = window.testRoadConnection(road1, road2);
    console.log('Shared edge result:', sharedEdge);
  }
  
  // Test if they should be connected by analyzing the coordinate system
  console.log('\nManual analysis:');
  console.log('Road 1 (1,0,3): edge 3 direction is [-1,0], neighbor is (0,0), opposite edge is 0');
  console.log('Road 2 (1,1,4): edge 4 direction is [0,-1], neighbor is (1,0), opposite edge is 1');
  console.log('Expected: These roads should NOT be connected (different neighbor tiles)');
  
  console.log('=== END PROBLEMATIC ROADS TEST ===\n');
}

/**
 * Check if roads are properly normalized (no duplicates from different tile perspectives)
 */
export function checkRoadNormalization(allPlayers) {
  console.log('\n=== ROAD NORMALIZATION CHECK ===');
  
  const allRoads = [];
  allPlayers.forEach(player => {
    if (player.roads) {
      player.roads.forEach(road => {
        allRoads.push({
          player: player.name,
          road: road
        });
      });
    }
  });
  
  console.log(`Total roads across all players: ${allRoads.length}`);
  
  // Check for potential duplicates (same edge from different tile perspectives)
  const roadMap = new Map();
  allRoads.forEach(({ player, road }) => {
    const key1 = `${road.q},${road.r},${road.edge}`;
    
    // Calculate the alternative representation from neighbor tile
    const directions = [
      [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
    ];
    const [nq, nr] = [road.q + directions[road.edge][0], road.r + directions[road.edge][1]];
    const key2 = `${nq},${nr},${(road.edge + 3) % 6}`;
    
    if (roadMap.has(key1)) {
      console.log(`⚠️  Duplicate road found: ${key1} (players: ${roadMap.get(key1)} and ${player})`);
    } else {
      roadMap.set(key1, player);
    }
    
    if (roadMap.has(key2)) {
      console.log(`⚠️  Duplicate road found: ${key2} (alternative form of ${key1}) (players: ${roadMap.get(key2)} and ${player})`);
    }
  });
  
  console.log('Normalization check complete');
}

/**
 * Create a debug UI button for road analysis
 */
export function createDebugUI() {
  const debugContainer = document.createElement('div');
  debugContainer.id = 'road-debug-container';
  debugContainer.style.position = 'fixed';
  debugContainer.style.top = '10px';
  debugContainer.style.right = '10px';
  debugContainer.style.zIndex = '10000';
  debugContainer.style.backgroundColor = 'rgba(0,0,0,0.8)';
  debugContainer.style.color = 'white';
  debugContainer.style.padding = '10px';
  debugContainer.style.borderRadius = '5px';
  debugContainer.style.fontSize = '12px';
  
  const title = document.createElement('h3');
  title.textContent = 'Road Debug Tools';
  title.style.margin = '0 0 10px 0';
  debugContainer.appendChild(title);
  
  // Enable/Disable debug button
  const debugToggle = document.createElement('button');
  debugToggle.textContent = 'Enable Debug';
  debugToggle.style.display = 'block';
  debugToggle.style.marginBottom = '5px';
  debugToggle.onclick = () => {
    if (window.DEBUG_ROAD_CONNECTIONS) {
      disableRoadDebug();
      debugToggle.textContent = 'Enable Debug';
    } else {
      enableRoadDebug();
      debugToggle.textContent = 'Disable Debug';
    }
  };
  debugContainer.appendChild(debugToggle);
  
  // Analyze current player button
  const analyzeBtn = document.createElement('button');
  analyzeBtn.textContent = 'Analyze Current Player';
  analyzeBtn.style.display = 'block';
  analyzeBtn.style.marginBottom = '5px';
  analyzeBtn.onclick = () => {
    if (window.currentPlayer) {
      analyzePlayerRoads(window.currentPlayer);
    } else {
      console.log('No current player found');
    }
  };
  debugContainer.appendChild(analyzeBtn);
  
  // Test connections button
  const testBtn = document.createElement('button');
  testBtn.textContent = 'Test Connections';
  testBtn.style.display = 'block';
  testBtn.style.marginBottom = '5px';
  testBtn.onclick = testRoadConnections;
  debugContainer.appendChild(testBtn);
  
  // Check normalization button
  const normalizeBtn = document.createElement('button');
  normalizeBtn.textContent = 'Check Normalization';
  normalizeBtn.style.display = 'block';
  normalizeBtn.style.marginBottom = '5px';
  normalizeBtn.onclick = () => {
    if (window.players) {
      checkRoadNormalization(window.players);
    } else {
      console.log('No players found');
    }
  };
  debugContainer.appendChild(normalizeBtn);
  
  // Diagnose coordinate system button
  const diagnoseBtn = document.createElement('button');
  diagnoseBtn.textContent = 'Diagnose Coordinates';
  diagnoseBtn.style.display = 'block';
  diagnoseBtn.style.marginBottom = '5px';
  diagnoseBtn.onclick = () => {
    if (window.diagnoseCoordinateSystem) {
      window.diagnoseCoordinateSystem();
    } else {
      console.log('Diagnosis function not available');
    }
  };
  debugContainer.appendChild(diagnoseBtn);
  
  // Test problematic roads button
  const problematicBtn = document.createElement('button');
  problematicBtn.textContent = 'Test Problematic Roads';
  problematicBtn.style.display = 'block';
  problematicBtn.style.marginBottom = '5px';
  problematicBtn.onclick = testProblematicRoads;
  debugContainer.appendChild(problematicBtn);
  
  // Analyze actual roads button
  const actualRoadsBtn = document.createElement('button');
  actualRoadsBtn.textContent = 'Analyze Actual Roads';
  actualRoadsBtn.style.display = 'block';
  actualRoadsBtn.style.marginBottom = '5px';
  actualRoadsBtn.onclick = () => {
    if (window.analyzeActualRoads) {
      window.analyzeActualRoads();
    } else {
      console.log('analyzeActualRoads function not available');
    }
  };
  debugContainer.appendChild(actualRoadsBtn);
  
  // Test connection logic button
  const testLogicBtn = document.createElement('button');
  testLogicBtn.textContent = 'Test Connection Logic';
  testLogicBtn.style.display = 'block';
  testLogicBtn.style.marginBottom = '5px';
  testLogicBtn.onclick = () => {
    if (window.testRoadConnectionLogic) {
      window.testRoadConnectionLogic();
    } else {
      console.log('testRoadConnectionLogic function not available');
    }
  };
  debugContainer.appendChild(testLogicBtn);
  
  // Test 5-road chain button
  const testFiveRoadBtn = document.createElement('button');
  testFiveRoadBtn.textContent = 'Test 5-Road Chain';
  testFiveRoadBtn.style.display = 'block';
  testFiveRoadBtn.style.marginBottom = '5px';
  testFiveRoadBtn.onclick = () => {
    if (window.testFiveRoadChain) {
      window.testFiveRoadChain();
    } else {
      console.log('testFiveRoadChain function not available');
    }
  };
  debugContainer.appendChild(testFiveRoadBtn);
  
  // Add test roads button
  const addTestRoadsBtn = document.createElement('button');
  addTestRoadsBtn.textContent = 'Add Test Roads to Current Player';
  addTestRoadsBtn.style.display = 'block';
  addTestRoadsBtn.style.marginBottom = '5px';
  addTestRoadsBtn.onclick = () => {
    if (window.addTestRoads) {
      window.addTestRoads();
    } else {
      console.log('addTestRoads function not available');
    }
  };
  debugContainer.appendChild(addTestRoadsBtn);
  
  // Clear test roads button
  const clearRoadsBtn = document.createElement('button');
  clearRoadsBtn.textContent = 'Clear Test Roads';
  clearRoadsBtn.style.display = 'block';
  clearRoadsBtn.style.marginBottom = '5px';
  clearRoadsBtn.onclick = () => {
    if (window.clearTestRoads) {
      window.clearTestRoads();
    } else {
      console.log('clearTestRoads function not available');
    }
  };
  debugContainer.appendChild(clearRoadsBtn);
  
  // Check achievement button
  const checkAchievementBtn = document.createElement('button');
  checkAchievementBtn.textContent = 'Check Achievement Status';
  checkAchievementBtn.style.display = 'block';
  checkAchievementBtn.style.marginBottom = '5px';
  checkAchievementBtn.onclick = () => {
    if (window.checkLongestRoadAchievement) {
      window.checkLongestRoadAchievement();
    } else {
      console.log('checkLongestRoadAchievement function not available');
    }
  };
  debugContainer.appendChild(checkAchievementBtn);
  
  document.body.appendChild(debugContainer);
  
  console.log('Road debug UI created');
}

// Auto-create debug UI when this module is loaded
if (typeof window !== 'undefined') {
  window.addEventListener('load', () => {
    setTimeout(createDebugUI, 1000);
  });
}
