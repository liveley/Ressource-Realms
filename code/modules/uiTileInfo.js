// modules/uiTileInfo.js
// Info-Overlay und Mousemove-Handling für Tile-Infos
import * as THREE from 'three';
import { tileInfo } from './tileInfo.js';

export function initTileInfoOverlay(scene, camera) {
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();

  function onMouseMove(event) {
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
