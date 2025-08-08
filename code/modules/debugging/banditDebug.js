// banditDebug.js - Debug utilities specific to the bandit/robber functionality
import { logDebug, LOG_LEVELS } from './debugTools.js';

/**
 * Creates a visual indicator when robber selection mode is active
 * @returns {HTMLElement} The created indicator element
 */
export function createRobberSelectionIndicator() {
  // Remove any existing indicator first
  const existingIndicator = document.getElementById('robber-selection-indicator');
  if (existingIndicator) {
    existingIndicator.parentNode.removeChild(existingIndicator);
  }

  // Create new indicator
  const indicator = document.createElement('div');
  indicator.id = 'robber-selection-indicator';
  indicator.textContent = '🔴 WÄCHTERAUSWAHL AKTIV';
  indicator.style.position = 'fixed';
  indicator.style.top = '10em';
  indicator.style.right = '20px';
  indicator.style.padding = '5px 10px';
  indicator.style.backgroundColor = 'rgba(255, 100, 0, 0.85)';
  indicator.style.color = 'white';
  indicator.style.borderRadius = '5px';
  indicator.style.zIndex = '1000';
  indicator.style.fontFamily = "'Montserrat', Arial, sans-serif";
  indicator.style.fontSize = '0.85em';
  indicator.style.fontWeight = 'bold';
  indicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
  document.body.appendChild(indicator);
  
  return indicator;
}

/**
 * Removes the robber selection indicator
 */
export function removeRobberSelectionIndicator() {
  const indicator = document.getElementById('robber-selection-indicator');
  if (indicator) {
    indicator.parentNode.removeChild(indicator);
  }
}

/**
 * Log robber position and movement details
 * @param {string} context - Context description for the log
 * @param {Object} position - Position information
 */
export function logRobberPosition(context, position) {
  logDebug(`[Robber] ${context}:`, LOG_LEVELS.DEBUG, position);
}

/**
 * Show a temporary message about bandit/robber action
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the message (ms)
 */
export function showBanditActionMessage(message, duration = 3000) {
  const errorMsg = document.createElement('div');
  errorMsg.textContent = message;
  errorMsg.style.position = 'fixed';
  errorMsg.style.left = '50%';
  errorMsg.style.top = '10%';
  errorMsg.style.transform = 'translateX(-50%)';
  errorMsg.style.background = 'rgba(255,50,50,0.9)';
  errorMsg.style.color = 'white';
  errorMsg.style.padding = '10px 20px';
  errorMsg.style.borderRadius = '5px';
  errorMsg.style.fontFamily = "'Montserrat', Arial, sans-serif";
  errorMsg.style.zIndex = '1000';
  document.body.appendChild(errorMsg);
  setTimeout(() => {
    if (errorMsg.parentNode) {
      document.body.removeChild(errorMsg);
    }
  }, duration);
}
