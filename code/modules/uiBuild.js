// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

let buildEnabled = false;
let buildMenu = null;

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx }) {
  const ui = document.createElement('div');
  ui.id = 'build-ui';

  // Bau-Button
  const buildToggleBtn = document.createElement('button');
  buildToggleBtn.id = 'build-toggle-btn';
  buildToggleBtn.textContent = 'Bauen: AN';
  buildToggleBtn.onclick = () => {
    buildEnabled = !buildEnabled;
    buildToggleBtn.textContent = buildEnabled ? 'Bauen: AN' : 'Bauen: AUS';
    if (buildMenu) buildMenu.style.display = buildEnabled ? '' : 'none';
  };
  ui.appendChild(buildToggleBtn);

  // Das eigentliche Baumenü (Buttons für Siedlung, Stadt, Straße, Spielerwahl, Feedback)
  buildMenu = document.createElement('div');
  buildMenu.id = 'build-menu';
  buildMenu.style.display = 'none'; // Anfangs ausgeblendet
  buildMenu.innerHTML = `
    <button id="build-settlement">Siedlung bauen</button>
    <button id="build-city">Stadt bauen</button>
    <button id="build-road">Straße bauen</button>
    <span><select id="player-select"></select></span>
    <!-- build-feedback entfernt, Pop-up ist jetzt global -->
  `;
  ui.appendChild(buildMenu);
  document.body.appendChild(ui);

  // Pop-up-Feedback-Element global anlegen, falls nicht vorhanden
  if (!document.getElementById('build-popup-feedback')) {
    const popup = document.createElement('div');
    popup.id = 'build-popup-feedback';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '12%';
    popup.style.transform = 'translateX(-50%)';
    popup.style.minWidth = '200px';
    popup.style.padding = '1em 2em';
    popup.style.borderRadius = '12px';
    popup.style.fontSize = '1.3em';
    popup.style.fontFamily = "'Montserrat', Arial, sans-serif";
    popup.style.textAlign = 'center';
    popup.style.zIndex = '1000';
    popup.style.display = 'none';
    document.body.appendChild(popup);
  }
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

export function isBuildEnabled() {
  return buildEnabled;
}

// Pop-up Feedback-Funktion
export function showBuildPopupFeedback(message, success = true) {
  const popup = document.getElementById('build-popup-feedback');
  if (!popup) return;
  popup.textContent = message;
  popup.style.display = 'block';
  popup.style.background = success ? '#8fd19e' : '#ffe066';
  popup.style.color = success ? '#222' : '#d7263d';
  popup.style.boxShadow = '0 2px 12px #0006';
  popup.style.opacity = '1';
  popup.style.transition = 'opacity 0.3s';
  clearTimeout(window._buildPopupTimeout);
  window._buildPopupTimeout = setTimeout(() => {
    popup.style.opacity = '0';
    setTimeout(() => { popup.style.display = 'none'; }, 350);
  }, success ? 1200 : 2200);
}
