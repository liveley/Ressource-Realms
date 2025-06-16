// debugTools.js - Collection of debugging utilities for development

// Debug flag to force certain dice values
let debugForceValue = null;

/**
 * Set a specific value for dice to always roll in debug mode
 * @param {number|null} value - The value to force (null for normal random rolling)
 * @returns {number|null} - The current debug value
 */
export function setDebugDiceValue(value) {
  debugForceValue = value;
  console.log(`Debug mode: Dice will roll ${value || 'randomly'}`);
  return debugForceValue;
}

/**
 * Toggle debug dice mode between a specific value and normal random rolling
 * @param {number|null} value - The value to force (null for normal random rolling)
 * @returns {boolean} - Whether debug mode is now enabled
 */
export function toggleDebugDiceMode(value = 7) {
  if (debugForceValue === null) {
    debugForceValue = value;
    console.log(`%c🎲 DEBUG MODE ENABLED: Dice will always roll ${value}`, 'background: #d42; color: white; font-weight: bold; padding: 3px 5px; border-radius: 3px;');
    return true;
  } else {
    debugForceValue = null;
    console.log('%c🎲 DEBUG MODE DISABLED: Dice will roll randomly', 'background: #333; color: white; font-weight: bold; padding: 3px 5px; border-radius: 3px;');
    return false;
  }
}

/**
 * Get the current debug dice value
 * @returns {number|null} The forced value or null if not in debug mode
 */
export function getDebugDiceValue() {
  return debugForceValue;
}

/**
 * Create a debug UI indicator for dice mode
 * @param {boolean} enabled - Whether debug mode is enabled
 * @param {number} value - The forced value
 * @returns {HTMLElement} - The created UI element
 */
export function createDebugDiceIndicator(enabled, value = 7) {
  // Remove any existing indicator
  let indicator = document.getElementById('debug-dice-indicator');
  if (indicator) {
    indicator.parentNode.removeChild(indicator);
  }
  
  if (!enabled) return null;
  
  // Create new indicator
  indicator = document.createElement('div');
  indicator.id = 'debug-dice-indicator';
  indicator.textContent = `🎲 ALWAYS ${value} MODE`;
  indicator.style.position = 'fixed';
  indicator.style.top = '6em';
  indicator.style.right = '20px';
  indicator.style.padding = '5px 10px';
  indicator.style.backgroundColor = 'rgba(255, 50, 50, 0.85)';
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
 * Display a temporary debug message
 * @param {string} message - The message to display
 * @param {number} duration - How long to show the message in ms
 */
export function showDebugMessage(message, duration = 3000) {
  const messageEl = document.createElement('div');
  messageEl.className = 'debug-message';
  messageEl.textContent = message;
  messageEl.style.position = 'fixed';
  messageEl.style.bottom = '20px';
  messageEl.style.left = '20px';
  messageEl.style.padding = '10px';
  messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
  messageEl.style.color = 'white';
  messageEl.style.borderRadius = '5px';
  messageEl.style.zIndex = '1000';
  messageEl.style.fontFamily = "'Montserrat', Arial, sans-serif";
  document.body.appendChild(messageEl);
  
  setTimeout(() => {
    if (messageEl.parentNode) {
      messageEl.parentNode.removeChild(messageEl);
    }
  }, duration);
  
  return messageEl;
}
