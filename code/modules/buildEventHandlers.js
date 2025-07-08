import * as THREE from 'three';
import { placeBuildingMesh, placeRoadMesh } from './gamePieces.js';
import { isBuildEnabled } from './uiBuild.js';
import { showBuildPopupFeedback } from './uiBuild.js';
import { getActivePlayerIdx, getCurrentPhase, TURN_PHASES, recordSetupAction } from './turnController.js';
import { tryBuildSetupSettlement, tryBuildSetupRoad } from './buildLogic.js';

// Build-Event-Handler für das Bauen von Siedlungen und Städten
// Kapselt die Click-Logik für das Spielfeld

export function setupBuildEventHandler({
  renderer,
  scene,
  camera,
  tileMeshes,
  players,
  getBuildMode,
  // ✅ Entfernt getActivePlayerIdx Parameter - verwende direkte Import
  tryBuildSettlement,
  tryBuildCity,
  tryBuildRoad,
  getCornerWorldPosition,
  updateResourceUI // now expects no arguments, closure from main.js
}) {
  function onBoardClick(event) {
    console.log('BuildEventHandler: click event');
    // Only if menu is hidden
    const menu = document.getElementById('main-menu');
    if (menu && menu.style.display !== 'none') return;
    // Nur bauen, wenn Bauen aktiviert ist
    if (!isBuildEnabled()) return;
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
    const currentPhase = getCurrentPhase();
    let result;
    let meshPlaced = false;
    
    // Check if we're in setup phase and use appropriate build functions
    const isSetupPhase = [
      TURN_PHASES.SETUP_SETTLEMENT_1,
      TURN_PHASES.SETUP_SETTLEMENT_2,
      TURN_PHASES.SETUP_ROAD_1,
      TURN_PHASES.SETUP_ROAD_2
    ].includes(currentPhase);
    
    if (getBuildMode() === 'settlement') {
      if (isSetupPhase) {
        // Use setup-specific settlement building
        result = tryBuildSetupSettlement(player, q, r, nearest, players);
      } else {
        // Regular settlement building with full rules
        result = tryBuildSettlement(player, q, r, nearest, players, { requireRoad: true, ignoreDistanceRule: false });
      }
      if (result.success) {
        placeBuildingMesh(scene, getCornerWorldPosition, q, r, nearest, 'settlement', player.color);
        meshPlaced = true;
      }
    } else if (getBuildMode() === 'city') {
      // Cities can only be built in regular play, not setup
      if (isSetupPhase) {
        result = { success: false, reason: 'Städte können nicht in der Aufbauphase gebaut werden' };
      } else {
        result = tryBuildCity(player, q, r, nearest);
        if (result.success) {
          placeBuildingMesh(scene, getCornerWorldPosition, q, r, nearest, 'city', player.color);
          meshPlaced = true;
        }
      }
    } else if (getBuildMode() === 'road') {
      // Für Straßenbau: Kante (edge) statt Ecke bestimmen
      // Finde die nächste Kante (edge) zur Klickposition
      let minEdgeDist = Infinity, nearestEdge = 0;
      for (let edge = 0; edge < 6; edge++) {
        // Mittelpunkt der Kante zwischen zwei Ecken
        const a = getCornerWorldPosition(q, r, edge);
        const b = getCornerWorldPosition(q, r, (edge + 1) % 6);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const d = mid.distanceTo(intersect.point);
        if (d < minEdgeDist) { minEdgeDist = d; nearestEdge = edge; }
      }
      if (minEdgeDist > 1.5) return;
      
      // Use setup-specific or regular road building
      if (isSetupPhase) {
        result = tryBuildSetupRoad(player, q, r, nearestEdge, players);
      } else {
        // Regular road building logic
        let ignoreResourceRule = false;
        if (window._roadBuildingMode && window._roadBuildingMode.player === player && window._roadBuildingMode.roadsLeft > 0) {
          ignoreResourceRule = true;
        }
        if (typeof tryBuildRoad === 'function') {
          result = tryBuildRoad(player, q, r, nearestEdge, players, { ignoreResourceRule });
        } else {
          result = { success: false, reason: 'Straßenbau nicht implementiert' };
        }
      }
      
      if (result.success) {
        placeRoadMesh(scene, getCornerWorldPosition, q, r, nearestEdge, player.color);
        meshPlaced = true;
        
        // Straßenbau-Modus: Zähler runterzählen und ggf. beenden (nur im regulären Spiel)
        if (!isSetupPhase && window._roadBuildingMode && window._roadBuildingMode.player === player && window._roadBuildingMode.roadsLeft > 0) {
          window._roadBuildingMode.roadsLeft--;
          if (window._roadBuildingMode.roadsLeft <= 0) {
            if (typeof window._roadBuildingMode.finish === 'function') window._roadBuildingMode.finish();
          }
        }
      }
    } else {
      result = { success: false, reason: 'Unbekannter Build-Modus' };
    }
    // === Feedback-Timeout robust machen ===
    if (window._buildFeedbackTimeout) {
      clearTimeout(window._buildFeedbackTimeout);
      window._buildFeedbackTimeout = null;
    }
    if (!result.success) {
      showBuildPopupFeedback(result.reason || 'Bau nicht möglich', false);
      return;
    }
    showBuildPopupFeedback('Gebaut!', true);
    
    // Ressourcen-UI nur aktualisieren, wenn gebaut wurde
    if (meshPlaced) {
      updateResourceUI();
      
      // If in setup phase, record the action and advance the phase
      if (isSetupPhase) {
        if (getBuildMode() === 'settlement') {
          recordSetupAction('settlement', q, r, nearest);
        } else if (getBuildMode() === 'road') {
          recordSetupAction('road', q, r, nearestEdge);
        }
      }
    }
  }
  renderer.domElement.addEventListener('click', onBoardClick, false);
}
