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
let bankUI = null;

export function createResourceUI() {
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.style.position = 'static';
  resUI.style.zIndex = '5';

  // --- Bank UI ---
  bankUI = document.createElement('div');
  bankUI.id = 'bank-ui';
  bankUI.style.position = 'static';
  bankUI.style.zIndex = '5';
  bankUI.style.background = 'rgba(255,255,255,0.92)';
  bankUI.style.borderRadius = '0.5em';
  bankUI.style.padding = '0.4em 1.2em 0.4em 0.8em';
  bankUI.style.marginTop = '0.5em';
  bankUI.style.fontSize = '1.1em';
  bankUI.style.boxShadow = '0 2px 8px #0002';
  bankUI.style.fontFamily = 'Montserrat, Arial, sans-serif';
  bankUI.style.display = 'flex';
  bankUI.style.gap = '1.2em';
  bankUI.style.alignItems = 'center';
  bankUI.innerHTML = '';

  // Container for both UIs
  const container = document.createElement('div');
  container.id = 'resource-bank-container';
  container.style.position = 'absolute';
  container.style.top = '0.5em';
  container.style.right = '0.5em';
  container.style.left = '';
  container.style.zIndex = '5';
  container.style.display = 'flex';
  container.style.flexDirection = 'column';
  container.style.alignItems = 'flex-end';
  container.appendChild(resUI);
  container.appendChild(bankUI);
  document.body.appendChild(container);
}

function updateBankUI() {
  if (!bankUI || !window.bank) return;
  bankUI.innerHTML =
    '<span style="font-weight:bold;color:#222;margin-right:0.7em;">Bank:</span>' +
    resources.map(r => `
      <span style="display:inline-flex;align-items:center;gap:0.3em;min-width:3.5em;">
        <span style="font-size:1.5em;">${r.symbol}</span>
        <span style="color:${r.color};font-weight:bold;min-width:1.2em;text-align:right;">${window.bank[r.key] ?? 0}</span>
      </span>
    `).join('');
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
  updateBankUI();
}

// Debug/cheat: allow adding resources to the current player
export function handleResourceKeydown(e) {
  // Nutze window.activePlayerIdx für den aktuellen Spieler
  const idx = (typeof window.activePlayerIdx === 'number' && window.players && window.players.length > window.activePlayerIdx)
    ? window.activePlayerIdx : 0;
  const player = window.players ? window.players[idx] : null;
  if (!player) return;
  let changed = false;
  // Ressourcen hinzufügen (1-5)
  if (e.key === '1' && !e.shiftKey && window.bank && window.bank.wheat > 0) {
    player.resources.wheat++;
    window.bank.wheat--;
    changed = true;
  }
  if (e.key === '2' && !e.shiftKey && window.bank && window.bank.sheep > 0) {
    player.resources.sheep++;
    window.bank.sheep--;
    changed = true;
  }
  if (e.key === '3' && !e.shiftKey && window.bank && window.bank.wood > 0) {
    player.resources.wood++;
    window.bank.wood--;
    changed = true;
  }
  if (e.key === '4' && !e.shiftKey && window.bank && window.bank.clay > 0) {
    player.resources.clay++;
    window.bank.clay--;
    changed = true;
  }
  if (e.key === '5' && !e.shiftKey && window.bank && window.bank.ore > 0) {
    player.resources.ore++;
    window.bank.ore--;
    changed = true;
  }
  // Ressourcen zurückgeben (Shift+1 bis Shift+5)
  if (e.key === '1' && e.shiftKey && player.resources.wheat > 0) {
    player.resources.wheat--;
    if (window.bank) window.bank.wheat++;
    changed = true;
  }
  if (e.key === '2' && e.shiftKey && player.resources.sheep > 0) {
    player.resources.sheep--;
    if (window.bank) window.bank.sheep++;
    changed = true;
  }
  if (e.key === '3' && e.shiftKey && player.resources.wood > 0) {
    player.resources.wood--;
    if (window.bank) window.bank.wood++;
    changed = true;
  }
  if (e.key === '4' && e.shiftKey && player.resources.clay > 0) {
    player.resources.clay--;
    if (window.bank) window.bank.clay++;
    changed = true;
  }
  if (e.key === '5' && e.shiftKey && player.resources.ore > 0) {
    player.resources.ore--;
    if (window.bank) window.bank.ore++;
    changed = true;
  }
  if (changed) {
    updateResourceUI(player, idx);
    updateBankUI();
    // Optional: Log für Debug
    // console.log(`Ressourcen für Spieler ${idx + 1} (${player.name}) aktualisiert:`, player.resources);
    // console.log('Bank:', window.bank);
  }
}

export { resources };
