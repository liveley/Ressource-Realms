// victoryPointSystem/utils/constants.js
// Victory Points System Constants

// Game rules constants
export const VICTORY_POINTS_TO_WIN = 10;
export const MIN_ROAD_LENGTH_FOR_LONGEST_ROAD = 5;
export const MIN_KNIGHTS_FOR_LARGEST_ARMY = 3;
export const LONGEST_ROAD_VICTORY_POINTS = 2;
export const LARGEST_ARMY_VICTORY_POINTS = 2;

// Coordinate system constants
export const FLOAT_TOLERANCE = 0.001; // For floating point comparisons in world coordinates
export const HEX_SIZE = 1.0; // Hex tile size for world coordinate conversion

// Debug logging helper
export function debugLog(...args) {
  if (typeof window !== 'undefined' && window.DEBUG_VICTORY_POINTS) {
    console.log('[VP Debug]', ...args);
  }
}
