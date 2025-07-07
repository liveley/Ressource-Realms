// Build-UI Modul für Siedler von Catan
// Erstellt und verwaltet die Build-UI (Siedlung/Stadt bauen, Spielerwahl, Feedback)
// Übergibt buildMode- und activePlayerIdx-Setter als Callback-Parameter

import { showPlayerSwitchButton } from './change_player.js';
import { canBuild, onPhaseChange } from './turnController.js';

// Statt globale Variablen: Pro Instanz speichern
const buildInstances = new Map();

export function createBuildUI({ players, getBuildMode, setBuildMode, getActivePlayerIdx, setActivePlayerIdx, parent }) {
  // Build-UI (wie bisher)
  const ui = document.createElement('div');
  ui.id = 'build-ui';
  ui.style.display = 'flex';
  ui.style.flexDirection = 'column';
  ui.style.alignItems = 'center';
  // Keine absolute Positionierung mehr!

  // Instanz-spezifische Variablen
  let buildEnabled = false;
  let buildMenu = null;
  let phaseChangeListener = null;

  // Instanz in Map speichern für Cleanup
  const instanceId = 'build-ui-' + Date.now();
  buildInstances.set(instanceId, {
    ui,
    cleanup: () => {
      if (phaseChangeListener) {
        // TODO: Wenn turnController removePhaseChange-Funktion hat, hier verwenden
        console.log('Build-UI: Cleanup für Instanz', instanceId);
      }
    }
  });

  // Bau-Button (immer sichtbar)
  const buildToggleBtn = document.createElement('button');
  buildToggleBtn.id = 'build-toggle-btn';
  buildToggleBtn.textContent = '🏗️';
  buildToggleBtn.style.fontSize = '2.5em'; // Emoji so groß wie beim Würfeln-Button
  buildToggleBtn.onclick = () => {
    // Prüfe, ob Bauen erlaubt ist
    if (!canBuild()) {
      showBuildPopupFeedback('Bauen nicht in aktueller Phase erlaubt!', false);
      return;
    }
    
    buildEnabled = !buildEnabled;
    console.log('Build-UI: buildEnabled =', buildEnabled);
    updateBuildMenuState();
  };

  // Funktion zum synchronisierten Update des Menü-States
  function updateBuildMenuState() {
    buildToggleBtn.textContent = buildEnabled ? '🏗️ AUS' : '🏗️';
    if (buildMenu) buildMenu.style.display = buildEnabled ? 'flex' : 'none';
    // Hintergrund und Rand nur anzeigen, wenn Menü offen ist
    if (buildEnabled) {
      ui.classList.add('menu-open');
      console.log('Build-UI: Menü geöffnet');
    } else {
      ui.classList.remove('menu-open');
      console.log('Build-UI: Menü geschlossen');
    }
  }

  // Verbesserte updateBuildButtonState Funktion
  function updateBuildButtonState() {
    if (!buildToggleBtn) return;
    
    const canBuildNow = canBuild();
    
    if (canBuildNow) {
      buildToggleBtn.style.opacity = "1";
      buildToggleBtn.style.cursor = "pointer";
      buildToggleBtn.disabled = false;
      buildToggleBtn.title = "Bauen";
    } else {
      buildToggleBtn.style.opacity = "0.5";
      buildToggleBtn.style.cursor = "not-allowed";
      buildToggleBtn.disabled = true;
      buildToggleBtn.title = "Nicht in der Bauphase";
      
      // ✅ FIX: Build State Reset bei Phasenwechsel
      if (buildEnabled) {
        buildEnabled = false;
        updateBuildMenuState(); // Synchronisiertes Update
        console.log('Build-UI: Menü automatisch geschlossen (Phase nicht erlaubt)');
      }
    }
  }

  // Event-Listener für Phasen-Updates
  phaseChangeListener = (phase) => {
    updateBuildButtonState();
  };
  onPhaseChange(phaseChangeListener);

  // Initial button state aktualisieren
  updateBuildButtonState();
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

  ui.appendChild(buildMenu);

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

  // ✅ Return UI mit Cleanup-Funktion
  return {
    ui,
    cleanup: () => {
      buildInstances.delete(instanceId);
      if (phaseChangeListener) {
        console.log('Build-UI: Event-Listener cleanup für Instanz', instanceId);
      }
    },
    // Getter für buildEnabled (für isBuildEnabled)
    isBuildEnabled: () => buildEnabled && canBuild()
  };
}

// ✅ Neue isBuildEnabled für Backwards-Kompatibilität
export function isBuildEnabled() {
  // Prüfe, ob das Build-Menü offen ist (über die Klasse am UI-Element)
  const ui = document.getElementById('build-ui');
  return !!(ui && ui.classList.contains('menu-open')) && canBuild();
}

// ✅ Cleanup-Funktion für alle Instanzen
export function cleanupAllBuildInstances() {
  for (const [id, instance] of buildInstances) {
    instance.cleanup();
  }
  buildInstances.clear();
}

/**
 * ✅ Entfernt: Ist jetzt eine lokale Funktion in createBuildUI
 * Die alte globale updateBuildButtonState-Funktion wird nicht mehr benötigt
 */

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
