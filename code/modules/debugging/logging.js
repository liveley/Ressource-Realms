// Lightweight debug logging utility to gate verbose logs in hot paths.
// Usage:
//   import { debug, enableDebug, disableDebug } from './debugging/logging.js';
//   debug('dice', 'value', someVar);
//   enableDebug('dice');
// Groups kept small to avoid string typos.

const flags = {
  dice: false,
  ports: false,
  roads: false,
  placement: false,
  performance: false
};

export function enableDebug(group) {
  if (group === 'all') {
    Object.keys(flags).forEach(k => flags[k] = true);
    return;
  }
  if (flags.hasOwnProperty(group)) flags[group] = true;
}

export function disableDebug(group) {
  if (group === 'all') {
    Object.keys(flags).forEach(k => flags[k] = false);
    return;
  }
  if (flags.hasOwnProperty(group)) flags[group] = false;
}

export function debug(group, ...args) {
  if (flags[group]) {
    // eslint-disable-next-line no-console
    console.log(`[${group}]`, ...args);
  }
}

export function getDebugFlags() { return { ...flags }; }

// Expose helpers globally for quick toggling in console (non-invasive)
if (typeof window !== 'undefined') {
  window.enableDebug = enableDebug;
  window.disableDebug = disableDebug;
  window.getDebugFlags = getDebugFlags;
}
