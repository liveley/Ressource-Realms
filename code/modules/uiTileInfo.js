// modules/uiTileInfo.js
// Info-Overlay und Mousemove-Handling für Tile-Infos
import * as THREE from 'three';
import { tileInfo } from './tileInfo.js';

let infoOverlayEnabled = true;
let infoToggleBtn = null;

export function initTileInfoOverlay(scene, camera) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function isGameActive() {
    // Das Menü ist nur sichtbar, wenn das Spiel noch nicht gestartet wurde
    const menu = document.getElementById('main-menu');
    return !menu || menu.style.display === 'none';
  }

  function onMouseMove(event) {
    if (!isGameActive() || !isInfoOverlayEnabled()) {
      hideInfoOverlay();
      return;
    }
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    raycaster.setFromCamera(mouse, camera);
    const hexGroup = scene.getObjectByName('HexGroup');
    if (!hexGroup) return;
    const intersects = raycaster.intersectObjects(hexGroup.children, true);
    if (intersects.length > 0) {
      const hovered = intersects[0].object;
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

  window.addEventListener('mousemove', onMouseMove, false);
}

export function createInfoOverlayToggle() {
  // Erstelle einen eigenen Container für den TileInfo-Button oben links
  let tileInfoContainer = document.getElementById('tileinfo-ui');
  if (!tileInfoContainer) {
    tileInfoContainer = document.createElement('div');
    tileInfoContainer.id = 'tileinfo-ui';
    tileInfoContainer.style.position = 'absolute';
    tileInfoContainer.style.top = '6em';
    tileInfoContainer.style.left = '2em';
    tileInfoContainer.style.zIndex = '15';
    document.body.appendChild(tileInfoContainer);
  }
  infoToggleBtn = document.createElement('button');
  infoToggleBtn.id = 'toggle-info-overlay';
  infoToggleBtn.textContent = infoOverlayEnabled ? 'Tile-Info: AN' : 'Tile-Info: AUS';
  infoToggleBtn.style.marginTop = '0.5em';
  infoToggleBtn.style.fontSize = '1em';
  infoToggleBtn.style.padding = '0.3em 1.2em';
  infoToggleBtn.style.borderRadius = '7px';
  infoToggleBtn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
  infoToggleBtn.style.border = 'none';
  infoToggleBtn.style.fontFamily = "'Montserrat', Arial, sans-serif";
  infoToggleBtn.style.fontWeight = '700';
  infoToggleBtn.style.cursor = 'pointer';
  infoToggleBtn.style.boxShadow = '0 1px 4px #0001';
  infoToggleBtn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s';
  infoToggleBtn.onclick = () => {
    infoOverlayEnabled = !infoOverlayEnabled;
    infoToggleBtn.textContent = infoOverlayEnabled ? 'Tile-Info: AN' : 'Tile-Info: AUS';
    if (!infoOverlayEnabled) {
      const overlay = document.getElementById('infoOverlay');
      if (overlay) overlay.style.display = 'none';
    }
  };
  tileInfoContainer.appendChild(infoToggleBtn);
}

export function isInfoOverlayEnabled() {
  return infoOverlayEnabled;
}
