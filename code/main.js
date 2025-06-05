import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './modules/scene.js';
import { camera } from './modules/camera.js';
import { setupLights } from './modules/lights.js';
import { createHexGrid } from './modules/hexGrid.js'; 
import { createDirectionArrows } from './modules/directionArrows.js'; 
import { createGameBoard, addNumberTokensToTiles, updateNumberTokensFacingCamera, highlightNumberTokens } from './modules/game_board.js'; 
import { rollDice, showDice } from './modules/dice.js';
import { tileInfo } from './modules/tileInfo.js';
import { createPlaceholderCards } from './modules/placeholderCards.js';

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;
controls.minDistance = 10;  // Minimaler Zoom (z. B. 10 Einheiten vom Zentrum)
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

// UI-Elemente für Würfeln
const diceUI = document.createElement('div');
diceUI.id = 'dice-ui';
diceUI.style.position = 'absolute';
diceUI.style.top = '2em';
diceUI.style.left = '2em';
diceUI.style.zIndex = '5';
diceUI.style.display = 'flex';
diceUI.style.flexDirection = 'column';
diceUI.style.alignItems = 'flex-start';
document.body.appendChild(diceUI);

diceUI.innerHTML = `
  <button id="roll-dice" style="font-size: 1.5em; padding: 0.5em 2em; margin-bottom: 0.5em; cursor: pointer;">Würfeln</button>
  <div id="dice-result" style="color: #fff; font-size: 2em; min-width: 2em; min-height: 1.5em; text-shadow: 0 2px 8px #000; font-family: 'Montserrat', Arial, sans-serif; display: inline-block; margin-left: 1em; vertical-align: middle;"></div>
`;

const diceBtn = document.getElementById('roll-dice');
const diceResult = document.getElementById('dice-result');

diceBtn.onclick = () => {
  const roll = rollDice();
  showDice(scene, roll); // Keine Position übergeben, damit Standard (Mitte) genutzt wird
  // Zeige das Ergebnis oben links neben dem Button an
  diceResult.textContent = roll;
  diceResult.style.color = '#fff';
  window.dispatchEvent(new CustomEvent('diceRolled', { detail: roll }));
};

// Raycaster und Maus-Tracking für Tile-Infos
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

window.addEventListener('mousemove', onMouseMove, false);

function onMouseMove(event) {
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);

    // Tiles aus game_board.js holen
    const hexGroup = scene.getObjectByName('HexGroup'); // HexGroup muss benannt werden
    if (!hexGroup) return;
    const intersects = raycaster.intersectObjects(hexGroup.children, true);

    if (intersects.length > 0) {
        const hovered = intersects[0].object;
        // Versuche den Tile-Typ aus dem Dateinamen zu extrahieren
        let tileType = null;
        if (hovered.parent && hovered.parent.name) {
            tileType = hovered.parent.name.replace('.glb', '');
        }
        if (tileInfo[tileType]) {
            showInfoOverlay(tileInfo[tileType], event.clientX, event.clientY);
        }
    } else {
        hideInfoOverlay();
    }
}

function showInfoOverlay(info, x, y) {
    const overlay = document.getElementById('infoOverlay');
    document.getElementById('infoTitle').textContent = info.name;
    document.getElementById('infoDesc').textContent = info.description;
    overlay.style.display = 'block';
    overlay.style.left = `${x + 20}px`;
    overlay.style.top = `${y - 10}px`;
}

function hideInfoOverlay() {
    document.getElementById('infoOverlay').style.display = 'none';
}

// Animation
function animate() {
    updateNumberTokensFacingCamera(scene, camera);
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
