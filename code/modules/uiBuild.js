// === UI: Build-Menü (Bauen) ===
// Build-UI Modul für Resource Realms
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
    buildToggleBtn.textContent = '\ud83c\udfd7\ufe0f';
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
  // Menü leicht nach rechts/unten verschieben, damit es den Button komplett überdeckt
  buildMenu.style.right = '-0.15em';
  buildMenu.style.bottom = '-0.15em';
  // Exakt gewünschte Breite und Höhe laut User-Devtools
  buildMenu.style.width = 'calc(3 * clamp(2.1em, 2.8vw, 2.5em))';
  // Erhöhe das Menü, damit alle Buttons sichtbar sind (z.B. für 5 Buttons)
  buildMenu.style.height = 'calc(4.8 * clamp(2.1em, 2.8vw, 2.5em))';
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
    btn.style.height = '19%'; // 5 Buttons passen mit gap exakt in 100%
    btn.style.minHeight = '1.5em';
    btn.style.maxHeight = '2.5em';
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


  buildMenu.appendChild(makeMenuBtn('build-road', 'Straße', () => setBuildMode('road')));
  buildMenu.appendChild(makeMenuBtn('build-settlement', 'Siedlung', () => setBuildMode('settlement')));
  buildMenu.appendChild(makeMenuBtn('build-city', 'Stadt', () => setBuildMode('city')));

  // Baukosten-Button
  const costBtn = makeMenuBtn('build-costs', 'Baukosten', () => {
    showBuildCostsPopup();
  });
  // Füge den Button unter "Stadt" und über "bauen aus" ein
  buildMenu.appendChild(costBtn);

  // "Bauen aus" schließt das Menü (nicht mehr setBuildMode(null), sondern Menü schließen)
  buildMenu.appendChild(makeMenuBtn('build-cancel', 'bauen aus', () => {
    buildEnabled = false;
    buildToggleBtn.textContent = '\ud83c\udfd7\ufe0f';
    buildMenu.style.display = 'none';
    ui.classList.remove('menu-open');
  }));

  // Baukosten-Popup (einmalig anlegen)
  if (!document.getElementById('build-costs-popup')) {
    const popup = document.createElement('div');
    popup.id = 'build-costs-popup';
    popup.style.position = 'fixed';
    popup.style.left = '50%';
    popup.style.top = '50%';
    popup.style.transform = 'translate(-50%, -50%)';
    popup.style.background = 'rgba(255,255,255,0.98)';
    popup.style.border = '2px solid #ffe066';
    popup.style.borderRadius = '0.7em';
    popup.style.boxShadow = '0 6px 32px #0004, 0 1.5px 0 #ffe066';
    popup.style.padding = '2em 2.5em 1.5em 2.5em';
    popup.style.zIndex = '99999';
    popup.style.display = 'none';
    popup.style.minWidth = '320px';
    popup.style.maxWidth = '90vw';
    popup.style.fontFamily = "'Montserrat', Arial, sans-serif";
    popup.innerHTML = `
      <div style="font-size:1.3em;font-weight:bold;margin-bottom:1em;text-align:center;">Baukosten Übersicht</div>
      <table style="width:100%;border-collapse:collapse;font-size:1.1em;">
        <tr><th style='text-align:left;'>Bau</th><th>Ressourcen</th></tr>
        <tr><td>Straße</td><td>🪵 Holz, 🧱 Lehm</td></tr>
        <tr><td>Siedlung</td><td>🪵 Holz, 🧱 Lehm, 🌾 Weizen, 🐑 Schaf</td></tr>
        <tr><td>Stadt</td><td>🌾 Weizen x2, 🪨 Erz x3</td></tr>
        <tr><td>Entwicklungskarte</td><td>🌾 Weizen, 🐑 Schaf, 🪨 Erz</td></tr>
      </table>
      <button id="close-costs-popup" style="margin-top:1.5em;padding:0.5em 1.5em;font-size:1em;border-radius:0.4em;border:none;background:#ffe066;font-weight:bold;cursor:pointer;">Schließen</button>
    `;
    document.body.appendChild(popup);
    // Close-Button Handler
    popup.querySelector('#close-costs-popup').onclick = () => {
      popup.style.display = 'none';
    };
  }

  // Funktion zum Anzeigen des Popups
  function showBuildCostsPopup() {
    const popup = document.getElementById('build-costs-popup');
    if (popup) popup.style.display = 'block';
  }

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
