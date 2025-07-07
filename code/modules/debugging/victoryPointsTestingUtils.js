// modules/debugging/victoryPointsTestingUtils.js
// Debug and testing utilities for victory points and road connections
// 
// USAGE:
// 1. Import this module in main.js: import { initVictoryPointsTestingUtils } from './modules/debugging/victoryPointsTestingUtils.js';
// 2. Call initVictoryPointsTestingUtils() in main.js to make functions globally available
// 3. Use in browser console:
//    - debugRoadConnections(player.roads) - Debug road connections for a player
//    - getCanonicalRoad(road) - Get canonical representation of a road
//    - testRoadConnections() - Run comprehensive road connection tests

import { calculateLongestRoad, getCanonicalRoad } from '../victoryPoints.js';

// Internal functions that are also used in the debug module
// These are copies of the functions from victoryPoints.js for debugging purposes

/**
 * Build simple road adjacency list
 * @param {Array} roads - Array of road objects {q, r, edge}
 * @returns {Map} Adjacency list
 */
function buildSimpleRoadAdjacencyList(roads) {
  const adjacencyList = new Map();
  
  // Initialize adjacency list
  roads.forEach(road => {
    const key = getRoadKey(road);
    adjacencyList.set(key, []);
  });
  
  // For each road, check if it connects to any other road
  roads.forEach((road1, i) => {
    const key1 = getRoadKey(road1);
    
    roads.forEach((road2, j) => {
      if (i === j) return; // Skip self
      
      const key2 = getRoadKey(road2);
      
      // Check if roads are connected (share a vertex)
      if (areRoadsConnectedVertex(road1, road2)) {
        adjacencyList.get(key1).push(key2);
      }
    });
  });
  
  return adjacencyList;
}

/**
 * Check if two roads are connected using the EXACT same logic as the game
 * @param {Object} road1 - First road {q, r, edge}
 * @param {Object} road2 - Second road {q, r, edge}
 * @returns {boolean} True if roads are connected
 */
function areRoadsConnectedVertex(road1, road2) {
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
  const vertices1 = getRoadVertices(road1);
  const vertices2 = getRoadVertices(road2);
  
  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqual(v1, v2)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get vertices of a road
 * @param {Object} road - Road object {q, r, edge}
 * @returns {Array} Array of vertex objects
 */
function getRoadVertices(road) {
  const { q, r, edge } = road;
  
  // Map edge to the two corners it connects
  const edgeToCorners = {
    0: [0, 1], // Top edge: corners 0 and 1
    1: [1, 2], // Top-right edge: corners 1 and 2
    2: [2, 3], // Bottom-right edge: corners 2 and 3
    3: [3, 4], // Bottom edge: corners 3 and 4
    4: [4, 5], // Bottom-left edge: corners 4 and 5
    5: [5, 0]  // Top-left edge: corners 5 and 0
  };
  
  const corners = edgeToCorners[edge] || [0, 1];
  return corners.map(corner => ({ q, r, corner }));
}

/**
 * Check if two vertices are at the same location
 * @param {Object} v1 - First vertex
 * @param {Object} v2 - Second vertex
 * @returns {boolean} True if vertices are at the same location
 */
function areVerticesEqual(v1, v2) {
  // Direct match
  if (v1.q === v2.q && v1.r === v2.r && v1.corner === v2.corner) {
    return true;
  }
  
  // Check equivalent vertices (same physical location, different coordinate representation)
  const equivalents1 = getEquivalentVertices(v1);
  const equivalents2 = getEquivalentVertices(v2);
  
  return equivalents1.some(eq1 => 
    equivalents2.some(eq2 => 
      eq1.q === eq2.q && eq1.r === eq2.r && eq1.corner === eq2.corner
    )
  );
}

/**
 * Get all equivalent representations of a vertex
 * @param {Object} vertex - Vertex object {q, r, corner}
 * @returns {Array} Array of equivalent vertex objects
 */
function getEquivalentVertices(vertex) {
  const { q, r, corner } = vertex;
  
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  const equivalents = [{ q, r, corner }];
  
  // Add representation from neighbor in direction (corner-1)%6
  const dir1 = (corner + 5) % 6; // (corner - 1) % 6 with wrap-around
  const neighbor1 = [q + directions[dir1][0], r + directions[dir1][1]];
  equivalents.push({ q: neighbor1[0], r: neighbor1[1], corner: (corner + 2) % 6 });
  
  // Add representation from neighbor in direction corner
  const dir2 = corner;
  const neighbor2 = [q + directions[dir2][0], r + directions[dir2][1]];
  equivalents.push({ q: neighbor2[0], r: neighbor2[1], corner: (corner + 4) % 6 });
  
  return equivalents;
}

/**
 * Get unique key for a road
 * @param {Object} road - Road object
 * @returns {string} Unique key
 */
function getRoadKey(road) {
  return `${road.q},${road.r},${road.edge}`;
}

/**
 * Debug function to test road connections
 * @param {Array} roads - Array of road objects
 */
export function debugRoadConnections(roads) {
  console.log('\n=== DEBUG ROAD CONNECTIONS ===');
  console.log('Roads:', roads);
  
  if (!roads || roads.length === 0) {
    console.log('No roads to debug');
    return;
  }
  
  // Build adjacency list
  const adjacencyList = buildSimpleRoadAdjacencyList(roads);
  console.log('Road adjacency list:', adjacencyList);
  
  // Test connections
  roads.forEach((road1, i) => {
    roads.forEach((road2, j) => {
      if (i >= j) return; // Avoid duplicate checks
      
      const connected = areRoadsConnectedVertex(road1, road2);
      console.log(`Road ${getRoadKey(road1)} <-> Road ${getRoadKey(road2)}: ${connected ? 'CONNECTED' : 'not connected'}`);
      
      if (connected && window.DEBUG_ROAD_CONNECTIONS) {
        const vertices1 = getRoadVertices(road1);
        const vertices2 = getRoadVertices(road2);
        console.log(`  Vertices road1:`, vertices1);
        console.log(`  Vertices road2:`, vertices2);
        
        // Show which vertex is shared
        for (const v1 of vertices1) {
          for (const v2 of vertices2) {
            if (areVerticesEqual(v1, v2)) {
              console.log(`  Shared vertex: {q: ${v1.q}, r: ${v1.r}, corner: ${v1.corner}}`);
            }
          }
        }
      }
    });
  });
  
  // Calculate longest road
  const longestLength = calculateLongestRoad({ roads });
  console.log(`Longest road calculated: ${longestLength}`);
  
  console.log('=== END DEBUG ===\n');
}

/**
 * Comprehensive test of road connection logic
 * Tests various road configurations to ensure proper connectivity
 */
export function testRoadConnections() {
  console.log('\n=== COMPREHENSIVE ROAD CONNECTION TESTS ===');
  
  // Test 1: Adjacent roads on same tile
  const testRoads1 = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },  // Should be connected (adjacent edges)
    { q: 0, r: 0, edge: 3 }   // Should not be connected to edge 0
  ];
  
  console.log('\nTest 1 - Adjacent roads on same tile:');
  debugRoadConnections(testRoads1);
  
  // Test 2: Roads on different tiles sharing vertex
  const testRoads2 = [
    { q: 0, r: 0, edge: 0 },
    { q: 1, r: 0, edge: 3 }   // Should be connected (shared vertex)
  ];
  
  console.log('\nTest 2 - Roads on different tiles:');
  debugRoadConnections(testRoads2);
  
  // Test 3: Long road chain
  const testRoads3 = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 0, r: 1, edge: 2 },
    { q: 0, r: 1, edge: 3 },
    { q: -1, r: 1, edge: 4 }
  ];
  
  console.log('\nTest 3 - Long road chain:');
  debugRoadConnections(testRoads3);
  
  console.log('=== END COMPREHENSIVE TESTS ===\n');
}

/**
 * Initialize victory points testing utilities
 * Makes all debug functions globally available
 */
export function initVictoryPointsTestingUtils() {
  // Make debug functions globally available
  window.debugRoadConnections = debugRoadConnections;
  window.getCanonicalRoad = getCanonicalRoad;  // Import from victoryPoints.js
  window.testRoadConnections = testRoadConnections;
  
  console.log('Victory Points Testing Utils initialized. Available functions:');
  console.log('- debugRoadConnections(roads)');
  console.log('- getCanonicalRoad(road)');
  console.log('- testRoadConnections()');
}
