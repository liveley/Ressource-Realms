// moved from modules/longestRoadDebug.js
// Debug script to analyze longest road calculation issues

import { debugRoadConnections } from './victoryPointsTestingUtils.js';

// Global variables to track road debug popup state
let roadDebugUI = null;
let roadDebugVisible = false;

/**
 * Enable debug logging for road connections
 */
export function enableRoadDebug() {
  window.DEBUG_ROAD_CONNECTIONS = true;
  console.log('Road debugging enabled');
}

/**
 * Disable debug logging for road connections
 */
export function disableRoadDebug() {
  window.DEBUG_ROAD_CONNECTIONS = false;
  console.log('Road debugging disabled');
}

/**
 * Analyze current player's roads and find potential issues
 */
export function analyzePlayerRoads(player) {
  console.log('\n=== ROAD ANALYSIS ===');
  console.log(`Player: ${player.name}`);
  console.log(`Total roads: ${player.roads ? player.roads.length : 0}`);
  
  if (!player.roads || player.roads.length === 0) {
    console.log('No roads to analyze');
    return;
  }
  
  // List all roads
  console.log('\nAll roads:');
  player.roads.forEach((road, index) => {
    console.log(`${index + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  // Run debug analysis
  debugRoadConnections(player.roads);
}

/**
 * Test road connection detection with specific examples
 */
export function testRoadConnections() {
  console.log('\n=== TESTING ROAD CONNECTIONS ===');
  
  // Test case 1: Two roads that should connect
  const testRoads1 = [
    { q: 0, r: 0, edge: 0 },  // Top edge of center tile
    { q: 1, r: 0, edge: 3 }   // Bottom edge of adjacent tile
  ];
  
  console.log('Test 1: Adjacent tiles, connecting edges');
  console.log('Roads:', testRoads1);
  debugRoadConnections(testRoads1);
  
  // Test case 2: Roads around a single tile
  const testRoads2 = [
    { q: 0, r: 0, edge: 0 },  // Top edge
    { q: 0, r: 0, edge: 1 },  // Top-right edge
    { q: 0, r: 0, edge: 2 }   // Bottom-right edge
  ];
  
  console.log('\nTest 2: Sequential edges around same tile');
  console.log('Roads:', testRoads2);
  debugRoadConnections(testRoads2);
  
  // Test case 3: A typical 5-road chain
  const testRoads3 = [
    { q: 0, r: 0, edge: 0 },  // Center tile, edge 0
    { q: 0, r: 0, edge: 1 },  // Center tile, edge 1 (connects to edge 0)
    { q: 1, r: 0, edge: 4 },  // Right tile, edge 4 (connects to center edge 1)
    { q: 1, r: 0, edge: 5 },  // Right tile, edge 5 (connects to edge 4)
    { q: 1, r: 0, edge: 0 }   // Right tile, edge 0 (connects to edge 5)
  ];
  
  console.log('\nTest 3: 5-road chain across tiles');
  console.log('Roads:', testRoads3);
  debugRoadConnections(testRoads3);
}

/**
 * Test specific problematic road configurations
 */
export function testProblematicRoads() {
  console.log('\n=== TESTING PROBLEMATIC ROADS ===');
  
  // Test the specific failing case from original Test 3
  const road1 = { q: 1, r: 0, edge: 3 }; // Should connect to road2?
  const road2 = { q: 1, r: 1, edge: 4 }; // Should connect to road1?
  
  console.log('Testing connection between:');
  console.log('Road 1:', road1);
  console.log('Road 2:', road2);
  
  // Use the global test function
}

/**
 * Create Road Debug Tools popup UI
 */
export function createRoadDebugToolsUI() {
  if (roadDebugUI) {
    roadDebugUI.remove();
  }

  roadDebugUI = document.createElement('div');
  roadDebugUI.id = 'road-debug-tools';
  roadDebugUI.style.position = 'fixed';
  roadDebugUI.style.top = '50px';
  roadDebugUI.style.right = '10px';
  roadDebugUI.style.background = 'rgba(0, 0, 0, 0.9)';
  roadDebugUI.style.color = 'white';
  roadDebugUI.style.padding = '15px';
  roadDebugUI.style.borderRadius = '8px';
  roadDebugUI.style.fontFamily = 'monospace';
  roadDebugUI.style.fontSize = '12px';
  roadDebugUI.style.zIndex = '10000';
  roadDebugUI.style.maxWidth = '400px';
  roadDebugUI.style.border = '2px solid #4CAF50';
  roadDebugUI.style.boxShadow = '0 4px 8px rgba(0,0,0,0.5)';
  roadDebugUI.style.display = 'none'; // Hidden by default

  // Create content
  const content = `
    <div style="border-bottom: 1px solid #555; padding-bottom: 10px; margin-bottom: 10px;">
      <h3 style="margin: 0; color: #4CAF50;">🛤️ Road Debug Tools</h3>
      <small style="color: #aaa;">Press R+D again to close</small>
    </div>
    
    <div style="margin-bottom: 10px;">
      <button id="analyze-roads-btn" style="margin-right: 5px; padding: 5px 10px; font-size: 11px; background: #2196F3; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Analyze Current Player Roads
      </button>
      <button id="test-connections-btn" style="padding: 5px 10px; font-size: 11px; background: #FF9800; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Test Road Connections
      </button>
    </div>
    
    <div style="margin-bottom: 10px;">
      <button id="debug-longest-path-btn" style="margin-right: 5px; padding: 5px 10px; font-size: 11px; background: #9C27B0; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Debug Longest Path
      </button>
      <button id="simulate-building-btn" style="padding: 5px 10px; font-size: 11px; background: #795548; color: white; border: none; border-radius: 3px; cursor: pointer;">
        Simulate Road Building
      </button>
    </div>
    
    <div style="background: rgba(255,255,255,0.1); padding: 8px; border-radius: 4px; font-size: 11px;">
      <strong>Debug Status:</strong> <span id="debug-status">Ready</span><br>
      <strong>Road Debug:</strong> <span id="road-debug-enabled">Disabled</span><br>
      <strong>Active Player:</strong> <span id="active-player-name">Unknown</span>
    </div>
  `;

  roadDebugUI.innerHTML = content;
  document.body.appendChild(roadDebugUI);

  // Add event listeners for buttons
  setupRoadDebugButtons();
  updateRoadDebugStatus();
}

/**
 * Setup event listeners for road debug buttons
 */
function setupRoadDebugButtons() {
  const analyzeBtn = document.getElementById('analyze-roads-btn');
  const testBtn = document.getElementById('test-connections-btn');
  const debugPathBtn = document.getElementById('debug-longest-path-btn');
  const simulateBtn = document.getElementById('simulate-building-btn');

  if (analyzeBtn) {
    analyzeBtn.onclick = () => {
      if (window.players && window.players.length > 0) {
        const activePlayer = window.players[window.activePlayerIdx || 0];
        analyzePlayerRoads(activePlayer);
        updateDebugStatus('Roads analyzed - check console');
      } else {
        updateDebugStatus('No players found');
      }
    };
  }

  if (testBtn) {
    testBtn.onclick = () => {
      testRoadConnections();
      updateDebugStatus('Connection tests run - check console');
    };
  }

  if (debugPathBtn) {
    debugPathBtn.onclick = () => {
      if (window.debugLongestRoadPath) {
        window.debugLongestRoadPath();
        updateDebugStatus('Longest path debugged - check console');
      } else {
        updateDebugStatus('Debug function not available');
      }
    };
  }

  if (simulateBtn) {
    simulateBtn.onclick = () => {
      if (window.simulateRoadBuilding) {
        window.simulateRoadBuilding();
        updateDebugStatus('Road building simulated - check console');
      } else {
        updateDebugStatus('Simulation function not available');
      }
    };
  }
}

/**
 * Update debug status display
 */
function updateDebugStatus(message) {
  const statusElement = document.getElementById('debug-status');
  if (statusElement) {
    statusElement.textContent = message;
    statusElement.style.color = '#4CAF50';
    
    // Reset color after 3 seconds
    setTimeout(() => {
      statusElement.style.color = 'white';
      statusElement.textContent = 'Ready';
    }, 3000);
  }
}

/**
 * Update road debug status information
 */
function updateRoadDebugStatus() {
  const roadDebugElement = document.getElementById('road-debug-enabled');
  const activePlayerElement = document.getElementById('active-player-name');
  
  if (roadDebugElement) {
    const isEnabled = window.DEBUG_ROAD_CONNECTIONS === true;
    roadDebugElement.textContent = isEnabled ? 'Enabled' : 'Disabled';
    roadDebugElement.style.color = isEnabled ? '#4CAF50' : '#f44336';
  }
  
  if (activePlayerElement && window.players && window.players.length > 0) {
    const activePlayer = window.players[window.activePlayerIdx || 0];
    activePlayerElement.textContent = activePlayer.name;
  }
}

/**
 * Show Road Debug Tools popup
 */
export function showRoadDebugTools() {
  if (!roadDebugUI) {
    createRoadDebugToolsUI();
  }
  roadDebugUI.style.display = 'block';
  roadDebugVisible = true;
  enableRoadDebug();
  updateRoadDebugStatus();
}

/**
 * Hide Road Debug Tools popup
 */
export function hideRoadDebugTools() {
  if (roadDebugUI) {
    roadDebugUI.style.display = 'none';
  }
  roadDebugVisible = false;
  disableRoadDebug();
}

/**
 * Toggle Road Debug Tools popup
 */
export function toggleRoadDebugTools() {
  if (roadDebugVisible) {
    hideRoadDebugTools();
    return false;
  } else {
    showRoadDebugTools();
    return true;
  }
}

/**
 * Check if Road Debug Tools is visible
 */
export function isRoadDebugToolsVisible() {
  return roadDebugVisible;
}
