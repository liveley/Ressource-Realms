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

export function createResourceUI() {
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.style.position = 'absolute';
  resUI.style.zIndex = '5';
  document.body.appendChild(resUI);
}

// Update the UI to show the resources of the given player
export function updateResourceUI(player, idx) {
  // Hole IMMER das aktuelle Spielerobjekt aus window.players, falls idx übergeben
  if (typeof idx === 'number' && window.players) {
    player = window.players[idx];
  } else if (typeof window.activePlayerIdx === 'number' && window.players) {
    player = window.players[window.activePlayerIdx];
  }
  if (!resUI || !player) {
    return;
  }
  resUI.innerHTML = resources.map(r => `
    <span style="display:inline-flex;align-items:center;gap:0.3em;min-width:3.5em;">
      <span style="font-size:1.5em;">${r.symbol}</span>
      <span style="color:${r.color};font-weight:bold;min-width:1.2em;text-align:right;">${player.resources[r.key]}</span>
    </span>
  `).join('');
}

// Debug/cheat: allow adding resources to the current player
export function handleResourceKeydown(e) {
  // Nutze window.activePlayerIdx für den aktuellen Spieler
  const idx = (typeof window.activePlayerIdx === 'number' && window.players && window.players.length > window.activePlayerIdx)
    ? window.activePlayerIdx : 0;
  const player = window.players ? window.players[idx] : null;
  if (!player) return;
  let changed = false;
  if (e.key === '1') { player.resources.wheat++; changed = true; }
  if (e.key === '2') { player.resources.sheep++; changed = true; }
  if (e.key === '3') { player.resources.wood++; changed = true; }
  if (e.key === '4') { player.resources.clay++; changed = true; }
  if (e.key === '5') { player.resources.ore++; changed = true; }
  if (changed) {
    updateResourceUI(player, idx);
    // Optional: Log für Debug
    // console.log(`Ressourcen für Spieler ${idx + 1} (${player.name}) aktualisiert:`, player.resources);
  }
}

export { resources };
