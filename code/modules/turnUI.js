// turnUI.js
// Turn-Based UI für das Catan-Spiel
// Zeigt die aktuelle Phase und den aktiven Spieler an

import { 
  TURN_PHASES, 
  getCurrentPhase, 
  getActivePlayerIdx, 
  nextPhase, 
  endTurn, 
  canRollDice, 
  canTrade, 
  canBuild,
  onPhaseChange,
  onPlayerSwitch
} from './turnController.js';

let turnUI = null;
let phaseIndicator = null;
let playerIndicator = null;
let nextPhaseBtn = null;
let endTurnBtn = null;

/**
 * Erstellt die Turn-Based-UI
 * @param {HTMLElement} parent - Parent-Element für die UI
 */
export function createTurnUI(parent) {
  // Prüfe, ob die UI bereits existiert
  if (turnUI) return turnUI;

  turnUI = document.createElement('div');
  turnUI.id = 'turn-ui';
  
  // Phasen-Anzeige
  phaseIndicator = document.createElement('div');
  phaseIndicator.id = 'phase-indicator';
  turnUI.appendChild(phaseIndicator);

  // Spieler-Anzeige
  playerIndicator = document.createElement('div');
  playerIndicator.id = 'player-indicator';
  turnUI.appendChild(playerIndicator);

  // Button-Container
  const buttonContainer = document.createElement('div');
  buttonContainer.style.display = 'flex';
  buttonContainer.style.gap = '0.5em';
  buttonContainer.style.marginTop = '0.5em';

  // Nächste Phase Button
  nextPhaseBtn = document.createElement('button');
  nextPhaseBtn.id = 'next-phase-btn';
  nextPhaseBtn.textContent = 'Nächste Phase';
  nextPhaseBtn.onclick = () => {
    nextPhase();
  };
  buttonContainer.appendChild(nextPhaseBtn);

  // Zug beenden Button
  endTurnBtn = document.createElement('button');
  endTurnBtn.id = 'end-turn-btn';
  endTurnBtn.textContent = 'Zug beenden';
  endTurnBtn.onclick = () => {
    endTurn();
  };
  buttonContainer.appendChild(endTurnBtn);

  turnUI.appendChild(buttonContainer);

  // UI zum Parent hinzufügen
  if (parent) {
    parent.appendChild(turnUI);
  } else {
    document.body.appendChild(turnUI);
  }

  // Event-Listener für Updates
  onPhaseChange(updateTurnUI);
  onPlayerSwitch(updateTurnUI);

  // Initiale UI-Aktualisierung
  updateTurnUI();

  return turnUI;
}

/**
 * Aktualisiert die Turn-UI basierend auf der aktuellen Phase und dem aktiven Spieler
 */
function updateTurnUI() {
  if (!turnUI) return;

  const currentPhase = getCurrentPhase();
  const activePlayerIdx = getActivePlayerIdx();
  const activePlayer = window.players?.[activePlayerIdx];

  // Phase-Anzeige aktualisieren
  const phaseTexts = {
    [TURN_PHASES.DICE]: '🎲 Würfeln',
    [TURN_PHASES.TRADE]: '💰 Handeln',
    [TURN_PHASES.BUILD]: '🏗️ Bauen',
    [TURN_PHASES.END]: '🏁 Zug beenden'
  };

  if (phaseIndicator) {
    phaseIndicator.textContent = `Phase: ${phaseTexts[currentPhase] || currentPhase}`;
  }

  // Spieler-Anzeige aktualisieren
  if (playerIndicator) {
    const playerName = activePlayer?.name || `Spieler ${activePlayerIdx + 1}`;
    playerIndicator.textContent = `Aktueller Spieler: ${playerName}`;
    // Spieler-Farbe setzen wenn vorhanden
    if (activePlayer?.color) {
      playerIndicator.style.color = `#${activePlayer.color.toString(16)}`;
    } else {
      playerIndicator.style.color = '#555'; // Fallback-Farbe
    }
  }

  // Button-Zustände aktualisieren
  updateButtonStates();
}

/**
 * Aktualisiert die Button-Zustände basierend auf der aktuellen Phase
 */
function updateButtonStates() {
  if (!nextPhaseBtn || !endTurnBtn) return;

  const currentPhase = getCurrentPhase();

  // Nächste Phase Button - nur anzeigen wenn nicht in END-Phase
  if (currentPhase === TURN_PHASES.END) {
    nextPhaseBtn.style.display = 'none';
  } else {
    nextPhaseBtn.style.display = 'inline-block';
    
    // Button-Text basierend auf aktueller Phase
    const nextPhaseTexts = {
      [TURN_PHASES.DICE]: 'Zu Handeln',    // Nach Würfeln kann man handeln
      [TURN_PHASES.TRADE]: 'Zu Bauen',     // Nach Handeln kann man bauen
      [TURN_PHASES.BUILD]: 'Zu Handeln'    // Nach Bauen kann man wieder handeln
    };
    
    nextPhaseBtn.textContent = nextPhaseTexts[currentPhase] || 'Nächste Phase';
  }

  // Zug beenden Button - immer verfügbar außer in DICE-Phase
  if (currentPhase === TURN_PHASES.DICE) {
    endTurnBtn.style.display = 'none'; // Nicht anzeigen in DICE-Phase
  } else {
    endTurnBtn.style.display = 'inline-block';
    endTurnBtn.textContent = currentPhase === TURN_PHASES.END ? 'Nächster Spieler' : 'Zug beenden';
  }
}

// Notification-System - nur eine Notification gleichzeitig
let currentNotification = null;

/**
 * Zeigt eine Phasen-Benachrichtigung an
 * @param {string} message - Die Nachricht, die angezeigt werden soll
 * @param {string} color - Die Farbe der Benachrichtigung (optional)
 * @param {number} duration - Anzeigedauer in Millisekunden (optional)
 */
export function showPhaseNotification(message, color = '#2196F3', duration = 3000) {
  // Vorherige Notification entfernen
  if (currentNotification) {
    clearNotification();
  }

  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20%';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.background = color;
  notification.style.color = 'white';
  notification.style.padding = '1em 2em';
  notification.style.borderRadius = '12px';
  notification.style.fontSize = '1.2em';
  notification.style.fontWeight = 'bold';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 6px 20px rgba(0,0,0,0.3)';
  notification.style.fontFamily = "'Montserrat', Arial, sans-serif";
  notification.style.textAlign = 'center';
  notification.style.minWidth = '200px';
  notification.style.border = '2px solid rgba(255,255,255,0.3)';
  notification.textContent = message;

  currentNotification = notification;
  document.body.appendChild(notification);

  // Animation: Einblenden mit leichter Bewegung
  notification.style.opacity = '0';
  notification.style.transform = 'translateX(-50%) translateY(-20px)';
  notification.style.transition = 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)';
  
  setTimeout(() => {
    notification.style.opacity = '1';
    notification.style.transform = 'translateX(-50%) translateY(0)';
  }, 10);

  // Nach angegebener Zeit ausblenden
  setTimeout(() => {
    if (currentNotification === notification) {
      clearNotification();
    }
  }, duration);
}

/**
 * Entfernt die aktuelle Notification
 */
function clearNotification() {
  if (currentNotification) {
    currentNotification.style.opacity = '0';
    currentNotification.style.transform = 'translateX(-50%) translateY(-20px)';
    
    setTimeout(() => {
      if (currentNotification && currentNotification.parentNode) {
        currentNotification.parentNode.removeChild(currentNotification);
      }
      currentNotification = null;
    }, 300);
  }
}

/**
 * Zeigt eine intelligente Benachrichtigung basierend auf Phase und Spieler
 * @param {string} phase - Die aktuelle Phase
 * @param {number} playerIdx - Der aktive Spieler Index
 */
export function showTurnNotification(phase, playerIdx) {
  const player = window.players?.[playerIdx];
  const playerName = player?.name || `Spieler ${playerIdx + 1}`;
  
  const phaseMessages = {
    [TURN_PHASES.DICE]: `🎲 ${playerName} würfelt!`,
    [TURN_PHASES.TRADE]: `💰 ${playerName} kann handeln`,
    [TURN_PHASES.BUILD]: `🏗️ ${playerName} kann bauen`,
    [TURN_PHASES.END]: `🏁 ${playerName} beendet den Zug`
  };

  const phaseColors = {
    [TURN_PHASES.DICE]: '#FF9800',    // Orange für Würfeln
    [TURN_PHASES.TRADE]: '#4CAF50',   // Grün für Handeln
    [TURN_PHASES.BUILD]: '#2196F3',   // Blau für Bauen
    [TURN_PHASES.END]: '#9C27B0'      // Lila für Zug beenden
  };

  const message = phaseMessages[phase] || `${playerName} ist dran!`;
  const color = phaseColors[phase] || '#2196F3';

  showPhaseNotification(message, color, 2500);
}

/**
 * Entfernt die Turn-UI
 */
export function removeTurnUI() {
  if (turnUI && turnUI.parentNode) {
    turnUI.parentNode.removeChild(turnUI);
    turnUI = null;
    phaseIndicator = null;
    playerIndicator = null;
    nextPhaseBtn = null;
    endTurnBtn = null;
  }
}

// Export für globale Verwendung
export { updateTurnUI };
