// modules/victoryPoints.js
// Comprehensive Victory Points System for Catan 3D

/**
 * Victory Points System
 * 
 * Handles all aspects of victory point calculation and tracking:
 * - Base VP sources (settlements, cities, VP cards)
 * - Special VP sources (Longest Road, Largest Army)
 * - Hidden VP tracking
 * - Win condition checking
 * - Real-time updates
 */

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
 */
export function updateSettlementVP(player) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  player.victoryPoints.settlements = (player.settlements || []).length;
  checkWinCondition(player);
}

/**
 * Update city VP count
 * @param {Object} player - The player object
 */
export function updateCityVP(player) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  player.victoryPoints.cities = (player.cities || []).length * 2;
  checkWinCondition(player);
}

/**
 * Add victory point card (immediately adds to hidden VP)
 * @param {Object} player - The player object
 */
export function addVictoryPointCard(player) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  player.victoryPoints.hiddenVP += 1;
  checkWinCondition(player);
}

/**
 * Calculate longest road for a player
 * @param {Object} player - The player object
 * @returns {number} Length of longest road
 */
export function calculateLongestRoad(player) {
  if (!player.roads || player.roads.length === 0) {
    return 0;
  }
  
  // Use simplified approach: build adjacency list directly
  const adjacencyList = buildSimpleRoadAdjacencyList(player.roads);
  
  // Find longest path in the graph
  let maxLength = 0;
  
  // Try starting from each road segment
  for (const roadKey of adjacencyList.keys()) {
    const visited = new Set();
    const length = dfsLongestPathSimple(adjacencyList, roadKey, visited);
    maxLength = Math.max(maxLength, length);
  }
  
  return maxLength;
}

/**
 * Build road graph from road segments
 * @param {Array} roads - Array of road objects {q, r, edge}
 * @returns {Map} Adjacency graph
 */
function buildRoadGraph(roads) {
  const graph = new Map();
  
  roads.forEach(road => {
    const key = getRoadKey(road);
    if (!graph.has(key)) {
      graph.set(key, new Set());
    }
  });
  
  // Connect adjacent roads
  roads.forEach(road1 => {
    const key1 = getRoadKey(road1);
    roads.forEach(road2 => {
      if (road1 === road2) return;
      
      const key2 = getRoadKey(road2);
      if (areRoadsConnected(road1, road2)) {
        graph.get(key1).add(key2);
        graph.get(key2).add(key1);
      }
    });
  });
  
  return graph;
}

/**
 * Check if two roads are connected
 * @param {Object} road1 - First road
 * @param {Object} road2 - Second road
 * @returns {boolean} True if roads are connected
 */
function areRoadsConnected(road1, road2) {
  // Roads are connected if they share a vertex (corner)
  const vertices1 = getRoadVertices(road1);
  const vertices2 = getRoadVertices(road2);
  
  const connected = vertices1.some(v1 => 
    vertices2.some(v2 => areVerticesEqual(v1, v2))
  );
  return connected;
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
 * Get all equivalent representations of a vertex (simplified based on axial coordinates)
 * @param {Object} vertex - Vertex object {q, r, corner}
 * @returns {Array} Array of equivalent vertex objects
 */
function getEquivalentVertices(vertex) {
  const { q, r, corner } = vertex;
  
  // Each vertex is shared by exactly 3 tiles
  // Using the axial coordinate system with directions: [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  // For corner N on tile (q,r), the equivalent representations are:
  // - Current tile: (q, r, corner)
  // - Neighbor in direction (corner-1)%6: corner becomes (corner+2)%6
  // - Neighbor in direction corner: corner becomes (corner+4)%6
  
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
  const hexSize = 1.0;
  vertices.forEach(v => {
    v.x *= hexSize;
    v.y *= hexSize;
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

/**
 * DFS to find longest path in road graph (simple version)
 * @param {Map} adjacencyList - Road adjacency list
 * @param {string} current - Current road key
 * @param {Set} visited - Set of visited roads
 * @returns {number} Length of longest path from current node
 */
function dfsLongestPathSimple(adjacencyList, current, visited) {
  visited.add(current);
  
  let maxLength = 0;
  const neighbors = adjacencyList.get(current) || [];
  
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const length = dfsLongestPathSimple(adjacencyList, neighbor, visited);
      maxLength = Math.max(maxLength, length);
    }
  }
  
  visited.delete(current);
  return maxLength + 1;
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
 * Update Longest Road achievement for all players
 * @param {Array} players - Array of all players
 */
export function updateLongestRoad(players) {
  if (!players || players.length === 0) return;
  
  // Debug logging (only if enabled)
  if (window.DEBUG_VICTORY_POINTS) {
    console.log('Updating longest road for', players.length, 'players');
  }
  
  // Calculate road lengths for all players
  const roadLengths = players.map(player => ({
    player,
    length: calculateLongestRoad(player)
  }));
  
  if (window.DEBUG_VICTORY_POINTS) {
    console.log('Road lengths:', roadLengths.map(r => ({ name: r.player.name, length: r.length })));
  }
  
  // Find the longest road (must be at least 5)
  const validRoads = roadLengths.filter(item => item.length >= 5);
  
  if (validRoads.length === 0) {
    // No one has longest road
    if (window.DEBUG_VICTORY_POINTS) {
      console.log('No player has 5+ roads for longest road');
    }
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
    if (window.DEBUG_VICTORY_POINTS) {
      console.log(`${winners[0].player.name} gets longest road with ${maxLength} roads`);
    }
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.longestRoad = (player === winners[0].player) ? 2 : 0;
      }
    });
  } else {
    // Tie - check who currently has the longest road achievement
    if (window.DEBUG_VICTORY_POINTS) {
      console.log(`Longest road tie at ${maxLength} roads between:`, winners.map(w => w.player.name));
    }
    const currentHolder = players.find(player => player.victoryPoints?.longestRoad > 0);
    
    if (currentHolder && winners.some(w => w.player === currentHolder)) {
      // Current holder is tied, they keep it
      if (window.DEBUG_VICTORY_POINTS) {
        console.log(`${currentHolder.name} keeps longest road (tie-breaker rule)`);
      }
      players.forEach(player => {
        if (player.victoryPoints) {
          player.victoryPoints.longestRoad = (player === currentHolder) ? 2 : 0;
        }
      });
    } else {
      // No current holder among tied players, first tied player gets it
      if (window.DEBUG_VICTORY_POINTS) {
        console.log(`${winners[0].player.name} gets longest road (first to achieve tie)`);
      }
      players.forEach(player => {
        if (player.victoryPoints) {
          player.victoryPoints.longestRoad = (player === winners[0].player) ? 2 : 0;
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
  if (window.DEBUG_VICTORY_POINTS) {
    console.log('Updating largest army for', players.length, 'players');
  }
  
  // Find players with at least 3 knights played
  const validArmies = players
    .filter(player => (player.knightsPlayed || 0) >= 3)
    .map(player => ({ player, knights: player.knightsPlayed || 0 }));
    
  if (window.DEBUG_VICTORY_POINTS) {
    console.log('Valid armies:', validArmies.map(a => ({ name: a.player.name, knights: a.knights })));
  }
  
  if (validArmies.length === 0) {
    // No one has largest army
    if (window.DEBUG_VICTORY_POINTS) {
      console.log('No player has 3+ knights for largest army');
    }
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
    if (window.DEBUG_VICTORY_POINTS) {
      console.log(`${winners[0].player.name} gets largest army with ${maxKnights} knights`);
    }
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = (player === winners[0].player) ? 2 : 0;
      }
    });
  } else {
    // Tie - no one gets the bonus
    if (window.DEBUG_VICTORY_POINTS) {
      console.log('Largest army tie, no one gets it');
    }
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = 0;
      }
    });
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
  
  if (totalVP >= 10) {
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
    // Reload the page for a new game
    window.location.reload();
  };
  
  winOverlay.appendChild(winMessage);
  winOverlay.appendChild(vpBreakdown);
  winOverlay.appendChild(playAgainBtn);
  
  document.body.appendChild(winOverlay);
  
  // Disable further game actions
  window.gameWon = true;
  
  // Fire custom event
  const winEvent = new CustomEvent('gameWon', {
    detail: { winner, totalVP }
  });
  window.dispatchEvent(winEvent);
}

/**
 * Update all victory points for a player
 * @param {Object} player - The player object
 * @param {Array} allPlayers - Array of all players for special achievements
 */
export function updateAllVictoryPoints(player, allPlayers) {
  if (!player.victoryPoints) initializeVictoryPoints([player]);
  
  updateSettlementVP(player);
  updateCityVP(player);
  
  if (allPlayers) {
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


