// modules/gamePieces.js
// Platzhalter-Spielsteine für Prototyp
import * as THREE from 'three';

// Definition der Spielsteintypen und Farben
const pieceTypes = [
  { type: 'settlement', shape: 'cube', size: [1, 1, 1.2] },
  { type: 'city', shape: 'prism', size: [1.2, 1.2, 1.8] },
  { type: 'road', shape: 'bar', size: [1.8, 0.4, 0.4] }
];
const playerColors = [0xd7263d, 0x277da1]; // rot, blau

// Erstellt und platziert Platzhalter-Spielsteine für alle Typen und Farben
export function createGamePieces(scene) {
  const startX = -10;
  const startY = -10;
  pieceTypes.forEach((piece, i) => {
    playerColors.forEach((color, j) => {
      let mesh;
      if (piece.shape === 'cube') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(...piece.size),
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (piece.shape === 'prism') {
        // Prisma als extrudiertes Dreieck
        const shape = new THREE.Shape();
        shape.moveTo(0, 0);
        shape.lineTo(1, 0);
        shape.lineTo(0.5, 0.9);
        shape.lineTo(0, 0);
        const extrudeSettings = { depth: piece.size[2], bevelEnabled: false };
        const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);
        geometry.scale(piece.size[0], piece.size[1], 1);
        mesh = new THREE.Mesh(
          geometry,
          new THREE.MeshStandardMaterial({ color })
        );
      } else if (piece.shape === 'bar') {
        mesh = new THREE.Mesh(
          new THREE.BoxGeometry(...piece.size),
          new THREE.MeshStandardMaterial({ color })
        );
      }
      mesh.position.set(startX + i * 4, startY + j * 3, 2 + j * 0.2);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      mesh.userData = { type: piece.type, player: j };
      scene.add(mesh);
    });
  });
}

// === Place settlement/city mesh at corner ===
export function placeBuildingMesh(scene, getCornerWorldPosition, q, r, corner, type, color) {
  if (!scene || typeof scene.traverse !== 'function') {
    console.error('[placeBuildingMesh] Scene-Objekt ist ungültig oder undefined!', scene);
    return;
  }
  // Remove settlement if upgrading to city
  if (type === 'city') {
    // Remove existing settlement mesh at this corner (if any)
    scene.children.slice().forEach(obj => {
      if (obj.userData && obj.userData.type === 'settlement' && obj.userData.q === q && obj.userData.r === r && obj.userData.corner === corner) {
        scene.remove(obj);
      }
    });
  }
  // Create mesh
  let mesh;
  if (type === 'settlement') {
    mesh = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1, 1.2),
      new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.copy(getCornerWorldPosition(q, r, corner));
  } else {
    // City: prism
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
      new THREE.MeshStandardMaterial({ color })
    );
    mesh.position.copy(getCornerWorldPosition(q, r, corner));
    mesh.position.x -= 0.6;
    mesh.position.y -= 0.3;
    mesh.position.z -= 0.6; // Stadt noch etwas tiefer (vorher -0.5, jetzt -0.6)
  }
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { type, q, r, corner };
  scene.add(mesh);
}

// === Place road mesh at edge ===
export function placeRoadMesh(scene, getCornerWorldPosition, q, r, edge, color) {
  if (!scene || typeof scene.traverse !== 'function') {
    console.error('[placeRoadMesh] Scene-Objekt ist ungültig oder undefined!', scene);
    return;
  }
  // Endpunkte der Straße bestimmen
  const start = getCornerWorldPosition(q, r, edge);
  const end = getCornerWorldPosition(q, r, (edge + 1) % 6);
  // Geometrie: schmaler Quader zwischen start und end
  const roadLength = start.distanceTo(end);
  const roadWidth = 0.4; // wie pieceTypes road
  const roadHeight = 0.4;
  const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
  const material = new THREE.MeshStandardMaterial({ color });
  const mesh = new THREE.Mesh(geometry, material);
  // Position: Mittelpunkt der Kante
  mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
  // Rotation: Quader entlang der Kante ausrichten (X-Achse der Box zeigt von start nach end)
  const direction = end.clone().sub(start).normalize();
  const axis = new THREE.Vector3(1, 0, 0); // BoxGeometry ist entlang X
  const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
  mesh.setRotationFromQuaternion(quaternion);
  mesh.castShadow = true;
  mesh.receiveShadow = true;
  mesh.userData = { type: 'road', q, r, edge };
  scene.add(mesh);
}
