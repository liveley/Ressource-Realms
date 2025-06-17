import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './modules/scene.js';
import { camera } from './modules/camera.js';
import { setupLights } from './modules/lights.js';
import { createHexGrid } from './modules/hexGrid.js'; 
import { createDirectionArrows } from './modules/directionArrows.js'; 
import { createGameBoard, addNumberTokensToTiles, updateNumberTokensFacingCamera } from './modules/game_board.js';
import { animateHalos, highlightNumberTokens, getTileWorldPosition } from './modules/tileHighlight.js'; 
import { rollDice, showDice, throwPhysicsDice, updateDicePhysics } from './modules/dice.js';
import { tileInfo } from './modules/tileInfo.js';
import { createPlaceholderCards } from './modules/placeholderCards.js';
import { createResourceUI, updateResourceUI, handleResourceKeydown } from './modules/uiResources.js';
import { createDiceUI, setDiceResult } from './modules/uiDice.js';
import { initTileInfoOverlay, createInfoOverlayToggle } from './modules/uiTileInfo.js';
import { showBanditOnTile, hideBandit } from './modules/bandit.js';
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

// === Bandit-Logik: Zeige Bandit auf Wüste, wenn eine 7 gewürfelt wurde ===
window.addEventListener('diceRolled', (e) => {
    if (e.detail === 7) {
        const desertPos = getTileWorldPosition(0, 0); // axial 0,0 = Wüste
        showBanditOnTile(scene, desertPos);
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
