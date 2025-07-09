// modules/portSystem.js
// Port-System für Catan 3D - Häfen-Definitionen, 3D-Rendering und Positioning

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { axialToWorld } from './game_board.js';

// Port-Konfiguration basierend auf Standard Catan Layout
// 9 Häfen total: 4 Generic (3:1) + 5 Resource-spezifisch (2:1)
// Harbor ring: [3,-1], [3,-2], [3,-3], [2,-3], [1,-3], [0,-3], [-1,-2], [-2,-1], [-3,1], [-3,2], [-3,0], [-3,3], [-2,3], [-1,3], [0,3], [1,2], [2,1], [3,0]
// Systematische Verteilung für bessere Balance: jeden 2. Tile mit korrekten Edge-Werten
export const PORTS = [
  // Index 0: [3, -1] - Generic port, Edge 5 (zeigt nach links oben)
  { 
    id: 'port_generic_1', 
    type: 'generic', 
    ratio: '3:1', 
    position: { q: 3, r: -1, edge: 5 },
    description: 'Allgemeiner Hafen'
  },
  // Index 2: [3, -3] - Ore port, Edge 4 (zeigt nach links)
  { 
    id: 'port_ore', 
    type: 'ore', 
    ratio: '2:1', 
    position: { q: 3, r: -3, edge: 4 },
    description: 'Erz-Hafen',
    resourceSymbol: '⛏️'
  },
  // Index 4: [1, -3] - Generic port, Edge 4 (zeigt nach links)
  { 
    id: 'port_generic_2', 
    type: 'generic', 
    ratio: '3:1', 
    position: { q: 1, r: -3, edge: 4 },
    description: 'Allgemeiner Hafen'
  },
  // Index 6: [-1, -2] - Wheat port, Edge 3 (zeigt nach links unten)
  { 
    id: 'port_wheat', 
    type: 'wheat', 
    ratio: '2:1', 
    position: { q: -1, r: -2, edge: 3 },
    description: 'Getreide-Hafen',
    resourceSymbol: '🌾'
  },
  // Index 8: [-3, 1] - Clay port, Edge 2 (zeigt nach unten)
  { 
    id: 'port_clay', 
    type: 'clay', 
    ratio: '2:1', 
    position: { q: -3, r: 2, edge: 2 },
    description: 'Lehm-Hafen',
    resourceSymbol: '🧱'
  },
  // Index 10: [-3, 0] - Generic port, Edge 1 (zeigt nach rechts unten)
  { 
    id: 'port_generic_3', 
    type: 'generic', 
    ratio: '3:1', 
    position: { q: -3, r: 0, edge: 1 },
    description: 'Allgemeiner Hafen'
  },
  // Index 12: [-2, 3] - Wood port, Edge 1 (zeigt nach rechts unten)
  { 
    id: 'port_wood', 
    type: 'wood', 
    ratio: '2:1', 
    position: { q: -2, r: 3, edge: 1 },
    description: 'Holz-Hafen',
    resourceSymbol: '🌲'
  },
  // Index 14: [0, 3] - Generic port, Edge 0 (zeigt nach rechts)
  { 
    id: 'port_generic_4', 
    type: 'generic', 
    ratio: '3:1', 
    position: { q: 0, r: 3, edge: 0 },
    description: 'Allgemeiner Hafen'
  },
  // Index 16: [2, 1] - Sheep port, Edge 0 (zeigt nach rechts)
  { 
    id: 'port_sheep', 
    type: 'sheep', 
    ratio: '2:1', 
    position: { q: 2, r: 1, edge: 0 },
    description: 'Wolle-Hafen',
    resourceSymbol: '🐑'
  }
];

// Constants
const HEX_RADIUS = 3; // Must match game_board.js
const PORT_SCALE = 2.6; // Gleiche Skalierung wie in loader.js
let portMeshes = {}; // Store references to port meshes
let harborModel = null; // Cached harbor model

/**
 * Load harbor.glb model (einmalig beim Spielstart)
 * @returns {Promise<THREE.Group>} Loaded harbor model
 */
async function loadHarborModel() {
  if (harborModel) return harborModel.clone();
  
  return new Promise((resolve, reject) => {
    const loader = new GLTFLoader();
    loader.load(
      './models/harbor.glb',
      (gltf) => {
        harborModel = gltf.scene;
        console.log('Harbor model loaded successfully');
        resolve(harborModel.clone());
      },
      (progress) => {
        console.log('Loading harbor model...', (progress.loaded / progress.total * 100) + '%');
      },
      (error) => {
        console.error('Error loading harbor model:', error);
        reject(error);
      }
    );
  });
}

/**
 * Berechnet die Welt-Position für einen Hafen auf einer Hex-Kante
 * @param {number} q - Axial coordinate q des Wasser-Tiles (harbor ring)
 * @param {number} r - Axial coordinate r des Wasser-Tiles (harbor ring)
 * @param {number} edge - Edge index (0-5, clockwise from top-right)
 * @returns {THREE.Vector3} World position for the port
 */
function getPortWorldPosition(q, r, edge) {
  // Verwende exakt die gleiche Position wie die Wasser-Tiles
  const [hexX, hexY, hexZ] = axialToWorld(q, r);
  
  // Häfen werden direkt am Zentrum des Wasser-Tiles positioniert
  // Genau wie bei den Wasser-Tiles: tile.position.set(...pos)
  const portX = hexX;
  const portY = hexY;
  const portZ = hexZ + 0.3; // Etwas über dem Wasser für bessere Sichtbarkeit
  
  return new THREE.Vector3(portX, portY, portZ);
}

/**
 * Berechnet die Rotation für einen Hafen basierend auf der Kante
 * @param {number} edge - Edge index (0-5)
 * @returns {THREE.Euler} Rotation for the port
 */
function getPortRotation(edge) {
  // Verwende exakt die gleiche Basis-Rotation wie in loader.js
  const xRotation = Math.PI / 2; // 90° um X-Achse 
  const baseYRotation = Math.PI / 6; // 30° um Y-Achse
  
  // Zusätzliche Y-Rotation für individuelle Ausrichtung
  // Jeder Hafen kann eine eigene Rotation haben, aber verwende Basis-Rotation
  const edgeYRotation = (Math.PI / 3) * edge; // 60° pro edge für Variation
  
  const totalYRotation = baseYRotation + edgeYRotation;
  
  return new THREE.Euler(xRotation, totalYRotation, 0, 'XYZ');
}

/**
 * Erstellt ein Label/Icon für einen Hafen
 * @param {Object} port - Port configuration object
 * @returns {THREE.Group} Port label group
 */
function createPortLabel(port) {
  const labelGroup = new THREE.Group();
  
  // Hintergrund-Plane für das Label
  const geometry = new THREE.PlaneGeometry(1.5, 0.8);
  const material = new THREE.MeshBasicMaterial({ 
    color: port.type === 'generic' ? 0x888888 : 0x4CAF50,
    transparent: true,
    opacity: 0.9
  });
  const background = new THREE.Mesh(geometry, material);
  labelGroup.add(background);
  
  // Text-Canvas für Ratio-Anzeige
  const canvas = document.createElement('canvas');
  canvas.width = 256;
  canvas.height = 128;
  const context = canvas.getContext('2d');
  context.fillStyle = 'white';
  context.font = 'bold 48px Arial';
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Text je nach Port-Typ
  if (port.type === 'generic') {
    context.fillText('3:1', canvas.width / 2, canvas.height / 2);
  } else {
    // Resource-Symbol + Ratio
    context.fillText(`${port.resourceSymbol || '?'} 2:1`, canvas.width / 2, canvas.height / 2);
  }
  
  // Text-Textur erstellen
  const textTexture = new THREE.CanvasTexture(canvas);
  const textMaterial = new THREE.MeshBasicMaterial({ 
    map: textTexture, 
    transparent: true 
  });
  const textMesh = new THREE.Mesh(new THREE.PlaneGeometry(1.4, 0.7), textMaterial);
  textMesh.position.z = 0.01; // Leicht vor dem Hintergrund
  labelGroup.add(textMesh);
  
  // Label immer zur Kamera ausrichten (wird in Animation-Loop aufgerufen)
  labelGroup.userData = { isBillboard: true };
  
  return labelGroup;
}

/**
 * Rendert alle Häfen in die 3D-Szene
 * @param {THREE.Scene} scene - Three.js scene
 * @returns {Promise<Object>} Object with port mesh references
 */
export async function renderPorts(scene) {
  console.log('Rendering ports...');
  
  try {
    // Harbor-Modell laden
    const harborTemplate = await loadHarborModel();
    
    // Erstelle Gruppe für alle Häfen
    const portsGroup = new THREE.Group();
    portsGroup.name = 'PortsGroup';
    
    for (const port of PORTS) {
      // Harbor-Mesh für diesen Port
      const harborMesh = harborTemplate.clone();
      
      // Position und Rotation setzen
      const position = getPortWorldPosition(port.position.q, port.position.r, port.position.edge);
      const rotation = getPortRotation(port.position.edge);
      
      harborMesh.position.copy(position);
      harborMesh.rotation.copy(rotation);
      harborMesh.scale.set(PORT_SCALE, PORT_SCALE, PORT_SCALE); // Wie in loader.js
      harborMesh.name = `harbor_${port.id}`;
      harborMesh.userData = { portId: port.id, portConfig: port };
      
      // Debug: Log position and rotation
      console.log(`Port ${port.id} (${port.type}, edge ${port.position.edge}):`, {
        landTile: `q=${port.position.q}, r=${port.position.r}`,
        position: {
          x: position.x.toFixed(2),
          y: position.y.toFixed(2), 
          z: position.z.toFixed(2)
        },
        rotation: {
          x: (rotation.x * 180 / Math.PI).toFixed(1) + '°',
          y: (rotation.y * 180 / Math.PI).toFixed(1) + '°', 
          z: (rotation.z * 180 / Math.PI).toFixed(1) + '°'
        }
      });
      
      // Label erstellen
      const label = createPortLabel(port);
      label.position.copy(position);
      label.position.z += 1.5; // Über dem Harbor-Mesh, aber nicht zu hoch
      label.name = `label_${port.id}`;
      
      // Zur Gruppe hinzufügen
      portsGroup.add(harborMesh);
      portsGroup.add(label);
      
      // Referenz speichern
      portMeshes[port.id] = {
        harbor: harborMesh,
        label: label,
        config: port
      };
      
      console.log(`Port ${port.id} rendered at`, position);
    }
    
    // Gruppe zur Szene hinzufügen
    scene.add(portsGroup);
    
    console.log(`${PORTS.length} ports rendered successfully`);
    return portMeshes;
    
  } catch (error) {
    console.error('Error rendering ports:', error);
    return {};
  }
}

/**
 * Findet alle Häfen in der Nähe einer Siedlung/Stadt
 * @param {number} q - Hex coordinate q of settlement
 * @param {number} r - Hex coordinate r of settlement  
 * @param {number} corner - Corner index (0-5) of settlement
 * @returns {Array<Object>} Array of nearby ports
 */
export function getPortsNearSettlement(q, r, corner) {
  const nearbyPorts = [];
  
  for (const port of PORTS) {
    // Prüfe ob die Siedlung auf einer der beiden Ecken der Port-Kante liegt
    const portVertices = getPortVertices(port.position.q, port.position.r, port.position.edge);
    
    for (const vertex of portVertices) {
      if (vertex.q === q && vertex.r === r && vertex.corner === corner) {
        nearbyPorts.push(port);
        break;
      }
    }
  }
  
  return nearbyPorts;
}

/**
 * Berechnet die beiden Vertices (Ecken) einer Port-Kante
 * @param {number} q - Hex coordinate q
 * @param {number} r - Hex coordinate r
 * @param {number} edge - Edge index (0-5)
 * @returns {Array<Object>} Array of two vertices [{q, r, corner}, {q, r, corner}]
 */
function getPortVertices(q, r, edge) {
  // Jede Kante verbindet zwei Ecken
  const corner1 = edge;
  const corner2 = (edge + 1) % 6;
  
  return [
    { q, r, corner: corner1 },
    { q, r, corner: corner2 }
  ];
}

/**
 * Berechnet die verfügbaren Handelsraten für einen Spieler basierend auf Häfen
 * @param {Object} player - Player object
 * @returns {Object} Trade rates object { wood: 2, clay: 4, wheat: 2, sheep: 4, ore: 4, generic: 3 }
 */
export function getPlayerTradeRates(player) {
  const rates = {
    wood: 4,    // Standard 4:1
    clay: 4,
    wheat: 4, 
    sheep: 4,
    ore: 4,
    generic: 4  // Allgemeine Rate
  };
  
  if (!player.settlements && !player.cities) return rates;
  
  // Alle Siedlungen und Städte des Spielers prüfen
  const buildings = [...(player.settlements || []), ...(player.cities || [])];
  
  for (const building of buildings) {
    const nearbyPorts = getPortsNearSettlement(building.q, building.r, building.corner);
    
    for (const port of nearbyPorts) {
      if (port.type === 'generic') {
        // Generic Port: 3:1 für alle Ressourcen
        rates.generic = Math.min(rates.generic, 3);
        // Setze alle Ressourcen auf 3, falls sie noch höher sind
        Object.keys(rates).forEach(key => {
          if (key !== 'generic' && rates[key] > 3) {
            rates[key] = 3;
          }
        });
      } else {
        // Resource-spezifischer Port: 2:1 für diese Ressource
        if (rates[port.type]) {
          rates[port.type] = Math.min(rates[port.type], 2);
        }
      }
    }
  }
  
  return rates;
}

/**
 * Update port labels to always face the camera
 * @param {THREE.Camera} camera - The game camera
 */
export function updatePortLabels(camera) {
  Object.values(portMeshes).forEach(portData => {
    if (portData.label && portData.label.userData && portData.label.userData.isBillboard) {
      // Verwende das gleiche System wie Number Tokens: quaternion copy
      portData.label.quaternion.copy(camera.quaternion);
    }
  });
}

/**
 * Highlight ports available to the current player
 * @param {Object} player - Current player object
 */
export function highlightPlayerPorts(player) {
  // Reset all port highlights
  Object.values(portMeshes).forEach(portData => {
    if (portData.harbor && portData.harbor.material) {
      portData.harbor.material.emissive = new THREE.Color(0x000000);
    }
  });
  
  // Highlight available ports
  const buildings = [...(player.settlements || []), ...(player.cities || [])];
  
  for (const building of buildings) {
    const nearbyPorts = getPortsNearSettlement(building.q, building.r, building.corner);
    
    for (const port of nearbyPorts) {
      const portData = portMeshes[port.id];
      if (portData && portData.harbor && portData.harbor.material) {
        portData.harbor.material.emissive = new THREE.Color(0x004400); // Grünlicher Glanz
      }
    }
  }
}

// Export references for external access
export { portMeshes, PORTS as PORT_CONFIGS };
