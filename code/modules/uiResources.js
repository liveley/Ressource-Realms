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
let currentPlayerIdx = 0;

export function createResourceUI() {
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.style.position = 'absolute';
  resUI.style.zIndex = '10';
  document.body.appendChild(resUI);
}

// Update the UI to show the resources of the given player
export function updateResourceUI(player, idx) {
  if (typeof idx === 'number') currentPlayerIdx = idx;
  currentPlayer = player;
  if (!resUI || !player) {
    console.log('[UI] Kein resUI oder player:', resUI, player);
    return;
  }
  console.log('[UI] updateResourceUI für', player.name, player.resources);
  resUI.innerHTML = resources.map(r => `
    <span style="display:inline-flex;align-items:center;gap:0.3em;min-width:3.5em;">
      <span style="font-size:1.5em;">${r.symbol}</span>
      <span style="color:${r.color};font-weight:bold;min-width:1.2em;text-align:right;">${player.resources[r.key]}</span>
    </span>
  `).join('');
}

// Debug/cheat: allow adding resources to the current player
export function handleResourceKeydown(e) {
  if (typeof currentPlayerIdx !== 'number') return;
  const player = window.players ? window.players[currentPlayerIdx] : currentPlayer;
  if (!player) return;
  if (e.key === '1') player.resources.wheat++;
  if (e.key === '2') player.resources.sheep++;
  if (e.key === '3') player.resources.wood++;
  if (e.key === '4') player.resources.clay++;
  if (e.key === '5') player.resources.ore++;
  updateResourceUI(player, currentPlayerIdx);
}

export { resources };
