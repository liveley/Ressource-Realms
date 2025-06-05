// modules/game_board.js
// Import des game_board-Moduls    ->  import { createGameBoard } from './modules/game_board.js';
// Hex-Grid hinzufügen  ->  createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Importiere die Funktion zum Laden eines einzelnen Tiles

const HEX_RADIUS = 3;
const hexGroup = new THREE.Group();

// Positionen der Tiles
const tilePositions = {
  'clay': [[-1, -1], [-2, 0], [1, -1]], //3/3 Feldern platziert
  'ore': [[-1, 2], [1, 0], [2, -2]], //3/3 Feldern platziert
  'sheep': [[2, 0], [0, 2], [-2, 2], [-1, 0]], //4/4 Felder platziert
  'wheat': [[2, -1], [1, -2], [0, -1], [-2, 1]], //4/4 Feldern platziert
  'wood': [[-1, 1], [0, 1], [0, -2], [1, 1]], //4/4 Feldern paltziert
  'water': [[3, -1], [3, -2], [3, -3], [2, -3], [1, -3], [0, -3], [-1, -2], [-2, -1], [-3, 1], [-3, 2], [-3, 0], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 2], [2, 1], [3, 0],// 1 Ring Hafen
            [4, -1], [4, -2], [4, -3], [3, -4], [2, -4], [1, -4], [0, -4], [-1, -3], [-2, -2], [-3, -1], [-4, 0], [-4, 1], [-4, 2], [-4, 3], [-3, 4], [-2, 4], [-1, 4], [0, 4], [1, 3], [2, 2], [3, 1], [4, 0], [4, -4], [-4 , 4], //erster Wasserring
            [5, -1], [5, -2], [5, -3], [5, -4], [4, -5], [3, -5], [2, -5], [1, -5], [0, -5], [-1, -4], [-2, -3], [-3, -2], [-4, -1], [-5, 0], [-5, 1], [-5, 2], [-5, 3], [-5, 4], [-4, 5], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0], [-5, 5], [5, -5] //zweiter Wasserring
]
};

// Funktion zur Umwandlung von axialen Koordinaten zu Weltkoordinaten
export function axialToWorld(q, r) {
  const x = HEX_RADIUS * 3/2 * q;
  const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
  const z = 0; // Höhe bleibt konstant
  return [x, y, z];
}

// Hilfsfunktion: Gibt alle axialen Koordinaten der Land-Tiles zurück (inkl. Zentrum)
function getLandTileAxials() {
  const landTypes = ['clay', 'ore', 'sheep', 'wheat', 'wood'];
  let coords = [[0, 0]]; // Zentrum hinzufügen
  landTypes.forEach(type => {
    coords = coords.concat(tilePositions[type]);
  });
  return coords;
}

// Hilfsfunktion: Berechnet die sechs Ecken eines Hexfelds in Weltkoordinaten (wie in hexGrid.js)
function getHexCorners(q, r) {
  const corners = [];
  for (let i = 0; i < 6; i++) {
    const angle = Math.PI / 3 * i; // 0°, 60°, 120°, ...
    const x = HEX_RADIUS * Math.cos(angle);
    const y = HEX_RADIUS * Math.sin(angle);
    const [cx, cy, cz] = axialToWorld(q, r);
    corners.push(new THREE.Vector3(cx + x, cy + y, cz));
  }
  return corners;
}

// Hilfsfunktion: Gibt die axiale Koordinate des Nachbarn für eine Kante zurück
function neighborAxial(q, r, edge) {
  // Reihenfolge: 0 = rechts oben, dann im Uhrzeigersinn
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  return [q + directions[edge][0], r + directions[edge][1]];
}

// Funktion zum Zeichnen der Straßen als Zylinder-Meshes
function drawRoadMeshes(scene) {
  const landAxials = getLandTileAxials();
  const landSet = new Set(landAxials.map(([q, r]) => `${q},${r}`));
  const drawnEdges = new Set();

  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    for (let edge = 0; edge < 6; edge++) {
      const [nq, nr] = neighborAxial(q, r, edge);
      if (landSet.has(`${nq},${nr}`)) {
        const key = [[q, r, edge], [nq, nr, (edge + 3) % 6]]
          .map(([a, b, e]) => `${a},${b},${e}`)
          .sort()
          .join('|');
        if (!drawnEdges.has(key)) {
          drawnEdges.add(key);
          const start = corners[edge];
          const end = corners[(edge + 1) % 6];
          // Quader-Geometrie als Straße
          const roadLength = start.distanceTo(end);
          const roadWidth = HEX_RADIUS * 0.20; // Dicke der Straße
          const roadHeight = HEX_RADIUS * 0.40; // Höhe der Straße
          const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
          const material = new THREE.MeshStandardMaterial({ color: 0xdddddd }); // Hellgrau
          const mesh = new THREE.Mesh(geometry, material);
          // Position: Mittelpunkt der Kante
          mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
          // Rotation: Quader entlang der Kante ausrichten
          const direction = end.clone().sub(start).normalize();
          const axis = new THREE.Vector3(1, 0, 0); // BoxGeometry ist entlang X
          const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
          mesh.setRotationFromQuaternion(quaternion);
          scene.add(mesh);
        }
      }
    }
  });
}

// Spielfeld erstellen
export function createGameBoard(scene) {
  // Lade und platziere die Mitte
  loadTile('center.glb', (centerTile) => {
    const centerPos = axialToWorld(0, 0);
    centerTile.position.set(...centerPos);
    hexGroup.add(centerTile);
    scene.add(hexGroup);
  });

  // Lade und platziere die umgebenden Tiles
  Object.entries(tilePositions).forEach(([tileName, positions]) => {
    positions.forEach(([q, r]) => {
      loadTile(`${tileName}.glb`, (tile) => {
        const pos = axialToWorld(q, r);
        tile.position.set(...pos);
        hexGroup.add(tile);
        scene.add(hexGroup);
      });
    });
  });

  // Nach dem Platzieren der Tiles: Straßen als Meshes zeichnen
  drawRoadMeshes(scene);
}
