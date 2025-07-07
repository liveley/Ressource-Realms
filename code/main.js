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
import { initializeVictoryPoints, updateAllVictoryPoints, getVictoryPointsForDisplay, debugRoadConnections, calculateLongestRoad } from './modules/victoryPoints.js';
import { enableRoadDebug, disableRoadDebug, analyzePlayerRoads, testRoadConnections, toggleRoadDebugTools, isRoadDebugToolsVisible } from './modules/debugging/longestRoadDebug.js';
import { initRoadTestingUtils } from './modules/debugging/roadTestingUtils.js';

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

// Track pressed keys for combination detection
let pressedKeys = new Set();
let rdCombinationPressed = false;

// Toggle dice debug mode when pressing 'D', and road debug when pressing R+D
window.addEventListener('keydown', (e) => {
    // Add the pressed key to the set
    pressedKeys.add(e.key.toLowerCase());
    
    // Check for R+D combination for road debug (only trigger once per combination)
    if (pressedKeys.has('r') && pressedKeys.has('d') && !rdCombinationPressed) {
        rdCombinationPressed = true;
        
        // Toggle road debug tools
        const isVisible = toggleRoadDebugTools();
        
        console.log(isVisible ? '=== ROAD DEBUG TOOLS ACTIVATED ===' : '=== ROAD DEBUG TOOLS DEACTIVATED ===');
        
        if (isVisible) {
            // Show road debug tools
            if (window.players && window.players.length > 0) {
                const activePlayer = window.players[window.activePlayerIdx || 0];
                console.log(`\nAnalyzing roads for ${activePlayer.name}:`);
                analyzePlayerRoads(activePlayer);
                
                console.log('\nRunning road connection tests:');
                testRoadConnections();
            } else {
                console.log('No players found for road analysis');
            }
            
            // Show debug message
            showDebugMessage('Road Debug Tools Activated - Check Panel & Console', 3000);
        } else {
            // Show debug message
            showDebugMessage('Road Debug Tools Deactivated', 2000);
        }
        
        return;
    }
    
    // Original dice debug functionality (D key only)
    if (e.key === 'd' || e.key === 'D') {
        // Only trigger dice debug if R is not also pressed
        if (!pressedKeys.has('r')) {
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
    }
});

// Clean up pressed keys on keyup
window.addEventListener('keyup', (e) => {
    pressedKeys.delete(e.key.toLowerCase());
    
    // Reset R+D combination flag when either key is released
    if (e.key.toLowerCase() === 'r' || e.key.toLowerCase() === 'd') {
        rdCombinationPressed = false;
    }
});

// Globale Hilfsfunktion für Entwicklungskarten-Logik (z.B. Monopol)
window.getAllPlayers = function() {
  return window.players;
};

window.startRobberPlacement = startRobberPlacement;
