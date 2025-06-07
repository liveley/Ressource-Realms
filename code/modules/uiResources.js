// modules/uiResources.js
// Ressourcen-UI für Catan 3D

const resources = [
  { key: 'wheat', symbol: '🌾', name: 'Weizen', color: '#ffe066' },
  { key: 'sheep', symbol: '🐑', name: 'Schaf', color: '#8fd19e' },
  { key: 'wood', symbol: '🌲', name: 'Holz', color: '#deb887' },
  { key: 'clay', symbol: '🧱', name: 'Lehm', color: '#e07a5f' },
  { key: 'ore', symbol: '🪙', name: 'Erz', color: '#ffd700' }
];

const playerRessources = { wheat: 0, sheep: 0, wood: 0, clay: 0, ore: 0 };
let resUI = null;

export function createResourceUI() {
  resUI = document.createElement('div');
  resUI.id = 'ressource-ui';
  resUI.style.position = 'absolute';
  resUI.style.top = '2em';
  resUI.style.right = '2em';
  resUI.style.zIndex = '10';
  resUI.style.background = 'rgba(255,255,255,0.92)';
  resUI.style.borderRadius = '10px';
  resUI.style.padding = '12px 18px';
  resUI.style.boxShadow = '0 2px 8px #0002';
  resUI.style.display = 'flex';
  resUI.style.gap = '1.5em';
  resUI.style.fontFamily = "'Montserrat', Arial, sans-serif";
  resUI.style.fontSize = '1.5em';
  resUI.style.alignItems = 'center';
  document.body.appendChild(resUI);
  updateResourceUI();
}

export function updateResourceUI() {
  if (!resUI) return;
  resUI.innerHTML = resources.map(r => `
    <span style="display:inline-flex;align-items:center;gap:0.3em;min-width:3.5em;">
      <span style="font-size:1.5em;">${r.symbol}</span>
      <span style="color:${r.color};font-weight:bold;min-width:1.2em;text-align:right;">${playerRessources[r.key]}</span>
    </span>
  `).join('');
}

export function handleResourceKeydown(e) {
  if (e.key === '1') playerRessources.wheat++;
  if (e.key === '2') playerRessources.sheep++;
  if (e.key === '3') playerRessources.wood++;
  if (e.key === '4') playerRessources.clay++;
  if (e.key === '5') playerRessources.ore++;
  updateResourceUI();
}

export { playerRessources, resources };
