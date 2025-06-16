// modules/game_board.js
// Import the game_board module -> import { createGameBoard } from './modules/game_board.js';
// Add hex grid -> createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Import the function to load a single tile

const HEX_RADIUS = 3;
const hexGroup = new THREE.Group();

// Axial coordinates for all tile types. Resource tiles will be randomized, water tiles are fixed.
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

// Converts axial coordinates (q, r) to world coordinates (x, y, z) for tile placement
export function axialToWorld(q, r) {
  const x = HEX_RADIUS * 3/2 * q;
  const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
  const z = 0; // All tiles are on the same plane
  return [x, y, z];
}

// === Helper function for main.js: World coordinates of a tile (axial) ===
export function getTileWorldPosition(q, r) {
    const [x, y, z] = axialToWorld(q, r);
    return { x, y, z };
}

// === Export: World coordinates of a specific corner (Vertex) of a hex tile ===
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

// Returns all axial coordinates for land tiles (including the center desert)
function getLandTileAxials() {
  const landTypes = ['clay', 'ore', 'sheep', 'wheat', 'wood'];
  let coords = [[0, 0]]; // Center desert tile
  landTypes.forEach(type => {
    coords = coords.concat(tilePositions[type]);
  });
  return coords;
}

// Returns the world coordinates of the 6 corners of a hex tile
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

// Returns the axial coordinates of the neighboring tile for a given edge (0-5, clockwise)
function neighborAxial(q, r, edge) {
  // Edge order: 0 = top right, then clockwise
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  return [q + directions[edge][0], r + directions[edge][1]];
}

// Draws all road meshes (as box geometries) between adjacent land tiles
function drawRoadMeshes(scene) {
  const landAxials = getLandTileAxials();
  const landSet = new Set(landAxials.map(([q, r]) => `${q},${r}`));
  const drawnEdges = new Set();

  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    for (let edge = 0; edge < 6; edge++) {
      const [nq, nr] = neighborAxial(q, r, edge);
      const isNeighborLand = landSet.has(`${nq},${nr}`);
      // Edge between two land tiles: draw only once to avoid duplicates
      if (isNeighborLand) {
        const key = [[q, r, edge], [nq, nr, (edge + 3) % 6]]
          .map(([a, b, e]) => `${a},${b},${e}`)
          .sort()
          .join('|');
        if (!drawnEdges.has(key)) {
          drawnEdges.add(key);
          const start = corners[edge];
          const end = corners[(edge + 1) % 6];
          // Create box geometry for the road
          const roadLength = start.distanceTo(end);
          const roadWidth = HEX_RADIUS * 0.20; // Road thickness
          const roadHeight = HEX_RADIUS * 0.40; // Road height
          const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
          const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 }); // Light brown
          const mesh = new THREE.Mesh(geometry, material);
          // Position: center of the edge
          mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
          // Rotate the box to align with the edge direction
          const direction = end.clone().sub(start).normalize();
          const axis = new THREE.Vector3(1, 0, 0); // BoxGeometry is along X axis
          const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
          mesh.setRotationFromQuaternion(quaternion);
          scene.add(mesh);
        }
      } else {
        // Outer edge: always draw a box (e.g., for the border)
        const start = corners[edge];
        const end = corners[(edge + 1) % 6];
        const roadLength = start.distanceTo(end);
        const roadWidth = HEX_RADIUS * 0.20;
        const roadHeight = HEX_RADIUS * 0.40;
        const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
        const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 }); // Light color for border
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

// === Draws a beige outline around all land tiles (including desert) ===
function drawLandTileOutline(scene) {
  const outlineColor = 0xffe066; // nice beige color
  const outlineWidth = 0.13; // slightly thicker
  const landAxials = getLandTileAxials();
  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    // Hex outline as a closed line
    const points = [...corners, corners[0]];
    const geometry = new THREE.BufferGeometry().setFromPoints(points);
    const material = new THREE.LineBasicMaterial({ color: outlineColor, linewidth: outlineWidth });
    const line = new THREE.Line(geometry, material);
    line.position.z += 1.25; // slightly above the tile for visibility
    scene.add(line);
  });
}

// Returns a shuffled array of resource tile types (excluding desert)
function getShuffledResourceTiles() {
    // Standard Catan: 4 sheep, 4 wheat, 4 wood, 3 clay, 3 ore, 1 desert (center)
    const resourceTiles = [
        ...Array(4).fill('sheep'),
        ...Array(4).fill('wheat'),
        ...Array(4).fill('wood'),
        ...Array(3).fill('clay'),
        ...Array(3).fill('ore')
    ];
    // Shuffle using Fisher-Yates
    for (let i = resourceTiles.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [resourceTiles[i], resourceTiles[j]] = [resourceTiles[j], resourceTiles[i]];
    }
    return resourceTiles;
}

// Add number tokens directly when loading a tile
export function createGameBoard(scene) {
    // --- Place the center desert tile ---
    loadTile('center.glb', (centerTile) => {
      centerTile.userData.q = 0;
      centerTile.userData.r = 0;
      const centerPos = axialToWorld(0, 0);
      centerTile.position.set(...centerPos);
      centerTile.name = 'center.glb';
      hexGroup.add(centerTile);
      scene.add(hexGroup);
      tileMeshes[`0,0`] = centerTile;
      // No number token for the center (desert)
    });

    // --- Randomize and place resource tiles ---
    // Get all land tile axial coordinates except center
    const landAxials = getLandTileAxials().filter(([q, r]) => !(q === 0 && r === 0));
    const shuffledResources = getShuffledResourceTiles();
    landAxials.forEach(([q, r], idx) => {
        const resource = shuffledResources[idx];
        loadTile(`${resource}.glb`, (tile) => {
          tile.userData.q = q;
          tile.userData.r = r;
            const pos = axialToWorld(q, r);
            tile.position.set(...pos);
            tile.name = `${resource}.glb`;
            hexGroup.add(tile);
            scene.add(hexGroup);
            tileMeshes[`${q},${r}`] = tile;
            // Number token for this tile (if present)
            const number = tileNumbers[`${q},${r}`];
            if (number) {
                const sprite = createNumberTokenSprite(number);
                sprite.position.set(0, HEX_RADIUS * 0.35, 0);
                tile.add(sprite);
            }
        });
    });

    // --- Place water tiles (fixed positions) ---
    tilePositions.water.forEach(([q, r]) => {
        loadTile('water.glb', (tile) => {
          tile.userData.q = q;
          tile.userData.r = r;
            const pos = axialToWorld(q, r);
            tile.position.set(...pos);
            tile.name = 'water.glb';
            tile.traverse(child => {
                if (child.isMesh) {
                    child.material = new THREE.MeshStandardMaterial({ color: 0x2da7c1, transparent: true, opacity: 0.98 });
                }
            });
            hexGroup.add(tile);
            scene.add(hexGroup);
            tileMeshes[`${q},${r}`] = tile;
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
  // --- Entferne asynchrone window.players/updateResourceUI-Initialisierung (Fehlerquelle) ---
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
      // === Ressourcenverteilung (fix: alle angrenzenden Hexes/Corners prüfen) ===
      // Ermittle Rohstofftyp aus mesh.name (z.B. 'wood.glb' -> 'wood')
      let resourceType = null;
      console.log('[DEBUG] mesh.name:', mesh.name, 'tileNumbers:', tileNumbers[key]);
      if (mesh.name && mesh.name.endsWith('.glb')) {
        resourceType = mesh.name.replace('.glb', '');
      }
      console.log('[DEBUG] resourceType:', resourceType);
      if (resourceType && resourceType !== 'center' && resourceType !== 'water') {
        for (let corner = 0; corner < 6; corner++) {
          // Ermittle alle angrenzenden Hexes/Corners für diese physische Ecke
          // (das aktuelle Hex + 2 Nachbarhexes)
          const adjacent = [
            { q: mesh.userData.q, r: mesh.userData.r, corner },
            (() => { // Nachbar 1
              const directions = [
                [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
              ];
              const prev = (corner + 5) % 6;
              const [dq, dr] = directions[prev];
              return { q: mesh.userData.q + dq, r: mesh.userData.r + dr, corner: (corner + 2) % 6 };
            })(),
            (() => { // Nachbar 2
              const directions = [
                [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
              ];
              const [dq, dr] = directions[corner];
              return { q: mesh.userData.q + dq, r: mesh.userData.r + dr, corner: (corner + 4) % 6 };
            })()
          ];
          for (const player of window.players || []) {
            for (const pos of adjacent) {
              // Debug: Zeige alle Siedlungen und die geprüften Koordinaten
              if (player.settlements && player.settlements.length > 0) {
                console.log(`[DEBUG] Prüfe Siedlungen von ${player.name}:`, player.settlements, 'gegen', pos);
              }
              // Siedlung?
              if (player.settlements && player.settlements.some(s => s.q === pos.q && s.r === pos.r && s.corner === pos.corner)) {
                player.resources[resourceType] = (player.resources[resourceType] || 0) + 1;
                console.log(`[Ressourcen] ${player.name} erhält 1 ${resourceType} (Siedlung)`);
              }
              // Stadt?
              if (player.cities && player.cities.some(c => c.q === pos.q && c.r === pos.r && c.corner === pos.corner)) {
                player.resources[resourceType] = (player.resources[resourceType] || 0) + 2;
                console.log(`[Ressourcen] ${player.name} erhält 2 ${resourceType} (Stadt)`);
              }
            }
          }
        }
      }
    }
  });
  // UI-Update für alle Spieler
  if (window.updateResourceUI && window.players) {
    // Debug: Log Ressourcen nach Verteilung
    window.players.forEach(p => console.log(`[Ressourcen nach Verteilung] ${p.name}:`, p.resources));
    // UI-Update für aktiven Spieler mit Index
    if (window.getActivePlayerIdx) {
      window.updateResourceUI(window.players[window.getActivePlayerIdx()], window.getActivePlayerIdx());
    } else {
      window.updateResourceUI(window.players[0], 0);
    }
  }
});
