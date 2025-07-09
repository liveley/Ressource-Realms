// victoryPointSystem/LargestArmyManager.js
// Largest Army calculation and management

import { MIN_KNIGHTS_FOR_LARGEST_ARMY, LARGEST_ARMY_VICTORY_POINTS, debugLog } from './utils/constants.js';

/**
 * LargestArmyManager Class
 * Single Responsibility: Manage largest army calculations and achievements
 * Focused on knight tracking and army size comparisons
 */
export class LargestArmyManager {
  constructor() {
    this.MIN_KNIGHTS = MIN_KNIGHTS_FOR_LARGEST_ARMY;
    this.VICTORY_POINTS = LARGEST_ARMY_VICTORY_POINTS;
  }
  
  /**
   * Get knight count for a player
   * @param {Object} player - The player object
   * @returns {number} Number of knights played
   */
  getKnightCount(player) {
    return player?.knightsPlayed || 0;
  }
  
  /**
   * Increment knight count for a player
   * @param {Object} player - The player object
   * @returns {number} New knight count
   */
  playKnight(player) {
    if (!player) return 0;
    player.knightsPlayed = (player.knightsPlayed || 0) + 1;
    debugLog(`${player.name || 'Unknown'} played knight (${player.knightsPlayed} total)`);
    return player.knightsPlayed;
  }
  
  /**
   * Check if a player qualifies for largest army
   * @param {Object} player - The player object
   * @returns {boolean} True if player has enough knights
   */
  qualifiesForLargestArmy(player) {
    return this.getKnightCount(player) >= this.MIN_KNIGHTS;
  }
  
  /**
   * Update Largest Army achievement for all players
   * @param {Array} players - Array of all players
   * @returns {Object} Current largest army holder and stats
   */
  updateLargestArmy(players) {
    if (!players || players.length === 0) {
      return { holder: null, knights: 0 };
    }
    
    debugLog('Updating largest army for', players.length, 'players');
    
    // Find players with at least minimum knights played
    const validArmies = players
      .filter(player => this.qualifiesForLargestArmy(player))
      .map(player => ({ player, knights: this.getKnightCount(player) }));
      
    debugLog('Valid armies:', validArmies.map(a => ({ name: a.player.name, knights: a.knights })));
    
    if (validArmies.length === 0) {
      // No one has largest army
      debugLog(`No player has ${this.MIN_KNIGHTS}+ knights for largest army`);
      this.clearLargestArmyAchievement(players);
      return { holder: null, knights: 0 };
    }
    
    // Sort by knights played descending
    validArmies.sort((a, b) => b.knights - a.knights);
    
    // Check if there's a clear winner (no tie at the top)
    const maxKnights = validArmies[0].knights;
    const winners = validArmies.filter(item => item.knights === maxKnights);
    
    if (winners.length === 1) {
      // Clear winner
      const winner = winners[0];
      debugLog(`${winner.player.name} gets largest army with ${maxKnights} knights`);
      this.awardLargestArmyAchievement(players, winner.player);
      return { holder: winner.player, knights: maxKnights };
    } else {
      // Tie - apply tie-breaking rules
      const tieWinner = this.resolveLargestArmyTie(players, winners);
      debugLog(`Largest army tie resolved: ${tieWinner.name} keeps/gets largest army`);
      this.awardLargestArmyAchievement(players, tieWinner);
      return { holder: tieWinner, knights: maxKnights };
    }
  }
  
  /**
   * Resolve largest army tie using game rules
   * @param {Array} players - All players
   * @param {Array} winners - Players tied for largest army
   * @returns {Object} Player who gets/keeps the achievement
   */
  resolveLargestArmyTie(players, winners) {
    debugLog(`Largest army tie between:`, winners.map(w => w.player.name));
    
    // Check who currently has the largest army achievement
    const currentHolder = players.find(player => player.victoryPoints?.largestArmy > 0);
    
    if (currentHolder && winners.some(w => w.player === currentHolder)) {
      // Current holder is tied, they keep it (tie-breaker rule)
      debugLog(`${currentHolder.name} keeps largest army (tie-breaker rule)`);
      return currentHolder;
    } else {
      // No current holder among tied players, first tied player gets it
      debugLog(`${winners[0].player.name} gets largest army (first to achieve tie)`);
      return winners[0].player;
    }
  }
  
  /**
   * Award largest army achievement to a player
   * @param {Array} players - All players
   * @param {Object} winner - Player to award achievement to
   */
  awardLargestArmyAchievement(players, winner) {
    players.forEach(player => {
      if (!player.victoryPoints) {
        player.victoryPoints = { largestArmy: 0 };
      }
      player.victoryPoints.largestArmy = (player === winner) ? this.VICTORY_POINTS : 0;
    });
  }
  
  /**
   * Clear largest army achievement from all players
   * @param {Array} players - All players
   */
  clearLargestArmyAchievement(players) {
    players.forEach(player => {
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = 0;
      }
    });
  }
  
  /**
   * Get current largest army holder
   * @param {Array} players - All players
   * @returns {Object|null} Player with largest army achievement
   */
  getCurrentLargestArmyHolder(players) {
    if (!players || players.length === 0) return null;
    return players.find(player => player.victoryPoints?.largestArmy > 0) || null;
  }
  
  /**
   * Get army statistics for all players
   * @param {Array} players - All players
   * @returns {Array} Array of {player, knights, hasAchievement, qualifies}
   */
  getArmyStatistics(players) {
    if (!players || players.length === 0) return [];
    
    return players.map(player => ({
      player,
      knights: this.getKnightCount(player),
      hasAchievement: (player.victoryPoints?.largestArmy || 0) > 0,
      qualifies: this.qualifiesForLargestArmy(player)
    }));
  }
  
  /**
   * Process knight play and update achievements
   * @param {Object} player - Player who played the knight
   * @param {Array} allPlayers - Array of all players
   * @returns {Object} Updated knight count and achievement status
   */
  processKnightPlay(player, allPlayers) {
    const newKnightCount = this.playKnight(player);
    const armyResult = this.updateLargestArmy(allPlayers);
    
    return {
      knightCount: newKnightCount,
      largestArmyHolder: armyResult.holder,
      achievementChanged: armyResult.holder === player && (player.victoryPoints?.largestArmy || 0) > 0
    };
  }
  
  /**
   * Reset all knight counts and achievements (for new game)
   * @param {Array} players - All players
   */
  resetKnightTracking(players) {
    if (!players || players.length === 0) return;
    
    players.forEach(player => {
      player.knightsPlayed = 0;
      if (player.victoryPoints) {
        player.victoryPoints.largestArmy = 0;
      }
    });
    
    debugLog('Knight tracking reset for all players');
  }
}
