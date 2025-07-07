// turnController.js
// Zentrale Steuerung für den Ablauf eines Spielerzugs (Phasen, aktiver Spieler, Debug-Modus)
// Single Source of Truth für alle Spieler- und Phasenverwaltung

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

// === SINGLE SOURCE OF TRUTH: Aktiver Spieler ===
// Statt eigener Variable: immer window.activePlayerIdx verwenden
export function getActivePlayerIdx() {
  return window.activePlayerIdx ?? 0;
}

// Validierung und Race-Condition-Schutz
let isSettingPlayer = false; // Flag gegen Race Conditions

export function setActivePlayerIdx(idx) {
  // Validierung: Prüfe ob idx gültig ist
  const playerCount = window.players?.length || 0;
  if (playerCount === 0) {
    console.warn('setActivePlayerIdx: Keine Spieler vorhanden');
    return false;
  }
  
  if (typeof idx !== 'number' || idx < 0 || idx >= playerCount) {
    console.warn(`setActivePlayerIdx: Ungültiger Index ${idx}. Erlaubt: 0-${playerCount-1}`);
    return false;
  }
  
  // Race-Condition-Schutz
  if (isSettingPlayer) {
    console.warn('setActivePlayerIdx: Bereits dabei, Spieler zu setzen. Verhindere Race Condition.');
    return false;
  }
  
  isSettingPlayer = true;
  window.activePlayerIdx = idx;
  triggerPlayerSwitch();
  isSettingPlayer = false;
  
  return true;
}

// === CALLBACK-MECHANISMUS für UI-Updates ===
let phaseChangeCallbacks = [];
let playerSwitchCallbacks = [];

export function onPhaseChange(cb) {
  if (typeof cb === 'function') phaseChangeCallbacks.push(cb);
}

export function onPlayerSwitch(cb) {
  if (typeof cb === 'function') playerSwitchCallbacks.push(cb);
}

// Callback-Cleanup-Funktionen (für Memory-Leak-Vermeidung)
export function removePhaseChangeCallback(cb) {
  const index = phaseChangeCallbacks.indexOf(cb);
  if (index > -1) {
    phaseChangeCallbacks.splice(index, 1);
  }
}

export function removePlayerSwitchCallback(cb) {
  const index = playerSwitchCallbacks.indexOf(cb);
  if (index > -1) {
    playerSwitchCallbacks.splice(index, 1);
  }
}

function triggerPhaseChange() {
  console.log(`Phase changed to: ${currentPhase}`);
  for (const cb of phaseChangeCallbacks) {
    try {
      cb(currentPhase);
    } catch (error) {
      console.error('Error in phase change callback:', error);
    }
  }
}

function triggerPlayerSwitch() {
  const activePlayer = window.players?.[getActivePlayerIdx()];
  console.log(`Player switched to: ${activePlayer?.name || 'Unknown'} (Index: ${getActivePlayerIdx()})`);
  for (const cb of playerSwitchCallbacks) {
    try {
      cb(getActivePlayerIdx());
    } catch (error) {
      console.error('Error in player switch callback:', error);
    }
  }
}

// === PHASEN-MANAGEMENT ===
export function getCurrentPhase() {
  return currentPhase;
}

export function setPhase(phase) {
  if (!Object.values(TURN_PHASES).includes(phase)) {
    console.warn(`setPhase: Ungültige Phase ${phase}`);
    return false;
  }
  currentPhase = phase;
  triggerPhaseChange();
  return true;
}

export function nextPhase() {
  switch (currentPhase) {
    case TURN_PHASES.DICE:
      return setPhase(TURN_PHASES.TRADE); // Nach Würfeln erstmal zu TRADE
    case TURN_PHASES.TRADE:
      return setPhase(TURN_PHASES.BUILD); // Von TRADE zu BUILD
    case TURN_PHASES.BUILD:
      return setPhase(TURN_PHASES.TRADE); // Von BUILD zurück zu TRADE (flexibles Wechseln)
    case TURN_PHASES.END:
      // END-Phase wird durch endTurn() nicht mehr erreicht, aber für Vollständigkeit
      return nextPlayer(); // Automatisch zum nächsten Spieler wechseln
    default:
      console.warn(`nextPhase: Unbekannte Phase ${currentPhase}`);
      return false;
  }
}

export function nextPlayer() {
  const playerCount = window.players?.length || 0;
  
  // Validierung: Prüfe ob Spieler vorhanden sind
  if (playerCount === 0) {
    console.error('nextPlayer: Keine Spieler vorhanden');
    return false;
  }
  
  // Sichere Berechnung des nächsten Spielers
  const currentIdx = getActivePlayerIdx();
  const nextIdx = (currentIdx + 1) % playerCount;
  
  // Verwende die sichere setActivePlayerIdx Funktion
  const success = setActivePlayerIdx(nextIdx);
  if (success) {
    setPhase(TURN_PHASES.DICE);
  }
  
  return success;
}

// === ZENTRALE FUNKTION: Nach Würfeln Phase auf TRADE setzen ===
export function rollDiceAndAdvancePhase(rollDiceFn) {
  if (currentPhase !== TURN_PHASES.DICE) {
    console.warn('rollDiceAndAdvancePhase: Nicht in Würfelphase');
    return false;
  }
  
  if (typeof rollDiceFn === 'function') {
    try {
      rollDiceFn();
    } catch (error) {
      console.error('Error in dice roll function:', error);
      return false;
    }
  }
  
  return setPhase(TURN_PHASES.TRADE); // Nach Würfeln zur TRADE-Phase
}

// === AKTIONS-VALIDIERUNG ===
export function isActionAllowed(phase) {
  if (debugFreeBuild) return true;
  return currentPhase === phase;
}

// === HILFSFUNKTIONEN für bessere Turn-Based-Kontrolle ===
export function isValidPlayerIndex(idx) {
  const playerCount = window.players?.length || 0;
  return typeof idx === 'number' && idx >= 0 && idx < playerCount && playerCount > 0;
}

export function getPlayerCount() {
  return window.players?.length || 0;
}

export function canRollDice() {
  return currentPhase === TURN_PHASES.DICE || debugFreeBuild;
}

export function canTrade() {
  return currentPhase === TURN_PHASES.TRADE || currentPhase === TURN_PHASES.BUILD || debugFreeBuild;
}

export function canBuild() {
  return currentPhase === TURN_PHASES.BUILD || debugFreeBuild;
}

export function endTurn() {
  console.log(`Turn ended for player ${getActivePlayerIdx()}`);
  // Direkt zum nächsten Spieler wechseln, statt nur Phase zu setzen
  return nextPlayer();
}

export function resetToStart() {
  console.log('Resetting game to start');
  const success = setActivePlayerIdx(0);
  if (success) {
    return setPhase(TURN_PHASES.DICE);
  }
  return false;
}

// === SICHERHEITS-FUNKTIONEN ===
export function validateGameState() {
  const playerCount = getPlayerCount();
  const activeIdx = getActivePlayerIdx();
  
  if (playerCount === 0) {
    console.error('validateGameState: Keine Spieler vorhanden');
    return false;
  }
  
  if (!isValidPlayerIndex(activeIdx)) {
    console.error(`validateGameState: Ungültiger aktiver Spieler-Index ${activeIdx}`);
    return false;
  }
  
  if (!Object.values(TURN_PHASES).includes(currentPhase)) {
    console.error(`validateGameState: Ungültige Phase ${currentPhase}`);
    return false;
  }
  
  return true;
}

// === INITIALIZATION ===
export function initializeTurnController() {
  // Sichere Initialisierung von window.activePlayerIdx
  if (typeof window.activePlayerIdx !== 'number') {
    window.activePlayerIdx = 0;
  }
  
  // Validiere Initialisierung
  if (!validateGameState()) {
    console.warn('initializeTurnController: Game state validation failed');
    return false;
  }
  
  console.log('Turn Controller initialized successfully');
  return true;
}

// === ACTIONBAR-UI Integration ===
export function setupActionBarUpdates() {
  onPhaseChange((phase) => {
    if (typeof window.updateActionBarUI === 'function') {
      try {
        window.updateActionBarUI();
      } catch (error) {
        console.error('Error updating action bar UI:', error);
      }
    }
  });
  
  onPlayerSwitch((playerIdx) => {
    if (typeof window.updateActionBarUI === 'function') {
      try {
        window.updateActionBarUI();
      } catch (error) {
        console.error('Error updating action bar UI:', error);
      }
    }
  });
}

// === CLEANUP ===
export function cleanupTurnController() {
  phaseChangeCallbacks = [];
  playerSwitchCallbacks = [];
  isSettingPlayer = false;
  console.log('Turn Controller cleanup complete');
}
