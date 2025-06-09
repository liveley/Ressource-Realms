// modules/game_board.js
// Import the game_board module -> import { createGameBoard } from './modules/game_board.js';
// Add hex grid -> createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Import the function to load a single tile

const HEX_RADIUS = 3;
const hexGroup = new THREE.Group();

// Positions of the tiles (axial coordinates)
const tilePositions = {
  'clay': [[-1, -1], [-2, 0], [1, -1]], // 3/3 clay tiles placed
  'ore': [[-1, 2], [1, 0], [2, -2]], // 3/3 ore tiles placed
  'sheep': [[2, 0], [0, 2], [-2, 2], [-1, 0]], // 4/4 sheep tiles placed
  'wheat': [[2, -1], [1, -2], [0, -1], [-2, 1]], // 4/4 wheat tiles placed
  'wood': [[-1, 1], [0, 1], [0, -2], [1, 1]], // 4/4 wood tiles placed
  'water': [
    [3, -1], [3, -2], [3, -3], [2, -3], [1, -3], [0, -3], [-1, -2], [-2, -1], [-3, 1], [-3, 2], [-3, 0], [-3, 3], [-2, 3], [-1, 3], [0, 3], [1, 2], [2, 1], [3, 0], // 1st harbor ring
    [4, -1], [4, -2], [4, -3], [3, -4], [2, -4], [1, -4], [0, -4], [-1, -3], [-2, -2], [-3, -1], [-4, 0], [-4, 1], [-4, 2], [-4, 3], [-3, 4], [-2, 4], [-1, 4], [0, 4], [1, 3], [2, 2], [3, 1], [4, 0], [4, -4], [-4 , 4], // 1st water ring
    [5, -1], [5, -2], [5, -3], [5, -4], [4, -5], [3, -5], [2, -5], [1, -5], [0, -5], [-1, -4], [-2, -3], [-3, -2], [-4, -1], [-5, 0], [-5, 1], [-5, 2], [-5, 3], [-5, 4], [-4, 5], [-3, 5], [-2, 5], [-1, 5], [0, 5], [1, 4], [2, 3], [3, 2], [4, 1], [5, 0], [-5, 5], [5, -5] // 2nd water ring
  ]
};

// Converts axial coordinates (q, r) to world coordinates (x, y, z)
export function axialToWorld(q, r) {
  const x = HEX_RADIUS * 3/2 * q;
  const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
  const z = 0; // Height remains constant
  return [x, y, z];
}

// === Hilfsfunktion für main.js: Weltkoordinaten eines Tiles (axial) ===
export function getTileWorldPosition(q, r) {
    const [x, y, z] = axialToWorld(q, r);
    return { x, y, z };
}

// === Export: Weltkoordinaten einer bestimmten Ecke (Vertex) eines Hexfelds ===
export function getCornerWorldPosition(q, r, corner) {
  // Returns THREE.Vector3 of the specified corner
  const HEX_RADIUS = 3; // must match above
  const angle = Math.PI / 3 * corner;
  const [cx, cy, cz] = axialToWorld(q, r);
  const x = cx + HEX_RADIUS * Math.cos(angle);
  const y = cy + HEX_RADIUS * Math.sin(angle);
  const z = cz + 1.2; // slightly above tile for visibility
  return new THREE.Vector3(x, y, z);
}

// Helper: Returns all axial coordinates of land tiles (including center)
function getLandTileAxials() {
  const landTypes = ['clay', 'ore', 'sheep', 'wheat', 'wood'];
  let coords = [[0, 0]]; // Add center
  landTypes.forEach(type => {
    coords = coords.concat(tilePositions[type]);
  });
  return coords;
}

// Helper: Calculates the six corners of a hex tile in world coordinates
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

// Helper: Returns the axial coordinate of the neighbor for a given edge
function neighborAxial(q, r, edge) {
  // Order: 0 = top right, then clockwise
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  return [q + directions[edge][0], r + directions[edge][1]];
}

// Draws the road meshes as box geometries between tile edges
function drawRoadMeshes(scene) {
  const landAxials = getLandTileAxials();
  const landSet = new Set(landAxials.map(([q, r]) => `${q},${r}`));
  const drawnEdges = new Set();

  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    for (let edge = 0; edge < 6; edge++) {
      const [nq, nr] = neighborAxial(q, r, edge);
      const isNeighborLand = landSet.has(`${nq},${nr}`);
      // Kante zwischen zwei Land-Tiles: wie bisher, aber nur einmal zeichnen
      if (isNeighborLand) {
        const key = [[q, r, edge], [nq, nr, (edge + 3) % 6]]
          .map(([a, b, e]) => `${a},${b},${e}`)
          .sort()
          .join('|');
        if (!drawnEdges.has(key)) {
          drawnEdges.add(key);
          const start = corners[edge];
          const end = corners[(edge + 1) % 6];
          const roadLength = start.distanceTo(end);
          const roadWidth = HEX_RADIUS * 0.20;
          const roadHeight = HEX_RADIUS * 0.40;
          const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
          const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
          const mesh = new THREE.Mesh(geometry, material);
          mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
          const direction = end.clone().sub(start).normalize();
          const axis = new THREE.Vector3(1, 0, 0);
          const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
          mesh.setRotationFromQuaternion(quaternion);
          scene.add(mesh);
        }
      } else {
        // Außenkante: immer Quader zeichnen
        const start = corners[edge];
        const end = corners[(edge + 1) % 6];
        const roadLength = start.distanceTo(end);
        const roadWidth = HEX_RADIUS * 0.20;
        const roadHeight = HEX_RADIUS * 0.40;
        const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
        const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
        const mesh = new THREE.Mesh(geometry, material);
        mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
        const direction = end.clone().sub(start).normalize();
        const axis = new THREE.Vector3(1, 0, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        mesh.setRotationFromQuaternion(quaternion);
        scene.add(mesh);
      }
    }
  });
}

// Helper: Simulate tile numbers for demo purposes (real assignment according to Catan rules possible)
const tileNumbers = {};
(function assignTileNumbers() {
  // Catan standard: 18 number tokens (2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12), desert gets none
  const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]; // 18 chips, no 7
  // Get all land tiles except center (desert)
  const landTypes = ['clay', 'ore', 'sheep', 'wheat', 'wood'];
  let coords = [];
  landTypes.forEach(type => {
    coords = coords.concat(tilePositions[type]);
  });
  // Shuffle coords for random assignment
  for (let i = coords.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [coords[i], coords[j]] = [coords[j], coords[i]];
  }
  // Assign numbers to shuffled land tiles
  coords.forEach(([q, r], i) => {
    tileNumbers[`${q},${r}`] = numbers[i] || null;
  });
  // Center (desert) gets no number
  tileNumbers['0,0'] = null;
})();

// Store references to the tile meshes
const tileMeshes = {}

// Helper: Create a sprite with a number and background
function createNumberTokenSprite(number) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    // Background (circle)
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 8, 0, 2 * Math.PI);
    ctx.fillStyle = '#fff8dc';
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 12;
    ctx.fill();
    ctx.shadowBlur = 0;
    // Border for better visibility
    ctx.lineWidth = 6;
    ctx.strokeStyle = '#222';
    ctx.stroke();
    // === Dynamic size and color for the number ===
    let fontSize, fontColor;
    if (number === 6 || number === 8) {
        fontSize = 90;
        fontColor = '#d7263d'; // strong red
    } else if (number === 2 || number === 12) {
        fontSize = 45;
        fontColor = '#222';
    } else if (number === 3 || number === 11) {
        fontSize = 54;
        fontColor = '#222';
    } else if (number === 4 || number === 10) {
        fontSize = 62;
        fontColor = '#222';
    } else if (number === 5 || number === 9) {
        fontSize = 76;
        fontColor = '#222';
    } else { // fallback
        fontSize = 60;
        fontColor = '#222';
    }
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(number, size/2, size/2);
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.9, 0.9, 1); // slightly larger
    sprite.position.set(0, HEX_RADIUS * 0.35, 0);
    sprite.userData.number = number;
    return sprite;
}

// Add number tokens to all land tiles
export function addNumberTokensToTiles(scene, tileMeshes, tileNumbers) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        if (number) {
            const sprite = createNumberTokenSprite(number);
            sprite.position.set(0, HEX_RADIUS * 0.35, 0); // Just above the surface (Y axis)
            mesh.add(sprite);
        }
    });
}

// Animation: Always face number tokens towards the camera
export function updateNumberTokensFacingCamera(scene, camera) {
    scene.traverse(obj => {
        if (obj.type === 'Sprite' && obj.userData.number) {
            obj.quaternion.copy(camera.quaternion);
        }
    });
}

// Highlight logic for number tokens (e.g. after dice roll)
export function highlightNumberTokens(scene, tileMeshes, tileNumbers, rolledNumber) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        mesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData.number) {
                if (number === rolledNumber) {
                    child.material.color.set('#ffe066'); // highlight yellow
                } else {
                    child.material.color.set('#ffffff'); // normal
                }
            }
        });
    });
}

// === Zeichnet eine beige Outline um alle Land-Tiles (inkl. Wüste) ===
function drawLandTileOutline(scene) {
  const outlineColor = 0xffe066; // schönes Beige
  const outlineWidth = 0.13; // etwas dicker
  const landAxials = getLandTileAxials();
  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    // Hex-Outline als geschlossene Linie
    const points = [...corners, corners[0]];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: outlineColor, linewidth: outlineWidth });
    const line = new THREE.Line(geometry, material);
    line.position.z += 1.25; // leicht über dem Tile, damit sichtbar
    scene.add(line);
  });
}

// Add number tokens directly when loading a tile
export function createGameBoard(scene) {
  // Load and place the center tile (desert)
  loadTile('center.glb', (centerTile) => {
    const centerPos = axialToWorld(0, 0);
    centerTile.position.set(...centerPos);
    centerTile.name = 'center.glb'; // Name for raycaster
    hexGroup.add(centerTile);
    scene.add(hexGroup);
    tileMeshes[`0,0`] = centerTile;
    // No number token for the center (desert)
  });

  // Load and place the surrounding tiles
  Object.entries(tilePositions).forEach(([tileName, positions]) => {
    positions.forEach(([q, r]) => {
      loadTile(`${tileName}.glb`, (tile) => {
        const pos = axialToWorld(q, r);
        tile.position.set(...pos);
        tile.name = `${tileName}.glb`; // Name for raycaster
        // === Color water tiles blue ===
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
        // Number token for this tile (if present)
        const number = tileNumbers[`${q},${r}`];
        if (number) {
          const sprite = createNumberTokenSprite(number);
          sprite.position.set(0, HEX_RADIUS * 0.35, 0); // Height on Y axis
          tile.add(sprite);
        }
      });
    });
  });

  // Nach dem Platzieren der Tiles: Outline um Land-Tiles zeichnen
  drawLandTileOutline(scene);

  // After placing the tiles: draw road meshes
  drawRoadMeshes(scene);
  hexGroup.name = 'HexGroup'; // Name HexGroup for raycaster
  // Return for main.js
  return { tileMeshes, tileNumbers };
}

// Highlight logic for tiles (e.g. after dice roll)
window.addEventListener('diceRolled', (e) => {
  const number = e.detail;
  Object.entries(tileMeshes).forEach(([key, mesh]) => {
    // Remove old highlight
    mesh.traverse(child => {
      if (child.material && child.material.emissive) {
        child.material.emissive.setHex(0x000000);
      }
    });
    // Highlight if number matches
    if (tileNumbers[key] === number) {
      mesh.traverse(child => {
        if (child.material && child.material.emissive) {
          child.material.emissive.setHex(0xffff00);
        }
      });
    }
  });
});
