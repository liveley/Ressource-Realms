// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx }) {
  const ui = document.createElement('div');
  ui.id = 'build-ui';
  ui.innerHTML = `
    <button id="build-settlement">Siedlung bauen</button>
    <button id="build-city">Stadt bauen</button>
    <button id="build-road">Straße bauen</button>
    <span>Aktiver Spieler: <select id="player-select"></select></span>
    <span id="build-feedback"></span>
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
