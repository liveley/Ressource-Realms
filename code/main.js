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
import { players, tryBuildSettlement, tryBuildCity, tryBuildRoad } from './modules/buildLogic.js';
import { getCornerWorldPosition } from './modules/tileHighlight.js';
import { setupBuildPreview } from './modules/uiBuildPreview.js';
import CardManager from './modules/cards.js';
import { createPlayerOverviews, updatePlayerOverviews } from './modules/ui_player_overview.js';
import { placePlayerSwitchButton } from './modules/change_player.js';
import { createBuildUI } from './modules/uiBuild.js';
import { setupBuildEventHandler } from './modules/buildEventHandlers.js';
import { showDebugMessage } from './modules/debugging/debugTools.js';
import { createDebugDiceIndicator, toggleDebugDiceMode } from './modules/debugging/diceDebug.js';
import { createDevelopmentCardsUI } from './modules/developmentCardsUI.js';
import { createDevelopmentDeck, initPlayerDevCards } from './modules/developmentCards.js';
import { createSettingsMenu } from './modules/uiSettingsMenu.js';
import { initializeVictoryPoints, updateAllVictoryPoints, getVictoryPointsForDisplay, debugRoadConnections, calculateLongestRoad } from './modules/victoryPoints.js';
import { createVictoryPointsDebugUI } from './modules/victoryPointsDebug.js';
import './modules/longestRoadDebug.js';

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

// Make victory points functions available globally
window.updateAllVictoryPoints = updateAllVictoryPoints;
window.initializeVictoryPoints = initializeVictoryPoints;
window.getVictoryPointsForDisplay = getVictoryPointsForDisplay;
window.debugRoadConnections = debugRoadConnections;

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

// === UI: Haupt-Button-Leiste (Action Bar) ===
let actionBar = document.getElementById('main-action-bar');
if (!actionBar) {
  actionBar = document.createElement('div');
  actionBar.id = 'main-action-bar';
  document.body.appendChild(actionBar);
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
      setActivePlayerIdx: (idx) => {
        activePlayerIdx = idx;
        window.activePlayerIdx = idx;
        updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
        updatePlayerOverviews(window.players, () => activePlayerIdx);
      },
      parent: actionBar
    });
    console.log('Build-UI erstellt:', document.getElementById('build-ui'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Build-UI:', e);
  }

  // === UI: Würfeln- und Spielerwechsel-Button (kombiniert) ===
  // Die alte createDiceUI bleibt auskommentiert erhalten:
  /*
  try {
    createDiceUI(() => {
      throwPhysicsDice(scene);
      window.setDiceResultFromPhysics = (result) => {
        setDiceResult(result.sum);
        window.dispatchEvent(new CustomEvent('diceRolled', { detail: result.sum }));
      };
    }, actionBar);
    console.log('Dice-UI erstellt:', document.getElementById('dice-ui'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Dice-UI:', e);
  }
  */

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

    // Label entfernt - nur noch Emoji wird angezeigt

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
      resultDiv.textContent = '?'; // Platzhalter-Text
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
      if (state === 0) {
        emoji.textContent = '🎲';
        // Label entfernt - nur Emoji wird geändert
      } else {
        emoji.textContent = '🔄';
        // Spielerwechsel-Emoji, kein Label nötig
      }
    }
    updateButtonUI();

    btn.onclick = () => {
      if (state === 0) {
        // Würfeln
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
        // Spielerwechsel
        const idx = activePlayerIdx;
        const nextIdx = (idx + 1) % window.players.length;
        if (typeof window.setActivePlayerIdx === 'function') {
          window.setActivePlayerIdx(nextIdx);
        } else {
          activePlayerIdx = nextIdx;
          window.activePlayerIdx = nextIdx;
        }
        // UI updaten
        updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
        updatePlayerOverviews(window.players, () => activePlayerIdx);
        if (devCardsUI && typeof devCardsUI.updateDevHand === 'function') devCardsUI.updateDevHand();
        // Button zurück auf Würfeln
        state = 0;
        resultDiv.textContent = '?'; // Zurück zum Platzhalter
        updateButtonUI();
      }
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
          updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
          updatePlayerOverviews(window.players, () => activePlayerIdx);
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
    updatePlayerOverviews(window.players, () => activePlayerIdx);
    console.log('Player-Overviews erstellt:', document.getElementById('player-overview-container'));
  } catch (e) {
    console.error('Fehler beim Erstellen der Player-Overviews:', e);
  }

  try {
    // === UI: Settings-Menu (Einstellungen & Info) ===
    createSettingsMenu();
    console.log('Settings-Menu erstellt:', document.getElementById('settings-button'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Settings-Menu:', e);
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
    tryBuildRoad, // <--- HINZUGEFÜGT
    getCornerWorldPosition,
    updateResourceUI: () => {
      updateResourceUI(window.players[activePlayerIdx], activePlayerIdx);
      updatePlayerOverviews(window.players, () => activePlayerIdx);
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

  // Create debug UI for victory points
  try {
    createVictoryPointsDebugUI();
    console.log('Victory Points Debug UI created');
  } catch (e) {
    console.error('Error creating Victory Points Debug UI:', e);
  }

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

// === Main-Menu-Start-Button-Handler ===
// NOTE: This is handled by index.js, so commenting out to avoid conflicts
/*
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM geladen, versuche Start-Button-Handler zu setzen...');
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
controls.maxDistance = 55; // Maximaler Zoom (z. B. 100 Einheiten vom Zentrum)


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
  tryBuildRoad, // <--- HINZUGEFÜGT
  getCornerWorldPosition,
  updateResourceUI: () => updateResourceUI(window.players[activePlayerIdx], activePlayerIdx) // Always update for current player
});

// === Build Preview Setup ===
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

// === Place settlement/city mesh at corner ===

// === Debug functions ===

// Toggle dice debug mode when pressing 'D'
window.addEventListener('keydown', (e) => {
    if (e.key === 'd' || e.key === 'D') {
        // Toggle between debug mode (7) and normal mode (null)
        window.debugDiceEnabled = toggleDebugDiceMode(7);
        
        // Show a message to the user about the current mode
        const message = window.debugDiceEnabled ? 
            "Debug mode enabled: Dice will always roll 7" : 
            "Debug mode disabled: Dice will roll randomly";
        
        // Display the debug message and indicator
        showDebugMessage(message, 3000);
        createDebugDiceIndicator(window.debugDiceEnabled, 7);
    }
});

// Globale Hilfsfunktion für Entwicklungskarten-Logik (z.B. Monopol)
window.getAllPlayers = function() {
  return window.players;
};

window.startRobberPlacement = startRobberPlacement;

// Function to test road connection using the exact logic from victoryPoints.js
function testRoadConnectionActual(road1, road2) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge (different tile perspectives)
  const [nq1, nr1] = [road1.q + directions[road1.edge][0], road1.r + directions[road1.edge][1]];
  const oppositeEdge1 = (road1.edge + 3) % 6;
  
  if (nq1 === road2.q && nr1 === road2.r && oppositeEdge1 === road2.edge) {
    return true; // Same physical edge
  }
  
  const [nq2, nr2] = [road2.q + directions[road2.edge][0], road2.r + directions[road2.edge][1]];
  const oppositeEdge2 = (road2.edge + 3) % 6;
  
  if (nq2 === road1.q && nr2 === road1.r && oppositeEdge2 === road1.edge) {
    return true; // Same physical edge (other direction)
  }
  
  // Method 2: Adjacent roads on same tile (share a vertex)
  if (road1.q === road2.q && road1.r === road2.r) {
    const edgeDiff = Math.abs(road1.edge - road2.edge);
    if (edgeDiff === 1 || edgeDiff === 5) { // Adjacent edges (including wrap-around 0-5)
      return true;
    }
  }
  
  // Method 3: Roads on different tiles that share a vertex
  const vertices1 = getRoadVerticesSimple(road1);
  const vertices2 = getRoadVerticesSimple(road2);
  
  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqualSimple(v1, v2)) {
        return true;
      }
    }
  }
  
  return false;
}

// Helper function to get vertices of a road
function getRoadVerticesSimple(road) {
  const vertices = [];
  
  // Each edge connects two vertices (corners of the hex)
  // Using the same logic as in victoryPoints.js
  const edgeToVertices = {
    0: [0, 1], // Top edge: top to top-right
    1: [1, 2], // Top-right edge: top-right to bottom-right
    2: [2, 3], // Bottom-right edge: bottom-right to bottom
    3: [3, 4], // Bottom edge: bottom to bottom-left
    4: [4, 5], // Bottom-left edge: bottom-left to top-left
    5: [5, 0]  // Top-left edge: top-left to top
  };
  
  const vertexIndices = edgeToVertices[road.edge] || [0, 1];
  
  for (const vertexIndex of vertexIndices) {
    vertices.push({
      q: road.q,
      r: road.r,
      corner: vertexIndex
    });
  }
  
  return vertices;
}

// Helper function to check if two vertices are equal
function areVerticesEqualSimple(v1, v2) {
  // First check if they're exactly the same
  if (v1.q === v2.q && v1.r === v2.r && v1.corner === v2.corner) {
    return true;
  }
  
  // Check for equivalent vertices (same vertex from different tile perspectives)
  const equivalents = getEquivalentVerticesSimple(v1);
  
  for (const equiv of equivalents) {
    if (equiv.q === v2.q && equiv.r === v2.r && equiv.corner === v2.corner) {
      return true;
    }
  }
  
  return false;
}

// Helper function to get equivalent vertices (same vertex from different tile perspectives)
function getEquivalentVerticesSimple(vertex) {
  const equivalents = [];
  const { q, r, corner } = vertex;
  
  // Based on axial coordinates, each vertex can be referenced from 3 different tiles
  // Using simplified logic for vertex equivalence
  
  // Corner 0 (top) equivalents
  if (corner === 0) {
    equivalents.push({ q: q, r: r - 1, corner: 3 });     // Bottom of tile above
    equivalents.push({ q: q - 1, r: r, corner: 2 });     // Bottom-right of tile to left
  }
  // Corner 1 (top-right) equivalents
  else if (corner === 1) {
    equivalents.push({ q: q + 1, r: r - 1, corner: 4 }); // Bottom-left of tile to top-right
    equivalents.push({ q: q, r: r - 1, corner: 5 });     // Top-left of tile above
  }
  // Corner 2 (bottom-right) equivalents
  else if (corner === 2) {
    equivalents.push({ q: q + 1, r: r, corner: 5 });     // Top-left of tile to right
    equivalents.push({ q: q + 1, r: r - 1, corner: 0 }); // Top of tile to top-right
  }
  // Corner 3 (bottom) equivalents
  else if (corner === 3) {
    equivalents.push({ q: q, r: r + 1, corner: 0 });     // Top of tile below
    equivalents.push({ q: q + 1, r: r, corner: 4 });     // Bottom-left of tile to right
  }
  // Corner 4 (bottom-left) equivalents
  else if (corner === 4) {
    equivalents.push({ q: q - 1, r: r + 1, corner: 1 }); // Top-right of tile to bottom-left
    equivalents.push({ q: q, r: r + 1, corner: 2 });     // Bottom-right of tile below
  }
  // Corner 5 (top-left) equivalents
  else if (corner === 5) {
    equivalents.push({ q: q - 1, r: r, corner: 1 });     // Top-right of tile to left
    equivalents.push({ q: q - 1, r: r + 1, corner: 3 }); // Bottom of tile to bottom-left
  }
  
  return equivalents;
}

// Helper function to calculate longest road from roads array
function calculateLongestRoadFromArray(roads) {
  if (!roads || roads.length === 0) return 0;
  
  // Create a temporary player object
  const tempPlayer = { roads };
  return calculateLongestRoad(tempPlayer);
}

// Enhanced debug function to trace longest road path
window.debugLongestRoadPath = function(playerIndex = null) {
  if (!window.players || window.players.length === 0) {
    console.log('No players available');
    return;
  }
  
  const player = playerIndex !== null ? window.players[playerIndex] : window.players[window.activePlayerIdx || 0];
  console.log(`\n=== DEBUG LONGEST ROAD PATH FOR ${player.name} ===`);
  
  if (!player.roads || player.roads.length === 0) {
    console.log('Player has no roads');
    return;
  }
  
  // Build adjacency list
  const adjacencyList = new Map();
  player.roads.forEach(road => {
    const key = `${road.q},${road.r},${road.edge}`;
    adjacencyList.set(key, []);
  });
  
  // Find connections
  player.roads.forEach((road1, i) => {
    const key1 = `${road1.q},${road1.r},${road1.edge}`;
    player.roads.forEach((road2, j) => {
      if (i === j) return;
      const connected = testRoadConnectionActual(road1, road2);
      if (connected) {
        const key2 = `${road2.q},${road2.r},${road2.edge}`;
        adjacencyList.get(key1).push(key2);
      }
    });
  });
  
  console.log('Adjacency list:');
  adjacencyList.forEach((neighbors, road) => {
    console.log(`  ${road}: [${neighbors.join(', ')}]`);
  });
  
  // Find longest path from each starting point
  let maxLength = 0;
  let bestPath = [];
  
  adjacencyList.forEach((neighbors, startRoad) => {
    console.log(`\nStarting DFS from ${startRoad}:`);
    const visited = new Set();
    const path = [];
    const result = dfsWithPath(adjacencyList, startRoad, visited, path);
    
    console.log(`  Path length: ${result.length}`);
    console.log(`  Path: ${result.path.join(' -> ')}`);
    
    if (result.length > maxLength) {
      maxLength = result.length;
      bestPath = result.path;
    }
  });
  
  console.log(`\nBest path found:`);
  console.log(`Length: ${maxLength}`);
  console.log(`Path: ${bestPath.join(' -> ')}`);
  
  console.log(`\n=== END DEBUG ===`);
  
  return { maxLength, bestPath };
};

// Helper function for DFS with path tracking
function dfsWithPath(adjacencyList, current, visited, path) {
  visited.add(current);
  path.push(current);
  
  let maxLength = 0;
  let bestPath = [...path];
  
  const neighbors = adjacencyList.get(current) || [];
  
  for (const neighbor of neighbors) {
    if (!visited.has(neighbor)) {
      const result = dfsWithPath(adjacencyList, neighbor, visited, path);
      if (result.length > maxLength) {
        maxLength = result.length;
        bestPath = result.path;
      }
    }
  }
  
  visited.delete(current);
  path.pop();
  
  return { length: maxLength + 1, path: bestPath };
}

// Function to simulate building roads one by one and track achievement changes
window.simulateRoadBuilding = function(playerIndex = null) {
  if (!window.players || window.players.length === 0) {
    console.log('No players available');
    return;
  }
  
  const player = playerIndex !== null ? window.players[playerIndex] : window.players[window.activePlayerIdx || 0];
  const originalRoads = [...player.roads];
  
  console.log(`\n=== SIMULATING ROAD BUILDING FOR ${player.name} ===`);
  
  // Clear roads
  player.roads = [];
  
  // Add roads one by one
  originalRoads.forEach((road, i) => {
    console.log(`\nBuilding road ${i + 1}: {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
    player.roads.push(road);
    
    // Calculate longest road
    const longestLength = window.calculateLongestRoad ? window.calculateLongestRoad(player) : 0;
    console.log(`  Longest road after building: ${longestLength}`);
    
    // Update victory points
    if (window.updateLongestRoad) {
      window.updateLongestRoad(window.players);
    }
    
    const hasAchievement = player.victoryPoints?.longestRoad > 0;
    console.log(`  Has achievement: ${hasAchievement}`);
    
    if (hasAchievement && longestLength < 5) {
      console.log(`  ⚠️  WARNING: Has achievement but longest road is only ${longestLength}`);
    }
    if (!hasAchievement && longestLength >= 5) {
      console.log(`  ⚠️  WARNING: No achievement but longest road is ${longestLength}`);
    }
  });
  
  console.log(`\n=== SIMULATION COMPLETE ===`);
};

// Function to test specific road connection
window.testSpecificConnection = function(road1, road2) {
  console.log(`\n=== TESTING SPECIFIC CONNECTION ===`);
  console.log(`Road 1: {q: ${road1.q}, r: ${road1.r}, edge: ${road1.edge}}`);
  console.log(`Road 2: {q: ${road2.q}, r: ${road2.r}, edge: ${road2.edge}}`);
  
  const connected = testRoadConnectionActual(road1, road2);
  console.log(`Connected: ${connected}`);
  
  // Show detailed analysis
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge
  const [nq1, nr1] = [road1.q + directions[road1.edge][0], road1.r + directions[road1.edge][1]];
  const oppositeEdge1 = (road1.edge + 3) % 6;
  const sameEdge1 = (nq1 === road2.q && nr1 === road2.r && oppositeEdge1 === road2.edge);
  
  const [nq2, nr2] = [road2.q + directions[road2.edge][0], road2.r + directions[road2.edge][1]];
  const oppositeEdge2 = (road2.edge + 3) % 6;
  const sameEdge2 = (nq2 === road1.q && nr2 === road1.r && oppositeEdge2 === road1.edge);
  
  console.log(`Same edge check 1: ${sameEdge1} (${road1.q},${road1.r},${road1.edge} -> neighbor (${nq1},${nr1}) vs (${road2.q},${road2.r},${road2.edge}) with opposite edge ${oppositeEdge1})`);
  console.log(`Same edge check 2: ${sameEdge2} (${road2.q},${road2.r},${road2.edge} -> neighbor (${nq2},${nr2}) vs (${road1.q},${road1.r},${road1.edge}) with opposite edge ${oppositeEdge2})`);
  
  // Method 2: Same tile adjacent
  const sameTile = (road1.q === road2.q && road1.r === road2.r);
  let adjacent = false;
  if (sameTile) {
    const edgeDiff = Math.abs(road1.edge - road2.edge);
    adjacent = (edgeDiff === 1 || edgeDiff === 5);
  }
  console.log(`Same tile adjacent: ${adjacent} (same tile: ${sameTile})`);
  
  // Method 3: Vertex sharing
  const vertices1 = getRoadVerticesSimple(road1);
  const vertices2 = getRoadVerticesSimple(road2);
  let sharedVertex = false;

  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqualSimple(v1, v2)) {
        console.log(`Shared vertex found: {q: ${v1.q}, r: ${v1.r}, corner: ${v1.corner}}`);
        sharedVertex = true;
        break;
      }
    }
    if (sharedVertex) break;
  }

  console.log(`Vertex sharing: ${sharedVertex}`);
  console.log(`=== END TEST ===`);
};

// Function to analyze actual roads in the game
window.analyzeActualRoads = function() {
  console.log('\n=== ANALYZING ACTUAL ROADS IN GAME ===');
  
  if (!window.players || !Array.isArray(window.players)) {
    console.log('No players array found');
    return;
  }
  
  window.players.forEach((player, i) => {
    console.log(`\nPlayer ${i + 1} (${player.name}):`);
    console.log(`  Roads: ${player.roads ? player.roads.length : 0}`);
    
    if (player.roads && player.roads.length > 0) {
      player.roads.forEach((road, j) => {
        console.log(`    ${j + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
      });
    }
  });
  
  console.log('\n=== END ANALYSIS ===');
};

// Function to test road connection logic
window.testRoadConnectionLogic = function() {
  console.log('\n=== TESTING ROAD CONNECTION LOGIC ===');
  
  // Test case 1: Same physical edge from different tiles
  console.log('\n--- Test 1: Same physical edge ---');
  const road1 = { q: 0, r: 0, edge: 0 };
  const road2 = { q: 0, r: -1, edge: 3 };
  console.log(`Road 1: {q: ${road1.q}, r: ${road1.r}, edge: ${road1.edge}}`);
  console.log(`Road 2: {q: ${road2.q}, r: ${road2.r}, edge: ${road2.edge}}`);
  console.log(`Should connect: ${testRoadConnectionActual(road1, road2)}`);
  
  // Test case 2: Adjacent edges on same tile
  console.log('\n--- Test 2: Adjacent edges on same tile ---');
  const road3 = { q: 0, r: 0, edge: 0 };
  const road4 = { q: 0, r: 0, edge: 1 };
  console.log(`Road 3: {q: ${road3.q}, r: ${road3.r}, edge: ${road3.edge}}`);
  console.log(`Road 4: {q: ${road4.q}, r: ${road4.r}, edge: ${road4.edge}}`);
  console.log(`Should connect: ${testRoadConnectionActual(road3, road4)}`);
  
  // Test case 3: Roads that should NOT connect
  console.log('\n--- Test 3: Roads that should NOT connect ---');
  const road5 = { q: 0, r: 0, edge: 0 };
  const road6 = { q: 1, r: 1, edge: 3 };
  console.log(`Road 5: {q: ${road5.q}, r: ${road5.r}, edge: ${road5.edge}}`);
  console.log(`Road 6: {q: ${road6.q}, r: ${road6.r}, edge: ${road6.edge}}`);
  console.log(`Should NOT connect: ${testRoadConnectionActual(road5, road6)}`);
  
  console.log('\n=== END CONNECTION LOGIC TEST ===');
};

// Function to test a 5-road chain
window.testFiveRoadChain = function() {
  console.log('\n=== TESTING 5-ROAD CHAIN ===');
  
  const testRoads = [
    { q: 0, r: 0, edge: 0 },  // Starting road
    { q: 0, r: 0, edge: 1 },  // Adjacent on same tile
    { q: 0, r: 0, edge: 2 },  // Adjacent on same tile
    { q: 1, r: 0, edge: 5 },  // Connected to edge 2 from neighbor tile
    { q: 1, r: 0, edge: 0 }   // Adjacent on same tile
  ];
  
  console.log('Test roads:');
  testRoads.forEach((road, i) => {
    console.log(`  ${i + 1}. {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  // Test connections
  console.log('\nConnection tests:');
  for (let i = 0; i < testRoads.length - 1; i++) {
    const connected = testRoadConnectionActual(testRoads[i], testRoads[i + 1]);
    console.log(`  Road ${i + 1} -> Road ${i + 2}: ${connected}`);
  }
  
  // Calculate longest road
  const longestLength = calculateLongestRoadFromArray(testRoads);
  console.log(`\nLongest road length: ${longestLength}`);
  
  console.log('\n=== END 5-ROAD CHAIN TEST ===');
};

// Function to add test roads to current player
window.addTestRoads = function() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== ADDING TEST ROADS ===');
  
  const testRoads = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 0, r: 0, edge: 2 },
    { q: 1, r: 0, edge: 5 },
    { q: 1, r: 0, edge: 0 }
  ];
  
  if (!window.currentPlayer.roads) {
    window.currentPlayer.roads = [];
  }
  
  testRoads.forEach((road, i) => {
    window.currentPlayer.roads.push(road);
    console.log(`Added road ${i + 1}: {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
  });
  
  console.log(`Total roads for ${window.currentPlayer.name}: ${window.currentPlayer.roads.length}`);
  console.log('\n=== TEST ROADS ADDED ===');
};

// Function to clear test roads
window.clearTestRoads = function() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== CLEARING TEST ROADS ===');
  const originalCount = window.currentPlayer.roads ? window.currentPlayer.roads.length : 0;
  window.currentPlayer.roads = [];
  console.log(`Cleared ${originalCount} roads from ${window.currentPlayer.name}`);
  console.log('\n=== TEST ROADS CLEARED ===');
};

// Function to check longest road achievement
window.checkLongestRoadAchievement = function() {
  console.log('\n=== CHECKING LONGEST ROAD ACHIEVEMENT ===');
  
  if (!window.players || !Array.isArray(window.players)) {
    console.log('No players array found');
    return;
  }
  
  let longestRoadHolder = null;
  let maxLength = 0;
  
  window.players.forEach((player, i) => {
    const roads = player.roads || [];
    const length = calculateLongestRoad(player);
    
    console.log(`Player ${i + 1} (${player.name}): ${length} roads`);
    console.log(`  Roads: ${roads.length}`);
    
    if (length > maxLength) {
      maxLength = length;
      longestRoadHolder = player;
    }
  });
  
  console.log(`\nLongest road: ${maxLength} roads`);
  console.log(`Holder: ${longestRoadHolder ? longestRoadHolder.name : 'None'}`);
  console.log(`Achievement threshold: 5 roads`);
  console.log(`Achievement earned: ${maxLength >= 5 ? 'YES' : 'NO'}`);
  
  console.log('\n=== END ACHIEVEMENT CHECK ===');
};

// Function to debug longest road path
window.debugLongestRoadPath = function() {
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  console.log('\n=== DEBUGGING LONGEST ROAD PATH ===');
  
  const roads = window.currentPlayer.roads || [];
  console.log(`Player: ${window.currentPlayer.name}`);
  console.log(`Total roads: ${roads.length}`);
  
  if (roads.length === 0) {
    console.log('No roads to analyze');
    return;
  }
  
  // Build adjacency list
  const adjacencyList = {};
  roads.forEach((road, i) => {
    adjacencyList[i] = [];
  });
  
  for (let i = 0; i < roads.length; i++) {
    for (let j = i + 1; j < roads.length; j++) {
      if (testRoadConnectionActual(roads[i], roads[j])) {
        adjacencyList[i].push(j);
        adjacencyList[j].push(i);
      }
    }
  }
  
  console.log('\nAdjacency list:');
  Object.keys(adjacencyList).forEach(i => {
    const road = roads[i];
    const connections = adjacencyList[i];
    console.log(`  Road ${i} {q: ${road.q}, r: ${road.r}, edge: ${road.edge}} -> [${connections.join(', ')}]`);
  });
  
  // Find longest path
  const longestLength = calculateLongestRoadFromArray(roads);
  console.log(`\nLongest road length: ${longestLength}`);
  
  console.log('\n=== END PATH DEBUG ===');
};

// Function to simulate road building
window.simulateRoadBuilding = function() {
  console.log('\n=== SIMULATING ROAD BUILDING ===');
  
  if (!window.currentPlayer) {
    console.log('No current player found');
    return;
  }
  
  // Clear existing roads
  window.currentPlayer.roads = [];
  
  const roadSequence = [
    { q: 0, r: 0, edge: 0 },
    { q: 0, r: 0, edge: 1 },
    { q: 0, r: 0, edge: 2 },
    { q: 1, r: 0, edge: 5 },
    { q: 1, r: 0, edge: 0 }
  ];
  
  roadSequence.forEach((road, i) => {
    window.currentPlayer.roads.push(road);
    const currentLength = calculateLongestRoad(window.currentPlayer);
    
    console.log(`Step ${i + 1}: Added road {q: ${road.q}, r: ${road.r}, edge: ${road.edge}}`);
    console.log(`  Current longest road: ${currentLength}`);
    console.log(`  Total roads: ${window.currentPlayer.roads.length}`);
    
    if (currentLength >= 5) {
      console.log(`  🏆 ACHIEVEMENT UNLOCKED! Longest road (${currentLength} roads)`);
    }
  });
  
  console.log('\n=== SIMULATION COMPLETE ===');
};
