// modules/game_board.js
// Import the game_board module -> import { createGameBoard } from './modules/game_board.js';
// Add hex grid -> createGameBoard(scene);

import * as THREE from 'three';
import { loadTile } from '../loader.js'; // Import the function to load a single tile
import { initializeHighlighting, animateHalos, testBorderHighlighting } from './tileHighlight.js';
import { getEquivalentCorners } from './buildLogic.js';

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
const goldenFlags = new Set(); // Track which tiles have golden flags

(function assignTileNumbers() {
  // Catan standard: 18 triangular flags (2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12), desert gets none
  const numbers = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12]; // 18 flags, no 7
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

// Helper: Assign golden flags based on probability priority (more balanced)
(function assignGoldenFlags() {
  // Get all tiles with numbers and sort by probability (lowest first)
  const tilesWithNumbers = Object.entries(tileNumbers)
    .filter(([key, number]) => number !== null)
    .map(([key, number]) => ({ key, number, coords: key.split(',').map(Number) }));
  
  // More balanced probability weighting: lower numbers still preferred but less extreme
  const probabilityWeights = {
    2: 0.4, 12: 0.4,   // Highest chance for golden flags
    3: 0.35, 11: 0.35, // High chance
    4: 0.25, 10: 0.25, // Medium-high chance
    5: 0.2, 9: 0.2,    // Medium chance
    6: 0.15, 8: 0.15   // Lower chance (but still possible)
  };
  
  // Create weighted list for random selection
  const weightedTiles = [];
  tilesWithNumbers.forEach(tile => {
    const weight = probabilityWeights[tile.number] || 0.1;
    const copies = Math.ceil(weight * 100); // Convert to integer weight
    for (let i = 0; i < copies; i++) {
      weightedTiles.push(tile.key);
    }
  });
  
  // Randomly select golden flags (approximately 30% of tiles)
  const maxGoldenFlags = Math.min(6, Math.floor(tilesWithNumbers.length * 0.3));
  const usedKeys = new Set();
  
  for (let i = 0; i < maxGoldenFlags; i++) {
    let attempts = 0;
    let selectedKey;
    do {
      selectedKey = weightedTiles[Math.floor(Math.random() * weightedTiles.length)];
      attempts++;
    } while (usedKeys.has(selectedKey) && attempts < 100);
    
    if (!usedKeys.has(selectedKey)) {
      goldenFlags.add(selectedKey);
      usedKeys.add(selectedKey);
    }
  }
  
  console.log(`Assigned ${goldenFlags.size} golden flags to tiles:`, Array.from(goldenFlags));
  console.log('Tile numbers:', tileNumbers);
  console.log('Golden flags details:', Array.from(goldenFlags).map(key => ({
    key,
    number: tileNumbers[key],
    coords: key.split(',').map(Number)
  })));
})();

// Store references to the tile meshes (exported for use with robber placement)
export const tileMeshes = {}

// Export golden flags for external access
export const getGoldenFlags = () => goldenFlags;

// Helper: Create a sprite with a triangular flag instead of circular chip
function createNumberTokenSprite(number, isGolden = false) {
    const size = 960; // Tripled from 320 for three times as big flag
    const canvas = document.createElement('canvas');
    canvas.width = size;
    canvas.height = size;
    const ctx = canvas.getContext('2d');
    
    // Flag colors matching the original chip design
    let flagColor, fontColor, fontSize, poleColor, borderColor;
    
    if (isGolden) {
        // Golden flag styling with brown/bronze shades for authentic gold look
        flagColor = '#CD7F32'; // Bronze/golden brown flag background
        fontColor = '#2F1B14'; // Dark brown text for contrast
        poleColor = '#8B4513'; // Saddle brown pole
        borderColor = '#A0522D'; // Sienna brown border
    } else {
        // Regular flag styling
        poleColor = '#8B4513'; // Saddle brown color for regular poles
        borderColor = '#444'; // Regular border color
        
        if (number === 6 || number === 8) {
            flagColor = '#d7263d'; // strong red flag for high probability numbers
            fontColor = '#ffffff'; // white text on red background
        } else {
            flagColor = '#fff8dc'; // cream flag
            fontColor = '#222';
        }
    }
    
    // Font sizes based on number probability - increased sizes
    if (number === 6 || number === 8) {
        fontSize = 160; // Increased from 140
    } else if (number === 2 || number === 12) {
        fontSize = 85; // Increased from 70
    } else if (number === 3 || number === 11) {
        fontSize = 100; // Increased from 84
    } else if (number === 4 || number === 10) {
        fontSize = 115; // Increased from 98
    } else if (number === 5 || number === 9) {
        fontSize = 130; // Increased from 112
    } else { // fallback
        fontSize = 115; // Increased from 98
    }
    
    const defaultBackgroundColor = flagColor; // Store default flag color
    const defaultPoleColor = poleColor; // Store default pole color
    
    // Center the pole in the canvas - make flag smaller
    const poleX = size / 2 - 30; // Reduced from 36 for smaller pole
    const poleWidth = 60; // Reduced from 72 for smaller pole
    const poleTop = 80; // Moved down slightly
    const poleBottom = 680; // Reduced from 720
    
    // Draw golden or brown pole
    ctx.fillStyle = poleColor;
    ctx.fillRect(poleX, poleTop, poleWidth, poleBottom - poleTop);
    
    // Draw smaller triangular flag attached to the right side of the pole
    const flagLeft = poleX + poleWidth; // Start at right edge of pole
    const flagTop = poleTop; // Start at top of pole
    const flagBottom = poleTop + 400; // Make flag smaller (400px instead of 480px)
    const flagRight = size - 80; // Make flag narrower (80px from edge instead of 60px)
    const flagMid = (flagTop + flagBottom) / 2;
    
    ctx.beginPath();
    ctx.moveTo(flagLeft, flagTop); // Start at pole, top
    ctx.lineTo(flagLeft, flagBottom); // Down along pole
    ctx.lineTo(flagRight, flagMid); // Point to the right (triangle tip)
    ctx.closePath();
    
    // Fill flag with color and shadow
    ctx.shadowColor = '#000';
    ctx.shadowBlur = 48; // Tripled from 16
    ctx.shadowOffsetX = 12; // Tripled from 4
    ctx.shadowOffsetY = 12; // Tripled from 4
    ctx.fillStyle = flagColor;
    ctx.fill();
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Flag border for definition
    ctx.lineWidth = 12; // Tripled from 4
    ctx.strokeStyle = borderColor;
    ctx.stroke();
    
    // Add the number text on the flag - moved closer to pole
    ctx.font = `bold ${fontSize}px Arial`;
    ctx.fillStyle = fontColor;
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    // Position text closer to the pole (moved left from 0.4 to 0.25)
    const textX = flagLeft + (flagRight - flagLeft) * 0.25; // Moved closer to pole
    const textY = flagMid; // Vertical center of flag
    ctx.fillText(number, textX, textY);
    
    // Create texture and sprite
    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({ map: texture, transparent: true, opacity: 0.95 });
    const sprite = new THREE.Sprite(material);
    sprite.scale.set(0.5, 0.5, 1); // Made even smaller from 0.6
    
    // Add distance-based scaling for better visibility
    sprite.userData.originalScale = { x: 0.5, y: 0.5, z: 1 }; // Updated base scale
    sprite.userData.scaleWithDistance = function(camera) {
        const distance = sprite.position.distanceTo(camera.position);
        // Scale up when further away, minimum scale 0.5, maximum scale 1.5
        const scaleFactor = Math.max(0.5, Math.min(1.5, distance * 0.10));
        sprite.scale.set(scaleFactor, scaleFactor, 1);
        
        // Debug logging (remove after testing)
        if (Math.random() < 0.001) { // Only log occasionally to avoid spam
            console.log(`Flag ${sprite.userData.number}: distance=${distance.toFixed(2)}, scale=${scaleFactor.toFixed(2)}`);
        }
    };
    
    // Store variables needed for updating the flag color
    sprite.userData.canvas = canvas;
    sprite.userData.ctx = ctx;
    sprite.userData.texture = texture;
    sprite.userData.number = number;
    sprite.userData.isGolden = isGolden;
    sprite.userData.defaultBackgroundColor = defaultBackgroundColor;
    sprite.userData.defaultFontColor = fontColor;
    sprite.userData.defaultPoleColor = defaultPoleColor;
    sprite.userData.defaultBorderColor = borderColor;
    sprite.userData.fontSize = fontSize;
    sprite.userData.isActivated = false; // Track activation state
    
    // Store function to update flag color and optionally text color
    sprite.userData.updateBackgroundColor = function(bgColor, textColor = null, activated = false) {
        // Clear canvas
        ctx.clearRect(0, 0, size, size);
        
        // Recalculate coordinates (same as above) - updated to match main function
        const poleX = size / 2 - 30; // Match the main function - smaller pole
        const poleWidth = 60; // Match the main function - smaller pole
        const poleTop = 80; // Match the main function
        const poleBottom = 680; // Match the main function
        const flagLeft = poleX + poleWidth;
        const flagTop = poleTop; // Match the main function - flag starts at top of pole
        const flagBottom = poleTop + 400; // Match the main function - smaller flag (400px)
        const flagRight = size - 80; // Match the main function - narrower flag
        const flagMid = (flagTop + flagBottom) / 2;
        
        // Determine pole color and styling
        let currentPoleColor = defaultPoleColor;
        let currentBorderColor = defaultBorderColor;
        let currentFlagColor = bgColor;
        
        if (activated) {
            // Any activated flag (golden or regular) gets consistent orange highlighting
            currentFlagColor = '#FF8C00'; // Consistent orange for all activated flags
            currentBorderColor = '#FF4500'; // Orange border when activated
            // Keep original pole color for consistency
        } else if (isGolden) {
            // Golden flag not activated: use golden brown appearance
            currentFlagColor = bgColor || '#CD7F32'; // Bronze/golden brown
            currentBorderColor = '#A0522D'; // Sienna brown border
            currentPoleColor = '#8B4513'; // Saddle brown pole
        } else {
            // Regular flag: use provided or default colors
            currentFlagColor = bgColor || defaultBackgroundColor;
        }
        
        // Redraw pole
        ctx.fillStyle = currentPoleColor;
        ctx.fillRect(poleX, poleTop, poleWidth, poleBottom - poleTop);
        
        // Redraw triangular flag with new color
        ctx.beginPath();
        ctx.moveTo(flagLeft, flagTop);
        ctx.lineTo(flagLeft, flagBottom);
        ctx.lineTo(flagRight, flagMid);
        ctx.closePath();
        
        ctx.shadowColor = '#000';
        ctx.shadowBlur = 48; // Tripled from 16
        ctx.shadowOffsetX = 12; // Tripled from 4
        ctx.shadowOffsetY = 12; // Tripled from 4
        ctx.fillStyle = currentFlagColor;
        ctx.fill();
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;
        
        // Flag border
        ctx.lineWidth = 12; // Tripled from 4
        ctx.strokeStyle = currentBorderColor;
        ctx.stroke();
        
        // Redraw number with original or specified text color - moved closer to pole
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.fillStyle = textColor || fontColor;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        const textX = flagLeft + (flagRight - flagLeft) * 0.25; // Closer to pole
        const textY = flagMid;
        ctx.fillText(number, textX, textY);
        
        // Update texture to show changes
        texture.needsUpdate = true;
        
        // Update activation state
        sprite.userData.isActivated = activated;
    };
    
    // Default position - moved down for better tile association
    sprite.position.set(0, 1.8, 0); // Lowered from 2.5 to 1.8
    
    return sprite;
}

// Add triangular flags to all land tiles
export function addNumberTokensToTiles(scene, tileMeshes, tileNumbers) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const number = tileNumbers[key];
        if (number) {
            const isGolden = goldenFlags.has(key);
            const sprite = createNumberTokenSprite(number, isGolden);
            
            console.log(`Creating flag for tile ${key}: number=${number}, isGolden=${isGolden}`);
            
            // Position the sprite at a lower height above the tile for better association
            sprite.position.set(0, 1.8, 0); // Lowered from 2.5 to 1.8
            
            // Store useful data for robber placement and golden flag logic
            sprite.userData.number = number;
            sprite.userData.tileKey = key;
            sprite.userData.isGolden = isGolden;
            const [q, r] = key.split(',').map(Number);
            sprite.userData.tileQ = q;
            sprite.userData.tileR = r;
            
            // Give the flag a descriptive name for easier identification
            sprite.name = `flag_${number}_tile_${key}${isGolden ? '_golden' : ''}`;
            
            // Make the flag clickable for robber placement - smaller size
            sprite.scale.set(0.65, 0.65, 0.65); // Slightly reduced from 0.8 to make smaller
            
            // Add the sprite to the tile mesh
            mesh.add(sprite);
        }
    });
}

// Animation: Always face triangular flags towards the camera and scale based on distance
export function updateNumberTokensFacingCamera(scene, camera) {
    scene.traverse(obj => {
        if (obj.type === 'Sprite' && obj.userData.number) {
            obj.quaternion.copy(camera.quaternion);
            // Apply distance-based scaling if available
            if (obj.userData.scaleWithDistance) {
                obj.userData.scaleWithDistance(camera);
            }
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
export function createGameBoard(scene) {
    return new Promise((resolve) => {
        let loadedTiles = 0;
        const totalTiles = 1 + getLandTileAxials().filter(([q, r]) => !(q === 0 && r === 0)).length + tilePositions.water.length;
        
        function checkAllTilesLoaded() {
            loadedTiles++;
            if (loadedTiles === totalTiles) {
                // All tiles loaded, now add flags
                addNumberTokensToTiles(scene, tileMeshes, tileNumbers);
                
                // After placing the tiles: draw outline around land tiles
                drawLandTileOutline(scene);

                // After placing the tiles: draw road meshes
                drawRoadMeshes(scene);
                hexGroup.name = 'HexGroup'; // Name HexGroup for raycaster
                
                // Initialize the tile highlighting system
                initializeHighlighting(hexGroup, tileNumbers, roadMeshes, tileMeshes);
                
                // Return for main.js
                resolve({ tileMeshes, tileNumbers });
            }
        }
        
        // --- Place the center desert tile ---
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
            // No triangular flag for the center (desert)
            
            checkAllTilesLoaded();
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
                
                checkAllTilesLoaded();
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
                
                checkAllTilesLoaded();
            });
        });
    });
}

// Änderungen für game_board.js - ersetze den diceRolled Event Listener mit dieser Version:

// Highlight logic for tiles (e.g. after dice roll)
window.addEventListener('diceRolled', (e) => {
    // --- Entferne asynchrone window.players/updateResourceUI-Initialisierung (Fehlerquelle) ---
  const number = e.detail;
  
  // Reset gain trackers am Anfang des Events in uiResources.js
  
  Object.entries(tileMeshes).forEach(([key, mesh]) => {
    // Blockiere Ressourcenverteilung, wenn Räuber auf diesem Feld steht
    if (typeof window.blockedTileKey !== 'undefined' && key === window.blockedTileKey) {
      // Optional: Debug-Log
      console.log(`[Räuber] Ressourcenverteilung auf Feld ${key} blockiert.`);
      return;
    }
    if (tileNumbers[key] === number) {
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
          
          // Iteriere über alle Spieler mit Index für Gain Tracking
          for (let playerIdx = 0; playerIdx < (window.players || []).length; playerIdx++) {
            const player = window.players[playerIdx];
            for (const pos of adjacent) {
              // Check if this tile has a golden flag
              const isGolden = goldenFlags.has(key);
              
              // Siedlung: 1 Karte (2 if golden flag)
              if (player.settlements && player.settlements.some(s => s.q === pos.q && s.r === pos.r && s.corner === pos.corner)) {
                const baseAmount = isGolden ? 2 : 1; // Golden flag gives +1 resource
                let given = 0;
                
                for (let i = 0; i < baseAmount; i++) {
                  if (window.bank && window.bank[resourceType] > 0) {
                    player.resources[resourceType] = (player.resources[resourceType] || 0) + 1;
                    window.bank[resourceType]--;
                    given++;
                  }
                }
                
                // Track gain for this player
                if (given > 0 && window.trackResourceGain) {
                  window.trackResourceGain(playerIdx, resourceType, given);
                }
                
                // Log golden flag activation
                if (isGolden && given > 0) {
                  console.log(`[Golden Flag] ${player.name} got ${given} ${resourceType} from golden flag on tile ${key}`);
                }
              }
              
              // Stadt: 2 Karten (3 if golden flag, not 4 to keep balance)
              if (player.cities && player.cities.some(c => c.q === pos.q && c.r === pos.r && c.corner === pos.corner)) {
                const baseAmount = isGolden ? 3 : 2; // Golden flag gives +1 resource (not double)
                let given = 0;
                
                for (let i = 0; i < baseAmount; i++) {
                  if (window.bank && window.bank[resourceType] > 0) {
                    player.resources[resourceType] = (player.resources[resourceType] || 0) + 1;
                    window.bank[resourceType]--;
                    given++;
                  }
                }
                
                // Track gain for cities
                if (given > 0 && window.trackResourceGain) {
                  window.trackResourceGain(playerIdx, resourceType, given);
                }
                
                // Log golden flag activation
                if (isGolden && given > 0) {
                  console.log(`[Golden Flag] ${player.name} got ${given} ${resourceType} from golden flag city on tile ${key}`);
                }
              }
            }
          }
        }
      }
    }
  });
  
  // Update golden flag visual states when activated
  Object.entries(tileMeshes).forEach(([key, mesh]) => {
    if (tileNumbers[key] === number && goldenFlags.has(key)) {
      // This golden flag was activated, update its visual state
      mesh.traverse(child => {
        if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor && child.userData.isGolden) {
          child.userData.updateBackgroundColor(null, null, true); // Activate golden flag (orange middle)
          console.log(`[Golden Flag] Activated flag on tile ${key}`);
        }
      });
    }
  });
  
  // Reset golden flag visual states for non-activated flags
  setTimeout(() => {
    Object.values(tileMeshes).forEach(mesh => {
      mesh.traverse(child => {
        if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor && child.userData.isGolden) {
          child.userData.updateBackgroundColor(null, null, false); // Reset to golden state
        }
      });
    });
  }, 2000); // Reset after 2 seconds
  
  // UI-Update für alle Spieler
  if (window.updateResourceUI && window.players) {
    // Debug: Log Ressourcen nach Verteilung
    window.players.forEach(p => console.log(`[Ressourcen nach Verteilung] ${p.name}:`, p.resources));

    // UI-Update für aktiven Spieler mit globalem Index
    if (typeof window.activePlayerIdx === 'number') {
      window.updateResourceUI(window.players[window.activePlayerIdx], window.activePlayerIdx);
    } else {
      window.updateResourceUI(window.players[0], 0);
    }
  }
  // Debug: Log Bank-Bestand
  if (window.bank) {
    console.log('[Bank nach Verteilung]', JSON.stringify(window.bank));
  }
});

// Re-export the highlight functions from tileHighlight module
export { animateHalos, testBorderHighlighting };

// Function to update triangular flag colors when the robber is moved
// Function to update flag colors based on robber position
export function updateNumberTokensForRobber(robberTileKey) {
    const ROBBER_BLOCKED_COLOR = '#FF8C00'; // Consistent orange color for all blocked tiles
    
    console.log(`Updating triangular flag colors, robber on tile ${robberTileKey}`);
    
    // Reset all flags to default color first
    Object.values(tileMeshes).forEach(mesh => {
        mesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor) {
                // Reset to default appearance (golden or regular)
                child.userData.updateBackgroundColor(child.userData.defaultBackgroundColor, null, false);
                console.log(`Reset flag color on tile ${child.userData.tileKey || 'unknown'} (Golden: ${child.userData.isGolden || false})`);
            }
        });
    });
    
    // If we have a blocked tile, change its flag color to consistent orange
    if (robberTileKey && tileMeshes[robberTileKey]) {
        const blockedTileMesh = tileMeshes[robberTileKey];
        
        // Find the triangular flag in this tile and change its color
        blockedTileMesh.traverse(child => {
            if (child.type === 'Sprite' && child.userData && child.userData.updateBackgroundColor) {
                console.log(`Changing flag color on blocked tile ${robberTileKey} to consistent orange`);
                child.userData.updateBackgroundColor(ROBBER_BLOCKED_COLOR, '#000000', true); // Orange with black text and activated state
            }
        });
    }
}

// === Funktion: Nach Räuberplatzierung einen Rohstoff von einem betroffenen Spieler stehlen ===
function handleRobberSteal(q, r) {
  if (!window.players || typeof window.activePlayerIdx !== 'number') return;
  const activePlayer = window.players[window.activePlayerIdx];
  // Prüfe alle 6 Ecken des Hexfelds und sammle alle Opfer
  let allVictims = [];
  let victimSet = new Set();
  for (let corner = 0; corner < 6; corner++) {
    const equivalents = typeof getEquivalentCorners === 'function' ? getEquivalentCorners(q, r, corner) : [{q, r, corner}];
    window.players.forEach((p, idx) => {
      if (idx === window.activePlayerIdx) return;
      const isVictim = equivalents.some(eq =>
        (p.settlements && p.settlements.some(s => s.q === eq.q && s.r === eq.r && s.corner === eq.corner)) ||
        (p.cities && p.cities.some(c => c.q === eq.q && c.r === eq.r && c.corner === eq.corner))
      );
      if (isVictim && !victimSet.has(idx)) {
        allVictims.push(p);
        victimSet.add(idx);
      }
    });
  }
  if (allVictims.length === 0) {
    showRobberFeedback('Kein Spieler zum Stehlen an diesem Feld.', '#888');
    return;
  }
  // Wenn nur ein Opfer: direkt stehlen
  if (allVictims.length === 1) {
    stealRandomResource(activePlayer, allVictims[0]);
    return;
  }
  // Mehrere Opfer: UI-Auswahl
  showRobberVictimDialog(activePlayer, allVictims);
}

function stealRandomResource(stealer, victim) {
  // Erstelle Liste aller Rohstoffe, die der Spieler hat
  const resourceKeys = Object.keys(victim.resources).filter(k => victim.resources[k] > 0);
  if (resourceKeys.length === 0) {
    showRobberFeedback(`${victim.name} hat keine Rohstoffe zum Stehlen.`, '#888');
    return;
  }
  const chosen = resourceKeys[Math.floor(Math.random() * resourceKeys.length)];
  victim.resources[chosen]--;
  stealer.resources[chosen] = (stealer.resources[chosen] || 0) + 1;
  showRobberFeedback(`${stealer.name} stiehlt 1x ${chosen} von ${victim.name}!`, '#2a8c2a');
  if (typeof window.updateResourceUI === 'function') window.updateResourceUI(stealer);
  if (typeof window.updateResourceUI === 'function') window.updateResourceUI(victim);
}

function showRobberVictimDialog(stealer, victims) {
  // Einfaches Dialog-Overlay
  let overlay = document.getElementById('robber-victim-overlay');
  if (overlay) overlay.remove();
  overlay = document.createElement('div');
  overlay.id = 'robber-victim-overlay';
  overlay.style.position = 'fixed';
  overlay.style.left = '0';
  overlay.style.top = '0';
  overlay.style.width = '100vw';
  overlay.style.height = '100vh';
  overlay.style.background = 'rgba(0,0,0,0.25)';
  overlay.style.zIndex = '100001';
  overlay.style.display = 'flex';
  overlay.style.alignItems = 'center';
  overlay.style.justifyContent = 'center';

  const dialog = document.createElement('div');
  dialog.style.background = 'rgba(255,255,255,0.98)';
  dialog.style.borderRadius = '0.7em';
  dialog.style.boxShadow = '0 8px 32px #0004';
  dialog.style.padding = '2em 2.5em 1.5em 2.5em';
  dialog.style.display = 'flex';
  dialog.style.flexDirection = 'column';
  dialog.style.alignItems = 'center';
  dialog.style.gap = '1.2em';
  dialog.style.fontFamily = 'Montserrat, Arial, sans-serif';
  dialog.style.minWidth = '320px';
  dialog.style.maxWidth = '90vw';

  const title = document.createElement('div');
  title.textContent = 'Wähle einen Spieler zum Stehlen:';
  title.style.fontWeight = 'bold';
  title.style.fontSize = '1.2em';
  title.style.marginBottom = '0.5em';
  dialog.appendChild(title);

  victims.forEach(victim => {
    const btn = document.createElement('button');
    btn.textContent = victim.name;
    btn.style.background = '#ffe066';
    btn.style.color = '#222';
    btn.style.border = 'none';
    btn.style.borderRadius = '0.3em';
    btn.style.padding = '0.5em 2em';
    btn.style.fontWeight = 'bold';
    btn.style.fontSize = '1.1em';
    btn.style.cursor = 'pointer';
    btn.style.margin = '0.5em 0';
    btn.onclick = () => {
      stealRandomResource(stealer, victim);
      overlay.remove();
    };
    dialog.appendChild(btn);
  });

  // Abbrechen-Button
  const cancelBtn = document.createElement('button');
  cancelBtn.textContent = 'Abbrechen';
  cancelBtn.style.background = '#bbb';
  cancelBtn.style.color = '#222';
  cancelBtn.style.border = 'none';
  cancelBtn.style.borderRadius = '0.3em';
  cancelBtn.style.padding = '0.5em 2em';
  cancelBtn.style.fontWeight = 'bold';
  cancelBtn.style.fontSize = '1.1em';
  cancelBtn.style.cursor = 'pointer';
  cancelBtn.style.marginTop = '1.2em';
  cancelBtn.onclick = () => overlay.remove();
  dialog.appendChild(cancelBtn);

  overlay.appendChild(dialog);
  document.body.appendChild(overlay);
}

function showRobberFeedback(msg, color = '#2a8c2a', duration = 2500) {
  let el = document.getElementById('robber-feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'robber-feedback';
    el.style.position = 'fixed';
    el.style.left = '50%';
    el.style.bottom = '4.5em';
    el.style.transform = 'translateX(-50%)';
    el.style.background = 'rgba(255,255,255,0.95)';
    el.style.color = color;
    el.style.fontWeight = 'bold';
    el.style.fontSize = '1.15em';
    el.style.fontFamily = 'Montserrat, Arial, sans-serif';
    el.style.padding = '0.7em 2.2em';
    el.style.borderRadius = '0.7em';
    el.style.boxShadow = '0 4px 24px #0002';
    el.style.zIndex = '99999';
    el.style.textAlign = 'center';
    document.body.appendChild(el);
  }
  el.textContent = msg;
  el.style.color = color;
  el.style.display = 'block';
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => { el.style.display = 'none'; }, duration);
}

// Event-Listener für Räuberbewegung: Stehlen nach Platzierung
window.addEventListener('robberMoved', (e) => {
    // ...existing code...
    // Stehlen-Logik aufrufen
    // Nur q, r übergeben, alle 6 Ecken werden geprüft
    handleRobberSteal(e.detail.q, e.detail.r);
});
