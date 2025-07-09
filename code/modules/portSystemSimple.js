// Simple port system for testing
import * as THREE from 'three';

let portsLoaded = false;

/**
 * Simple port rendering - just colored cubes for testing
 */
export async function renderPortsSimple(scene) {
  if (portsLoaded) {
    console.log('Ports already loaded');
    return;
  }
  
  console.log('Rendering simple test ports...');
  
  try {
    // Create simple colored cubes as port markers
    const portGeometry = new THREE.BoxGeometry(0.5, 0.5, 0.5);
    const portMaterial = new THREE.MeshBasicMaterial({ color: 0x3498db });
    
    // Test positions around the board
    const testPositions = [
      new THREE.Vector3(5, 0, 1),
      new THREE.Vector3(-5, 0, 1),
      new THREE.Vector3(0, 5, 1),
      new THREE.Vector3(0, -5, 1)
    ];
    
    testPositions.forEach((position, index) => {
      const portMesh = new THREE.Mesh(portGeometry, portMaterial);
      portMesh.position.copy(position);
      portMesh.name = `test_port_${index}`;
      scene.add(portMesh);
      console.log(`Added test port ${index} at position:`, position);
    });
    
    portsLoaded = true;
    console.log('Simple test ports rendered successfully');
    
  } catch (error) {
    console.error('Error rendering simple ports:', error);
    throw error;
  }
}

// Dummy functions for compatibility
export function updatePortLabels(camera) {
  // Do nothing for simple version
}

export function highlightPlayerPorts(player) {
  // Do nothing for simple version  
}

export function getPlayerTradeRates(player) {
  // Return default rates
  return {
    wood: 4,
    clay: 4, 
    wheat: 4,
    sheep: 4,
    ore: 4
  };
}
