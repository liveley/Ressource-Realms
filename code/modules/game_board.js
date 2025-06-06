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
          const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 }); // Dunkelgrau
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

// Hilfsfunktion: Simuliere Tile-Nummern für Demo-Zwecke (echte Zuordnung nach Catan-Regeln möglich)
const tileNumbers = {};
(function assignTileNumbers() {
  // Verteile Zahlen 2-12 (ohne 7) zufällig auf Land-Tiles (Demo)
  const numbers = [2,3,3,4,4,5,5,5,6,6,8,8,9,9,10,10,11,11,12]; // Jetzt 19 Zahlen
  const landTiles = getLandTileAxials();
  let i = 0;
  landTiles.forEach(([q, r]) => {
    if (i < numbers.length) {
      tileNumbers[`${q},${r}`] = numbers[i++];
    } else {
      tileNumbers[`${q},${r}`] = null;
    }
  });
})();

// Speichere Referenzen auf die Tile-Meshes
const tileMeshes = {}

// Hilfsfunktion: Erstelle ein Sprite mit Zahl und Hintergrund
function createNumberTokenSprite(number) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Hintergrund (Kreis)
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff8dc';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 8;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Zahl
    ctx.font = 'bold 64px Arial';
    ctx.fillStyle = '#222';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, size/2, size/2);
    // Texture & Sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.3 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.8, 0.8, 1); // Noch kleinere Größe
    // Positioniere das Token mittig, aber sehr knapp über dem Tile (Y-Achse = Höhe)
    sprite.position.set(0, HEX_RADIUS * 0.35, 0);
    sprite.userData.number = number;
    return sprite;
}

// Füge Number Tokens zu allen Land-Tiles hinzu
export function addNumberTokensToTiles(scene, tileMeshes, tileNumbers) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        if (number) {
            const sprite = createNumberTokenSprite(number);
            sprite.position.set(0, HEX_RADIUS * 0.35, 0); // Sehr knapp über der Oberfläche (Y-Achse)
            mesh.add(sprite);
        }
    });
}

// Animation: Tokens immer zur Kamera drehen
export function updateNumberTokensFacingCamera(scene, camera) {
    scene.traverse(obj => {
        if (obj.type === 'Sprite' && obj.userData.number) {
            obj.quaternion.copy(camera.quaternion);
        }
    });
}

// Highlight-Logik für Number Tokens
export function highlightNumberTokens(scene, tileMeshes, tileNumbers, rolledNumber) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        mesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData.number) {
                if (number === rolledNumber) {
                    child.material.color.set('#ffe066'); // gelb hervorheben
                } else {
                    child.material.color.set('#ffffff'); // normal
                }
            }
        });
    });
}

// Füge Number Tokens direkt beim Laden eines Tiles hinzu
export function createGameBoard(scene) {
  // Lade und platziere die Mitte
  loadTile('center.glb', (centerTile) => {
    const centerPos = axialToWorld(0, 0);
    centerTile.position.set(...centerPos);
    centerTile.name = 'center.glb'; // Name für Raycaster
    hexGroup.add(centerTile);
    scene.add(hexGroup);
    tileMeshes[`0,0`] = centerTile;
    // Number Token für die Mitte (falls vorhanden)
    const number = tileNumbers[`0,0`];
    if (number) {
      const sprite = createNumberTokenSprite(number);
      sprite.position.set(0, HEX_RADIUS * 0.35, 0); // Hier Höhe auf Y-Achse
      centerTile.add(sprite);
    }
  });

  // Lade und platziere die umgebenden Tiles
  Object.entries(tilePositions).forEach(([tileName, positions]) => {
    positions.forEach(([q, r]) => {
      loadTile(`${tileName}.glb`, (tile) => {
        const pos = axialToWorld(q, r);
        tile.position.set(...pos);
        tile.name = `${tileName}.glb`; // Name für Raycaster
        // === Wasser-Tiles blau einfärben ===
        if (tileName === 'water') {
          tile.traverse(child => {
            if (child.isMesh) {
              child.material = new THREE.MeshStandardMaterial({ color: 0x2da7c1, transparent: true, opacity: 0.98 });
            }
          });
        }
        hexGroup.add(tile);
        scene.add(hexGroup);
        tileMeshes[`${q},${r}`] = tile;
        // Number Token für dieses Tile (falls vorhanden)
        const number = tileNumbers[`${q},${r}`];
        if (number) {
          const sprite = createNumberTokenSprite(number);
          sprite.position.set(0, HEX_RADIUS * 0.35, 0); // Hier Höhe auf Y-Achse
          tile.add(sprite);
        }
      });
    });
  });

  // Nach dem Platzieren der Tiles: Straßen als Meshes zeichnen
  drawRoadMeshes(scene);
  hexGroup.name = 'HexGroup'; // HexGroup benennen für Raycaster
  // Rückgabe für main.js
  return { tileMeshes, tileNumbers };
}

// Highlight-Logik für Tiles
window.addEventListener('diceRolled', (e) => {
  const number = e.detail;
  Object.entries(tileMeshes).forEach(([key, mesh]) => {
    // Entferne altes Highlight
    mesh.traverse(child => {
      if (child.material && child.material.emissive) {
        child.material.emissive.setHex(0x000000);
      }
    });
    // Highlight, wenn Zahl passt
    if (tileNumbers[key] === number) {
      mesh.traverse(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0xffff00);
        }
      });
    }
  });
});
