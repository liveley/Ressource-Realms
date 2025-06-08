import * as THREE from 'three';
import { placeBuildingMesh } from './gamePieces.js';

// Build-Event-Handler für das Bauen von Siedlungen und Städten
// Kapselt die Click-Logik für das Spielfeld

export function setupBuildEventHandler({
  renderer,
  scene,
  camera,
  tileMeshes,
  players,
  getBuildMode,
  getActivePlayerIdx,
  tryBuildSettlement,
  tryBuildCity,
  getCornerWorldPosition,
  updateResourceUI // now expects no arguments, closure from main.js
}) {
  function onBoardClick(event) {
    // Only if menu is hidden
    const menu = document.getElementById('main-menu');
    if (menu && menu.style.display !== 'none') return;
    // Raycast to find nearest tile and corner
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hexGroup = scene.getObjectByName('HexGroup');
    if (!hexGroup) return;
    const intersects = raycaster.intersectObjects(hexGroup.children, true);
    if (intersects.length === 0) return;
    const intersect = intersects[0];
    // Find which tile was clicked
    let tileMesh = intersect.object;
    while (tileMesh && !tileMesh.name.endsWith('.glb')) tileMesh = tileMesh.parent;
    if (!tileMesh) return;
    // Parse tile axial coordinates from tileMeshes
    let tileKey = null;
    for (const [key, mesh] of Object.entries(tileMeshes)) {
      if (mesh === tileMesh) { tileKey = key; break; }
    }
    if (!tileKey) return;
    const [q, r] = tileKey.split(',').map(Number);
    // Find nearest corner
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const pos = getCornerWorldPosition(q, r, i);
      corners.push({ i, pos });
    }
    let minDist = Infinity, nearest = 0;
    for (let i = 0; i < 6; i++) {
      const d = corners[i].pos.distanceTo(intersect.point);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    // Only allow if close enough (e.g. <1.5 units)
    if (minDist > 1.5) return;
    // Try to build
    const player = players[getActivePlayerIdx()];
    let result;
    if (getBuildMode() === 'settlement') {
      // Für Testzwecke: requireRoad = false, ignoreDistanceRule = true
      result = tryBuildSettlement(player, q, r, nearest, players, { requireRoad: false, ignoreDistanceRule: true });
    } else {
      result = tryBuildCity(player, q, r, nearest);
    }
    // === Feedback-Element holen (immer aus Build-UI!) ===
    const feedback = document.getElementById('build-feedback');
    // === Feedback-Timeout robust machen ===
    if (window._buildFeedbackTimeout) {
      clearTimeout(window._buildFeedbackTimeout);
      window._buildFeedbackTimeout = null;
    }
    if (!result.success) {
      if (feedback) {
        console.log('[Build-Feedback]', result.reason || 'Bau nicht möglich');
        feedback.textContent = result.reason || 'Bau nicht möglich';
        feedback.style.display = 'inline';
        feedback.style.visibility = 'visible';
        feedback.style.opacity = '1';
        feedback.style.background = '#ffe066';
        feedback.style.color = '#d7263d';
        feedback.style.fontWeight = 'bold';
        window._buildFeedbackTimeout = setTimeout(() => {
          feedback.textContent = '';
          feedback.style.display = '';
          feedback.style.visibility = '';
          feedback.style.opacity = '';
          feedback.style.background = '';
          feedback.style.color = '';
          feedback.style.fontWeight = '';
          window._buildFeedbackTimeout = null;
        }, 2200);
      }
      return;
    }
    if (feedback) {
      console.log('[Build-Feedback] Gebaut!');
      feedback.textContent = 'Gebaut!';
      feedback.style.display = 'inline';
      feedback.style.visibility = 'visible';
      feedback.style.opacity = '1';
      feedback.style.background = '#8fd19e';
      feedback.style.color = '#222';
      feedback.style.fontWeight = 'bold';
      window._buildFeedbackTimeout = setTimeout(() => {
        feedback.textContent = '';
        feedback.style.display = '';
        feedback.style.visibility = '';
        feedback.style.opacity = '';
        feedback.style.background = '';
        feedback.style.color = '';
        feedback.style.fontWeight = '';
        window._buildFeedbackTimeout = null;
      }, 1200);
    }
    // Place 3D mesh
    placeBuildingMesh(scene, getCornerWorldPosition, q, r, nearest, getBuildMode(), player.color);
    updateResourceUI(); // Will update for the current player
  }
  renderer.domElement.addEventListener('click', onBoardClick, false);
}
