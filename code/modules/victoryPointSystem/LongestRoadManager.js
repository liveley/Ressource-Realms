// victoryPointSystem/LongestRoadManager.js
// Longest Road calculation and management

import { MIN_ROAD_LENGTH_FOR_LONGEST_ROAD, LONGEST_ROAD_VICTORY_POINTS, debugLog } from './utils/constants.js';
import { getRoadKey, areRoadsConnectedVertex } from './utils/roadUtils.js';

/**
 * LongestRoadManager Class
 * Single Responsibility: Manage longest road calculations and achievements
 * Focused on road connectivity and path finding algorithms
 */
export class LongestRoadManager {
  constructor() {
    this.MIN_ROAD_LENGTH = MIN_ROAD_LENGTH_FOR_LONGEST_ROAD;
    this.VICTORY_POINTS = LONGEST_ROAD_VICTORY_POINTS;
  }
  
  /**
   * Calculate longest road for a player
   * @param {Object} player - The player object
   * @returns {number} Length of longest road
   */
  calculateLongestRoad(player) {
    if (!player || !player.roads || !Array.isArray(player.roads) || player.roads.length === 0) {
      return 0;
    }
    
    // Use simplified approach: build adjacency list directly
    const adjacencyList = this.buildRoadAdjacencyList(player.roads);
    
    // Find longest path in the graph
    let maxLength = 0;
    
    // Try starting from each road segment
    for (const roadKey of adjacencyList.keys()) {
      const visited = new Set();
      const length = this.dfsLongestPath(adjacencyList, roadKey, visited);
      maxLength = Math.max(maxLength, length);
    }
    
    return maxLength;
  }
  
  /**
   * Build road adjacency list
   * @param {Array} roads - Array of road objects {q, r, edge}
   * @returns {Map} Adjacency list
   */
  buildRoadAdjacencyList(roads) {
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
   * DFS to find longest path in road graph
   * @param {Map} adjacencyList - Road adjacency list
   * @param {string} current - Current road key
   * @param {Set} visited - Set of visited roads
   * @returns {number} Length of longest path from current node
   */
  dfsLongestPath(adjacencyList, current, visited) {
    visited.add(current);
    
    let maxLength = 0;
    const neighbors = adjacencyList.get(current) || [];
    
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        const length = this.dfsLongestPath(adjacencyList, neighbor, visited);
        maxLength = Math.max(maxLength, length);
      }
    }
    
    visited.delete(current);
    return maxLength + 1;
  }
  
  /**
   * Update Longest Road achievement for all players
   * @param {Array} players - Array of all players
   * @returns {Object} Current longest road holder and stats
   */
  updateLongestRoad(players) {
    if (!players || players.length === 0) {
      return { holder: null, length: 0 };
    }
    
    debugLog('Updating longest road for', players.length, 'players');
    
    // Calculate road lengths for all players
    const roadLengths = players.map(player => ({
      player,
      length: this.calculateLongestRoad(player)
    }));
    
    debugLog('Road lengths:', roadLengths.map(r => ({ name: r.player.name, length: r.length })));
    
    // Find the longest road (must be at least minimum length)
    const validRoads = roadLengths.filter(item => item.length >= this.MIN_ROAD_LENGTH);
    
    if (validRoads.length === 0) {
      // No one has longest road
      debugLog(`No player has ${this.MIN_ROAD_LENGTH}+ roads for longest road`);
      this.clearLongestRoadAchievement(players);
      return { holder: null, length: 0 };
    }
    
    // Sort by length descending
    validRoads.sort((a, b) => b.length - a.length);
    
    // Check if there's a clear winner (no tie at the top)
    const maxLength = validRoads[0].length;
    const winners = validRoads.filter(item => item.length === maxLength);
    
    if (winners.length === 1) {
      // Clear winner
      const winner = winners[0];
      debugLog(`${winner.player.name} gets longest road with ${maxLength} roads`);
      this.awardLongestRoadAchievement(players, winner.player);
      this.updatePlayerRoadLengths(players, roadLengths);
      return { holder: winner.player, length: maxLength };
    } else {
      // Tie - apply tie-breaking rules
      const tieWinner = this.resolveLongestRoadTie(players, winners);
      debugLog(`Longest road tie resolved: ${tieWinner.name} keeps/gets longest road`);
      this.awardLongestRoadAchievement(players, tieWinner);
      this.updatePlayerRoadLengths(players, roadLengths);
      return { holder: tieWinner, length: maxLength };
    }
  }
  
  /**
   * Resolve longest road tie using game rules
   * @param {Array} players - All players
   * @param {Array} winners - Players tied for longest road
   * @returns {Object} Player who gets/keeps the achievement
   */
  resolveLongestRoadTie(players, winners) {
    debugLog(`Longest road tie between:`, winners.map(w => w.player.name));
    
    // Check who currently has the longest road achievement
    const currentHolder = players.find(player => player.victoryPoints?.longestRoad > 0);
    
    if (currentHolder && winners.some(w => w.player === currentHolder)) {
      // Current holder is tied, they keep it (tie-breaker rule)
      debugLog(`${currentHolder.name} keeps longest road (tie-breaker rule)`);
      return currentHolder;
    } else {
      // No current holder among tied players, first tied player gets it
      debugLog(`${winners[0].player.name} gets longest road (first to achieve tie)`);
      return winners[0].player;
    }
  }
  
  /**
   * Award longest road achievement to a player
   * @param {Array} players - All players
   * @param {Object} winner - Player to award achievement to
   */
  awardLongestRoadAchievement(players, winner) {
    players.forEach(player => {
      if (!player.victoryPoints) {
        player.victoryPoints = { longestRoad: 0 };
      }
      player.victoryPoints.longestRoad = (player === winner) ? this.VICTORY_POINTS : 0;
    });
  }
  
  /**
   * Clear longest road achievement from all players
   * @param {Array} players - All players
   */
  clearLongestRoadAchievement(players) {
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.longestRoad = 0;
      }
    });
  }
  
  /**
   * Update road lengths for display purposes
   * @param {Array} players - All players
   * @param {Array} roadLengths - Calculated road lengths
   */
  updatePlayerRoadLengths(players, roadLengths) {
    players.forEach(player => {
      const roadData = roadLengths.find(item => item.player === player);
      player.longestRoadLength = roadData ? roadData.length : 0;
    });
  }
  
  /**
   * Get current longest road holder
   * @param {Array} players - All players
   * @returns {Object|null} Player with longest road achievement
   */
  getCurrentLongestRoadHolder(players) {
    if (!players || players.length === 0) return null;
    return players.find(player => player.victoryPoints?.longestRoad > 0) || null;
  }
  
  /**
   * Get road statistics for all players
   * @param {Array} players - All players
   * @returns {Array} Array of {player, length, hasAchievement}
   */
  getRoadStatistics(players) {
    if (!players || players.length === 0) return [];
    
    return players.map(player => ({
      player,
      length: this.calculateLongestRoad(player),
      hasAchievement: (player.victoryPoints?.longestRoad || 0) > 0
    }));
  }
}
