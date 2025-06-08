// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx }) {
  const ui = document.createElement('div');
  ui.id = 'build-ui';
  ui.style.position = 'absolute';
  ui.style.bottom = '2em';
  ui.style.left = '50%';
  ui.style.transform = 'translateX(-50%)';
  ui.style.background = 'rgba(255,255,255,0.95)';
  ui.style.borderRadius = '10px';
  ui.style.padding = '10px 24px';
  ui.style.boxShadow = '0 2px 8px #0002';
  ui.style.display = 'flex';
  ui.style.gap = '1.5em';
  ui.style.fontFamily = "'Montserrat', Arial, sans-serif";
  ui.style.fontSize = '1.2em';
  ui.style.alignItems = 'center';
  ui.style.zIndex = '20';
  ui.innerHTML = `
    <button id="build-settlement">Siedlung bauen</button>
    <button id="build-city">Stadt bauen</button>
    <button id="build-road">Straße bauen</button>
    <span>Aktiver Spieler: <select id="player-select"></select></span>
    <span id="build-feedback" style="color:#d7263d;margin-left:1em;min-width:7em;min-height:1.5em;display:inline-block;vertical-align:middle;"></span>
  `;
  document.body.appendChild(ui);
  document.getElementById('build-settlement').onclick = () => setBuildMode('settlement');
  document.getElementById('build-city').onclick = () => setBuildMode('city');
  document.getElementById('build-road').onclick = () => setBuildMode('road');
  const sel = document.getElementById('player-select');
  players.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = getActivePlayerIdx();
  sel.onchange = e => setActivePlayerIdx(parseInt(e.target.value));
}
