// victoryPointSystem/VictoryPointCalculator.js
// Pure calculation logic for victory points - no state management

/**
 * VictoryPointCalculator Class
 * Single Responsibility: Calculate VP from player data
 * Pure functions without side effects - perfect for testing
 */
export class VictoryPointCalculator {
  /**
   * Calculate basic victory points (settlements + cities)
   * @param {Object} player - The player object
   * @returns {number} Basic victory points
   */
  calculateBasicVP(player) {
    if (!player) return 0;
    
    const settlements = (player.settlements || []).length;
    const cities = (player.cities || []).length * 2;
    
    return settlements + cities;
  }
  
  /**
   * Calculate hidden victory points (VP cards)
   * @param {Object} player - The player object
   * @returns {number} Hidden victory points
   */
  calculateHiddenVP(player) {
    if (!player || !player.victoryPoints) return 0;
    return player.victoryPoints.hiddenVP || 0;
  }
  
  /**
   * Calculate special achievement victory points (Longest Road + Largest Army)
   * @param {Object} player - The player object
   * @returns {number} Special achievement victory points
   */
  calculateSpecialVP(player) {
    if (!player || !player.victoryPoints) return 0;
    
    const longestRoad = player.victoryPoints.longestRoad || 0;
    const largestArmy = player.victoryPoints.largestArmy || 0;
    
    return longestRoad + largestArmy;
  }
  
  /**
   * Calculate total victory points for a player
   * @param {Object} player - The player object
   * @param {boolean} includeHidden - Whether to include hidden VP cards
   * @returns {number} Total victory points
   */
  calculateTotalVP(player, includeHidden = true) {
    if (!player) return 0;
    
    let total = 0;
    total += this.calculateBasicVP(player);
    total += this.calculateSpecialVP(player);
    
    if (includeHidden) {
      total += this.calculateHiddenVP(player);
    }
    
    return total;
  }
  
  /**
   * Calculate public victory points (visible to all players)
   * @param {Object} player - The player object
   * @returns {number} Public victory points
   */
  calculatePublicVP(player) {
    return this.calculateTotalVP(player, false);
  }
  
  /**
   * Get detailed victory points breakdown for display
   * @param {Object} player - The player object
   * @returns {Object} VP breakdown
   */
  getVPBreakdown(player) {
    if (!player) {
      return {
        settlements: 0,
        cities: 0,
        hiddenVP: 0,
        longestRoad: 0,
        largestArmy: 0,
        total: 0,
        public: 0
      };
    }
    
    const settlements = (player.settlements || []).length;
    const cities = (player.cities || []).length * 2;
    const hiddenVP = this.calculateHiddenVP(player);
    const longestRoad = player.victoryPoints?.longestRoad || 0;
    const largestArmy = player.victoryPoints?.largestArmy || 0;
    
    return {
      settlements,
      cities,
      hiddenVP,
      longestRoad,
      largestArmy,
      total: this.calculateTotalVP(player, true),
      public: this.calculatePublicVP(player)
    };
  }
  
  /**
   * Get victory points for display in UI
   * @param {Object} player - The player object
   * @param {boolean} isCurrentPlayer - Whether this is the current player
   * @returns {Object} Display information
   */
  getVPForDisplay(player, isCurrentPlayer = false) {
    if (!player) {
      return { display: '0', total: 0, public: 0, hidden: 0 };
    }
    
    const breakdown = this.getVPBreakdown(player);
    
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
}
