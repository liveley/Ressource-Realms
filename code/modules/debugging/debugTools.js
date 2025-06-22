// debugTools.js - Collection of general debugging utilities for development
// Feature-specific debug utilities should be placed in feature-specific files like:
// - diceDebug.js - For dice-related debugging
// - banditDebug.js - For bandit/robber-related debugging

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

// Robber-related functions have been moved to banditDebug.js for better organization

// Debug log level constants
export const LOG_LEVELS = {
  NONE: 0,
  ERROR: 1,
  WARN: 2,
  INFO: 3,
  DEBUG: 4,
  VERBOSE: 5
};

// Current log level - set to INFO by default
// Change this to adjust how verbose logging is
let currentLogLevel = LOG_LEVELS.INFO;

/**
 * Set the current debug log level
 * @param {number} level - The log level to set
 */
export function setLogLevel(level) {
  if (Object.values(LOG_LEVELS).includes(level)) {
    currentLogLevel = level;
    console.log(`Log level set to ${Object.keys(LOG_LEVELS).find(key => LOG_LEVELS[key] === level)}`);
  } else {
    console.error(`Invalid log level: ${level}`);
  }
}

/**
 * Log a message at the specified level
 * @param {string} message - The message to log
 * @param {number} level - The log level for this message
 * @param  {...any} args - Additional arguments to log
 * @returns {boolean} Whether the message was logged
 */
export function logDebug(message, level = LOG_LEVELS.INFO, ...args) {
  if (level <= currentLogLevel) {
    const prefix = getLogPrefix(level);
    if (args && args.length > 0) {
      console.log(`${prefix} ${message}`, ...args);
    } else {
      console.log(`${prefix} ${message}`);
    }
    return true;
  }
  return false;
}

// Helper to get prefix based on log level
function getLogPrefix(level) {
  switch (level) {
    case LOG_LEVELS.ERROR: return '🔴 ERROR:';
    case LOG_LEVELS.WARN: return '🟠 WARNING:';
    case LOG_LEVELS.INFO: return '🔵 INFO:';
    case LOG_LEVELS.DEBUG: return '🟢 DEBUG:';
    case LOG_LEVELS.VERBOSE: return '⚪ TRACE:';
    default: return '';
  }
}
