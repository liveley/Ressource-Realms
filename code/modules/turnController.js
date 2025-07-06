// turnController.js
// Zentrale Steuerung für den Ablauf eines Spielerzugs (Phasen, aktiver Spieler, Debug-Modus)

export const TURN_PHASES = {
  DICE: 'dice',
  TRADE: 'trade',
  BUILD: 'build',
  END: 'end',
};

export let currentPhase = TURN_PHASES.DICE;
export let debugFreeBuild = false; // Kann von außen auf true gesetzt werden

export function setDebugFreeBuild(val) {
  debugFreeBuild = !!val;
}

// Statt eigener Variable: immer window.activePlayerIdx verwenden
export function getActivePlayerIdx() {
  return window.activePlayerIdx ?? 0;
}
export function setActivePlayerIdx(idx) {
  window.activePlayerIdx = idx;
  triggerPlayerSwitch();
}

// --- Callback-Mechanismus für UI-Updates ---
let phaseChangeCallbacks = [];
let playerSwitchCallbacks = [];

export function onPhaseChange(cb) {
  if (typeof cb === 'function') phaseChangeCallbacks.push(cb);
}
export function onPlayerSwitch(cb) {
  if (typeof cb === 'function') playerSwitchCallbacks.push(cb);
}

function triggerPhaseChange() {
  console.log(`Phase changed to: ${currentPhase}`);
  for (const cb of phaseChangeCallbacks) cb(currentPhase);
}
function triggerPlayerSwitch() {
  const activePlayer = window.players?.[getActivePlayerIdx()];
  console.log(`Player switched to: ${activePlayer?.name || 'Unknown'} (Index: ${getActivePlayerIdx()})`);
  for (const cb of playerSwitchCallbacks) cb(getActivePlayerIdx());
}

export function getCurrentPhase() {
  return currentPhase;
}

export function setPhase(phase) {
  currentPhase = phase;
  triggerPhaseChange();
}

export function nextPhase() {
  if (currentPhase === TURN_PHASES.DICE) {
    setPhase(TURN_PHASES.TRADE); // Nach Würfeln erstmal zu TRADE
  } else if (currentPhase === TURN_PHASES.TRADE) {
    setPhase(TURN_PHASES.BUILD); // Von TRADE zu BUILD
  } else if (currentPhase === TURN_PHASES.BUILD) {
    setPhase(TURN_PHASES.TRADE); // Von BUILD zurück zu TRADE (flexibles Wechseln)
  } else if (currentPhase === TURN_PHASES.END) {
    // Automatisch zum nächsten Spieler wechseln
    nextPlayer();
  }
}

export function nextPlayer() {
  window.activePlayerIdx = ((window.activePlayerIdx ?? 0) + 1) % (window.players?.length || 1);
  setPhase(TURN_PHASES.DICE);
  triggerPlayerSwitch();
  triggerPhaseChange(); // <--- Phase-Callback nach Spielerwechsel
}

// --- Zentrale Funktion: Nach Würfeln Phase auf TRADE setzen ---
export function rollDiceAndAdvancePhase(rollDiceFn) {
  if (currentPhase !== TURN_PHASES.DICE) return;
  if (typeof rollDiceFn === 'function') rollDiceFn();
  setPhase(TURN_PHASES.TRADE); // Nach Würfeln zur TRADE-Phase
}

// Hilfsfunktion: Ist Aktion erlaubt?
export function isActionAllowed(phase) {
  if (debugFreeBuild) return true;
  return currentPhase === phase;
}

// --- Neue Funktionen für bessere Turn-Based-Kontrolle ---

// Prüft, ob der aktuelle Spieler würfeln darf
export function canRollDice() {
  return currentPhase === TURN_PHASES.DICE;
}

// Prüft, ob der aktuelle Spieler handeln darf
export function canTrade() {
  return currentPhase === TURN_PHASES.TRADE || currentPhase === TURN_PHASES.BUILD;
}

// Prüft, ob der aktuelle Spieler bauen darf
export function canBuild() {
  return currentPhase === TURN_PHASES.BUILD || debugFreeBuild;
}

// Beendet den aktuellen Zug und wechselt zum nächsten Spieler
export function endTurn() {
  console.log(`Turn ended for player ${getActivePlayerIdx()}`);
  nextPlayer();
}

// Setzt das Spiel in die Anfangsphase zurück
export function resetToStart() {
  setPhase(TURN_PHASES.DICE);
  window.activePlayerIdx = 0;
  triggerPlayerSwitch();
  triggerPhaseChange();
}

// --- ActionBar-UI nach jedem Spieler- und Phasenwechsel updaten ---
// Diese Funktion wird von main.js registriert, nachdem updateActionBarUI definiert wurde
export function setupActionBarUpdates() {
  onPhaseChange((phase) => {
    if (typeof window.updateActionBarUI === 'function') {
      window.updateActionBarUI();
    }
  });
  
  onPlayerSwitch((playerIdx) => {
    if (typeof window.updateActionBarUI === 'function') {
      window.updateActionBarUI();
    }
  });
}
