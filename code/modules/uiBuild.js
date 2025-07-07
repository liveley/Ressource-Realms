// === UI: Build-Menü (Bauen) ===
// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

import { showPlayerSwitchButton } from './change_player.js';

let buildEnabled = false;
let buildMenu = null;

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx, parent }) {
  // Bau-Button (immer sichtbar)
  const buildToggleBtn = document.createElement('button');
  buildToggleBtn.id = 'build-toggle-btn';
  buildToggleBtn.textContent = '🏗️';
  buildToggleBtn.style.fontSize = '2.5em';
  buildToggleBtn.style.padding = '0.4em';
  buildToggleBtn.style.margin = '0';
  buildToggleBtn.style.cursor = 'pointer';
  buildToggleBtn.style.borderRadius = '6px';
  // Noch etwas kleiner
  buildToggleBtn.style.width = 'clamp(2.1em, 2.8vw, 2.5em)';
  buildToggleBtn.style.height = 'clamp(2.1em, 2.8vw, 2.5em)';
  buildToggleBtn.style.aspectRatio = '1 / 1';
  buildToggleBtn.onclick = () => {
    buildEnabled = !buildEnabled;
    console.log('Build-UI: buildEnabled =', buildEnabled);
    buildToggleBtn.textContent = buildEnabled ? '\ud83c\udfd7\ufe0f AUS' : '\ud83c\udfd7\ufe0f';
    if (buildMenu) buildMenu.style.display = buildEnabled ? 'flex' : 'none';
    // Hintergrund und Rand nur anzeigen, wenn Menü offen ist
    if (buildEnabled) {
      ui.classList.add('menu-open');
      console.log('Build-UI: Menü geöffnet');
    } else {
      ui.classList.remove('menu-open');
      console.log('Build-UI: Menü geschlossen');
    }
  };

  // Build-UI Container
  const ui = document.createElement('div');
  ui.id = 'build-ui';
  ui.style.display = 'flex';
  ui.style.flexDirection = 'column';
  ui.style.alignItems = 'center';
  ui.style.justifyContent = 'flex-end';
  ui.style.padding = '0';
  ui.style.boxSizing = 'border-box';
  ui.style.position = 'relative';
  // Positionierung direkt im JS:
  ui.style.marginLeft = '1.2em';

  ui.appendChild(buildToggleBtn);

  // Das eigentliche Baumenü (Buttons für Straße, Siedlung, Stadt, Bauen aus)
  buildMenu = document.createElement('div');
  buildMenu.id = 'build-menu';
  buildMenu.style.display = 'none'; // Anfangs ausgeblendet
  buildMenu.style.flexDirection = 'column';
  buildMenu.style.justifyContent = 'space-between';
  buildMenu.style.alignItems = 'stretch';
  buildMenu.style.gap = '0.3em';
  buildMenu.style.position = 'absolute';
  // Menü an rechter unterer Ecke des Buttons verankern
  buildMenu.style.right = '0';
  buildMenu.style.bottom = '0';
  // Exakt gewünschte Breite und Höhe laut User-Devtools
  buildMenu.style.width = 'calc(3 * clamp(2.1em, 2.8vw, 2.5em))';
  buildMenu.style.height = 'calc(3 * clamp(2.1em, 2.8vw, 2.5em))';
  buildMenu.style.background = 'rgba(255,255,255,0.98)';
  buildMenu.style.border = '2px solid #ffe066';
  buildMenu.style.borderRadius = '0.5em';
  buildMenu.style.boxShadow = '0 4px 24px #0003, 0 1.5px 0 #ffe066';
  buildMenu.style.padding = '0.4em 0.3em';
  buildMenu.style.overflow = 'hidden';

  // Helper für kompakte, längliche Menü-Buttons
  function makeMenuBtn(id, text, onClick) {
    const btn = document.createElement('button');
    btn.id = id;
    btn.textContent = text;
    btn.style.width = '100%';
    btn.style.height = '22%'; // 4 Buttons passen mit gap exakt in 100%
    btn.style.minHeight = '1.5em';
    btn.style.maxHeight = '2.2em';
    btn.style.fontSize = '1em';
    btn.style.fontFamily = 'inherit';
    btn.style.fontWeight = '600';
    btn.style.borderRadius = '0.35em';
    btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
    btn.style.border = 'none';
    btn.style.boxShadow = '0 1px 4px #0001';
    btn.style.margin = '0';
    btn.style.padding = '0.2em 0.5em';
    btn.style.cursor = 'pointer';
    btn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s';
    btn.style.display = 'block';
    btn.onclick = onClick;
    btn.onmouseover = () => { btn.style.background = 'linear-gradient(90deg, #ffe066 80%, #fffbe6 100%)'; };
    btn.onmouseout = () => { btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)'; };
    return btn;
  }

  buildMenu.appendChild(makeMenuBtn('build-road', 'Straße bauen', () => setBuildMode('road')));
  buildMenu.appendChild(makeMenuBtn('build-settlement', 'Siedlung bauen', () => setBuildMode('settlement')));
  buildMenu.appendChild(makeMenuBtn('build-city', 'Stadt bauen', () => setBuildMode('city')));
  buildMenu.appendChild(makeMenuBtn('build-cancel', 'Bauen aus', () => setBuildMode(null)));

  ui.appendChild(buildMenu); // Menü bleibt erhalten

  // In gewünschtes Parent-Element einfügen
  if (parent) {
    parent.appendChild(ui);
  } else {
    document.body.appendChild(ui);
  }

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

  // Debugging logs for layout issues
  console.log('Build-Menu: Position and size adjusted for consistent spacing.');
}

export function isBuildEnabled() {
  // Prüfe, ob das Build-Menü offen ist (über die Klasse am UI-Element)
  const ui = document.getElementById('build-ui');
  return !!(ui && ui.classList.contains('menu-open'));
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
