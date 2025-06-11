// modules/uiResources.js
// Ressourcen-UI für Catan 3D

const resources = [
  { key: 'wheat', symbol: '🌾', name: 'Weizen', color: '#ffe066' },
  { key: 'sheep', symbol: '🐑', name: 'Schaf', color: '#8fd19e' },
  { key: 'wood', symbol: '🌲', name: 'Holz', color: '#deb887' },
  { key: 'clay', symbol: '🧱', name: 'Lehm', color: '#e07a5f' },
  { key: 'ore', symbol: '🪙', name: 'Erz', color: '#ffd700' }
];

let resUI = null;
let currentPlayer = null; // Track the player whose resources are shown

export function createResourceUI() {
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.style.position = 'absolute';
  resUI.style.zIndex = '10';
  document.body.appendChild(resUI);
}

// Update the UI to show the resources of the given player
export function updateResourceUI(player) {
  currentPlayer = player;
  if (!resUI || !player) return;
  resUI.innerHTML = resources.map(r => `
    <span style="display:inline-flex;align-items:center;gap:0.3em;min-width:3.5em;">
      <span style="font-size:1.5em;">${r.symbol}</span>
      <span style="color:${r.color};font-weight:bold;min-width:1.2em;text-align:right;">${player.resources[r.key]}</span>
    </span>
  `).join('');
}

// Debug/cheat: allow adding resources to the current player
export function handleResourceKeydown(e) {
  if (!currentPlayer) return;
  if (e.key === '1') currentPlayer.resources.wheat++;
  if (e.key === '2') currentPlayer.resources.sheep++;
  if (e.key === '3') currentPlayer.resources.wood++;
  if (e.key === '4') currentPlayer.resources.clay++;
  if (e.key === '5') currentPlayer.resources.ore++;
  updateResourceUI(currentPlayer);
}

export { resources };
