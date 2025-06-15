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

// Add the game board with tiles to the scene
export function createGameBoard(scene) {
    // --- Place the center desert tile ---
    loadTile('center.glb', (centerTile) => {
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
    
    // Return for main.js
    return { tileMeshes, tileNumbers };
}

// Create a brief sunbeam effect that illuminates the tile and then fades away
function createTileHalo(position, height = HEX_RADIUS * 1.5, color = 0xffdd66) {
  // Create a group to hold the sunbeam effect
  const beamGroup = new THREE.Group();

  // Create a primary shaft of light down onto the tile
  const beamGeometry = new THREE.CylinderGeometry(
    HEX_RADIUS * 0.6,  // top radius (smaller)
    HEX_RADIUS * 0.8,  // bottom radius (still wider at bottom but smaller overall)
    height,            // height of the beam (reduced)
    16,                // radial segments
    2,                 // height segments
    true               // open-ended
  );
  
  // Create a bright, glowing material
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: 0xffffd0,     // Bright, warm light color
    transparent: true,
    opacity: 0.5,        // Start less bright for less visual impact
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    depthWrite: false
  });
  
  // Create the beam mesh
  const beam = new THREE.Mesh(beamGeometry, beamMaterial);
  beam.position.set(0, 0, height / 2);
  beam.rotation.x = Math.PI / 2; // Point downward
  
  // Set userData directly on the beam
  beam.userData = { isMainBeam: true };
  beamGroup.add(beam);
    // Add some floating dust/light particles in the beam for visual interest
  const particleCount = 6; // Further reduced particle count for shorter column
  const particleGroup = new THREE.Group();
  
  for (let i = 0; i < particleCount; i++) {
    const particleSize = Math.random() * 0.1 + 0.05; // Even smaller particles
    const particleGeometry = new THREE.SphereGeometry(particleSize, 6, 6); // Simpler geometry
    const particleMaterial = new THREE.MeshBasicMaterial({
      color: 0xffffff,
      transparent: true,
      opacity: Math.random() * 0.35 + 0.15, // Less opaque
      blending: THREE.AdditiveBlending
    });
    
    const particle = new THREE.Mesh(particleGeometry, particleMaterial);
    
    // Position randomly within the beam but not too close to the bottom
    const radius = Math.random() * (HEX_RADIUS * 0.4); // Keep particles even closer to center
    const angle = Math.random() * Math.PI * 2;
    const heightPos = Math.random() * height * 0.6 + height * 0.2; // Keep away from bottom and top
    
    particle.position.set(
      radius * Math.cos(angle),
      radius * Math.sin(angle),
      heightPos
    );
    
    // Set userData directly on the particle
    particle.userData = {
      isParticle: true,
      originalOpacity: particle.material.opacity
    };
    
    particleGroup.add(particle);
  }
  
  beamGroup.add(particleGroup);
    // Set up the effect to fade out properly with even shorter duration values
  beamGroup.userData = {
    isHalo: true,
    isBeam: true,
    isFading: false,
    creationTime: Date.now() * 0.001,
    lifespan: 0.5,     // Seconds before starting to fade (much shorter)
    fadeDuration: 0.3  // Seconds to fade out (much faster fade)
  };
    // Position the entire group at the tile position, but slightly higher to avoid any division effect
  beamGroup.position.set(position.x, position.y, position.z + 0.5);
  
  return beamGroup;
}

// Add halo effects to all land tiles
export function addTileHalos(scene, tileMeshes) {
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const position = mesh.position;
        // Create and add the halo
        const halo = createTileHalo(position);
        scene.add(halo);
    });
}

// Animation: Update halo visibility based on camera distance
export function updateTileHaloVisibility(scene, camera) {
    const distanceThreshold = HEX_RADIUS * 2; // Distance at which halos start to fade
    const maxOpacity = 0.6; // Fully visible
    const minOpacity = 0.0; // Fully transparent
    
    scene.traverse(obj => {
        if (obj.userData.isHalo) {
            const distance = camera.position.distanceTo(obj.position);
            // Calculate opacity based on distance
            const opacity = Math.max(minOpacity, maxOpacity - (distance / distanceThreshold));
            obj.material.opacity = opacity;
        }
    });
}

// Animate the sunbeams to create a dynamic lighting effect
export function animateHalos() {
  const scene = hexGroup.parent;
  if (!scene) return;
  
  const currentTime = Date.now() * 0.001; // Convert to seconds
  const toRemove = []; // Track objects to remove
  
  scene.traverse(obj => {
    if (obj.userData && obj.userData.isHalo) {
      if (obj.userData.isBeam) {
        // Calculate the age of this effect
        const creationTime = obj.userData.creationTime || currentTime;
        const age = currentTime - creationTime;
        const lifespan = obj.userData.lifespan || 0.75;
        const fadeDuration = obj.userData.fadeDuration || 0.5;
        
        // Check if the effect should be fading or removed
        if (age > lifespan + fadeDuration) {
          // Effect has completed its lifecycle - mark for removal
          toRemove.push(obj);
          return;
        }
        
        // Calculate fade factor (1.0 = fully visible, 0.0 = invisible)
        let fadeFactor = 1.0;
        if (age > lifespan) {
          // We're in the fade-out period
          fadeFactor = Math.max(0, 1.0 - ((age - lifespan) / fadeDuration));
          obj.userData.isFading = true;
        }
          // Initially, the effect should grow from 0 to full brightness very quickly
        if (age < 0.1) {
          // First 0.1 seconds - grow into full effect (even faster)
          const growFactor = age / 0.1;
          fadeFactor = growFactor;
        }
        
        // Apply fade factor to all children
        obj.children.forEach(child => {
          if (child instanceof THREE.Group && child.children.length > 0) {
            // This is the particle group
            child.children.forEach(particle => {
              if (particle.userData && particle.userData.isParticle) {
                // Calculate base opacity with some variation
                const originalOpacity = particle.userData.originalOpacity || 0.5;
                const flicker = Math.random() * 0.1; // Random flicker
                const pulseValue = 0.1 * Math.sin(currentTime * 3 + particle.position.z * 2);
                
                // Apply fadeFactor to base opacity
                particle.material.opacity = (originalOpacity + flicker + pulseValue) * fadeFactor;
                  // If not fading out yet, animate particles downward
                if (!obj.userData.isFading) {
                  particle.position.z -= 0.04; // Move particles even faster for shorter duration
                  if (particle.position.z < 0) {
                    // Reset particle to top (shorter height)
                    particle.position.z = HEX_RADIUS * 1.3 * Math.random();
                  }
                }
              }
            });
          } else if (child.userData && child.userData.isMainBeam) {
            // Beam effect
            const baseOpacity = 0.6;
            const pulseValue = 0.1 * Math.sin(currentTime * 2);
            child.material.opacity = (baseOpacity + pulseValue) * fadeFactor;
            
            // Add a slight scale pulsing
            const pulseFactor = 1.0 + 0.05 * Math.sin(currentTime * 1.5);
            child.scale.set(pulseFactor, pulseFactor, 1.0);
          }
          // We're removing the spot effect completely as it visually divides the tile
        });
        
        // Add a subtle overall shimmer to the entire effect
        const shimmerX = Math.sin(currentTime) * 0.01;
        const shimmerY = Math.cos(currentTime * 1.2) * 0.01;
        obj.rotation.x = shimmerX;
        obj.rotation.y = shimmerY;
      }
    }
  });
  
  // Clean up completed effects
  if (toRemove.length > 0) {
    toRemove.forEach(obj => {
      scene.remove(obj);
      
      // Properly dispose of geometries and materials to avoid memory leaks
      if (obj.children) {
        obj.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          } else if (child instanceof THREE.Group) {
            child.children.forEach(grandChild => {
              if (grandChild instanceof THREE.Mesh) {
                if (grandChild.geometry) grandChild.geometry.dispose();
                if (grandChild.material) grandChild.material.dispose();
              }
            });
          }
        });
      }
    });
  }
}

// Highlight logic for tiles (e.g. after dice roll)
window.addEventListener('diceRolled', (e) => {
  const number = e.detail;
  
  // Remove any existing halos - improved cleanup
  const scene = hexGroup.parent;
  if (scene) {
    // First collect all halos to remove
    const halosToRemove = [];
    scene.traverse(obj => {
      if (obj.userData && obj.userData.isHalo) {
        halosToRemove.push(obj);
      }
    });
    
    // Then remove them and properly dispose resources
    halosToRemove.forEach(obj => {
      scene.remove(obj);
      
      // Dispose geometries and materials
      if (obj.children) {
        obj.children.forEach(child => {
          if (child instanceof THREE.Mesh) {
            if (child.geometry) child.geometry.dispose();
            if (child.material) child.material.dispose();
          } else if (child instanceof THREE.Group) {
            child.children.forEach(grandChild => {
              if (grandChild instanceof THREE.Mesh) {
                if (grandChild.geometry) grandChild.geometry.dispose();
                if (grandChild.material) grandChild.material.dispose();
              }
            });
          }
        });
      }
    });
  }
  
  // Reset all road meshes to their default color
  Object.values(roadMeshes).forEach(mesh => {
    if (mesh) mesh.material.color.set(0xf5deb3);
  });
  
  // Find all tiles with the rolled number
  const matchingTiles = [];
  Object.entries(tileNumbers).forEach(([key, tileNumber]) => {
    if (tileNumber === number) {
      const [q, r] = key.split(',').map(Number);
      matchingTiles.push([q, r]);
    }
  });
  
  // Create a map to track each unique physical mesh that should be highlighted
  const meshesToHighlight = new Map();
  
  // For each matching tile, find all its border segments and add sunbeam
  matchingTiles.forEach(([q, r]) => {
    // 1. Add sunbeam above the matching tile
    const tileMesh = tileMeshes[`${q},${r}`];
    if (tileMesh && scene) {
      // Get world position of the tile
      const position = new THREE.Vector3();
      tileMesh.getWorldPosition(position);
      
      // Create and add sunbeam effect
      const beam = createTileHalo(position);
      scene.add(beam);
    }
    
    // 2. Highlight border segments
    for (let edge = 0; edge < 6; edge++) {
      const edgeKey = `${q},${r},${edge}`;
      const mesh = roadMeshes[edgeKey];
      
      if (mesh) {
        meshesToHighlight.set(mesh, true);
      }
    }
  });
  
  // Highlight all unique meshes
  meshesToHighlight.forEach((_, mesh) => {
    mesh.material.color.set(0xffff00); // Yellow
  });
  
  // Store the count for later use or testing
  window.lastHighlightCount = meshesToHighlight.size;
});

// Test function to verify border highlighting and halo effects
export function testBorderHighlighting(number) {
  // Trigger dice roll event with the given number
  const event = new CustomEvent('diceRolled', { detail: number });
  window.dispatchEvent(event);
  
  // Count halos and find matching tiles by traversing the scene
  let sunbeamCount = 0;
  const scene = hexGroup.parent;
  if (scene) {
    scene.traverse(obj => {
      if (obj.userData && obj.userData.isHalo && obj.userData.isBeam) {
        sunbeamCount++;
      }
    });
  }
  
  // Find the number of tiles that have this number
  const tilesWithNumber = Object.values(tileNumbers).filter(n => n === number).length;
  
  // Check if tiles with same number are adjacent
  let areAdjacent = false;
  if (tilesWithNumber > 1) {
    // Find the tiles with this number
    const matchingTiles = [];
    Object.entries(tileNumbers).forEach(([key, tileNumber]) => {
      if (tileNumber === number) {
        const [q, r] = key.split(',').map(Number);
        matchingTiles.push([q, r]);
      }
    });
    
    // Check if any pair of tiles are adjacent
    for (let i = 0; i < matchingTiles.length; i++) {
      for (let j = i + 1; j < matchingTiles.length; j++) {
        const [q1, r1] = matchingTiles[i];
        const [q2, r2] = matchingTiles[j];
        // Check if tiles are adjacent using axial coordinates
        const dx = q2 - q1;
        const dy = r2 - r1;
        // In axial coordinates, tiles are adjacent if they differ by exactly one
        // in any direction or one in both directions with opposite signs
        areAdjacent = areAdjacent || (Math.abs(dx) <= 1 && Math.abs(dy) <= 1 && Math.abs(dx + dy) <= 1);
      }
    }
  }
  
  // Return the highlight count, sunbeam count, and additional test info
  return {
    highlightCount: window.lastHighlightCount,
    sunbeamCount: sunbeamCount,
    tilesWithNumber: tilesWithNumber,
    areAdjacent: areAdjacent,
    message: `Highlighted ${window.lastHighlightCount} border segments and added ${sunbeamCount} sunbeams for number ${number}`
  };
}
