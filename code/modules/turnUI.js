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
  turnUI.style.display = 'flex';
  turnUI.style.flexDirection = 'column';
  turnUI.style.alignItems = 'center';
  turnUI.style.gap = '0.5em';
  turnUI.style.background = 'rgba(255,255,255,0.95)';
  turnUI.style.border = '2px solid #ddd';
  turnUI.style.borderRadius = '8px';
  turnUI.style.padding = '1em';
  turnUI.style.fontFamily = "'Montserrat', Arial, sans-serif";
  turnUI.style.fontSize = '1em';
  turnUI.style.boxShadow = '0 4px 12px rgba(0,0,0,0.1)';

  // Phasen-Anzeige
  phaseIndicator = document.createElement('div');
  phaseIndicator.id = 'phase-indicator';
  phaseIndicator.style.fontWeight = 'bold';
  phaseIndicator.style.fontSize = '1.1em';
  phaseIndicator.style.color = '#333';
  phaseIndicator.style.textAlign = 'center';
  turnUI.appendChild(phaseIndicator);

  // Spieler-Anzeige
  playerIndicator = document.createElement('div');
  playerIndicator.id = 'player-indicator';
  playerIndicator.style.fontSize = '1em';
  playerIndicator.style.color = '#555';
  playerIndicator.style.textAlign = 'center';
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
  nextPhaseBtn.style.padding = '0.5em 1em';
  nextPhaseBtn.style.borderRadius = '4px';
  nextPhaseBtn.style.border = 'none';
  nextPhaseBtn.style.background = '#4CAF50';
  nextPhaseBtn.style.color = 'white';
  nextPhaseBtn.style.cursor = 'pointer';
  nextPhaseBtn.style.fontSize = '0.9em';
  nextPhaseBtn.onclick = () => {
    nextPhase();
  };
  buttonContainer.appendChild(nextPhaseBtn);

  // Zug beenden Button
  endTurnBtn = document.createElement('button');
  endTurnBtn.id = 'end-turn-btn';
  endTurnBtn.textContent = 'Zug beenden';
  endTurnBtn.style.padding = '0.5em 1em';
  endTurnBtn.style.borderRadius = '4px';
  endTurnBtn.style.border = 'none';
  endTurnBtn.style.background = '#f44336';
  endTurnBtn.style.color = 'white';
  endTurnBtn.style.cursor = 'pointer';
  endTurnBtn.style.fontSize = '0.9em';
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
    playerIndicator.style.color = activePlayer?.color ? `#${activePlayer.color.toString(16)}` : '#555';
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
      [TURN_PHASES.DICE]: 'Zu Handeln', // Nach Würfeln kann man handeln
      [TURN_PHASES.TRADE]: 'Zu Bauen',  // Nach Handeln kann man bauen
      [TURN_PHASES.BUILD]: 'Zu Handeln' // Nach Bauen kann man wieder handeln
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

/**
 * Zeigt eine Phasen-Benachrichtigung an
 * @param {string} message - Die Nachricht, die angezeigt werden soll
 * @param {string} color - Die Farbe der Benachrichtigung (optional)
 */
export function showPhaseNotification(message, color = '#2196F3') {
  const notification = document.createElement('div');
  notification.style.position = 'fixed';
  notification.style.top = '20%';
  notification.style.left = '50%';
  notification.style.transform = 'translateX(-50%)';
  notification.style.background = color;
  notification.style.color = 'white';
  notification.style.padding = '1em 2em';
  notification.style.borderRadius = '8px';
  notification.style.fontSize = '1.2em';
  notification.style.fontWeight = 'bold';
  notification.style.zIndex = '10000';
  notification.style.boxShadow = '0 4px 12px rgba(0,0,0,0.3)';
  notification.style.fontFamily = "'Montserrat', Arial, sans-serif";
  notification.textContent = message;

  document.body.appendChild(notification);

  // Animation: Einblenden
  notification.style.opacity = '0';
  notification.style.transition = 'opacity 0.3s ease';
  setTimeout(() => {
    notification.style.opacity = '1';
  }, 10);

  // Nach 3 Sekunden ausblenden
  setTimeout(() => {
    notification.style.opacity = '0';
    setTimeout(() => {
      if (notification.parentNode) {
        notification.parentNode.removeChild(notification);
      }
    }, 300);
  }, 3000);
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
