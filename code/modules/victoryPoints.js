// modules/victoryPoints.js
// Comprehensive Victory Points System for Resource Realms

/**
 // Helper: This module manages all logic for calculating, updating, and displaying victory points in Resource Realms. See exported functions for integration points with the main game loop and UI.
 * Victory Points System - Handles all aspects of victory point calculation and tracking:
 * - Base VP sources (settlements, cities, VP cards)
 * - Special VP sources (Longest Road, Largest Army)
 * - Hidden VP tracking
 * - Win condition checking
 * - Real-time updates
 */

// Game constants
const VICTORY_POINTS_TO_WIN = 10;
const MIN_ROAD_LENGTH_FOR_LONGEST_ROAD = 5;
const MIN_KNIGHTS_FOR_LARGEST_ARMY = 3;
const LONGEST_ROAD_VICTORY_POINTS = 2;
const LARGEST_ARMY_VICTORY_POINTS = 2;

// Coordinate system constants
const FLOAT_TOLERANCE = 0.001; // For floating point comparisons in world coordinates
const HEX_SIZE = 1.0; // Hex tile size for world coordinate conversion

// Debug logging helper
function debugLog(...args) {
  // Production: Debug logging disabled for performance
  // if (typeof window !== 'undefined' && window.DEBUG_VICTORY_POINTS) {
  //   console.log('[VP Debug]', ...args);
  // }
}

// Initialize VP tracking for all players
export function initializeVictoryPoints(players) {
  players.forEach(player => {
    if (!player.victoryPoints) {
      player.victoryPoints = {
        settlements: 0,
        cities: 0,
        victoryPointCards: 0,
        longestRoad: 0,
        largestArmy: 0,
        // Hidden VP cards count (immediate VP)
        hiddenVP: 0
      };
    }
    
    // Initialize tracking arrays if not present
    if (!player.knightsPlayed) player.knightsPlayed = 0;
    if (!player.roads) player.roads = [];
    if (!player.longestRoadLength) player.longestRoadLength = 0;
    if (!player.victoryPointCardsCount) player.victoryPointCardsCount = 0;
  });
}

/**
 * Calculate total victory points for a player
 * @param {Object} player - The player object
 * @param {boolean} includeHidden - Whether to include hidden VP cards
 * @returns {number} Total victory points
 */
export function calculateVictoryPoints(player, includeHidden = true) {
  if (!player.victoryPoints) {
    initializeVictoryPoints([player]);
  }
  
  let total = 0;
  
  // Base VP sources
  total += player.victoryPoints.settlements;
  total += player.victoryPoints.cities;
  
  // Special VP sources
  total += player.victoryPoints.longestRoad;
  total += player.victoryPoints.largestArmy;
  
  // Hidden VP cards (if requested)
  if (includeHidden) {
    total += player.victoryPoints.hiddenVP;
  }
  
  return total;
}

/**
 * Calculate public victory points (visible to all players)
 * @param {Object} player - The player object
 * @returns {number} Public victory points
 */
export function calculatePublicVictoryPoints(player) {
  return calculateVictoryPoints(player, false);
}

/**
 * Update settlement VP count
 * @param {Object} player - The player object
 * @param {boolean} skipWinCheck - Skip win condition check for performance
 */
export function updateSettlementVP(player, skipWinCheck = false) {
  if (!player) {
    console.error('updateSettlementVP: player is null/undefined');
    return;
  }
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  player.victoryPoints.settlements = (player.settlements || []).length;
  if (!skipWinCheck) {
    checkWinCondition(player);
  }
}

/**
 * Update city VP count
 * @param {Object} player - The player object
 * @param {boolean} skipWinCheck - Skip win condition check for performance
 */
export function updateCityVP(player, skipWinCheck = false) {
  if (!player) {
    console.error('updateCityVP: player is null/undefined');
    return;
  }
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  player.victoryPoints.cities = (player.cities || []).length * 2;
  if (!skipWinCheck) {
    checkWinCondition(player);
  }
}

/**
 * Add victory point card (immediately adds to hidden VP)
 * @param {Object} player - The player object
 * @returns {boolean} - True if card was added, false if limit reached
 */
export function addVictoryPointCard(player) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  
  // Track VP cards separately for proper counting
  if (!player.victoryPointCardsCount) player.victoryPointCardsCount = 0;
  
  player.victoryPointCardsCount += 1;
  player.victoryPoints.hiddenVP += 1;
  
  debugLog(`Player ${player.name || 'Unknown'} received VP card (${player.victoryPointCardsCount} total)`);
  
  checkWinCondition(player);
  return true;
}

/**
 * Calculate longest road for a player using correct Resource Realms ruling
 * Finds the longest single path without repeating any road segment
 * @param {Object} player - The player object
 * @returns {number} Length of longest road
 */
export function calculateLongestRoad(player) {
  if (!player || !player.roads || !Array.isArray(player.roads) || player.roads.length === 0) {
    return 0;
  }
  
  debugLog(`Calculating longest road for ${player.name || 'Unknown'} with ${player.roads.length} roads`);
  
  // Build road network as edge-based graph
  const roadNetwork = buildRoadNetwork(player.roads);
  
  // Find longest path using edge-based DFS with backtracking
  let maxLength = 0;
  
  // Try starting from each road endpoint (vertex)
  for (const vertex of roadNetwork.vertices.keys()) {
    const visitedEdges = new Set();
    const length = dfsLongestPath(roadNetwork, vertex, visitedEdges);
    maxLength = Math.max(maxLength, length);
  }
  
  debugLog(`Longest road for ${player.name || 'Unknown'}: ${maxLength}`);
  return maxLength;
}

/**
 * Build road network as vertex-edge graph for longest path calculation
 * Each road is an edge connecting two vertices (road endpoints)
 * @param {Array} roads - Array of road objects {q, r, edge}
 * @returns {Object} Road network with vertices and edges
 */
function buildRoadNetwork(roads) {
  const vertices = new Map(); // vertex -> Set of connected edges
  const edges = new Map();    // edge -> {from: vertex, to: vertex}
  const vertexEquivalenceMap = new Map(); // canonical vertex -> original vertices
  
  roads.forEach(road => {
    const roadKey = getRoadKey(road);
    const endpoints = getRoadVertices(road);
    
    // For each endpoint, find its canonical representation
    const canonicalVertices = endpoints.map(vertex => {
      // Check if we already have a canonical vertex for this physical location
      for (const [canonical, originals] of vertexEquivalenceMap.entries()) {
        for (const original of originals) {
          if (areVerticesEqual(vertex, original)) {
            return canonical;
          }
        }
      }
      
      // No existing canonical vertex found, this becomes the canonical one
      const canonical = getVertexKey(vertex);
      vertexEquivalenceMap.set(canonical, [vertex]);
      return canonical;
    });
    
    const vertex1 = canonicalVertices[0];
    const vertex2 = canonicalVertices[1];
    
    // Add vertices to graph
    if (!vertices.has(vertex1)) vertices.set(vertex1, new Set());
    if (!vertices.has(vertex2)) vertices.set(vertex2, new Set());
    
    // Connect vertices with this edge
    vertices.get(vertex1).add(roadKey);
    vertices.get(vertex2).add(roadKey);
    
    // Store edge information
    edges.set(roadKey, { from: vertex1, to: vertex2 });
  });
  
  debugLog(`Built road network: ${vertices.size} vertices, ${edges.size} edges`);
  debugLog(`Vertex equivalence map has ${vertexEquivalenceMap.size} canonical vertices`);
  return { vertices, edges };
}

/**
 * Get unique string key for a vertex
 * @param {Object} vertex - Vertex object {q, r, corner}
 * @returns {string} Unique vertex key
 */
function getVertexKey(vertex) {
  return `${vertex.q},${vertex.r},${vertex.corner}`;
}

/**
 * DFS to find longest path using edge-based backtracking (correct Euler algorithm)
 * @param {Object} roadNetwork - Road network with vertices and edges
 * @param {string} currentVertex - Current vertex key
 * @param {Set} visitedEdges - Set of visited edge keys
 * @returns {number} Length of longest path from current vertex
 */
function dfsLongestPath(roadNetwork, currentVertex, visitedEdges) {
  let maxLength = 0;
  
  // Get all edges connected to current vertex
  const connectedEdges = roadNetwork.vertices.get(currentVertex) || new Set();
  
  for (const edgeKey of connectedEdges) {
    // Skip if this edge was already used in the current path
    if (visitedEdges.has(edgeKey)) continue;
    
    // Mark edge as visited
    visitedEdges.add(edgeKey);
    
    // Find the other end of this edge
    const edge = roadNetwork.edges.get(edgeKey);
    const nextVertex = (edge.from === currentVertex) ? edge.to : edge.from;
    
    // Recursively explore from the other end
    const pathLength = 1 + dfsLongestPath(roadNetwork, nextVertex, visitedEdges);
    maxLength = Math.max(maxLength, pathLength);
    
    // Backtrack: remove edge from visited set
    visitedEdges.delete(edgeKey);
  }
  
  return maxLength;
}

/**
 * Check if two roads are connected (share a vertex)
 * Simplified and more reliable version
 * @param {Object} road1 - First road
 * @param {Object} road2 - Second road
 * @returns {boolean} True if roads are connected
 */
function areRoadsConnected(road1, road2) {
  // Get vertices for both roads
  const vertices1 = getRoadVertices(road1);
  const vertices2 = getRoadVertices(road2);
  
  // Check if any vertex from road1 matches any vertex from road2
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
 * Check if two vertices are equal (considering equivalent representations)
 * @param {Object} v1 - First vertex {q, r, corner}
 * @param {Object} v2 - Second vertex {q, r, corner}
 * @returns {boolean} True if vertices represent the same physical location
 */
function areVerticesEqual(v1, v2) {
  // Direct comparison
  if (v1.q === v2.q && v1.r === v2.r && v1.corner === v2.corner) {
    return true;
  }
  
  // Check equivalent representations
  const equivalents1 = getEquivalentVertices(v1);
  const equivalents2 = getEquivalentVertices(v2);
  
  for (const eq1 of equivalents1) {
    for (const eq2 of equivalents2) {
      if (eq1.q === eq2.q && eq1.r === eq2.r && eq1.corner === eq2.corner) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Check if two vertices are at the same location (hex coordinates)
 * @param {Object} v1 - First vertex {q, r, corner}
 * @param {Object} v2 - Second vertex {q, r, corner}
 * @returns {boolean} True if vertices are at the same location
 */
function areVerticesEqualOld(v1, v2) {
  // Direct match for hex coordinates (exact integer comparison)
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
 * Check if two points are equal in world coordinates (with floating point tolerance)
 * @param {Object} p1 - First point {x, y}
 * @param {Object} p2 - Second point {x, y}
 * @returns {boolean} True if points are approximately equal
 */
function areWorldPointsEqual(p1, p2) {
  return Math.abs(p1.x - p2.x) < FLOAT_TOLERANCE && 
         Math.abs(p1.y - p2.y) < FLOAT_TOLERANCE;
}

/**
 * Get all equivalent representations of a vertex (simplified and more accurate)
 * @param {Object} vertex - Vertex object {q, r, corner}
 * @returns {Array} Array of equivalent vertex objects
 */
function getEquivalentVertices(vertex) {
  const { q, r, corner } = vertex;
  
  // Direction vectors for axial coordinates
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Each vertex is shared by exactly 3 tiles in a hexagonal grid
  // Based on the correct mathematical relationship between hex tiles and vertices
  
  const equivalents = [{ q, r, corner }];
  
  // For a vertex at corner N on tile (q,r), find the adjacent tiles that share this vertex
  // Using the proper hexagonal grid mathematics:
  
  // Clockwise neighbor (direction = corner)
  const neighborCW_q = q + directions[corner][0];
  const neighborCW_r = r + directions[corner][1];
  const neighborCW_corner = (corner + 4) % 6; // 240° rotation
  
  // Counter-clockwise neighbor (direction = (corner-1+6)%6)
  const prevDirection = (corner + 5) % 6; // (corner - 1) with proper wrap
  const neighborCCW_q = q + directions[prevDirection][0]; 
  const neighborCCW_r = r + directions[prevDirection][1];
  const neighborCCW_corner = (corner + 2) % 6; // 120° rotation
  
  equivalents.push({ q: neighborCW_q, r: neighborCW_r, corner: neighborCW_corner });
  equivalents.push({ q: neighborCCW_q, r: neighborCCW_r, corner: neighborCCW_corner });
  
  return equivalents;
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
 * Check if two roads are connected using the EXACT same logic as the game's isRoadOccupied
 * @param {Object} road1 - First road {q, r, edge}
 * @param {Object} road2 - Second road {q, r, edge}
 * @returns {boolean} True if roads are connected
 */
function areRoadsConnectedVertex(road1, road2) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge (different tile perspectives)
  // This replicates the exact logic from isRoadOccupied
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
  // Use a more robust approach - check if roads share any vertex
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
 * Get endpoints of a road in world coordinates
 * @param {Object} road - Road object {q, r, edge}
 * @returns {Array} Array of {x, y} coordinates
 */
function getRoadEndpoints(road) {
  const { q, r, edge } = road;
  
  // Convert hex coordinates to world coordinates
  const centerX = q * 1.5;
  const centerY = (r + q * 0.5) * Math.sqrt(3);
  
  // Hex vertex offsets (corners)
  const vertices = [
    { x: 0, y: 1 },           // 0: top
    { x: 0.866, y: 0.5 },     // 1: top-right
    { x: 0.866, y: -0.5 },    // 2: bottom-right
    { x: 0, y: -1 },          // 3: bottom
    { x: -0.866, y: -0.5 },   // 4: bottom-left
    { x: -0.866, y: 0.5 }     // 5: top-left
  ];
  
  // Scale vertices to match hex size
  vertices.forEach(v => {
    v.x *= HEX_SIZE;
    v.y *= HEX_SIZE;
  });
  
  // Map edge to the two vertices it connects
  const edgeToVertices = {
    0: [0, 1], // Top edge: top to top-right
    1: [1, 2], // Top-right edge: top-right to bottom-right
    2: [2, 3], // Bottom-right edge: bottom-right to bottom
    3: [3, 4], // Bottom edge: bottom to bottom-left
    4: [4, 5], // Bottom-left edge: bottom-left to top-left
    5: [5, 0]  // Top-left edge: top-left to top
  };
  
  const vertexIndices = edgeToVertices[edge] || [0, 1];
  
  return vertexIndices.map(i => ({
    x: centerX + vertices[i].x,
    y: centerY + vertices[i].y
  }));
}

// Removed old DFS function - replaced with correct edge-based algorithm above

/**
 * Get unique key for a road
 * @param {Object} road - Road object
 * @returns {string} Unique key
 */
function getRoadKey(road) {
  return `${road.q},${road.r},${road.edge}`;
}

/**
 * Update Longest Road achievement for all players
 * @param {Array} players - Array of all players
 */
export function updateLongestRoad(players) {
  if (!players || players.length === 0) return;
  
  // Debug logging (only if enabled)
  debugLog('Updating longest road for', players.length, 'players');
  
  // Calculate road lengths for all players
  const roadLengths = players.map(player => ({
    player,
    length: calculateLongestRoad(player)
  }));
  
  debugLog('Road lengths:', roadLengths.map(r => ({ name: r.player.name, length: r.length })));
  
  // Find the longest road (must be at least 5)
  const validRoads = roadLengths.filter(item => item.length >= MIN_ROAD_LENGTH_FOR_LONGEST_ROAD);
  
  if (validRoads.length === 0) {
    // No one has longest road
    debugLog(`No player has ${MIN_ROAD_LENGTH_FOR_LONGEST_ROAD}+ roads for longest road`);
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.longestRoad = 0;
      }
    });
    return;
  }
  
  // Sort by length descending
  validRoads.sort((a, b) => b.length - a.length);
  
  // Check if there's a clear winner (no tie at the top)
  const maxLength = validRoads[0].length;
  const winners = validRoads.filter(item => item.length === maxLength);
  
  if (winners.length === 1) {
    // Clear winner
    debugLog(`${winners[0].player.name} gets longest road with ${maxLength} roads`);
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.longestRoad = (player === winners[0].player) ? LONGEST_ROAD_VICTORY_POINTS : 0;
      }
    });
  } else {
    // Tie - check who currently has the longest road achievement
    debugLog(`Longest road tie at ${maxLength} roads between:`, winners.map(w => w.player.name));
    const currentHolder = players.find(player => player.victoryPoints?.longestRoad > 0);
    
    if (currentHolder && winners.some(w => w.player === currentHolder)) {
      // Current holder is tied, they keep it
      debugLog(`${currentHolder.name} keeps longest road (tie-breaker rule)`);
      players.forEach(player => {
        if (player.victoryPoints) {
          player.victoryPoints.longestRoad = (player === currentHolder) ? LONGEST_ROAD_VICTORY_POINTS : 0;
        }
      });
    } else {
      // No current holder among tied players, first tied player gets it
      debugLog(`${winners[0].player.name} gets longest road (first to achieve tie)`);
      players.forEach(player => {
        if (player.victoryPoints) {
          player.victoryPoints.longestRoad = (player === winners[0].player) ? LONGEST_ROAD_VICTORY_POINTS : 0;
        }
      });
    }
  }
  
  // Store road lengths for display
  players.forEach(player => {
    const roadData = roadLengths.find(item => item.player === player);
    player.longestRoadLength = roadData ? roadData.length : 0;
  });
}

/**
 * Update Largest Army achievement for all players
 * @param {Array} players - Array of all players
 */
export function updateLargestArmy(players) {
  if (!players || players.length === 0) return;
  
  // Debug logging (only if enabled)
  debugLog('Updating largest army for', players.length, 'players');
  
  // Find players with at least 3 knights played
  const validArmies = players
    .filter(player => (player.knightsPlayed || 0) >= MIN_KNIGHTS_FOR_LARGEST_ARMY)
    .map(player => ({ player, knights: player.knightsPlayed || 0 }));
    
  debugLog('Valid armies:', validArmies.map(a => ({ name: a.player.name, knights: a.knights })));
  
  if (validArmies.length === 0) {
    // No one has largest army
    debugLog(`No player has ${MIN_KNIGHTS_FOR_LARGEST_ARMY}+ knights for largest army`);
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = 0;
      }
    });
    return;
  }
  
  // Sort by knights played descending
  validArmies.sort((a, b) => b.knights - a.knights);
  
  // Check if there's a clear winner (no tie at the top)
  const maxKnights = validArmies[0].knights;
  const winners = validArmies.filter(item => item.knights === maxKnights);
  
  if (winners.length === 1) {
    // Clear winner
    debugLog(`${winners[0].player.name} gets largest army with ${maxKnights} knights`);
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = (player === winners[0].player) ? LARGEST_ARMY_VICTORY_POINTS : 0;
      }
    });
  } else {
    // Tie - current holder keeps it, or first player gets it
    const currentHolder = players.find(player => player.victoryPoints?.largestArmy > 0);
    
    if (currentHolder && winners.some(w => w.player === currentHolder)) {
      // Current holder is tied, they keep it
      // (keine Änderung nötig)
    } else {
      // No current holder among tied players, first tied player gets it
      players.forEach(player => {
        if (player.victoryPoints) {
          player.victoryPoints.largestArmy = (player === winners[0].player) ? LARGEST_ARMY_VICTORY_POINTS : 0;
        }
      });
    }
  }
}

/**
 * Increment knight count for a player
 * @param {Object} player - The player object
 * @param {Array} allPlayers - Array of all players
 */
export function playKnight(player, allPlayers) {
  player.knightsPlayed = (player.knightsPlayed || 0) + 1;
  updateLargestArmy(allPlayers);
  
  // Check win condition after potential largest army change
  allPlayers.forEach(p => checkWinCondition(p));
}

/**
 * Check if a player has won the game
 * @param {Object} player - The player object
 * @returns {boolean} True if player has won
 */
export function checkWinCondition(player) {
  const totalVP = calculateVictoryPoints(player, true);
  
  if (totalVP >= VICTORY_POINTS_TO_WIN) {
    // Atomically check and set to prevent race conditions
    if (typeof window !== 'undefined') {
      if (window.gameWon) {
        return false; // Another player already won
      }
      window.gameWon = true;
    }
    // Player has won!
    triggerGameWin(player, totalVP);
    return true;
  }
  
  return false;
}

/**
 * Trigger game win condition
 * @param {Object} winner - The winning player
 * @param {number} totalVP - Total victory points
 */
function triggerGameWin(winner, totalVP) {
  // Remove any existing win overlay to prevent duplicates/leaks
  const existingOverlay = document.getElementById('game-win-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
  }
  
  // Create win announcement
  const winOverlay = document.createElement('div');
  winOverlay.id = 'game-win-overlay';
  winOverlay.style.position = 'fixed';
  winOverlay.style.top = '0';
  winOverlay.style.left = '0';
  winOverlay.style.width = '100vw';
  winOverlay.style.height = '100vh';
  winOverlay.style.background = 'rgba(0, 0, 0, 0.8)';
  winOverlay.style.display = 'flex';
  winOverlay.style.flexDirection = 'column';
  winOverlay.style.alignItems = 'center';
  winOverlay.style.justifyContent = 'center';
  winOverlay.style.zIndex = '999999';
  winOverlay.style.fontFamily = 'Montserrat, Arial, sans-serif';
  
  // Win message
  const winMessage = document.createElement('div');
  winMessage.style.fontSize = '3em';
  winMessage.style.fontWeight = 'bold';
  winMessage.style.color = '#ffd700';
  winMessage.style.textAlign = 'center';
  winMessage.style.marginBottom = '1em';
  winMessage.style.textShadow = '0 0 20px #ffd700';
  winMessage.textContent = `🏆 ${winner.name} gewinnt! 🏆`;
  
  // VP breakdown
  const vpBreakdown = document.createElement('div');
  vpBreakdown.style.fontSize = '1.5em';
  vpBreakdown.style.color = '#fff';
  vpBreakdown.style.textAlign = 'center';
  vpBreakdown.style.marginBottom = '2em';
  
  const publicVP = calculatePublicVictoryPoints(winner);
  const hiddenVP = winner.victoryPoints.hiddenVP || 0;
  
  vpBreakdown.innerHTML = `
    <div style="margin-bottom: 0.5em;">Gesamtpunkte: ${totalVP}</div>
    <div style="font-size: 0.8em; color: #ccc;">
      Öffentliche Punkte: ${publicVP}<br>
      Versteckte Punkte: ${hiddenVP}
    </div>
  `;
  
  // Play again button
  const playAgainBtn = document.createElement('button');
  playAgainBtn.textContent = 'Neues Spiel';
  playAgainBtn.style.fontSize = '1.2em';
  playAgainBtn.style.padding = '0.8em 2em';
  playAgainBtn.style.background = '#ffe066';
  playAgainBtn.style.border = 'none';
  playAgainBtn.style.borderRadius = '0.5em';
  playAgainBtn.style.cursor = 'pointer';
  playAgainBtn.style.fontWeight = 'bold';
  playAgainBtn.onclick = () => {
    // Clean up overlay before reload to prevent memory leaks
    cleanup();
    
    // Reload the page for a new game
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  };
  
  // ESC key listener for cleanup
  const escListener = (event) => {
    if (event.key === 'Escape') {
      cleanup();
    }
  };
  
  // Cleanup function to remove overlay and event listeners
  const cleanup = () => {
    document.removeEventListener('keydown', escListener);
    if (winOverlay.parentNode) {
      winOverlay.remove();
    }
    // Reset game state
    if (typeof window !== 'undefined') {
      window.gameWon = false;
    }
  };
  
  // Add ESC key listener
  document.addEventListener('keydown', escListener);
  
  winOverlay.appendChild(winMessage);
  winOverlay.appendChild(vpBreakdown);
  winOverlay.appendChild(playAgainBtn);
  
  document.body.appendChild(winOverlay);
  
  // Disable further game actions
  if (typeof window !== 'undefined') {
    window.gameWon = true;
  }
  
  // Fire custom event
  if (typeof window !== 'undefined' && window.dispatchEvent) {
    const winEvent = new CustomEvent('gameWon', {
      detail: { winner, totalVP, cleanup }
    });
    window.dispatchEvent(winEvent);
  }
}

/**
 * Manually cleanup win overlay (for testing or manual game reset)
 * @returns {boolean} True if overlay was removed, false if none existed
 */
export function cleanupWinOverlay() {
  const existingOverlay = document.getElementById('game-win-overlay');
  if (existingOverlay) {
    existingOverlay.remove();
    // Reset game state
    if (typeof window !== 'undefined') {
      window.gameWon = false;
    }
    return true;
  }
  return false;
}

/**
 * Update all victory points for a player
 * @param {Object} player - The player object
 * @param {Array} allPlayers - Array of all players for special achievements
 * @param {boolean} skipSpecialAchievements - Skip longest road/largest army updates for performance
 */
export function updateAllVictoryPoints(player, allPlayers, skipSpecialAchievements = false) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  
  updateSettlementVP(player, skipSpecialAchievements);
  updateCityVP(player, skipSpecialAchievements);
  
  // Only update special achievements if explicitly requested
  if (allPlayers && !skipSpecialAchievements) {
    updateLongestRoad(allPlayers);
    updateLargestArmy(allPlayers);
  }
}

/**
 * Get victory points breakdown for display
 * @param {Object} player - The player object
 * @returns {Object} VP breakdown
 */
export function getVictoryPointsBreakdown(player) {
  if (!player.victoryPoints) {
    initializeVictoryPoints([player]);
  }
  
  return {
    settlements: player.victoryPoints.settlements,
    cities: player.victoryPoints.cities,
    hiddenVP: player.victoryPoints.hiddenVP,
    longestRoad: player.victoryPoints.longestRoad,
    largestArmy: player.victoryPoints.largestArmy,
    total: calculateVictoryPoints(player, true),
    public: calculatePublicVictoryPoints(player)
  };
}

/**
 * Export functions for updating UI
 */
export function getVictoryPointsForDisplay(player, isCurrentPlayer = false) {
  if (!player) {
    debugLog('getVictoryPointsForDisplay called with null/undefined player');
    return { display: '0', total: 0, public: 0, hidden: 0 };
  }
  
  const breakdown = getVictoryPointsBreakdown(player);
  
  if (isCurrentPlayer) {
    // Current player sees their total including hidden VP
    return {
      display: breakdown.hiddenVP > 0 ? 
        `${breakdown.public} (+${breakdown.hiddenVP})` : 
        `${breakdown.total}`,
      total: breakdown.total,
      public: breakdown.public,
      hidden: breakdown.hiddenVP
    };
  } else {
    // Other players only see public VP
    return {
      display: `${breakdown.public}`,
      total: breakdown.public,
      public: breakdown.public,
      hidden: 0
    };
  }
}

/**
 * Get canonical road representation to prevent duplicates
 * Roads can be represented from either end, so we normalize to a standard form
 * @param {Object} road - Road object with q, r, edge
 * @returns {Object} Canonical road representation
 */
export function getCanonicalRoad(road) {
  const { q, r, edge } = road;
  
  // Calculate neighbor tile coordinates
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  const [nq, nr] = [q + directions[edge][0], r + directions[edge][1]];
  const neighborEdge = (edge + 3) % 6;
  
  // Choose the canonical representation based on tile coordinates
  // Use lexicographic ordering: smaller q first, then smaller r, then smaller edge
  if (q < nq || (q === nq && r < nr) || (q === nq && r === nr && edge < neighborEdge)) {
    return { q, r, edge };
  } else {
    return { q: nq, r: nr, edge: neighborEdge };
  }
}

/**
 * Efficiently update victory points when only basic VP sources change
 * Use this for settlement/city building when roads/knights don't change
 * @param {Object} player - The player object
 */
export function updateBasicVictoryPoints(player) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  
  // Only update basic VP sources (no expensive calculations)
  player.victoryPoints.settlements = (player.settlements || []).length;
  player.victoryPoints.cities = (player.cities || []).length * 2;
  
  // Check win condition with current VP state
  checkWinCondition(player);
}

/**
 * Update special achievements for all players (call sparingly)
 * Use this only when roads are built or knights are played
 * @param {Array} allPlayers - Array of all players
 */
export function updateSpecialAchievements(allPlayers) {
  if (!allPlayers || allPlayers.length === 0) return;
  
  updateLongestRoad(allPlayers);
  updateLargestArmy(allPlayers);
  
  // Check win conditions for all players after special achievements update
  allPlayers.forEach(player => checkWinCondition(player));
}

// === PRODUCTION BUILD: DEBUG FUNCTIONS MOVED ===
// Debug functions have been moved to modules/debugging/ folder
// To enable debugging, use: import { debugLongestRoad } from './debugging/victoryPointsTestingUtils.js';

// Only expose essential functions for testing in development
if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
  // Development mode - expose some debugging functions
  window.calculateLongestRoad = calculateLongestRoad;
  window.updateLongestRoad = updateLongestRoad;
}


