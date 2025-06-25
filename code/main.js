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
import { initTileInfoOverlay, createInfoOverlayToggle } from './modules/uiTileInfo.js';
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

window.players = window.players || [
  {
    name: 'Spieler 1',
    color: 0xd7263d,
    settlements: [],
    cities: [],
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 }
  },
  {
    name: 'Spieler 2',
    color: 0x277da1,
    settlements: [],
    cities: [],
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 }
  }
];

window.updateResourceUI = updateResourceUI;

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// === Haupt-Button-Leiste (Action Bar) ===
let actionBar = document.getElementById('main-action-bar');
if (!actionBar) {
  actionBar = document.createElement('div');
  actionBar.id = 'main-action-bar';
  document.body.appendChild(actionBar);
}

// === Initialisiere Spielfeld und UI erst nach Spielstart ===
function startGame() {
  console.log('startGame() wurde aufgerufen!');
  let actionBar = document.getElementById('main-action-bar');
  console.log('actionBar:', actionBar);

  console.log('Starte Spiel: Initialisiere UI und Spielfeld...');
  try {
    createBuildUI({
      players,
      getBuildMode: () => buildMode,
      setBuildMode: (mode) => { buildMode = mode; },
      getActivePlayerIdx: () => activePlayerIdx,
      setActivePlayerIdx: (idx) => {
        activePlayerIdx = idx;
        updateResourceUI(players[activePlayerIdx]);
        updatePlayerOverviews(players, () => activePlayerIdx);
      },
      parent: actionBar
    });
    console.log('Build-UI erstellt:', document.getElementById('build-ui'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Build-UI:', e);
  }

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

  try {
    placePlayerSwitchButton(players, () => activePlayerIdx, (idx) => {
      activePlayerIdx = idx;
      updateResourceUI(players[activePlayerIdx]);
      updatePlayerOverviews(players, () => activePlayerIdx);
    }, actionBar);
    console.log('Player-Switch-Button erstellt:', document.getElementById('player-switch-btn'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Player-Switch-Buttons:', e);
  }

  try {
    createResourceUI();
    updateResourceUI(players[activePlayerIdx]);
    console.log('Ressourcen-UI erstellt:', document.getElementById('ressource-ui'));
  } catch (e) {
    console.error('Fehler beim Erstellen der Ressourcen-UI:', e);
  }

  try {
    createPlayerOverviews(players, () => activePlayerIdx);
    updatePlayerOverviews(players, () => activePlayerIdx);
    console.log('Player-Overviews erstellt:', document.getElementById('player-overview-container'));
  } catch (e) {
    console.error('Fehler beim Erstellen der Player-Overviews:', e);
  }

  try {
    createInfoOverlayToggle();
    initTileInfoOverlay(scene, camera);
    console.log('Info-Overlay erstellt:', document.getElementById('infoOverlay'));
  } catch (e) {
    console.error('Fehler beim Erstellen des Info-Overlays:', e);
  }

  try {
    createPlaceholderCards(scene);
    const cardManager = new CardManager();
    cardManager.loadAllCards().then(() => {
      console.log('Karten geladen:', cardManager.getCards());
    }).catch(error => console.error("Fehler beim Laden der Karten:", error));
  } catch (e) {
    console.error('Fehler beim Erstellen der Karten:', e);
  }
}

// === Main-Menu-Start-Button-Handler ===
window.addEventListener('DOMContentLoaded', () => {
  console.log('DOM geladen, versuche Start-Button-Handler zu setzen...');
  const menu = document.getElementById('main-menu');
  const startBtn = document.getElementById('start-game');
  if (startBtn) {
    console.log('Start-Button gefunden und Handler gesetzt.');
    startBtn.onclick = () => {
      console.log('Start-Button wurde geklickt!');
      if (menu) menu.style.display = 'none';
      startGame();
    };
  } else {
    console.error('Start-Button NICHT gefunden!');
  }
});

// Debug flags
window.debugDiceEnabled = false; // Initialize debug mode as disabled

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4; // 45° von oben
controls.maxPolarAngle = Math.PI * 0.44; // ca. 79°, verhindert "unter das Feld schauen"
controls.minDistance = 10;  // Näher ranzoomen von oben möglich
controls.maxDistance = 55; // Maximaler Zoom (z. B. 100 Einheiten vom Zentrum)

scene.add(createHexGrid());
createDirectionArrows(scene);

setupLights(scene);

// Erstelle das Spielfeld direkt in game_board.js
// createGameBoard(scene); // loadTile() wird nun dort für jedes einzelne Tile genutzt!
const { tileMeshes, tileNumbers } = createGameBoard(scene);
// Nach dem Erstellen des Spielfelds: Number Tokens hinzufügen
addNumberTokensToTiles(scene, tileMeshes, tileNumbers);

// === Robber erst initialisieren, wenn das Wüstenfeld-Mesh geladen ist ===
const initialRobberTileKey = '0,0';
function waitForDesertTileAndInitRobber(retries = 20) {
  if (tileMeshes[initialRobberTileKey]) {
    // Number token colors setzen
    setTimeout(() => {
      console.log("Setting initial token colors for robber on desert");
      updateNumberTokensForRobber(initialRobberTileKey);
    }, 200);
    // Robber initialisieren
    console.log("Initializing robber on the desert tile");
    initializeRobber(scene, null, tileMeshes);
  } else if (retries > 0) {
    setTimeout(() => waitForDesertTileAndInitRobber(retries - 1), 100);
  } else {
    console.warn("Desert tile mesh (0,0) not found after waiting. Robber not initialized.");
  }
}
waitForDesertTileAndInitRobber();

// Platzhalter-Spielkarten erstellen
createPlaceholderCards(scene);
// === JPEG-Karten laden und zur Szene hinzufügen ===
const cardManager = new CardManager();
cardManager.loadAllCards().catch(error => console.error("Fehler beim Laden der Karten:", error));

// Ressourcen-UI anzeigen
createResourceUI();

let buildMode = 'settlement'; // 'settlement' or 'city'
let activePlayerIdx = 0;

updateResourceUI(window.players[activePlayerIdx], activePlayerIdx); // Show initial player resources

// UI-Elemente für Würfeln
createDiceUI(() => {
  throwPhysicsDice(scene);
  window.setDiceResultFromPhysics = (result) => {
    setDiceResult(result.sum); // Zeige die Summe im UI
    window.dispatchEvent(new CustomEvent('diceRolled', { detail: result.sum }));
  };
});
//createInfoOverlayToggle();  //auskommentiert wegen doppelter Initialisierung

// Info-Overlay und Mousemove-Handling für Tile-Infos
//initTileInfoOverlay(scene, camera); //auskommentiert wegen doppelter Initialisierung

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
            // Add a visible error message to help with debugging
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

// Handle 7 being rolled
window.addEventListener('diceRolled', (e) => {
    if (e.detail === 7) {
        // Start robber placement mode
        startRobberPlacement(tileMeshes, tileNumbers);
        
        // Block dice rolls until robber is placed
        blockDiceRolls("Platziere zuerst den Räuber");
    }
});

// === Build Mode UI ===
createBuildUI({
  players: window.players,
  getBuildMode: () => buildMode,
  setBuildMode: (mode) => { buildMode = mode; },
  getActivePlayerIdx: () => activePlayerIdx,
  setActivePlayerIdx: (idx) => {
    activePlayerIdx = idx;
    updateResourceUI(players[activePlayerIdx]); // Update resource UI on player switch
    updatePlayerOverviews(players, () => activePlayerIdx);
    updateResourceUI(window.players[activePlayerIdx], activePlayerIdx); // Update resource UI on player switch
  }
});
// === Spielerwechsel-Button UI ===
placePlayerSwitchButton(players, () => activePlayerIdx, (idx) => {
  activePlayerIdx = idx;
  updateResourceUI(players[activePlayerIdx]);
  updatePlayerOverviews(players, () => activePlayerIdx);
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
