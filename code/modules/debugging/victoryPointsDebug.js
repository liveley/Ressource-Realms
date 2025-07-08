// moved from modules/victoryPointsDebug.js
// Debug UI for victory points system

let debugUI = null;

export function createVictoryPointsDebugUI() {
  if (debugUI) {
    debugUI.remove();
  }

  debugUI = document.createElement('div');
  debugUI.id = 'victory-points-debug';
  debugUI.style.position = 'fixed';
  debugUI.style.top = '10px';
  debugUI.style.right = '10px';
  debugUI.style.background = 'rgba(0, 0, 0, 0.8)';
  debugUI.style.color = 'white';
  debugUI.style.padding = '10px';
  debugUI.style.borderRadius = '5px';
  debugUI.style.fontFamily = 'monospace';
  debugUI.style.fontSize = '12px';
  debugUI.style.zIndex = '10000';
  debugUI.style.maxWidth = '300px';
  debugUI.style.display = 'none'; // Hidden by default

  document.body.appendChild(debugUI);

  // Update function
  function updateDebugUI() {
    if (!window.players || !debugUI || debugUI.style.display === 'none') return;

    let content = '<h3>Victory Points Debug</h3>';
    
    window.players.forEach((player, idx) => {
      const isActive = idx === (window.activePlayerIdx || 0);
      const vpData = window.getVictoryPointsForDisplay ? 
        window.getVictoryPointsForDisplay(player, isActive) : 
        { display: 'N/A', total: 0, public: 0, hidden: 0 };
      
      content += `<div style="margin-bottom: 10px; border: 1px solid #555; padding: 5px;">`;
      content += `<strong>${player.name}${isActive ? ' (Active)' : ''}</strong><br>`;
      content += `Display: ${vpData.display}<br>`;
      content += `Total: ${vpData.total}<br>`;
      content += `Public: ${vpData.public}<br>`;
      content += `Hidden: ${vpData.hidden}<br>`;
      content += `Settlements: ${(player.settlements || []).length}<br>`;
      content += `Cities: ${(player.cities || []).length}<br>`;
      content += `Roads: ${(player.roads || []).length}<br>`;
      content += `Knights: ${player.knightsPlayed || 0}<br>`;
      content += `VP Cards: ${player.victoryPoints?.hiddenVP || 0}<br>`;
      content += `Longest Road: ${player.victoryPoints?.longestRoad || 0}<br>`;
      content += `Largest Army: ${player.victoryPoints?.largestArmy || 0}<br>`;
      content += `</div>`;
    });

    debugUI.innerHTML = content;
  }

  // Update every 500ms
  setInterval(updateDebugUI, 500);

  return { updateDebugUI };
}

// Function to show VP debug popup (called when road debug is enabled)
export function showVictoryPointsDebug() {
  if (!debugUI) {
    createVictoryPointsDebugUI();
  }
  debugUI.style.display = 'block';
}

// Function to hide VP debug popup (called when road debug is disabled)
export function hideVictoryPointsDebug() {
  if (debugUI) {
    debugUI.style.display = 'none';
  }
}

// Function to check if VP debug is currently visible
export function isVictoryPointsDebugVisible() {
  return debugUI && debugUI.style.display === 'block';
}
