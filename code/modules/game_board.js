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
}
