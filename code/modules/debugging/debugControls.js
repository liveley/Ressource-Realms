// Debug Control Module
// This module provides centralized control for all debug features in the game
// 
// USAGE:
// 1. Import this module in main.js: import { initDebugControls } from './modules/debugging/debugControls.js';
// 2. Call initDebugControls() in main.js to make debug controls globally available
// 3. Use in browser console:
//    - enableDebugLogging() - Enable all debug logging
//    - disableDebugLogging() - Disable all debug logging
//    - setDebugMode(category, enabled) - Enable/disable specific debug categories
//    - getDebugStatus() - Show current debug settings

/**
 * Initialize debug controls and make them globally available
 */
export function initDebugControls() {
  // Set up global debug flags
  window.DEBUG_VICTORY_POINTS = false;
  window.DEBUG_ROAD_CONNECTIONS = false;
  window.DEBUG_DICE = false;
  window.DEBUG_RESOURCES = false;
  window.DEBUG_BUILD = false;
  window.DEBUG_BANDIT = false;
  window.DEBUG_CARDS = false;
  window.DEBUG_GENERAL = false;
  
  // Make debug control functions globally available
  window.enableDebugLogging = enableDebugLogging;
  window.disableDebugLogging = disableDebugLogging;
  window.setDebugMode = setDebugMode;
  window.getDebugStatus = getDebugStatus;
  window.enableAllDebug = enableAllDebug;
  window.disableAllDebug = disableAllDebug;
  
  console.log('🔧 Debug controls initialized. Use enableDebugLogging() or disableDebugLogging() in console.');
}

/**
 * Enable debug logging for specific categories
 * @param {string[]} categories - Array of categories to enable (optional, defaults to all)
 */
function enableDebugLogging(categories = null) {
  if (!categories) {
    // Enable all categories
    window.DEBUG_VICTORY_POINTS = true;
    window.DEBUG_ROAD_CONNECTIONS = true;
    window.DEBUG_DICE = true;
    window.DEBUG_RESOURCES = true;
    window.DEBUG_BUILD = true;
    window.DEBUG_BANDIT = true;
    window.DEBUG_CARDS = true;
    window.DEBUG_GENERAL = true;
    console.log('🔧 All debug logging enabled');
  } else {
    // Enable specific categories
    categories.forEach(category => {
      const flagName = `DEBUG_${category.toUpperCase()}`;
      if (window[flagName] !== undefined) {
        window[flagName] = true;
        console.log(`🔧 Debug logging enabled for: ${category}`);
      } else {
        console.warn(`🔧 Unknown debug category: ${category}`);
      }
    });
  }
}

/**
 * Disable debug logging for specific categories
 * @param {string[]} categories - Array of categories to disable (optional, defaults to all)
 */
function disableDebugLogging(categories = null) {
  if (!categories) {
    // Disable all categories
    window.DEBUG_VICTORY_POINTS = false;
    window.DEBUG_ROAD_CONNECTIONS = false;
    window.DEBUG_DICE = false;
    window.DEBUG_RESOURCES = false;
    window.DEBUG_BUILD = false;
    window.DEBUG_BANDIT = false;
    window.DEBUG_CARDS = false;
    window.DEBUG_GENERAL = false;
    console.log('🔧 All debug logging disabled');
  } else {
    // Disable specific categories
    categories.forEach(category => {
      const flagName = `DEBUG_${category.toUpperCase()}`;
      if (window[flagName] !== undefined) {
        window[flagName] = false;
        console.log(`🔧 Debug logging disabled for: ${category}`);
      } else {
        console.warn(`🔧 Unknown debug category: ${category}`);
      }
    });
  }
}

/**
 * Set debug mode for a specific category
 * @param {string} category - Debug category name
 * @param {boolean} enabled - Whether to enable or disable
 */
function setDebugMode(category, enabled) {
  const flagName = `DEBUG_${category.toUpperCase()}`;
  if (window[flagName] !== undefined) {
    window[flagName] = enabled;
    console.log(`🔧 Debug logging ${enabled ? 'enabled' : 'disabled'} for: ${category}`);
  } else {
    console.warn(`🔧 Unknown debug category: ${category}`);
  }
}

/**
 * Get current debug status
 * @returns {Object} Object with current debug settings
 */
function getDebugStatus() {
  const status = {
    VICTORY_POINTS: window.DEBUG_VICTORY_POINTS,
    ROAD_CONNECTIONS: window.DEBUG_ROAD_CONNECTIONS,
    DICE: window.DEBUG_DICE,
    RESOURCES: window.DEBUG_RESOURCES,
    BUILD: window.DEBUG_BUILD,
    BANDIT: window.DEBUG_BANDIT,
    CARDS: window.DEBUG_CARDS,
    GENERAL: window.DEBUG_GENERAL
  };
  
  console.log('🔧 Current debug status:', status);
  return status;
}

/**
 * Enable all debug features (alias for enableDebugLogging)
 */
function enableAllDebug() {
  enableDebugLogging();
}

/**
 * Disable all debug features (alias for disableDebugLogging)
 */
function disableAllDebug() {
  disableDebugLogging();
}

/**
 * Available debug categories
 */
export const DEBUG_CATEGORIES = [
  'VICTORY_POINTS',
  'ROAD_CONNECTIONS',
  'DICE',
  'RESOURCES',
  'BUILD',
  'BANDIT',
  'CARDS',
  'GENERAL'
];

/**
 * Debug logging helper function
 * @param {string} category - Debug category
 * @param {*} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debugLog(category, message, ...args) {
  const flagName = `DEBUG_${category.toUpperCase()}`;
  if (window[flagName]) {
    console.log(`[${category}]`, message, ...args);
  }
}

/**
 * Debug warning helper function
 * @param {string} category - Debug category
 * @param {*} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debugWarn(category, message, ...args) {
  const flagName = `DEBUG_${category.toUpperCase()}`;
  if (window[flagName]) {
    console.warn(`[${category}]`, message, ...args);
  }
}

/**
 * Debug error helper function
 * @param {string} category - Debug category
 * @param {*} message - Message to log
 * @param {...any} args - Additional arguments
 */
export function debugError(category, message, ...args) {
  const flagName = `DEBUG_${category.toUpperCase()}`;
  if (window[flagName]) {
    console.error(`[${category}]`, message, ...args);
  }
}
