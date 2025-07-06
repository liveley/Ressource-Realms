// modules/victoryPointsDebug.js
// Debug UI for victory points system

export function createVictoryPointsDebugUI() {
  let debugUI = document.getElementById('victory-points-debug');
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

  // Toggle button
  const toggleBtn = document.createElement('button');
  toggleBtn.textContent = 'VP Debug';
  toggleBtn.style.position = 'fixed';
  toggleBtn.style.top = '10px';
  toggleBtn.style.right = '10px';
  toggleBtn.style.zIndex = '10001';
  toggleBtn.style.padding = '5px 10px';
  toggleBtn.style.fontSize = '12px';
  toggleBtn.onclick = () => {
    debugUI.style.display = debugUI.style.display === 'none' ? 'block' : 'none';
  };

  document.body.appendChild(toggleBtn);
  document.body.appendChild(debugUI);

  // Update function
  function updateDebugUI() {
    if (!window.players || debugUI.style.display === 'none') return;

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
