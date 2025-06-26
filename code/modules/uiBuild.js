// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

import { showPlayerSwitchButton } from './change_player.js';

let buildEnabled = false;
let buildMenu = null;

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx }) {
  // Build-UI (wie bisher)
  const ui = document.createElement('div');
  ui.id = 'build-ui';

  // Bau-Button (immer sichtbar)
  const buildToggleBtn = document.createElement('button');
  buildToggleBtn.id = 'build-toggle-btn';
  buildToggleBtn.textContent = '🏗️';
  buildToggleBtn.style.fontSize = '2.5em'; // Emoji so groß wie beim Würfeln-Button
  buildToggleBtn.onclick = () => {
    buildEnabled = !buildEnabled;
    buildToggleBtn.textContent = buildEnabled ? '🏗️ AUS' : '🏗️';
    if (buildMenu) buildMenu.style.display = buildEnabled ? 'flex' : 'none';
    // Hintergrund und Rand nur anzeigen, wenn Menü offen ist
    if (buildEnabled) {
      ui.classList.add('menu-open');
    } else {
      ui.classList.remove('menu-open');
    }
  };
  ui.appendChild(buildToggleBtn);

  // Das eigentliche Baumenü (Buttons für Spielerwahl, Straße, Siedlung, Stadt)
  buildMenu = document.createElement('div');
  buildMenu.id = 'build-menu';
  buildMenu.style.display = 'none'; // Anfangs ausgeblendet
  buildMenu.style.flexDirection = 'column';
  buildMenu.style.gap = '0.5em';
  buildMenu.style.marginTop = '0.7em';
  buildMenu.style.alignItems = 'stretch';
  buildMenu.style.bottom = '2em'; // Abstand zum unteren Rand
  buildMenu.style.right = '6em'; // Abstand zum rechten Rand

  // Straße bauen
  const roadBtn = document.createElement('button');
  roadBtn.id = 'build-road';
  roadBtn.textContent = 'Straße bauen';
  roadBtn.onclick = () => setBuildMode('road');
  buildMenu.appendChild(roadBtn);

  // Siedlung bauen
  const settlementBtn = document.createElement('button');
  settlementBtn.id = 'build-settlement';
  settlementBtn.textContent = 'Siedlung bauen';
  settlementBtn.onclick = () => setBuildMode('settlement');
  buildMenu.appendChild(settlementBtn);

  // Stadt bauen
  const cityBtn = document.createElement('button');
  cityBtn.id = 'build-city';
  cityBtn.textContent = 'Stadt bauen';
  cityBtn.onclick = () => setBuildMode('city');
  buildMenu.appendChild(cityBtn);

  // Build-UI direkt an body anhängen
  document.body.appendChild(ui);
  ui.appendChild(buildMenu);

  // Spielerwechsel-Button wird nicht mehr im Build-Menü platziert

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
    popup.style.zIndex = '5'; // niedriger als das Main-Menü
    popup.style.display = 'none';
    document.body.appendChild(popup);
  }
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
