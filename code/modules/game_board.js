// modules/game_board.js
// Import des game_board-Moduls    ->  import { createGameBoard } from './modules/game_board.js';
// Hex-Grid hinzufügen  ->  createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Importiere die Funktion zum Laden eines einzelnen Tiles

const HEX_RADIUS = 3;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_HEIGHT = HEX_RADIUS * 1.5;
const hexGroup = new THREE.Group();

// Positionen der Tiles
const tilePositions = {
  'clay': [1, 0],
  'ore': [1, -1],
  'sheep': [0, -1],
  'wheat': [-1, 0],
  'wood': [-1, 1],
  'water': [0, 2] // Neuer Eintrag für "water.glb"
};

// Funktion zur Umwandlung von axialen Koordinaten zu Weltkoordinaten
export function axialToWorld(q, r) {
  const x = HEX_RADIUS * 3/2 * q;
  const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
  const z = 0; // Höhe immer 0
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
  Object.entries(tilePositions).forEach(([tileName, [q, r]]) => {
    loadTile(`${tileName}.glb`, (tile) => {
      const pos = axialToWorld(q, r);
      tile.position.set(...pos);
      hexGroup.add(tile);
      scene.add(hexGroup);
    });
  });
}
