// modules/uiBuildPreview.js
// Vorschau-Piece für Siedlung/Stadt beim Hover auf dem Spielfeld
import * as THREE from 'three';
import { getCornerWorldPosition } from './game_board.js';
import { canPlaceSettlement, canPlaceCity, canPlaceRoad } from './buildLogic.js';
import { placeRoadMesh } from './gamePieces.js';
import { isBuildEnabled } from './uiBuild.js';

let previewMesh = null;

export function setupBuildPreview(renderer, scene, camera, tileMeshes, players, getBuildMode, getActivePlayerIdx) {
  renderer.domElement.addEventListener('mousemove', (event) => {
    console.log('BuildPreview: mousemove event');
    const menu = document.getElementById('main-menu');
    if (menu && menu.style.display !== 'none') {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    // Vorschau nur anzeigen, wenn Bauen aktiviert ist
    if (!isBuildEnabled()) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    const mouse = new THREE.Vector2();
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;
    const raycaster = new THREE.Raycaster();
    raycaster.setFromCamera(mouse, camera);
    const hexGroup = scene.getObjectByName('HexGroup');
    if (!hexGroup) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    const intersects = raycaster.intersectObjects(hexGroup.children, true);
    if (intersects.length === 0) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    let tileMesh = intersects[0].object;
    while (tileMesh && !tileMesh.name.endsWith('.glb')) tileMesh = tileMesh.parent;
    if (!tileMesh) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    let tileKey = null;
    for (const [key, mesh] of Object.entries(tileMeshes)) {
      if (mesh === tileMesh) { tileKey = key; break; }
    }
    if (!tileKey) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    const [q, r] = tileKey.split(',').map(Number);
    const corners = [];
    for (let i = 0; i < 6; i++) {
      const pos = getCornerWorldPosition(q, r, i);
      corners.push({ i, pos });
    }
    let minDist = Infinity, nearest = 0;
    for (let i = 0; i < 6; i++) {
      const d = corners[i].pos.distanceTo(intersects[0].point);
      if (d < minDist) { minDist = d; nearest = i; }
    }
    if (minDist > 1.5) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    const buildMode = getBuildMode();
    const player = players[getActivePlayerIdx()];
    let canBuild = false;
    let previewType = buildMode;
    let previewParams = {};
    let previewEdge = 0;
    let shouldShowPreview = true; // New flag to control preview visibility
    
    if (buildMode === 'settlement') {
      // Für Testzwecke: requireRoad = false, ignoreDistanceRule = true
      const res = canPlaceSettlement(player, q, r, nearest, players, { requireRoad: false, ignoreDistanceRule: true });
      canBuild = res.success;
      
      // Don't show preview if no land tile adjacent
      if (res.reason === 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)') {
        shouldShowPreview = false;
      }
    } else if (buildMode === 'city') {
      const res = canPlaceCity(player, q, r, nearest);
      canBuild = res.success;
      
      // Don't show preview if no land tile adjacent
      if (res.reason === 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)') {
        shouldShowPreview = false;
      }
    } else if (buildMode === 'road') {
      // Finde die nächste Kante (edge) zur Mausposition
      let minEdgeDist = Infinity, nearestEdge = 0;
      for (let edge = 0; edge < 6; edge++) {
        const a = getCornerWorldPosition(q, r, edge);
        const b = getCornerWorldPosition(q, r, (edge + 1) % 6);
        const mid = a.clone().add(b).multiplyScalar(0.5);
        const d = mid.distanceTo(intersects[0].point);
        if (d < minEdgeDist) { minEdgeDist = d; nearestEdge = edge; }
      }
      if (minEdgeDist > 1.5) {
        removePreviewMesh(scene, renderer, camera);
        return;
      }
      const res = canPlaceRoad(player, q, r, nearestEdge, players);
      canBuild = res.success;
      previewType = 'road';
      previewParams = { q, r, edge: nearestEdge };
      previewEdge = nearestEdge;
      
      // Don't show preview if no land tile adjacent
      if (res.reason === 'Straßenbau auf Wasser nicht erlaubt') {
        shouldShowPreview = false;
      }
    }
    
    // If we shouldn't show preview due to no land adjacency, remove any existing preview and return
    if (!shouldShowPreview) {
      removePreviewMesh(scene, renderer, camera);
      return;
    }
    const previewColor = canBuild ? player.color : 0xffe066;
    const previewOpacity = canBuild ? 0.45 : 0.32;
    if (previewMesh && previewMesh.userData && previewMesh.userData.q === q && previewMesh.userData.r === r && previewMesh.userData.corner === nearest && previewMesh.userData.type === buildMode && previewMesh.userData.color === previewColor) {
      return;
    }
    removePreviewMesh(scene, renderer, camera);
    let mesh;
    if (buildMode === 'settlement') {
      mesh = new THREE.Mesh(
        new THREE.BoxGeometry(1, 1, 1.2),
        new THREE.MeshStandardMaterial({ color: previewColor, transparent: true, opacity: previewOpacity, depthWrite: false })
      );
      mesh.position.copy(getCornerWorldPosition(q, r, nearest));
      // Vorschau: KEIN z-Offset für Siedlung
    } else if (buildMode === 'city') {
      const shape = new THREE.Shape();
      shape.moveTo(0, 0);
      shape.lineTo(1, 0);
      shape.lineTo(0.5, 0.9);
      shape.lineTo(0, 0);
      const extrudeSettings = { depth: 1.8, bevelEnabled: false };
      const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
      geometry.scale(1.2, 1.2, 1);
      mesh = new THREE.Mesh(
        geometry,
        new THREE.MeshStandardMaterial({ color: previewColor, transparent: true, opacity: previewOpacity, depthWrite: false })
      );
      mesh.position.copy(getCornerWorldPosition(q, r, nearest));
      mesh.position.x -= 0.6;
      mesh.position.y -= 0.3;
      // Vorschau: Stadt braucht x/y-Korrektur wie vorher
    } else if (buildMode === 'road') {
      // Vorschau für Straße: schmaler transparenter Quader zwischen zwei Ecken
      const a = getCornerWorldPosition(q, r, previewEdge);
      const b = getCornerWorldPosition(q, r, (previewEdge + 1) % 6);
      const roadLength = a.distanceTo(b);
      const roadWidth = 0.4;
      const roadHeight = 0.4;
      const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
      const material = new THREE.MeshStandardMaterial({ color: previewColor, transparent: true, opacity: previewOpacity, depthWrite: false });
      mesh = new THREE.Mesh(geometry, material);
      mesh.position.copy(a.clone().add(b).multiplyScalar(0.5));
      const direction = b.clone().sub(a).normalize();
      const axis = new THREE.Vector3(1, 0, 0);
      const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
      mesh.setRotationFromQuaternion(quaternion);
      mesh.userData = { preview: true, q, r, edge: previewEdge, type: 'road', color: previewColor };
    }
    // Vorschau: KEIN z-Offset für beide
    mesh.renderOrder = 999;
    mesh.userData = { preview: true, q, r, corner: nearest, type: buildMode, color: previewColor };
    scene.add(mesh);
    previewMesh = mesh;
    renderer.render(scene, camera);
  });
}

export function removePreviewMesh(scene, renderer, camera) {
  if (previewMesh) {
    scene.remove(previewMesh);
    previewMesh = null;
    renderer.render(scene, camera);
  }
}
