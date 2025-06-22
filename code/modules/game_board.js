// modules/game_board.js
// Import the game_board module -> import { createGameBoard } from './modules/game_board.js';
// Add hex grid -> createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Import the function to load a single tile
import { initializeHighlighting, animateHalos, testBorderHighlighting } from './tileHighlight.js';

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

// Store all road meshes for later highlighting
const roadMeshes = {};
function drawRoadMeshes(scene) {
  const landAxials = getLandTileAxials();
  const landSet = new Set(landAxials.map(([q, r]) => `${q},${r}`));
  const drawnEdges = new Set();
  
  // Clear previous road meshes
  Object.keys(roadMeshes).forEach(key => delete roadMeshes[key]);
  
  landAxials.forEach(([q, r]) => {
    const corners = getHexCorners(q, r);
    
    // Process all 6 edges of the tile
    for (let edge = 0; edge < 6; edge++) {
      const [nq, nr] = neighborAxial(q, r, edge);
      const isNeighborLand = landSet.has(`${nq},${nr}`);
      
      // Create a unique key for this edge (tile1|tile2|edge1|edge2)
      const edgeKey = [[q, r, edge], [nq, nr, (edge + 3) % 6]]
        .sort((a, b) => a[0] !== b[0] ? a[0] - b[0] : a[1] - b[1])
        .map(([a, b, e]) => `${a},${b},${e}`)
        .join('|');
      
      // Check if we've already drawn this edge
      if (!drawnEdges.has(edgeKey)) {
        drawnEdges.add(edgeKey);
        
        // Get the start and end points of this edge
        const start = corners[edge];
        const end = corners[(edge + 1) % 6];
        
        // Create road mesh
        const roadLength = start.distanceTo(end);
        const roadWidth = HEX_RADIUS * 0.20;
        const roadHeight = HEX_RADIUS * 0.40;
        const geometry = new THREE.BoxGeometry(roadLength, roadWidth, roadHeight);
        const material = new THREE.MeshStandardMaterial({ color: 0xf5deb3 });
        const mesh = new THREE.Mesh(geometry, material);
        
        // Position and orient the mesh
        mesh.position.copy(start.clone().add(end).multiplyScalar(0.5));
        const direction = end.clone().sub(start).normalize();
        const axis = new THREE.Vector3(1, 0, 0);
        const quaternion = new THREE.Quaternion().setFromUnitVectors(axis, direction);
        mesh.setRotationFromQuaternion(quaternion);
        
        // Add to scene
        scene.add(mesh);
        
        // Store in roadMeshes for both the current tile and neighbor tile (if land)
        roadMeshes[`${q},${r},${edge}`] = mesh;
        
        // If neighbor is land, also store reference from its perspective
        if (isNeighborLand) {
          roadMeshes[`${nq},${nr},${(edge + 3) % 6}`] = mesh;
        }
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

// Store references to the tile meshes (exported for use with robber placement)
export const tileMeshes = {}

// Helper: Create a sprite with a number and background
function createNumberTokenSprite(number) {
    const size = 128;
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');    
    
    // Background (circle)
    const defaultBackgroundColor = '#fff8dc'; // Default cream background color
    ctx.beginPath();
    ctx.arc(size/2, size/2, size/2 - 8, 0, 2 * Math.PI);
    ctx.fillStyle = defaultBackgroundColor;
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
        fontColor = '#222';    } else { // fallback
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
    
    // Store variables needed for updating the token color
    sprite.userData.canvas = canvas;
    sprite.userData.ctx = ctx;
    sprite.userData.texture = texture;
    sprite.userData.number = number;
    sprite.userData.defaultBackgroundColor = defaultBackgroundColor;
      // Store function to update background color and optionally text color
    sprite.userData.updateBackgroundColor = function(bgColor, textColor = null) {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Redraw background with new color
        ctx.beginPath();
        ctx.arc(size/2, size/2, size/2 - 8, 0, 2 * Math.PI);
        ctx.fillStyle = bgColor;
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 12;
        ctx.fill();
        ctx.shadowBlur = 0;
        
        // Border for better visibility
        ctx.lineWidth = 6;
        ctx.strokeStyle = '#222';
        ctx.stroke();
        
        // Redraw number with original or specified text color
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = textColor || fontColor; // Use specified text color or fall back to original
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(number, size/2, size/2);
        
        // Update texture to show changes
        texture.needsUpdate = true;
    };
    
    // Default position - will be overridden when added to tile
    sprite.position.set(0, 2.5, 0); // Y-Achse für die Höhe verwenden (moderat über dem Räuber)
    
    return sprite;
}

// Add number tokens to all land tiles
export function addNumberTokensToTiles(scene, tileMeshes, tileNumbers) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        if (number) {
            const sprite = createNumberTokenSprite(number);            // Position the sprite at a moderate height above the tile so it's visible when the robber is present
            sprite.position.set(0, 2.5, 0); // Y-Achse für die Höhe verwenden - etwas höher als der Räuber (3.2)
            
            // Store useful data for robber placement
            sprite.userData.number = number;
            sprite.userData.tileKey = key;
            const [q, r] = key.split(',').map(Number);
            sprite.userData.tileQ = q;
            sprite.userData.tileR = r;
            
            // Give the token a descriptive name for easier identification
            sprite.name = `token_${number}_tile_${key}`;            // Make the token larger and more clickable for robber placement
            sprite.scale.set(1.2, 1.2, 1.2);
            
            // Add the sprite to the tile mesh
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

// Add the game board with tiles to the scene
export function createGameBoard(scene) {    // --- Place the center desert tile ---
    loadTile('center.glb', (centerTile) => {
        const centerPos = axialToWorld(0, 0);
        centerTile.position.set(...centerPos);
        centerTile.name = '0,0';
        
        // Add userData to help with robber placement
        centerTile.userData.tileKey = '0,0';
        centerTile.userData.tileQ = 0;
        centerTile.userData.tileR = 0;
        centerTile.userData.type = 'desert';
        centerTile.userData.isDesert = true;
        
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
            // Set a proper name and userData for robber placement
            const tileKey = `${q},${r}`;
            tile.name = tileKey;
            
            // Add userData to help with robber placement
            tile.userData.tileKey = tileKey;
            tile.userData.tileQ = q;
            tile.userData.tileR = r;
            tile.userData.type = resource;
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
                // Position the number token at a moderate height above the tile
                sprite.position.set(0, 1.6, 0); // Reduzierte Höhe, aber immer noch über dem Räuber (3.2)
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
    
    // After placing the tiles: draw outline around land tiles
    drawLandTileOutline(scene);

    // After placing the tiles: draw road meshes
    drawRoadMeshes(scene);
    hexGroup.name = 'HexGroup'; // Name HexGroup for raycaster
    
    // Initialize the tile highlighting system
    initializeHighlighting(hexGroup, tileNumbers, roadMeshes, tileMeshes);
    
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
      // Ermittle Rohstofftyp aus userData.type (sicher und eindeutig)
      let resourceType = mesh.userData && mesh.userData.type ? mesh.userData.type : null;
      // Debug: Log resourceType und userData
      // console.log('DEBUG resourceType:', resourceType, mesh.userData);
      if (resourceType && resourceType !== 'center' && resourceType !== 'water' && resourceType !== 'desert') {
        for (let corner = 0; corner < 6; corner++) {
          const adjacent = [
            { q: mesh.userData.tileQ ?? mesh.userData.q, r: mesh.userData.tileR ?? mesh.userData.r, corner },
            (() => {
              const directions = [
                [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
              ];
              const prev = (corner + 5) % 6;
              const [dq, dr] = directions[prev];
              return { q: (mesh.userData.tileQ ?? mesh.userData.q) + dq, r: (mesh.userData.tileR ?? mesh.userData.r) + dr, corner: (corner + 2) % 6 };
            })(),
            (() => {
              const directions = [
                [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
              ];
              const [dq, dr] = directions[corner];
              return { q: (mesh.userData.tileQ ?? mesh.userData.q) + dq, r: (mesh.userData.tileR ?? mesh.userData.r) + dr, corner: (corner + 4) % 6 };
            })()
          ];
          for (const player of window.players || []) {
            for (const pos of adjacent) {
              if (player.settlements && player.settlements.some(s => s.q === pos.q && s.r === pos.r && s.corner === pos.corner)) {
                player.resources[resourceType] = (player.resources[resourceType] || 0) + 1;
              }
              if (player.cities && player.cities.some(c => c.q === pos.q && c.r === pos.r && c.corner === pos.corner)) {
                player.resources[resourceType] = (player.resources[resourceType] || 0) + 2;
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

// Re-export the highlight functions from tileHighlight module
export { animateHalos, testBorderHighlighting };

// Function to update number token colors when the robber is moved
// Function to update number token colors based on robber position
export function updateNumberTokensForRobber(robberTileKey) {
    const ROBBER_BLOCKED_COLOR = '#FF4D00'; // Vibrant orange color for blocked tile
    
    console.log(`Updating number token colors, robber on tile ${robberTileKey}`);
    
    // Reset all number tokens to default color first
    Object.values(tileMeshes).forEach(mesh => {
        mesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor) {
                child.userData.updateBackgroundColor(child.userData.defaultBackgroundColor, null); // Reset to default background with original text color
                console.log(`Reset token color on tile ${child.userData.tileKey || 'unknown'}`);
            }
        });
    });
    
    // If we have a blocked tile, change its token color
    if (robberTileKey && tileMeshes[robberTileKey]) {
        const blockedTileMesh = tileMeshes[robberTileKey];
        
        // Find the number token in this tile and change its color
        blockedTileMesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor) {
                console.log(`Changing token color on blocked tile ${robberTileKey} to #FF4D00`);
                child.userData.updateBackgroundColor(ROBBER_BLOCKED_COLOR, '#000000'); // Orange background with black text
            }
        });
    }
}
