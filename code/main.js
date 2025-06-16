import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './modules/scene.js';
import { camera } from './modules/camera.js';
import { setupLights } from './modules/lights.js';
import { createHexGrid } from './modules/hexGrid.js'; 
import { createDirectionArrows } from './modules/directionArrows.js'; 
import { createGameBoard, addNumberTokensToTiles, updateNumberTokensFacingCamera, updateNumberTokensForRobber } from './modules/game_board.js';
import { animateHalos, highlightNumberTokens, getTileWorldPosition } from './modules/tileHighlight.js'; 
import { rollDice, showDice, throwPhysicsDice, updateDicePhysics, setDebugDiceValue, toggleDebugDiceMode } from './modules/dice.js';
import { tileInfo } from './modules/tileInfo.js';
import { createPlaceholderCards } from './modules/placeholderCards.js';
import { createResourceUI, updateResourceUI, handleResourceKeydown } from './modules/uiResources.js';
import { createDiceUI, setDiceResult } from './modules/uiDice.js';
import { initTileInfoOverlay, createInfoOverlayToggle } from './modules/uiTileInfo.js';
import { initializeRobber, showBanditOnTile, hideBandit, startRobberPlacement, handleTileSelection, isInRobberPlacementMode, cancelRobberPlacement, getTileCenter } from './modules/bandit.js';
import { players, tryBuildSettlement, tryBuildCity, tryBuildRoad } from './modules/buildLogic.js';
import { getCornerWorldPosition } from './modules/tileHighlight.js';
import { setupBuildPreview } from './modules/uiBuildPreview.js';
import { createBuildUI } from './modules/uiBuild.js';
import { setupBuildEventHandler } from './modules/buildEventHandlers.js';
import CardManager from './modules/cards.js';

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

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

// Initialize robber position and update number token colors
// At start, the robber is on the desert tile at 0,0, which has no number token
// Wait a bit for all tokens to load before applying the colors
const initialRobberTileKey = '0,0';
// Use a slight delay to ensure all tokens are created
setTimeout(() => {
  console.log("Setting initial token colors for robber on desert");
  updateNumberTokensForRobber(initialRobberTileKey);
}, 500);

// Initialize the robber on the desert tile (q=0, r=0)
// We now pass tileMeshes to use the accurate center position calculation
console.log("Initializing robber on the desert tile");
initializeRobber(scene, null, tileMeshes);

// Platzhalter-Spielkarten erstellen
createPlaceholderCards(scene);
// === JPEG-Karten laden und zur Szene hinzufügen ===
const cardManager = new CardManager();
cardManager.loadAllCards().catch(error => console.error("Fehler beim Laden der Karten:", error));

// Ressourcen-UI anzeigen
createResourceUI();

let buildMode = 'settlement'; // 'settlement' or 'city'
let activePlayerIdx = 0;

updateResourceUI(players[activePlayerIdx]); // Show initial player resources

// UI-Elemente für Würfeln
createDiceUI(() => {
  throwPhysicsDice(scene);
  window.setDiceResultFromPhysics = (result) => {
    setDiceResult(result.sum); // Zeige die Summe im UI
    window.dispatchEvent(new CustomEvent('diceRolled', { detail: result.sum }));
  };
});
createInfoOverlayToggle();

// Info-Overlay und Mousemove-Handling für Tile-Infos
initTileInfoOverlay(scene, camera);

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

// Handle escape key to cancel robber placement
window.addEventListener('keydown', (event) => {
    if (event.key === 'Escape' && isInRobberPlacementMode()) {
        cancelRobberPlacement();
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

// Highlight-Logik bei Würfelergebnis
window.addEventListener('diceRolled', (e) => {
    highlightNumberTokens(scene, tileMeshes, tileNumbers, e.detail);
});

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
});

// Handle 7 being rolled
window.addEventListener('diceRolled', (e) => {
    if (e.detail === 7) {
        // Start robber placement mode
        startRobberPlacement(tileMeshes, tileNumbers);
    }
});

// === Build Mode UI ===
createBuildUI({
  players,
  getBuildMode: () => buildMode,
  setBuildMode: (mode) => { buildMode = mode; },
  getActivePlayerIdx: () => activePlayerIdx,
  setActivePlayerIdx: (idx) => {
    activePlayerIdx = idx;
    updateResourceUI(players[activePlayerIdx]); // Update resource UI on player switch
  }
});

// === Build Event Handler Setup ===
setupBuildEventHandler({
  renderer,
  scene,
  camera,
  tileMeshes,
  players,
  getBuildMode: () => buildMode,
  getActivePlayerIdx: () => activePlayerIdx,
  tryBuildSettlement,
  tryBuildCity,
  tryBuildRoad, // <--- HINZUGEFÜGT
  getCornerWorldPosition,
  updateResourceUI: () => updateResourceUI(players[activePlayerIdx]) // Always update for current player
});

// === Build Preview Setup ===
setupBuildPreview(
  renderer,
  scene,
  camera,
  tileMeshes,
  players,
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
        
        // Display the message in the UI
        const messageEl = document.createElement('div');
        messageEl.className = 'debug-message';
        messageEl.textContent = message;
        messageEl.style.position = 'fixed';
        messageEl.style.bottom = '20px';
        messageEl.style.left = '20px';
        messageEl.style.padding = '10px';
        messageEl.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
        messageEl.style.color = 'white';
        messageEl.style.borderRadius = '5px';
        messageEl.style.zIndex = '1000';
        messageEl.style.fontFamily = "'Montserrat', Arial, sans-serif";
        document.body.appendChild(messageEl);
          // Create a debug indicator that stays when in debug mode
        let debugIndicator = document.getElementById('debug-dice-indicator');
        if (window.debugDiceEnabled) {
            if (!debugIndicator) {
                debugIndicator = document.createElement('div');
                debugIndicator.id = 'debug-dice-indicator';
                debugIndicator.textContent = '🎲 ALWAYS 7 MODE';
                debugIndicator.style.position = 'fixed';
                debugIndicator.style.top = '6em';
                debugIndicator.style.right = '20px';
                debugIndicator.style.padding = '5px 10px';
                debugIndicator.style.backgroundColor = 'rgba(255, 50, 50, 0.85)';
                debugIndicator.style.color = 'white';
                debugIndicator.style.borderRadius = '5px';
                debugIndicator.style.zIndex = '1000';
                debugIndicator.style.fontFamily = "'Montserrat', Arial, sans-serif";
                debugIndicator.style.fontSize = '0.85em';
                debugIndicator.style.fontWeight = 'bold';
                debugIndicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
                document.body.appendChild(debugIndicator);
            }
        } else if (debugIndicator) {
            document.body.removeChild(debugIndicator);
        }
        
        // Remove the message after 3 seconds
        setTimeout(() => {
            if (messageEl.parentNode) {
                document.body.removeChild(messageEl);
            }
        }, 3000);
    }
});
