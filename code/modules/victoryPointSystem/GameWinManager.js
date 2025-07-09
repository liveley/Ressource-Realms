// victoryPointSystem/GameWinManager.js
// Game win conditions and win UI management

import { VICTORY_POINTS_TO_WIN, debugLog } from './utils/constants.js';

/**
 * GameWinManager Class
 * Single Responsibility: Manage win conditions and win UI
 * Focused on win detection, overlay display, and game state management
 */
export class GameWinManager {
  constructor(vpCalculator) {
    this.vpCalculator = vpCalculator;
    this.VICTORY_POINTS_TO_WIN = VICTORY_POINTS_TO_WIN;
    this.gameWon = false;
    this.winnerCallback = null;
  }
  
  /**
   * Check if a player has won the game
   * @param {Object} player - The player object
   * @returns {boolean} True if player has won
   */
  checkWinCondition(player) {
    if (this.gameWon) {
      debugLog('Game already won, ignoring win check');
      return false; // Game already won
    }
    
    if (!player) {
      debugLog('checkWinCondition called with null/undefined player');
      return false;
    }
    
    const totalVP = this.vpCalculator.calculateTotalVP(player, true);
    debugLog(`Checking win condition for ${player.name}: ${totalVP}/${this.VICTORY_POINTS_TO_WIN} VP`);
    
    if (totalVP >= this.VICTORY_POINTS_TO_WIN) {
      this.gameWon = true;
      debugLog(`🏆 ${player.name} wins with ${totalVP} victory points!`);
      this.triggerGameWin(player, totalVP);
      return true;
    }
    
    return false;
  }
  
  /**
   * Check win conditions for multiple players
   * @param {Array} players - Array of players to check
   * @returns {Object|null} Winner object or null if no winner
   */
  checkMultipleWinConditions(players) {
    if (!players || players.length === 0) return null;
    
    for (const player of players) {
      if (this.checkWinCondition(player)) {
        return player;
      }
    }
    return null;
  }
  
  /**
   * Trigger game win condition
   * @param {Object} winner - The winning player
   * @param {number} totalVP - Total victory points
   */
  triggerGameWin(winner, totalVP) {
    if (this.winnerCallback) {
      debugLog('Calling custom winner callback');
      this.winnerCallback(winner, totalVP);
    } else {
      debugLog('Showing default win overlay');
      this.showWinOverlay(winner, totalVP);
    }
    
    // Fire custom event for other systems to listen to
    this.fireWinEvent(winner, totalVP);
  }
  
  /**
   * Set a custom callback for when a player wins
   * @param {Function} callback - Function to call when game is won
   */
  setWinnerCallback(callback) {
    this.winnerCallback = callback;
    debugLog('Custom winner callback set');
  }
  
  /**
   * Show the default win overlay
   * @param {Object} winner - The winning player
   * @param {number} totalVP - Total victory points
   */
  showWinOverlay(winner, totalVP) {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      debugLog('Cannot show win overlay: document is not available');
      return;
    }
    
    // Remove any existing win overlay to prevent duplicates/leaks
    this.cleanupWinOverlay();
    
    // Create win announcement
    const winOverlay = this.createWinOverlay(winner, totalVP);
    if (winOverlay) {
      document.body.appendChild(winOverlay);
      
      // Add escape listener and fire events
      this.addEscapeListener();
      this.fireWinEvent(winner, totalVP);
    }
    
    // Disable further game actions
    this.disableGameActions();
    
    debugLog('Win overlay displayed');
  }
  
  /**
   * Create the win overlay DOM element
   * @param {Object} winner - The winning player
   * @param {number} totalVP - Total victory points
   * @returns {HTMLElement} Win overlay element
   */
  createWinOverlay(winner, totalVP) {
    const winOverlay = document.createElement('div');
    winOverlay.id = 'game-win-overlay';
    winOverlay.style.cssText = `
      position: fixed;
      top: 0;
      left: 0;
      width: 100vw;
      height: 100vh;
      background: rgba(0, 0, 0, 0.8);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      z-index: 999999;
      font-family: Montserrat, Arial, sans-serif;
    `;
    
    // Win message
    const winMessage = this.createWinMessage(winner);
    winOverlay.appendChild(winMessage);
    
    // VP breakdown
    const vpBreakdown = this.createVPBreakdown(winner, totalVP);
    winOverlay.appendChild(vpBreakdown);
    
    // Play again button
    const playAgainBtn = this.createPlayAgainButton();
    winOverlay.appendChild(playAgainBtn);
    
    // ESC key listener for cleanup
    this.addEscapeListener();
    
    return winOverlay;
  }
  
  /**
   * Create win message element
   * @param {Object} winner - The winning player
   * @returns {HTMLElement} Win message element
   */
  createWinMessage(winner) {
    if (typeof document === 'undefined') return null;
    
    const winMessage = document.createElement('div');
    winMessage.style.cssText = `
      font-size: 3em;
      font-weight: bold;
      color: #ffd700;
      text-align: center;
      margin-bottom: 1em;
      text-shadow: 0 0 20px #ffd700;
    `;
    winMessage.textContent = `🏆 ${winner.name} gewinnt! 🏆`;
    return winMessage;
  }
  
  /**
   * Create VP breakdown element
   * @param {Object} winner - The winning player
   * @param {number} totalVP - Total victory points
   * @returns {HTMLElement} VP breakdown element
   */
  createVPBreakdown(winner, totalVP) {
    if (typeof document === 'undefined') return null;
    
    const vpBreakdown = document.createElement('div');
    vpBreakdown.style.cssText = `
      font-size: 1.5em;
      color: #fff;
      text-align: center;
      margin-bottom: 2em;
    `;
    
    const publicVP = this.vpCalculator.calculatePublicVP(winner);
    const hiddenVP = this.vpCalculator.calculateHiddenVP(winner);
    
    vpBreakdown.innerHTML = `
      <div style="margin-bottom: 0.5em;">Gesamtpunkte: ${totalVP}</div>
      <div style="font-size: 0.8em; color: #ccc;">
        Öffentliche Punkte: ${publicVP}<br>
        Versteckte Punkte: ${hiddenVP}
      </div>
    `;
    
    return vpBreakdown;
  }
  
  /**
   * Create play again button
   * @returns {HTMLElement} Play again button element
   */
  createPlayAgainButton() {
    if (typeof document === 'undefined') return null;
    
    const playAgainBtn = document.createElement('button');
    playAgainBtn.textContent = 'Neues Spiel';
    playAgainBtn.style.cssText = `
      font-size: 1.2em;
      padding: 0.8em 2em;
      background: #ffe066;
      border: none;
      border-radius: 0.5em;
      cursor: pointer;
      font-weight: bold;
    `;
    
    playAgainBtn.onclick = () => {
      this.restartGame();
    };
    
    return playAgainBtn;
  }
  
  /**
   * Add escape key listener for cleanup
   */
  addEscapeListener() {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      debugLog('Cannot add escape listener: document is not available');
      return;
    }
    
    const escListener = (event) => {
      if (event.key === 'Escape') {
        this.cleanupWinOverlay();
      }
    };
    
    document.addEventListener('keydown', escListener);
    
    // Store listener for cleanup
    this.escListener = escListener;
  }
  
  /**
   * Fire win event for other systems to listen to
   * @param {Object} winner - The winning player
   * @param {number} totalVP - Total victory points
   */
  fireWinEvent(winner, totalVP) {
    if (typeof window !== 'undefined' && window.dispatchEvent) {
      const winEvent = new CustomEvent('gameWon', {
        detail: { 
          winner, 
          totalVP, 
          cleanup: () => this.cleanupWinOverlay() 
        }
      });
      window.dispatchEvent(winEvent);
      debugLog('Game won event fired');
    }
  }
  
  /**
   * Disable further game actions
   */
  disableGameActions() {
    if (typeof window !== 'undefined') {
      window.gameWon = true;
    }
  }
  
  /**
   * Restart the game
   */
  restartGame() {
    debugLog('Restarting game');
    this.cleanupWinOverlay();
    
    // Reload the page for a new game
    if (typeof window !== 'undefined' && window.location) {
      window.location.reload();
    }
  }
  
  /**
   * Manually cleanup win overlay (for testing or manual game reset)
   * @returns {boolean} True if overlay was removed, false if none existed
   */
  cleanupWinOverlay() {
    // Check if we're in a browser environment
    if (typeof document === 'undefined') {
      debugLog('Cannot cleanup win overlay: document is not available');
      this.resetGameState();
      return false;
    }
    
    const existingOverlay = document.getElementById('game-win-overlay');
    
    if (existingOverlay) {
      existingOverlay.remove();
      debugLog('Win overlay cleaned up');
    }
    
    // Remove escape listener
    if (this.escListener) {
      document.removeEventListener('keydown', this.escListener);
      this.escListener = null;
    }
    
    // Reset game state
    this.resetGameState();
    
    return !!existingOverlay;
  }
  
  /**
   * Reset game state for a new game
   */
  resetGameState() {
    this.gameWon = false;
    if (typeof window !== 'undefined') {
      window.gameWon = false;
    }
    debugLog('Game state reset');
  }
  
  /**
   * Check if game is currently won
   * @returns {boolean} True if game is won
   */
  isGameWon() {
    return this.gameWon;
  }
  
  /**
   * Force set game won state (for testing)
   * @param {boolean} won - Game won state
   */
  setGameWon(won) {
    this.gameWon = won;
    if (typeof window !== 'undefined') {
      window.gameWon = won;
    }
  }
}
