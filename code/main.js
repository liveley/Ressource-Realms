import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './modules/scene.js';
import { camera } from './modules/camera.js';
import { setupLights } from './modules/lights.js';
import { createHexGrid } from './modules/hexGrid.js'; 
import { createDirectionArrows } from './modules/directionArrows.js'; 
import { createGameBoard, addNumberTokensToTiles, updateNumberTokensFacingCamera, updateNumberTokensForRobber } from './modules/game_board.js';
import { animateHalos, highlightNumberTokens, getTileWorldPosition } from './modules/tileHighlight.js'; 
import { rollDice, showDice, throwPhysicsDice, updateDicePhysics } from './modules/dice.js';
import { tileInfo } from './modules/tileInfo.js';
import { createPlaceholderCards } from './modules/placeholderCards.js';
import { createResourceUI, updateResourceUI, handleResourceKeydown } from './modules/uiResources.js';
import { createDiceUI, setDiceResult, blockDiceRolls, unblockDiceRolls } from './modules/uiDice.js';
import { initTileInfoOverlay } from './modules/uiTileInfo.js';
import { initializeRobber, showBanditOnTile, hideBandit, startRobberPlacement, handleTileSelection, isInRobberPlacementMode, getTileCenter } from './modules/bandit.js';
import { players, tryBuildSettlement, tryBuildCity, tryBuildRoad, initializeInitialPlacement, getGamePhaseInfo, getCurrentPlayerPlacementInfo, undoLastInitialPlacement, getInitialPlacementUIState, getPlacementWarning } from './modules/buildLogic.js';
import { getCornerWorldPosition } from './modules/tileHighlight.js';
import { setupBuildPreview } from './modules/uiBuildPreview.js';
import CardManager from './modules/cards.js';
import { createPlayerOverviews, updatePlayerOverviews } from './modules/ui_player_overview.js';
import { placePlayerSwitchButton } from './modules/change_player.js';
import { createBuildUI, showBuildPopupFeedback } from './modules/uiBuild.js';
import { setupBuildEventHandler } from './modules/buildEventHandlers.js';
import { showDebugMessage } from './modules/debugging/debugTools.js';
import { createDebugDiceIndicator, toggleDebugDiceMode } from './modules/debugging/diceDebug.js';
import { createDevelopmentCardsUI } from './modules/developmentCardsUI.js';
import { createDevelopmentDeck, initPlayerDevCards } from './modules/developmentCards.js';

import { createMainMenuSidebar } from './modules/uiMainMenu.js';

import { createSettingsMenu } from './modules/uiSettingsMenu.js';
import { initializeVictoryPoints, updateAllVictoryPoints, getVictoryPointsForDisplay, calculateLongestRoad } from './modules/victoryPoints.js';
import { renderPorts, updatePortLabels, highlightPlayerPorts, getPlayerTradeRates } from './modules/portSystem.js';
import { showPortTradeUI, hidePortTradeUI, togglePortTradeUI } from './modules/portTradeUI.js';
import { enableRoadDebug, disableRoadDebug, analyzePlayerRoads, testRoadConnections, toggleRoadDebugTools, isRoadDebugToolsVisible } from './modules/debugging/longestRoadDebug.js';
import { initRoadTestingUtils } from './modules/debugging/roadTestingUtils.js';
import { initDebugKeyHandlers } from './modules/debugging/debugKeyHandlers.js';
import { initDebugControls } from './modules/debugging/debugControls.js';
import { initVictoryPointsTestingUtils } from './modules/debugging/victoryPointsTestingUtils.js';


window.players = window.players || [
  {
    name: 'Spieler 1',
    color: 0xd7263d,
    settlements: [],
    cities: [],
    roads: [],
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 },
    knightsPlayed: 0,
    longestRoadLength: 0
  },
  {
    name: 'Spieler 2',
    color: 0x277da1,
    settlements: [],
    cities: [],
    roads: [],
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 },
    knightsPlayed: 0,
    longestRoadLength: 0
  }
];

// Initialize victory points system
initializeVictoryPoints(window.players);

// Initialize initial placement phase
initializeInitialPlacement(window.players);

// Make victory points functions available globally
window.updateAllVictoryPoints = updateAllVictoryPoints;
window.initializeVictoryPoints = initializeVictoryPoints;
window.getVictoryPointsForDisplay = getVictoryPointsForDisplay;

// Make game phase functions available globally
window.getGamePhaseInfo = getGamePhaseInfo;
window.getCurrentPlayerPlacementInfo = getCurrentPlayerPlacementInfo;
window.undoLastInitialPlacement = undoLastInitialPlacement;
window.getInitialPlacementUIState = getInitialPlacementUIState;

window.updateResourceUI = updateResourceUI;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Global game state
let gameInitialized = false;
let tileMeshes = {};
let tileNumbers = {};
let buildMode = 'settlement';
let activePlayerIdx = 0;
window.activePlayerIdx = activePlayerIdx;

// Hide the renderer initially
renderer.domElement.style.visibility = 'hidden';
renderer.domElement.classList.add('board-hidden');

// === UI: Game Status Display ===
let gameStatusDisplay = document.getElementById('game-status-display');
if (!gameStatusDisplay) {
  gameStatusDisplay = document.createElement('div');
  gameStatusDisplay.id = 'game-status-display';
  gameStatusDisplay.style.cssText = `
    position: fixed;
    bottom: 20px;
    left: 20px;
    background: linear-gradient(135deg, rgba(0, 0, 0, 0.9), rgba(30, 30, 30, 0.9));
    color: white;
    padding: 15px;
    border-radius: 10px;
    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
    font-size: 14px;
    z-index: 1000;
    max-width: 280px;
    min-width: 260px;
    box-shadow: 0 4px 20px rgba(0, 0, 0, 0.4);
    border: 1px solid rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);
    transition: all 0.3s ease;
  `;
  document.body.appendChild(gameStatusDisplay);
}

function updateGameStatusDisplay() {
  const phaseInfo = getGamePhaseInfo();
  const currentPlayerInfo = getCurrentPlayerPlacementInfo(activePlayerIdx);
  
  let html = `<div style="display: flex; align-items: center; margin-bottom: 8px;">`;
  html += `<div style="width: 8px; height: 8px; background: ${phaseInfo.phase === 'Startaufstellung' ? '#4CAF50' : '#2196F3'}; border-radius: 50%; margin-right: 8px;"></div>`;
  html += `<strong style="color: #fff; font-size: 16px;">${phaseInfo.phase}</strong>`;
  html += `</div>`;
  html += `<div style="color: #ccc; font-size: 13px; margin-bottom: 12px;">${phaseInfo.description}</div>`;
  
  if (currentPlayerInfo) {
    const playerColor = window.players && window.players[activePlayerIdx] ? 
      `#${window.players[activePlayerIdx].color.toString(16).padStart(6, '0')}` : '#fff';
    
    html += `<div style="background: rgba(255, 255, 255, 0.05); padding: 12px; border-radius: 8px; border-left: 3px solid ${playerColor};">`;
    html += `<div style="color: ${playerColor}; font-weight: bold; margin-bottom: 8px;">Spieler ${activePlayerIdx + 1}</div>`;
    
    // Progress bars for remaining pieces
    const settlementProgress = ((2 - currentPlayerInfo.settlements) / 2) * 100;
    const roadProgress = ((2 - currentPlayerInfo.roads) / 2) * 100;
    
    html += `<div style="margin-bottom: 6px;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">`;
    html += `<span style="color: #ddd; font-size: 12px;">🏠 Siedlungen</span>`;
    html += `<span style="color: #fff; font-weight: bold;">${currentPlayerInfo.settlements}</span>`;
    html += `</div>`;
    html += `<div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; overflow: hidden;">`;
    html += `<div style="background: #4CAF50; height: 100%; width: ${settlementProgress}%; transition: width 0.3s;"></div>`;
    html += `</div>`;
    html += `</div>`;
    
    html += `<div style="margin-bottom: 12px;">`;
    html += `<div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 2px;">`;
    html += `<span style="color: #ddd; font-size: 12px;">🛤️ Straßen</span>`;
    html += `<span style="color: #fff; font-weight: bold;">${currentPlayerInfo.roads}</span>`;
    html += `</div>`;
    html += `<div style="background: rgba(255,255,255,0.2); height: 4px; border-radius: 2px; overflow: hidden;">`;
    html += `<div style="background: #FF9800; height: 100%; width: ${roadProgress}%; transition: width 0.3s;"></div>`;
    html += `</div>`;
    html += `</div>`;
    
    // Add undo button if available
    if (currentPlayerInfo.canUndo) {
      const lastAction = currentPlayerInfo.lastAction;
      const actionName = lastAction ? 
        (lastAction.type === 'settlements' ? 'Siedlung' : 'Straße') : 
        'letzte Aktion';
      
      html += `<button onclick="performUndo()" style="
        width: 100%;
        background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
        color: white;
        border: none;
        padding: 8px 12px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 12px;
        font-weight: 500;
        transition: all 0.2s;
        box-shadow: 0 2px 8px rgba(255, 107, 107, 0.3);
      " onmouseover="this.style.transform='translateY(-1px)'; this.style.boxShadow='0 4px 12px rgba(255, 107, 107, 0.4)'" 
         onmouseout="this.style.transform='translateY(0)'; this.style.boxShadow='0 2px 8px rgba(255, 107, 107, 0.3)'">`;
      html += `🔄 ${actionName} rückgängig`;
      html += `</button>`;
    }
    
    html += `</div>`;
  }
  
  gameStatusDisplay.innerHTML = html;
}

// === Centralized Player Switch Function ===
// This function ensures all UI components are properly synchronized when switching players
function setActivePlayerAndUpdateUI(newPlayerIdx) {
  console.log(`Switching active player from ${activePlayerIdx} to ${newPlayerIdx}`);
  
  // Update the active player index
  activePlayerIdx = newPlayerIdx;
  window.activePlayerIdx = newPlayerIdx;
  
  // Update all UI components
  updateAllUI();
  
  // Update development cards UI if it exists
  if (devCardsUI && typeof devCardsUI.updateDevHand === 'function') {
    devCardsUI.updateDevHand();
  }
  
  console.log(`Active player is now Player ${newPlayerIdx + 1}`);
}

// Function specifically for switching to first player after initial placement
function setActivePlayerToFirstPlayer() {
  console.log('Switching to first player (Player 1) after initial placement complete');
  setActivePlayerAndUpdateUI(0);
}

// Make functions globally available
window.setActivePlayerAndUpdateUI = setActivePlayerAndUpdateUI;
window.setActivePlayerToFirstPlayer = setActivePlayerToFirstPlayer;
window.updateAllUI = updateAllUI;

// === UI: Haupt-Button-Leiste (Action Bar) ===
let actionBar = document.getElementById('main-action-bar');
if (!actionBar) {
  actionBar = document.createElement('div');
  actionBar.id = 'main-action-bar';
  document.body.appendChild(actionBar);
}

// Centralized UI update function
function updateAllUI() {
  updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
  updatePlayerOverviews(window.players, () => activePlayerIdx);
  updateGameStatusDisplay();
  
  // Highlight available ports for current player
  if (window.players && window.players[activePlayerIdx]) {
    highlightPlayerPorts(window.players[activePlayerIdx]);
  }
}

// === Preload Game Board ===
async function preloadGameBoard() {
  console.log('Preloading game board...');
  
  return new Promise((resolve) => {
    // Set up scene components that don't require UI
    scene.add(createHexGrid());
    createDirectionArrows(scene);
    setupLights(scene);

    // Create the game board with all tiles
    const result = createGameBoard(scene);
    tileMeshes = result.tileMeshes;
    tileNumbers = result.tileNumbers;
    
    // After creating the game board: Number Tokens hinzufügen
    addNumberTokensToTiles(scene, tileMeshes, tileNumbers);

    // Initialize ports after game board is created
    renderPorts(scene).then(() => {
      console.log('Ports initialized successfully');
    }).catch(error => {
      console.error('Error initializing ports:', error);
    });

    // Initialize robber on desert tile
    const initialRobberTileKey = '0,0';
    function waitForDesertTileAndInitRobber(retries = 30) {
      if (tileMeshes[initialRobberTileKey]) {
        setTimeout(() => {
          console.log("Setting initial token colors for robber on desert");
          updateNumberTokensForRobber(initialRobberTileKey);
        }, 200);
        console.log("Initializing robber on the desert tile");
        initializeRobber(scene, null, tileMeshes);
        
        // Robber initialized, continue with cards
        setTimeout(() => {
          createPlaceholderCards(scene);
          const cardManager = new CardManager();
          cardManager.loadAllCards().then(() => {
            console.log('Game board preloaded successfully');
            resolve(true);
          }).catch(error => {
            console.error("Fehler beim Laden der Karten:", error);
            resolve(true); // Continue even if cards fail
          });
        }, 300);
        
      } else if (retries > 0) {
        setTimeout(() => waitForDesertTileAndInitRobber(retries - 1), 100);
      } else {
        console.warn("Desert tile mesh (0,0) not found after waiting. Robber not initialized.");
        resolve(true); // Continue anyway
      }
    }
    waitForDesertTileAndInitRobber();
  });
}

// === Event Listeners for Game Initialization ===
window.addEventListener('initializeGame', async () => {
  console.log('Game initialization requested...');
  try {
    // First preload the game board
    console.log('Starting preload...');    
    await preloadGameBoard();
    console.log('Game board preloaded, now starting UI...');
    
    // Then start the game UI
    await startGame();
    console.log('Game UI started, dispatching gameReady event...');
    window.dispatchEvent(new CustomEvent('gameReady'));
  } catch (error) {
    console.error('Error during game initialization:', error);
    // Still notify that we're "ready" even if there was an error
    window.dispatchEvent(new CustomEvent('gameReady'));
  }
});

// === Event Listeners for Preloading and Game Start (Legacy) ===
window.addEventListener('assetsPreloaded', () => {
  console.log('Assets preloaded, preparing game board...');
  preloadGameBoard();
});

window.addEventListener('startGame', () => {
  console.log('Starting game from preloaded state...');
  startGame();
});

// === Initialisiere Spielfeld und UI erst nach Spielstart ===
let devCardsUI = null;

async function startGame() {
  if (gameInitialized) {
    console.log('Game already initialized, returning...');
    return;
  }
  
  console.log('startGame() wurde aufgerufen!');
  let actionBar = document.getElementById('main-action-bar');
  console.log('actionBar:', actionBar);

  console.log('Starte Spiel: Initialisiere UI...');
  
  // Show the game board
  console.log('Zeige Spielfeld...');
  renderer.domElement.style.visibility = 'visible';
  renderer.domElement.classList.remove('board-hidden');
  console.log('Spielfeld sollte jetzt sichtbar sein...');  
  
  try {
    // === UI: Build-Menü (Bauen) ===
    createBuildUI({
      players: window.players,
      getBuildMode: () => buildMode,
      setBuildMode: (mode) => { buildMode = mode; },
      getActivePlayerIdx: () => activePlayerIdx,
      setActivePlayerIdx: setActivePlayerAndUpdateUI,  // Use centralized function
      parent: actionBar
    });
    // Passe die Höhe des Build-Menus an, damit alle Buttons sichtbar sind
    const buildUI = document.getElementById('build-ui');
    if (buildUI) {
      buildUI.style.maxHeight = 'none';
      buildUI.style.height = 'auto';
      buildUI.style.overflowY = 'visible';
      buildUI.style.display = 'flex';
      buildUI.style.flexDirection = 'column';
      buildUI.style.flexWrap = 'nowrap';
    }
    console.log('Build-UI erstellt und Höhe angepasst:', buildUI);
  } catch (e) {
    console.error('Fehler beim Erstellen des Build-UI:', e);
  }

  try {
    // === UI: Markt-Button (unabhängig vom Würfeln-Button) ===
    let marketBtn = document.getElementById('market-btn');
    if (!marketBtn) {
      marketBtn = document.createElement('button');
      marketBtn.id = 'market-btn';
      marketBtn.title = 'Markt öffnen';
      marketBtn.style.fontSize = '2.5em';
      marketBtn.style.padding = '0.4em';
      marketBtn.style.margin = '0 0.5em';
      marketBtn.style.cursor = 'pointer';
      marketBtn.style.borderRadius = '6px';
      marketBtn.style.aspectRatio = '1 / 1';
      marketBtn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
      marketBtn.style.border = 'none';
      marketBtn.style.boxShadow = '0 2px 8px #0001';
      marketBtn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
      marketBtn.style.outline = 'none';
      marketBtn.style.fontFamily = "'Montserrat', Arial, sans-serif";
      marketBtn.style.fontWeight = '700';
      marketBtn.style.color = '#222';
      marketBtn.style.display = 'flex';
      marketBtn.style.flexDirection = 'column';
      marketBtn.style.alignItems = 'center';
      marketBtn.style.justifyContent = 'center';
      // Emoji
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = '🏬';
      emojiSpan.style.display = 'block';
      emojiSpan.style.fontSize = '1em';
      emojiSpan.style.lineHeight = '1';
      marketBtn.appendChild(emojiSpan);
      // Click-Handler: Markt-UI toggeln (nur Bank-Trade-UI + Bank-UI + Development-Cards-UI)
      marketBtn.onclick = () => {
        const marketUI = document.getElementById('bank-trade-ui');
        const bankResourceUI = document.getElementById('bank-ui');
        const devCardsUI = document.getElementById('development-cards-ui');
        
        // Bestimme den aktuellen Zustand (alle sollten synchron sein)
        const isCurrentlyHidden = !marketUI || marketUI.style.display === 'none' || marketUI.style.display === '';
        
        // Toggle nur die Markt-spezifischen UI-Elemente (nicht die Spieler-Ressourcen)
        if (marketUI) {
          marketUI.style.display = isCurrentlyHidden ? 'flex' : 'none';
        }
        if (bankResourceUI) {
          bankResourceUI.style.display = isCurrentlyHidden ? 'block' : 'none';
        }
        if (devCardsUI) {
          devCardsUI.style.display = isCurrentlyHidden ? 'flex' : 'none';
        }
      };
      actionBar.appendChild(marketBtn);
    }
  } catch (e) {
    console.error('Fehler beim Erstellen des Markt-Buttons:', e);
  }

  try {
    // === UI: Port-Handel-Button ===
    let portBtn = document.getElementById('port-trade-btn');
    if (!portBtn) {
      portBtn = document.createElement('button');
      portBtn.id = 'port-trade-btn';
      portBtn.title = 'Hafen-Handel';
      portBtn.style.fontSize = '2.5em';
      portBtn.style.padding = '0.4em';
      portBtn.style.margin = '0 0.5em';
      portBtn.style.cursor = 'pointer';
      portBtn.style.borderRadius = '6px';
      portBtn.style.aspectRatio = '1 / 1';
      portBtn.style.background = 'linear-gradient(90deg, #3498db 60%, #85c1e9 100%)';
      portBtn.style.border = 'none';
      portBtn.style.boxShadow = '0 2px 8px #0001';
      portBtn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
      portBtn.style.outline = 'none';
      portBtn.style.fontFamily = "'Montserrat', Arial, sans-serif";
      portBtn.style.fontWeight = '700';
      portBtn.style.color = '#fff';
      portBtn.style.display = 'flex';
      portBtn.style.flexDirection = 'column';
      portBtn.style.alignItems = 'center';
      portBtn.style.justifyContent = 'center';
      
      // Emoji
      const emojiSpan = document.createElement('span');
      emojiSpan.textContent = '🚢';
      emojiSpan.style.display = 'block';
      emojiSpan.style.fontSize = '1em';
      emojiSpan.style.lineHeight = '1';
      portBtn.appendChild(emojiSpan);
      
      // Click-Handler: Port-Trade-UI öffnen
      portBtn.onclick = () => {
        const player = window.players && window.players[window.activePlayerIdx || 0];
        if (!player) {
          console.warn('No active player for port trade');
          return;
        }
        
        // Prüfe ob Spieler Zugang zu Häfen hat
        const rates = getPlayerTradeRates(player);
        const hasPortAccess = Object.values(rates).some(rate => rate < 4);
        
        if (hasPortAccess) {
          togglePortTradeUI();
        } else {
          // Feedback wenn kein Port-Zugang
          let feedback = document.getElementById('global-feedback');
          if (!feedback) {
            feedback = document.createElement('div');
            feedback.id = 'global-feedback';
            feedback.style.cssText = `
              position: fixed;
              left: 50%;
              bottom: 100px;
              transform: translateX(-50%);
              background: rgba(0, 0, 0, 0.9);
              color: #e74c3c;
              font-weight: bold;
              font-size: 16px;
              padding: 15px 25px;
              border-radius: 10px;
              box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
              z-index: 99999;
              text-align: center;
              font-family: 'Montserrat', Arial, sans-serif;
              border: 2px solid currentColor;
            `;
            document.body.appendChild(feedback);
          }
          feedback.textContent = '🚢 Kein Zugang zu Häfen! Baue eine Siedlung an einem Hafen.';
          feedback.style.display = 'block';
          setTimeout(() => feedback.style.display = 'none', 3000);
        }
      };
      
      // Hover-Effekte
      portBtn.onmouseover = () => {
        portBtn.style.background = 'linear-gradient(90deg, #2980b9 60%, #5dade2 100%)';
        portBtn.style.transform = 'translateY(-2px)';
      };
      portBtn.onmouseout = () => {
        portBtn.style.background = 'linear-gradient(90deg, #3498db 60%, #85c1e9 100%)';
        portBtn.style.transform = 'translateY(0)';
      };
      
      actionBar.appendChild(portBtn);
    }
  } catch (e) {
    console.error('Fehler beim Erstellen des Port-Handel-Buttons:', e);
  }

  // === UI: Kombinierter Würfeln- und Spielerwechsel-Button ===
  try {
    // Entferne evtl. alten Button UND Wrapper
    const oldBtn = document.getElementById('roll-dice-combined');
    const oldWrapper = document.getElementById('dice-wrapper');
    if (oldBtn) oldBtn.remove();
    if (oldWrapper) oldWrapper.remove();

    let state = 0; // 0 = Würfeln, 1 = Spielerwechsel
    let lastDiceResult = null;

    const btn = document.createElement('button');
    btn.id = 'roll-dice-combined';
    btn.style.fontSize = '2.5em';
    btn.style.padding = '0.4em';
    btn.style.margin = '0';
    btn.style.cursor = 'pointer';
    btn.style.borderRadius = '6px';
    btn.style.aspectRatio = '1 / 1';
    btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
    btn.style.border = 'none';
    btn.style.boxShadow = '0 2px 8px #0001';
    btn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
    btn.style.outline = 'none';
    btn.style.display = 'flex';
    btn.style.flexDirection = 'column';
    btn.style.alignItems = 'center';
    btn.style.justifyContent = 'center';

    const emoji = document.createElement('span');
    emoji.textContent = '🎲';
    emoji.style.fontSize = '1em';
    emoji.style.lineHeight = '1';
    btn.appendChild(emoji);

    // Label entfernt - nur noch Emoji

    // Dummy-UI für das Würfelergebnis (wie dice-result), aber außerhalb des Buttons
    let resultDiv = document.getElementById('dice-result');
    let diceWrapper = document.getElementById('dice-wrapper');
    
    if (!resultDiv) {
      resultDiv = document.createElement('div');
      resultDiv.id = 'dice-result';
      resultDiv.style.color = '#fff';
      resultDiv.style.fontSize = '2em';
      resultDiv.style.minWidth = '2em';
      resultDiv.style.minHeight = '1.5em';
      resultDiv.style.textShadow = '0 2px 8px #000';
      resultDiv.style.fontFamily = "'Montserrat', Arial, sans-serif";
      resultDiv.style.display = 'block';
      resultDiv.style.marginBottom = '0.5em';
      resultDiv.style.textAlign = 'center';
      resultDiv.style.border = '2px solid rgba(255,255,255,0.3)';
      resultDiv.style.borderRadius = '6px';
      resultDiv.style.backgroundColor = 'rgba(0,0,0,0.5)';
      resultDiv.style.padding = '0.2em';
      resultDiv.textContent = ''; // Platzhalter-Text
    }
    
    if (!diceWrapper) {
      // Erstelle einen Wrapper für Ergebnis und Button (Flexbox, column)
      diceWrapper = document.createElement('div');
      diceWrapper.id = 'dice-wrapper';
      diceWrapper.style.display = 'flex';
      diceWrapper.style.flexDirection = 'column';
      diceWrapper.style.alignItems = 'center';
      diceWrapper.style.justifyContent = 'center';
      // Füge Ergebnis und Button in den Wrapper ein
      diceWrapper.appendChild(resultDiv);
      diceWrapper.appendChild(btn);
      // Füge den Wrapper in die Action Bar ein
      actionBar.appendChild(diceWrapper);
    } else {
      // Wrapper existiert bereits, füge nur den Button hinzu
      diceWrapper.appendChild(btn);
    }

    function updateButtonUI() {
      // Check current game phase
      const gamePhaseInfo = getGamePhaseInfo();
      
      if (gamePhaseInfo.phase === 'Startaufstellung') {
        // During initial placement: always show player switch
        emoji.textContent = '🔄';
        btn.title = 'Spieler wechseln';
      } else {
        // During regular play: switch between dice and player change
        if (state === 0) {
          emoji.textContent = '🎲';
          btn.title = 'Würfeln';
        } else {
          emoji.textContent = '🔄';
          btn.title = 'Spieler wechseln';
        }
      }
    }
    
    // Initial UI update - delay to ensure game phase is properly set
    setTimeout(() => {
      updateButtonUI();
    }, 100);

    btn.onclick = () => {
      // Check current game phase
      const gamePhaseInfo = getGamePhaseInfo();
      
      if (gamePhaseInfo.phase === 'Startaufstellung') {
        // During initial placement: always do player switch
        const nextIdx = (activePlayerIdx + 1) % window.players.length;
        setActivePlayerAndUpdateUI(nextIdx);
        
      } else if (state === 0) {
        // Regular play: Würfeln
        if (typeof throwPhysicsDice === 'function' && typeof scene !== 'undefined') {
          throwPhysicsDice(scene);
          window.setDiceResultFromPhysics = (result) => {
            lastDiceResult = result;
            // Zeige Ergebnis
            if (resultDiv) resultDiv.textContent = result.sum;
            // Event feuern wie gehabt
            window.dispatchEvent(new CustomEvent('diceRolled', { detail: result.sum }));
            // Wenn KEIN Räuber (7), Button auf Spielerwechsel
            if (result.sum !== 7) {
              state = 1;
              updateButtonUI();
            }
            // Bei 7 bleibt der Button auf Würfeln (Räuber muss platziert werden)
          };
        } else {
          // Fallback: Dummy-Logik
          const dummy = Math.floor(Math.random()*6+1) + Math.floor(Math.random()*6+1);
          if (resultDiv) resultDiv.textContent = dummy;
          window.dispatchEvent(new CustomEvent('diceRolled', { detail: dummy }));
          if (dummy !== 7) {
            state = 1;
            updateButtonUI();
          }
        }
      } else {
        // Regular play: Spielerwechsel
        const nextIdx = (activePlayerIdx + 1) % window.players.length;
        setActivePlayerAndUpdateUI(nextIdx);
        // Button zurück auf Würfeln
        state = 0;
        resultDiv.textContent = '?'; // Zurück zum Platzhalter
        updateButtonUI();
      }
    };
    
    // Make button update function globally available for phase changes
    window.updateDiceButtonForPhaseChange = function() {
      updateButtonUI();
    };

    // Button wird bereits im diceWrapper hinzugefügt, nicht direkt zur actionBar
    console.log('Kombinierter Würfeln-/Spielerwechsel-Button erstellt:', btn);
  } catch (e) {
    console.error('Fehler beim Erstellen des kombinierten Buttons:', e);
  }

  // try {
  //   // === UI: Spielerwechsel-Button ===
  //   placePlayerSwitchButton(window.players, () => activePlayerIdx, (idx) => {
  //     activePlayerIdx = idx;
  //     window.activePlayerIdx = idx;
  //     updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
  //     updatePlayerOverviews(window.players, () => activePlayerIdx);
  //     if (devCardsUI && typeof devCardsUI.updateDevHand === 'function') devCardsUI.updateDevHand();
  //   }, actionBar);
  //   console.log('Player-Switch-Button erstellt:', document.getElementById('player-switch-btn'));
  // } catch (e) {
  //   console.error('Fehler beim Erstellen des Player-Switch-Buttons:', e);
  // }

  try {
    // === UI: Ressourcenanzeige & Entwicklungskarten-UI ===
    createResourceUI();
    updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
    if (!devCardsUI) {
      devCardsUI = createDevelopmentCardsUI({
        getPlayer: () => window.players[activePlayerIdx],
        getBank: () => window.bank,
        getDeck: () => window.developmentDeck,
        onBuy: () => {
          updateAllUI();
        },
        getScene: () => scene,
        getTileMeshes: () => tileMeshes
      });
      const container = document.getElementById('resource-bank-container');
      if (container) container.appendChild(devCardsUI);
    }
    if (devCardsUI && typeof devCardsUI.updateDevHand === 'function') devCardsUI.updateDevHand();
    console.log('Ressourcen- und Entwicklungskarten-UI erstellt:', document.getElementById('ressource-ui'), devCardsUI);
  } catch (e) {
    console.error('Fehler beim Erstellen der Ressourcen- oder Entwicklungskarten-UI:', e);
  }

  try {
    // === UI: Spieler-Übersicht (oben links) ===
    createPlayerOverviews(window.players, () => activePlayerIdx);
    updateAllUI();
    console.log('Player-Overviews erstellt:', document.getElementById('player-overview-container'));
  } catch (e) {
    console.error('Fehler beim Erstellen der Player-Overviews:', e);
  }


  // === UI: Info-Button (Regeln) ===
  try {
    // Settings-Button Container suchen oder erstellen
    let settingsContainer = document.getElementById('settings-ui');
    if (!settingsContainer) {
      createSettingsMenu();
      settingsContainer = document.getElementById('settings-ui');
    }
    
    // Info-Button nur einmal anlegen
    let infoBtn = document.getElementById('info-button');
    if (!infoBtn) {
      infoBtn = document.createElement('button');
      infoBtn.id = 'info-button';
      infoBtn.title = 'Spielregeln anzeigen';
      infoBtn.textContent = 'ℹ️';
      // Gleiche Styling wie Settings-Button
      infoBtn.style.fontSize = '1.5em';
      infoBtn.style.padding = '0.3em';
      infoBtn.style.width = '2em';
      infoBtn.style.height = '2em';
      infoBtn.style.borderRadius = '7px';
      infoBtn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
      infoBtn.style.border = 'none';
      infoBtn.style.fontFamily = "'Montserrat', Arial, sans-serif";
      infoBtn.style.fontWeight = '700';
      infoBtn.style.cursor = 'pointer';
      infoBtn.style.boxShadow = '0 2px 8px #0001';
      infoBtn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s';
      infoBtn.style.outline = 'none';
      infoBtn.style.color = '#222';
      infoBtn.style.display = 'inline-block';
      infoBtn.style.marginRight = '0.5em';
      
      // Hover-Effekte (gleich wie Settings-Button)
      infoBtn.onmouseenter = () => {
        infoBtn.style.background = 'linear-gradient(90deg, #ffd700 70%, #fffbe6 100%)';
        infoBtn.style.boxShadow = '0 4px 12px #ffe06644';
        infoBtn.style.transform = 'translateY(-1px)';
      };
      infoBtn.onmouseleave = () => {
        infoBtn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
        infoBtn.style.boxShadow = '0 2px 8px #0001';
        infoBtn.style.transform = 'translateY(0)';
      };
      
      // Button in den Settings-Container einfügen (vor dem Settings-Button)
      if (settingsContainer) {
        const settingsBtn = document.getElementById('settings-button');
        if (settingsBtn) {
          settingsContainer.insertBefore(infoBtn, settingsBtn);
        } else {
          settingsContainer.appendChild(infoBtn);
        }
      }
    }
    // Regeln-Popup Modal nur einmal anlegen
    let rulesModal = document.getElementById('rules-modal');
    if (!rulesModal) {
      rulesModal = document.createElement('div');
      rulesModal.id = 'rules-modal';
      rulesModal.style.cssText = `
        position: fixed;
        left: 50%;
        top: 50%;
        transform: translate(-50%, -50%);
        background: linear-gradient(135deg, #f8fafc 80%, #e0eafc 100%);
        color: #222;
        padding: 32px 28px 22px 28px;
        border-radius: 18px;
        font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        font-size: 1.1em;
        z-index: 10010;
        max-width: 520px;
        min-width: 320px;
        box-shadow: 0 8px 32px rgba(0,0,0,0.25);
        border: 2px solid #b6c6e3;
        display: none;
      `;
      rulesModal.innerHTML = `
        <div style="font-size:1.5em;font-weight:bold;margin-bottom:0.5em;text-align:center;">Spielregeln</div>
        <div style="max-height:340px;overflow-y:auto;padding-right:8px;">
          <ul style="padding-left:1.2em;">
            <li>Baue Siedlungen, Städte und Straßen, um Siegpunkte zu sammeln.</li>
            <li>Würfle zu Beginn deines Zuges und sammle Rohstoffe entsprechend der gewürfelten Zahl.</li>
            <li>Handel mit der Bank, anderen Spielern oder an Häfen.</li>
            <li>Der Räuber blockiert Felder und kann Rohstoffe stehlen, wenn eine 7 gewürfelt wird.</li>
            <li>Entwicklungskarten bringen Vorteile wie Ritter, Fortschritt oder Siegpunkte.</li>
            <li>Wer zuerst 10 Siegpunkte erreicht, gewinnt das Spiel!</li>
          </ul>
          <div style="margin-top:1em;font-size:0.95em;color:#444;">Weitere Details findest du im offiziellen Catan-Regelwerk.</div>
        </div>
        <button id="close-rules-modal" style="margin-top:1.5em;width:100%;background:linear-gradient(90deg,#b6c6e3 60%,#e0eafc 100%);color:#222;border:none;padding:10px 0;border-radius:8px;font-size:1.1em;font-weight:600;cursor:pointer;">Schließen</button>
      `;
      document.body.appendChild(rulesModal);
      // Schließen-Button
      rulesModal.querySelector('#close-rules-modal').onclick = () => {
        rulesModal.style.display = 'none';
      };
    }
    // Info-Button öffnet das Modal
    infoBtn.onclick = () => {
      rulesModal.style.display = 'block';
    };
    // Automatisch beim ersten Spielstart anzeigen
    if (!window._rulesModalShownOnce) {
      setTimeout(() => {
        rulesModal.style.display = 'block';
        window._rulesModalShownOnce = true;
      }, 600);
    }
    console.log('Info-Button und Regeln-Popup erstellt:', infoBtn, rulesModal);
  } catch (e) {
    console.error('Fehler beim Erstellen des Info-Buttons/Regeln-Popups:', e);
  }

  try {
    // === UI: Tile-Info-Overlay (nur das Overlay, kein Button mehr) ===
    initTileInfoOverlay(scene, camera);
    console.log('Info-Overlay erstellt:', document.getElementById('infoOverlay'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Info-Overlays:', e);
  }

  // === Build Event Handler Setup ===
  setupBuildEventHandler({
    renderer,
    scene,
    camera,
    tileMeshes,
    players: window.players,
    getBuildMode: () => buildMode,
    getActivePlayerIdx: () => activePlayerIdx,
    tryBuildSettlement,
    tryBuildCity,
    tryBuildRoad,
    getCornerWorldPosition,
    updateAllUI: () => {
      updateAllUI();
    }
  });

  // === UI: Build-Preview (Vorschau beim Bauen) ===
  setupBuildPreview(
    renderer,
    scene,
    camera,
    tileMeshes,
    window.players,
    () => buildMode,
    () => activePlayerIdx,
    tryBuildSettlement,
    tryBuildCity
  );

  // Mark game as initialized
  gameInitialized = true;
  console.log('Game initialization complete!');
  
  // Note: gameReady event is now dispatched by the initializeGame event handler
}

// === Catan-Bank: Ressourcenlimitierung ===
window.bank = {
  wood: 19,
  clay: 19,
  wheat: 19,
  sheep: 19,
  ore: 19
};

// === Entwicklungskarten-Deck und Spieler-Setup ===
window.developmentDeck = createDevelopmentDeck();
window.players.forEach(initPlayerDevCards);

// === Initialize Road Testing Utilities ===
initRoadTestingUtils();
console.log('Road testing utilities initialized and available in console.');

// === Initialize Debug Key Handlers ===
initDebugKeyHandlers();

// === Initialize Debug Controls ===
initDebugControls();
console.log('Debug controls initialized. Use enableDebugLogging() / disableDebugLogging() in console.');

// === Initialize Victory Points Testing Utils ===
initVictoryPointsTestingUtils();
console.log('Victory Points testing utilities initialized.');

// === Main-Menu-Start-Button-Handler ===
// NOTE: This is handled by index.js, so commenting out to avoid conflicts
/*
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM geladen, versuche Start-Button-Handler zu setzen...');
  // Sidebar anzeigen
  createMainMenuSidebar();
  const menu = document.getElementById('main-menu');
  const startBtn = document.getElementById('start-game');
  if (startBtn) {
    console.log('Start-Button gefunden und Handler gesetzt.');
    startBtn.onclick = () => {
      console.log('Start-Button wurde geklickt!');
      if (menu) {
        console.log('Menu wird ausgeblendet...');
        menu.style.display = 'none';
      }
      // Sidebar ausblenden, wenn Spiel startet
      import('./modules/uiMainMenu.js').then(mod => mod.removeMainMenuSidebar());
      console.log('Rufe startGame() auf...');
      startGame();
    };
  } else {
    console.error('Start-Button NICHT gefunden!');
  }
});
*/

// Debug flags
window.debugDiceEnabled = false; // Initialize debug mode as disabled

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4; // 45° von oben
controls.maxPolarAngle = Math.PI * 0.44; // ca. 79°, verhindert "unter das Feld schauen"
controls.minDistance = 10;  // Näher ranzoomen von oben möglich
controls.maxDistance = 55; // Maximaler Zoom (z. B. 100 Einheiten vom Zentrum)


// Create a raycaster for robber tile selection
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Handle click events for robber placement
window.addEventListener('click', (event) => {
    // Only process click if we're in robber placement mode
    if (!isInRobberPlacementMode()) {
        console.log("Not in robber placement mode, ignoring click");
        return;
    }
    
    console.log("Click detected in robber placement mode");

    // Calculate mouse position in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = - (event.clientY / window.innerHeight) * 2 + 1;

    // Update the raycaster
    raycaster.setFromCamera(mouse, camera);

    // Find intersections with all scene objects - true for recursive search through children
    const intersects = raycaster.intersectObjects(scene.children, true);
    
    console.log("Found", intersects.length, "intersections");

    if (intersects.length > 0) {
        // Log the first several intersections to help with debugging
        for (let i = 0; i < Math.min(3, intersects.length); i++) {
            const obj = intersects[i].object;
            console.log(`Intersection ${i}:`, 
                obj.name || "unnamed", 
                "type:", obj.type, 
                "userData:", obj.userData,
                "parent:", obj.parent ? (obj.parent.name || "unnamed parent") : "no parent");
        }
        
        // Try using handleTileSelection from the bandit module with the first intersection
        let success = false;
        
        // Try each of the first 3 intersections in case the first one doesn't work
        for (let i = 0; i < Math.min(3, intersects.length) && !success; i++) {
            success = handleTileSelection(intersects[i], tileMeshes, getTileWorldPosition);
            if (success) {
                console.log(`Successfully placed robber using intersection ${i}`);
                break;
            }
        }
        
        if (success) {
            console.log("Successfully placed robber");
        } else {
            console.log("Failed to place robber at the selected location");
            // === UI: Fehler-/Feedback-Popup ===
            const errorMsg = document.createElement('div');
            errorMsg.textContent = "Konnte den Räuber nicht auf diesem Feld platzieren. Versuche ein anderes Feld.";
            errorMsg.style.position = 'fixed';
            errorMsg.style.left = '50%';
            errorMsg.style.top = '10%';
            errorMsg.style.transform = 'translateX(-50%)';
            errorMsg.style.background = 'rgba(255,50,50,0.9)';
            errorMsg.style.color = 'white';
            errorMsg.style.padding = '10px 20px';
            errorMsg.style.borderRadius = '5px';
            errorMsg.style.fontFamily = "'Montserrat', Arial, sans-serif";
            errorMsg.style.zIndex = '1000';
            document.body.appendChild(errorMsg);
            setTimeout(() => document.body.removeChild(errorMsg), 3000);
            
            // DEBUG: Dump intersection details to console for debugging
            console.log("DEBUG - All intersections:");
            intersects.slice(0, 5).forEach((intersection, i) => {
                console.log(`Intersection ${i} details:`, {
                    object: intersection.object,
                    distance: intersection.distance,
                    point: intersection.point,
                    face: intersection.face
                });
            });
        }
    } else {
        console.log("No intersections found - nothing was clicked");
    }
});



// Animation
function animate() {
    // Update number tokens to face camera
    updateNumberTokensFacingCamera(scene, camera);
    
    // Update port labels to face camera
    updatePortLabels(camera);
    
    // Update physics for dice
    updateDicePhysics();
    
    // Animate the sunbeam effects - ensure this runs on every frame
    animateHalos();
    
    // Render the scene
    renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});

window.addEventListener('keydown', (e) => handleResourceKeydown(e)); // handleResourceKeydown uses current player

// === Bandit-Logik: Verwalte Räuberplatzierung und -bewegung ===

// Track which tile is currently blocked by the robber
let blockedTileKey = "0,0"; // Initially desert tile

// Handle robber movement events
window.addEventListener('robberMoved', (e) => {
    console.log(`Robber moved to tile ${e.detail.key} at coordinates (${e.detail.q},${e.detail.r})`);
    // Update which tile is blocked for resource production
    blockedTileKey = e.detail.key;
    
    // Use the accurate position function to ensure the robber is perfectly centered
    // This is a fallback to ensure proper placement even after the event
    const accuratePosition = getTileCenter(e.detail.q, e.detail.r, tileMeshes);
    console.log("Ensuring robber is at accurate position:", accuratePosition);
      // Update the number token colors to show which one is blocked
    // Use setTimeout to ensure any tile updates complete first
    setTimeout(() => {
        console.log("Updating token colors for robber moved to", blockedTileKey);
        updateNumberTokensForRobber(blockedTileKey);
    }, 100);
    
    // Unblock dice rolls once the robber has been placed
    unblockDiceRolls();
});

// Handle dice rolls
window.addEventListener('diceRolled', (e) => {
    // Highlight number tokens for the rolled number
    highlightNumberTokens(scene, tileMeshes, tileNumbers, e.detail);
    
    // Special handling for rolling a 7
    if (e.detail === 7) {
        // Start robber placement mode
        startRobberPlacement(tileMeshes, tileNumbers);
        
        // Block dice rolls until robber is placed
        blockDiceRolls("Platziere zuerst den Räuber");
    }
});

// === Place settlement/city mesh at corner ===

// Globale Hilfsfunktion für Entwicklungskarten-Logik (z.B. Monopol)
window.getAllPlayers = function() {
  return window.players;
};

window.startRobberPlacement = startRobberPlacement;

// === Undo Functionality ===
function performUndo() {
  if (typeof undoLastInitialPlacement === 'function') {
    const result = undoLastInitialPlacement(activePlayerIdx, players);
    
    if (result.success) {
      console.log('Undo successful:', result.message);
      showBuildPopupFeedback(result.message, 'success');
      
      // Update all visual elements
      updateAllUI();
      
      // Refresh the game board to reflect changes
      if (typeof window.refreshGameBoard === 'function') {
        window.refreshGameBoard();
      }
    } else {
      console.log('Undo failed:', result.reason);
      showBuildPopupFeedback(result.reason, 'error');
    }
  } else {
    showBuildPopupFeedback('Undo-Funktion nicht verfügbar', 'error');
  }
}

// Make undo function globally available
window.performUndo = performUndo;
