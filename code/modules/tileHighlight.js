// modules/tileHighlight.js
// Responsible for creating visual highlight effects for tiles and borders

import * as THREE from 'three';

// Reference to tileNumbers, roadMeshes, and tileMeshes from game_board
let tileNumbers = {};
let roadMeshes = {};
let tileMeshes = {};
let hexGroup = null;

// Constant needed for highlight sizes
const HEX_RADIUS = 3;

// Convert axial coordinates to world position
export function getTileWorldPosition(q, r) {
  const x = HEX_RADIUS * Math.sqrt(3) * (q + r/2);
  const z = HEX_RADIUS * 3/2 * r;
  return new THREE.Vector3(x, 0, z);
}

// Get the world position of a tile's corner point
export function getCornerWorldPosition(q, r, corner) {
  // Corner values 0-5, starting at east (0) and moving counterclockwise
  const center = getTileWorldPosition(q, r);
  const angle = Math.PI / 3 * corner; // Each corner is 60 degrees apart
  const x = center.x + HEX_RADIUS * Math.cos(angle);
  const z = center.z + HEX_RADIUS * Math.sin(angle);
  return new THREE.Vector3(x, 0, z);
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
    lifespan: 0.3,     // Seconds before starting to fade (much shorter)
    fadeDuration: 0.2  // Seconds to fade out (much faster fade)
  };
  
  // Position the entire group at the tile position, but slightly higher to avoid any division effect
  beamGroup.position.set(position.x, position.y, position.z + 0.5);
  
  return beamGroup;
}

// Animate the sunbeams to create a dynamic lighting effect
export function animateHalos() {
  if (!hexGroup) return;
  const scene = hexGroup.parent;
  if (!scene) return;
  
  // Find all halo objects and animate them
  scene.traverse(obj => {
    if (obj.userData && obj.userData.isHalo) {
      if (obj.userData.animationTime !== undefined) {
        obj.userData.animationTime += 0.02;
        
        if (obj.userData.animationTime > 2.0) { // Animation complete after 2 seconds
          // Remove the halo object
          obj.parent.remove(obj);
        } else if (obj.userData.isBeam) {
          // Fade out sunbeam
          if (obj.userData.animationTime > 1.0) {
            const fadeOutPhase = Math.min((obj.userData.animationTime - 1.0) / 1.0, 1.0); 
            obj.material.opacity = 1.0 - fadeOutPhase;
          }
          
          // Slight up/down oscillation for beam
          const oscPhase = Math.sin(obj.userData.animationTime * 2) * 0.3;
          obj.position.y += oscPhase - obj.userData.lastOscPhase;
          obj.userData.lastOscPhase = oscPhase;
        } else if (obj.userData.isParticle) {
          // Move particles outward and upward
          const radius = 0.3 + obj.userData.animationTime * 1.0; 
          const angle = obj.userData.angle + (0.2 * obj.userData.animationTime);
          obj.position.x = Math.cos(angle) * radius;
          obj.position.z = Math.sin(angle) * radius;
          obj.position.y = obj.userData.initialHeight + obj.userData.animationTime * 1.5;
          
          // Fade out particles
          if (obj.userData.animationTime > 0.6) {
            obj.material.opacity = Math.max(0, 1.0 - (obj.userData.animationTime - 0.6) / 0.5);
          }
        }
      }
    }
  });
}

// Highlight number tokens on tiles that match a rolled number
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

// Initialize with references from game_board.js
export function initializeHighlighting(gameHexGroup, gameTileNumbers, gameRoadMeshes, gameTileMeshes) {
  hexGroup = gameHexGroup;
  tileNumbers = gameTileNumbers;
  roadMeshes = gameRoadMeshes;
  tileMeshes = gameTileMeshes;
  
  // Set up event listener for highlighting
  setupHighlightEventListener();
}

// Setup event listener for dice rolls
function setupHighlightEventListener() {
  window.addEventListener('diceRolled', (e) => {
    const number = e.detail;
    
    // Remove any existing halos - improved cleanup
    const scene = hexGroup?.parent;
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
}

// Test function to verify border highlighting and halo effects
export function testBorderHighlighting(number) {
  // Trigger dice roll event with the given number
  const event = new CustomEvent('diceRolled', { detail: number });
  window.dispatchEvent(event);
  
  // Count halos and find matching tiles by traversing the scene
  let sunbeamCount = 0;
  const scene = hexGroup?.parent;
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
