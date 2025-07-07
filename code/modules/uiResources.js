// modules/uiResources.js
// Ressourcen-UI für Catan 3D mit Gain Counter

import { doBankTrade, canBankTrade } from './bankTrade.js';
import { createBankTradeUI } from './bankTradeUI.js';
import { getActivePlayerIdx } from './turnController.js';

const resources = [
  { key: 'wheat', symbol: '🌾', name: 'Weizen', color: '#ffe066' },
  { key: 'sheep', symbol: '🐑', name: 'Schaf', color: '#8fd19e' },
  { key: 'wood', symbol: '🌲', name: 'Holz', color: '#deb887' },
  { key: 'clay', symbol: '🧱', name: 'Lehm', color: '#e07a5f' },
  { key: 'ore', symbol: '🪙', name: 'Erz', color: '#ffd700' }
];

let resUI = null;
let bankUI = null;
let gainTrackers = {}; // Speichert die letzten Gewinne für jeden Spieler

export function createResourceUI() {
  // Spieler UI
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.className = 'resource-box';
  
  // Bank UI
  bankUI = document.createElement('div');
  bankUI.id = 'bank-ui';
  bankUI.className = 'resource-box';
  
  // Container for both UIs
  const container = document.createElement('div');
  container.id = 'resource-bank-container';
  container.appendChild(resUI);
  container.appendChild(bankUI);
  // Banktausch-UI modularisiert
  container.appendChild(createBankTradeUI());
  document.body.appendChild(container);
}

function updateBankUI() {
  if (!bankUI || !window.bank) return;
  
  const bankItems = resources.map(r => `
    <div class="resource-item">
      <div class="resource-content">
        <span class="resource-icon">${r.symbol}</span>
        <span class="resource-count" style="color:${r.color}">${window.bank[r.key] ?? 0}</span>
      </div>
    </div>
  `).join('');
  
  bankUI.innerHTML = `
    <div class="resource-header">
      <span class="resource-label">Bank:</span>
      <div class="resource-items">
        ${bankItems}
      </div>
    </div>
  `;
}

// Update the UI to show the resources of the given player
export function updateResourceUI(player, idx) {
  // Hole IMMER das aktuelle Spielerobjekt aus window.players, falls idx übergeben
  if (typeof idx === 'number' && window.players) {
    player = window.players[idx];
    // Initialisiere gainTrackers für diesen Spieler falls noch nicht vorhanden
    if (!gainTrackers[idx]) {
      gainTrackers[idx] = {};
      resources.forEach(r => gainTrackers[idx][r.key] = 0);
    }
  } else if (window.players) {
    // ✅ Verwende Turn-Controller statt direkten window.activePlayerIdx Zugriff
    const activeIdx = getActivePlayerIdx();
    player = window.players[activeIdx];
    idx = activeIdx;
    if (!gainTrackers[idx]) {
      gainTrackers[idx] = {};
      resources.forEach(r => gainTrackers[idx][r.key] = 0);
    }
  }
  
  if (!resUI || !player) {
    return;
  }

  // Erstelle Ressourcen mit Gain Counters
  const resourceItems = resources.map(r => {
    const gainValue = gainTrackers[idx] && gainTrackers[idx][r.key] > 0 ? gainTrackers[idx][r.key] : 0;
    return `
      <div class="resource-item">
        <div class="resource-content">
          <span class="resource-icon">${r.symbol}</span>
          <span class="resource-count" style="color:${r.color}">${player.resources[r.key]}</span>
        </div>
        <div class="resource-gain">
          ${gainValue > 0 ? `
            <span class="gain-plus">+</span>
            <span class="gain-number">${gainValue}</span>
          ` : ''}
        </div>
      </div>
    `;
  }).join('');

  resUI.innerHTML = `
    <div class="resource-header">
      <span class="resource-label">${player.name || 'Spieler ' + ((idx ?? 0) + 1)}</span>
      <div class="resource-items">
        ${resourceItems}
      </div>
    </div>
  `;
  
  updateBankUI();
}

// Reset gain counters when dice are rolled (before new distribution)
window.addEventListener('diceRolled', (e) => {
  // Reset alle Gain Tracker vor der neuen Verteilung
  Object.keys(gainTrackers).forEach(playerIdx => {
    resources.forEach(r => {
      gainTrackers[playerIdx][r.key] = 0;
    });
  });
});

// Track resource gains when distributed
window.trackResourceGain = function(playerIdx, resourceType, amount) {
  if (!gainTrackers[playerIdx]) {
    gainTrackers[playerIdx] = {};
    resources.forEach(r => gainTrackers[playerIdx][r.key] = 0);
  }
  gainTrackers[playerIdx][resourceType] = (gainTrackers[playerIdx][resourceType] || 0) + amount;
  console.log(`[Gain Tracker] Spieler ${playerIdx + 1} erhält +${amount} ${resourceType}`);
};

// Debug/cheat: allow adding resources to the current player
export function handleResourceKeydown(e) {
  // ✅ Verwende Turn-Controller statt direkten window.activePlayerIdx Zugriff
  const idx = getActivePlayerIdx();
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
  }
}

export { resources };