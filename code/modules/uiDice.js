// modules/uiDice.js
// Würfel-UI für Catan 3D

import { canRollDice, rollDiceAndAdvancePhase, onPhaseChange } from './turnController.js';

let diceUI = null;
let diceResult = null;
let diceBtn = null;
let diceBar = null;

// ✅ State-Machine für Button-Kontrolle
let blockReasons = new Set(); // Sammelt alle Gründe für Blockierung
let originalClickHandler = null; // Einmalige Speicherung des ursprünglichen Handlers

// callback: Funktion, die beim Klick auf "Würfeln" ausgeführt wird
export function createDiceUI(onRoll, parent) {
  diceUI = document.createElement('div');
  diceUI.id = 'dice-ui';
  diceUI.style.display = 'flex';
  diceUI.style.flexDirection = 'column';
  diceUI.style.alignItems = 'center';
  // Kein position: absolute mehr!

  diceUI.innerHTML = `
    <button id="roll-dice" style="
      font-size: 2.5em;
      padding: 0.4em;
      margin-bottom: 0.5em;
      cursor: pointer;
      border-radius: 6px;
      aspect-ratio: auto;
    ">🎲</button>
    <div id="dice-result" style="color: #fff; font-size: 2em; min-width: 2em; min-height: 1.5em; text-shadow: 0 2px 8px #000; font-family: 'Montserrat', Arial, sans-serif; display: inline-block; margin-left: 1em; vertical-align: middle;"></div>
  `;

  // ZUERST ins DOM einfügen, dann erst getElementById!
  if (parent) {
    parent.appendChild(diceUI);
  } else {
    document.body.appendChild(diceUI);
  }

  diceBtn = document.getElementById('roll-dice');
  diceResult = document.getElementById('dice-result');

  if (!diceBtn) {
    console.error('Würfeln-Button konnte nicht gefunden werden!');
    return;
  }

  diceBtn.onclick = () => {
    // Prüfe, ob Würfeln erlaubt ist
    if (!canRollDice()) {
      console.log('Würfeln nicht erlaubt in aktueller Phase');
      return;
    }
    
    if (typeof onRoll === 'function') {
      // Verwende die Turn-Controller-Logik
      rollDiceAndAdvancePhase(onRoll);
    }
  };

  // ✅ Speichere ursprünglichen Handler einmalig
  originalClickHandler = diceBtn.onclick;

  // Event-Listener für Phasen-Updates
  onPhaseChange((phase) => {
    updateDiceButtonState();
  });

  // Initial button state aktualisieren
  updateDiceButtonState();
}

export function setDiceResult(sum) {
  if (diceResult) {
    diceResult.textContent = sum;
    diceResult.style.color = '#fff';
  }
}

/**
 * ✅ Neue State-Machine für Button-Kontrolle
 * Sammelt alle Blockierungsgründe und entscheidet zentral über Button-Zustand
 */
function updateDiceButtonState() {
  if (!diceBtn) return;
  
  const canRoll = canRollDice();
  const isBlocked = blockReasons.size > 0;
  
  // Zentrale Entscheidungslogik: Button nur enabled wenn beide true
  const shouldEnable = canRoll && !isBlocked;
  
  if (shouldEnable) {
    // Button aktivieren
    diceBtn.style.opacity = "1";
    diceBtn.style.cursor = "pointer";
    diceBtn.disabled = false;
    diceBtn.onclick = originalClickHandler;
    diceBtn.title = "Würfeln";
  } else {
    // Button deaktivieren
    diceBtn.style.opacity = "0.5";
    diceBtn.style.cursor = "not-allowed";
    diceBtn.disabled = true;
    diceBtn.onclick = () => {}; // Empty handler
    
    // Priorisierte Tooltip-Logik
    if (!canRoll) {
      diceBtn.title = "Nicht in der Würfelphase";
    } else if (isBlocked) {
      const reasons = Array.from(blockReasons).join(', ');
      diceBtn.title = `Würfeln blockiert: ${reasons}`;
    }
  }
}

/**
 * ✅ Verbesserte Block-Funktion mit State-Machine
 * @param {string} reason - Der Grund für die Blockierung
 */
export function blockDiceRolls(reason = "Aktion erforderlich") {
  if (!diceBtn) return;
  
  // Füge Grund zur Set hinzu (automatisch dedupliziert)
  blockReasons.add(reason);
  console.log(`Dice blocked: ${reason}. Active blocks:`, Array.from(blockReasons));
  
  // Aktualisiere Button-Zustand über zentrale Logik
  updateDiceButtonState();
}

/**
 * ✅ Verbesserte Unblock-Funktion mit State-Machine
 * @param {string} reason - Der spezifische Grund der entfernt werden soll
 */
export function unblockDiceRolls(reason = null) {
  if (!diceBtn) return;
  
  if (reason) {
    // Entferne spezifischen Grund
    blockReasons.delete(reason);
    console.log(`Dice unblocked: ${reason}. Remaining blocks:`, Array.from(blockReasons));
  } else {
    // Entferne alle Gründe (Backwards-Kompatibilität)
    blockReasons.clear();
    console.log('Dice unblocked: All reasons cleared');
  }
  
  // Aktualisiere Button-Zustand über zentrale Logik
  updateDiceButtonState();
}

/**
 * ✅ Hilfsfunktion: Prüft ob Button blockiert ist
 * @returns {boolean} - True wenn blockiert
 */
export function isDiceBlocked() {
  return blockReasons.size > 0;
}

/**
 * ✅ Hilfsfunktion: Gibt alle aktiven Blockierungsgründe zurück
 * @returns {string[]} - Array der aktiven Gründe
 */
export function getBlockReasons() {
  return Array.from(blockReasons);
}
