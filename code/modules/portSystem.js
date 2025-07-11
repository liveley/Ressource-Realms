// modules/portSystem.js
// Port-System für Catan 3D - Häfen-Definitionen, 3D-Rendering und Positioning

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { axialToWorld } from './game_board.js';
import { getEquivalentCorners } from './buildLogic.js';

// Port-Konfiguration basierend auf Standard Catan Layout
// 9 Häfen total: 4 Generic (3:1) + 5 Resource-spezifisch (2:1)
// Harbor ring: [3,-1], [3,-2], [3,-3], [2,-3], [1,-3], [0,-3], [-1,-2], [-2,-1], [-3,1], [-3,2], [-3,0], [-3,3], [-2,3], [-1,3], [0,3], // Debug-Funktion: Zeige alle gültigen Ecken für alle Häfen an
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

// Alias for compatibility with existing code
export const HARBORS = PORTS;

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
    // Resource-Symbol + Ratio mit größerem Symbol
    // Erst das größere Symbol zeichnen
    context.font = 'bold 64px Arial'; // Größere Schrift für das Symbol
    context.fillText(port.resourceSymbol || '?', canvas.width / 2 - 40, canvas.height / 2);
    
    // Dann das "2:1" in kleinerer Schrift daneben
    context.font = 'bold 40px Arial'; // Kleinere Schrift für "2:1"
    context.fillText('2:1', canvas.width / 2 + 35, canvas.height / 2);
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
 * Findet alle Häfen in der Nähe einer Siedlung/Stadt (ZURÜCK ZU EINFACHER ADJACENCY)
 * @param {number} q - Hex coordinate q of settlement (Land-Tile)
 * @param {number} r - Hex coordinate r of settlement (Land-Tile)  
 * @param {number} corner - Corner index (0-5) of settlement
 * @returns {Array<Object>} Array of nearby ports
 */
export function getPortsNearSettlement(q, r, corner) {
  console.log(`🔍 Checking for ports near settlement at (${q},${r}) corner ${corner} [CORRECTED GEOMETRY]`);
  
  const nearbyPorts = [];
  
  for (const port of PORTS) {
    const isNear = isSettlementNearPortGeometry(q, r, corner, port);
    
    if (isNear) {
      console.log(`✓ Found accessible port: ${port.id}`);
      nearbyPorts.push(port);
    }
  }
  
  console.log(`🎯 Total accessible ports: ${nearbyPorts.length}`);
  return nearbyPorts;
}

/**
 * EMERGENCY DIRECT GEOMETRY TEST - Manuelle Harbor-Settlement Adjacency
 * Verwende direkte geometrische Berechnungen anstatt getEquivalentCorners()
 */
function isSettlementNearPortBasic(settlementQ, settlementR, settlementCorner, portQ, portR, portEdge) {
  console.log(`  [DEBUG] Settlement: (${settlementQ},${settlementR}) corner ${settlementCorner} vs Port: (${portQ},${portR}) edge ${portEdge}`);
  
  // SCHRITT 1: TESTE VERSCHIEDENE EDGE-ZU-DIRECTION MAPPINGS
  // Die bisherige Annahme war falsch: edge != corner
  // Edge könnte verschiedene Direction-Paare verbinden
  
  function neighborAxial(q, r, edge) {
    const directions = [
      [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
    ];
    return [q + directions[edge][0], r + directions[edge][1]];
  }
  
  // Teste verschiedene Mappings für harbor edge zu land directions
  const possibleMappings = [
    // Mapping 1: edge verbindet directions edge und (edge+1)%6  
    {
      name: 'consecutive',
      dirs: [portEdge, (portEdge + 1) % 6]
    },
    // Mapping 2: edge verbindet directions edge und (edge+3)%6 (gegenüberliegend)
    {
      name: 'opposite',
      dirs: [portEdge, (portEdge + 3) % 6]
    },
    // Mapping 3: edge verbindet directions (edge-1)%6 und edge
    {
      name: 'previous+current',
      dirs: [(portEdge + 5) % 6, portEdge]
    },
    // Mapping 4: edge verbindet directions (edge-1)%6 und (edge+1)%6 (um edge herum)
    {
      name: 'around_edge',
      dirs: [(portEdge + 5) % 6, (portEdge + 1) % 6]
    }
  ];
  
  console.log(`  [DEBUG] Testing different edge-to-direction mappings for edge ${portEdge}:`);
  
  for (const mapping of possibleMappings) {
    const [dir1, dir2] = mapping.dirs;
    const [land1Q, land1R] = neighborAxial(portQ, portR, dir1);
    const [land2Q, land2R] = neighborAxial(portQ, portR, dir2);
    
    console.log(`  [DEBUG] ${mapping.name}: directions ${dir1},${dir2} -> lands (${land1Q},${land1R}) and (${land2Q},${land2R})`);
    
    // Prüfe ob Settlement auf einem der Landfelder ist
    if ((settlementQ === land1Q && settlementR === land1R) || 
        (settlementQ === land2Q && settlementR === land2R)) {
      
      const matchedLand = (settlementQ === land1Q && settlementR === land1R) ? 
        {q: land1Q, r: land1R, dir: dir1} : 
        {q: land2Q, r: land2R, dir: dir2};
      
      console.log(`    ✓ MAPPING MATCH: ${mapping.name} - settlement on land (${matchedLand.q},${matchedLand.r}) from direction ${matchedLand.dir}`);
      
      // Jetzt finde die Harbor-Corners auf diesem Landfeld
      return findHarborCornersOnLand(settlementQ, settlementR, settlementCorner, portQ, portR, matchedLand.dir, mapping.name);
    }
  }
  
  console.log(`    ✗ No mapping matches settlement position`);
  return { isNear: false, bestDistance: Infinity };
}

function findHarborCornersOnLand(landQ, landR, settlementCorner, portQ, portR, directionToPort, mappingName) {
  console.log(`  [DEBUG] Finding harbor corners on land (${landQ},${landR}) connected to port via direction ${directionToPort}`);
  
  // Die edge zum port entspricht direction directionToPort
  // Das bedeutet auf dem Landfeld: edge directionToPort verbindet corners directionToPort und (directionToPort+1)%6
  const harborCorner1 = directionToPort;
  const harborCorner2 = (directionToPort + 1) % 6;
  
  console.log(`  [DEBUG] Harbor corners on land: ${harborCorner1} and ${harborCorner2}`);
  
  // Teste direkte Übereinstimmung
  if (settlementCorner === harborCorner1 || settlementCorner === harborCorner2) {
    console.log(`    ✓ DIRECT MATCH: Settlement corner ${settlementCorner} matches harbor corner`);
    return { isNear: true, bestDistance: 0, mapping: mappingName };
  }
  
  // Teste equivalent corners
  const equivalents1 = getEquivalentCorners(landQ, landR, harborCorner1);
  const equivalents2 = getEquivalentCorners(landQ, landR, harborCorner2);
  
  for (const eq of [...equivalents1, ...equivalents2]) {
    if (eq.q === landQ && eq.r === landR && eq.corner === settlementCorner) {
      console.log(`    ✓ EQUIVALENT MATCH: Settlement corner ${settlementCorner} matches harbor via equivalent`);
      return { isNear: true, bestDistance: 0, mapping: mappingName };
    }
  }
  
  console.log(`    ✗ Settlement corner ${settlementCorner} does not match harbor corners ${harborCorner1},${harborCorner2}`);
  return { isNear: false, bestDistance: Infinity };
}

/**
 * Berechnet alle gültigen Siedlungsecken für einen spezifischen Hafen
 * KORRIGIERTE VERSION - Zurück zu bewährter Geometrie
 * @param {number} portQ - Q-Koordinate des Hafen-Wasser-Tiles
 * @param {number} portR - R-Koordinate des Hafen-Wasser-Tiles
 * @param {number} portEdge - Kanten-Index des Hafens (0-5)
 * @returns {Array<Object>} Array of valid settlement corners [{q, r, corner}, ...]
 */
function getValidPortCorners(portQ, portR, portEdge) {
  const validCorners = [];
  
  // RÜCKKEHR ZUR BEWÄHRTEN ABER PRÄZISEREN LOGIK:
  // 1. Finde alle Land-Tiles um das Wasser-Tile
  // 2. Aber berücksichtige nur die, die zur portEdge gehören
  
  const waterNeighbors = getHexNeighbors(portQ, portR);
  
  // Die Kante portEdge verbindet das Wasser-Tile mit dem Nachbar-Tile an Index portEdge
  const primaryNeighbor = waterNeighbors[portEdge];
  
  if (primaryNeighbor) {
    // Die Hafen-Kante entspricht zwei spezifischen Ecken
    // auf dem angrenzenden Land-Tile
    
    // Berechne welche Ecken auf dem Land-Tile zur Hafen-Kante gehören
    // Wenn das Wasser-Tile edge X zum Land-Tile zeigt,
    // dann zeigt das Land-Tile edge (X+3)%6 zurück zum Wasser
    const landEdgeToWater = (portEdge + 3) % 6;
    
    // Die beiden Ecken dieser Kante sind landEdgeToWater und (landEdgeToWater + 1) % 6
    const landCorner1 = landEdgeToWater;
    const landCorner2 = (landEdgeToWater + 1) % 6;
    
    validCorners.push({
      q: primaryNeighbor.q,
      r: primaryNeighbor.r,
      corner: landCorner1
    });
    
    validCorners.push({
      q: primaryNeighbor.q,
      r: primaryNeighbor.r,
      corner: landCorner2
    });
  }
  
  // ZUSÄTZLICH: Prüfe die beiden benachbarten Tiles für geteilte Ecken
  // Ein Hafen kann an einer Ecke zwischen mehreren Land-Tiles liegen
  const prevNeighborIndex = (portEdge + 5) % 6; // Vorherige Kante
  const nextNeighborIndex = (portEdge + 1) % 6; // Nächste Kante
  
  const prevNeighbor = waterNeighbors[prevNeighborIndex];
  const nextNeighbor = waterNeighbors[nextNeighborIndex];
  
  // Wenn das vorherige Nachbar-Tile existiert, 
  // prüfe ob es eine geteilte Ecke mit dem primären Tile hat
  if (prevNeighbor && primaryNeighbor) {
    // Die geteilte Ecke ist portEdge auf dem Wasser-Tile
    // Das entspricht einer spezifischen Ecke auf beiden Land-Tiles
    const sharedCornerOnPrev = (prevNeighborIndex + 3 + 1) % 6; // +1 wegen Kanten-Verschiebung
    
    // Nur hinzufügen wenn es nicht bereits existiert
    const exists = validCorners.some(vc => 
      vc.q === prevNeighbor.q && vc.r === prevNeighbor.r && vc.corner === sharedCornerOnPrev
    );
    
    if (!exists) {
      validCorners.push({
        q: prevNeighbor.q,
        r: prevNeighbor.r,
        corner: sharedCornerOnPrev
      });
    }
  }
  
  // Dasselbe für das nächste Nachbar-Tile
  if (nextNeighbor && primaryNeighbor) {
    const sharedCornerOnNext = (nextNeighborIndex + 3) % 6;
    
    const exists = validCorners.some(vc => 
      vc.q === nextNeighbor.q && vc.r === nextNeighbor.r && vc.corner === sharedCornerOnNext
    );
    
    if (!exists) {
      validCorners.push({
        q: nextNeighbor.q,
        r: nextNeighbor.r,
        corner: sharedCornerOnNext
      });
    }
  }
  
  console.log(`Port at water tile (${portQ}, ${portR}) edge ${portEdge} has ${validCorners.length} valid corners:`, validCorners);
  
  return validCorners;
}

/**
 * Prüft ob eine Siedlung an einem Land-Tile in der Nähe eines Hafens steht (VERALTET)
 * @deprecated Verwendet jetzt getValidPortCorners() für präzisere Logik
 */
function isSettlementNearPort(settlementQ, settlementR, settlementCorner, portQ, portR, portEdge) {
  // Neue Implementierung nutzt getValidPortCorners
  const validCorners = getValidPortCorners(portQ, portR, portEdge);
  
  const settlementEquivalents = getEquivalentCorners(settlementQ, settlementR, settlementCorner);
  
  // Prüfe ob eine der äquivalenten Ecken der Siedlung gültig für den Hafen ist
  for (const validCorner of validCorners) {
    for (const equivalent of settlementEquivalents) {
      if (validCorner.q === equivalent.q && 
          validCorner.r === equivalent.r && 
          validCorner.corner === equivalent.corner) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Berechnet die 6 Nachbar-Koordinaten eines Hex-Tiles
 * @param {number} q - Axial coordinate q
 * @param {number} r - Axial coordinate r
 * @returns {Array<Object>} Array of 6 neighbor coordinates [{q, r}, ...]
 */
function getHexNeighbors(q, r) {
  // Die 6 Hex-Nachbarn in axial coordinates - EXAKT wie in game_board.js
  // Edge order: 0 = top right, then clockwise
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  return directions.map(dir => ({
    q: q + dir[0],
    r: r + dir[1]
  }));
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

// Debug-Funktion: Zeige alle gültigen Ecken für alle Häfen an
export function debugPortCorners() {
  console.log('=== DEBUG: Port Valid Corners ===');
  
  for (const port of PORTS) {
    const validCorners = getValidPortCorners(port.position.q, port.position.r, port.position.edge);
    console.log(`Port ${port.id} (${port.type}, ${port.ratio}):`);
    console.log(`  Water tile: (${port.position.q}, ${port.position.r}) edge ${port.position.edge}`);
    console.log(`  Valid settlement corners:`, validCorners);
    console.log('');
  }
  
  console.log('=== Ende Debug ===');
}

// Export für externe Nutzung
export { portMeshes, PORTS as PORT_CONFIGS, getValidPortCorners };

/**
 * CORRECTED HARBOR DETECTION - Geometrisch korrekt unter Verwendung der buildLogic.js-Muster
 * @param {number} settlementQ - Q-Koordinate der Siedlung
 * @param {number} settlementR - R-Koordinate der Siedlung  
 * @param {number} settlementCorner - Corner-Index der Siedlung (0-5)
 * @param {Object} harbor - Harbor configuration object
 * @returns {boolean} true if settlement can access this harbor
 */
function isSettlementNearPortGeometry(settlementQ, settlementR, settlementCorner, harbor) {
  const { q: portQ, r: portR, edge: portEdge } = harbor.position;
  
  console.log(`  [GEOMETRY] Checking harbor ${harbor.id} at (${portQ},${portR}) edge ${portEdge}`);
  
  // Verwenden Sie getEquivalentCorners, um alle physischen Darstellungen dieser Siedlung zu finden
  const settlementEquivalents = getEquivalentCorners(settlementQ, settlementR, settlementCorner);
  
  console.log(`  [GEOMETRY] Settlement equivalents:`, settlementEquivalents.map(eq => `(${eq.q},${eq.r})c${eq.corner}`));
  
  // Hafenrand verbindet sich mit dem Land über "previous+current" Richtung Mapping (bewährt)
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  function neighborAxial(q, r, edge) {
    return [q + directions[edge][0], r + directions[edge][1]];
  }
  
  const dir1 = (portEdge + 5) % 6; // Vorherige Richtung
  const dir2 = portEdge;           // Aktuelle Richtung
  
  const [land1Q, land1R] = neighborAxial(portQ, portR, dir1);
  const [land2Q, land2R] = neighborAxial(portQ, portR, dir2);
  
  console.log(`  [GEOMETRY] Harbor edge ${portEdge} connects to lands: (${land1Q},${land1R}) and (${land2Q},${land2R})`);
  
  // FIRST: Check if any settlement equivalent is DIRECTLY on the harbor water tile
  // This means the settlement is directly adjacent to the harbor!
  const settlementOnHarborTile = settlementEquivalents.find(eq => eq.q === portQ && eq.r === portR);
  
  if (settlementOnHarborTile) {
    console.log(`  [GEOMETRY] ✓ DIRECT HARBOR MATCH: Settlement equivalent (${settlementOnHarborTile.q},${settlementOnHarborTile.r})c${settlementOnHarborTile.corner} is ON the harbor water tile!`);
    return true;
  }
  
  // SECOND: Check connected land tiles for harbor corner matches
  // Überprüfen Sie jedes verbundene Landfeld
  const connectedLands = [
    {q: land1Q, r: land1R, fromDir: dir1},
    {q: land2Q, r: land2R, fromDir: dir2}
  ];
  
  for (const land of connectedLands) {
    // Check if ANY settlement equivalent is on this connected land
    const settlementOnThisLand = settlementEquivalents.find(eq => eq.q === land.q && eq.r === land.r);
    
    if (!settlementOnThisLand) {
      continue;
    }
    
    console.log(`  [GEOMETRY] Settlement equivalent found on connected land (${land.q},${land.r}): corner ${settlementOnThisLand.corner}`);
    
    // Calculate harbor corners on this land tile
    // When harbor direction X points to land, the land has edge (X+3)%6 pointing back to harbor
    const landEdgeToHarbor = (land.fromDir + 3) % 6;
    const harborCorner1 = landEdgeToHarbor;
    const harborCorner2 = (landEdgeToHarbor + 1) % 6;
    
    console.log(`  [GEOMETRY] Land direction to harbor: ${land.fromDir} → land edge: ${landEdgeToHarbor}`);
    console.log(`  [GEOMETRY] Harbor corners on this land: ${harborCorner1}, ${harborCorner2}`);
    
    // Check if the settlement equivalent matches these harbor corners
    if (settlementOnThisLand.corner === harborCorner1 || settlementOnThisLand.corner === harborCorner2) {
      console.log(`  [GEOMETRY] ✓ MATCH: Settlement equivalent (${settlementOnThisLand.q},${settlementOnThisLand.r})c${settlementOnThisLand.corner} matches harbor corner!`);
      return true;
    } else {
      console.log(`  [GEOMETRY] ✗ Settlement corner ${settlementOnThisLand.corner} doesn't match harbor corners ${harborCorner1}, ${harborCorner2}`);
    }
  }
  
  console.log(`  [GEOMETRY] ✗ No geometric match found`);
  return false;
}

// === HARBOR DETECTION SYSTEM ===
// Hauptfunktion zum Finden aller Häfen, die für eine Siedlung zugänglich sind
export function findNearbyPorts(settlementQ, settlementR, settlementCorner) {
  console.log(`🔍 Finding harbors near settlement at (${settlementQ},${settlementR}) corner ${settlementCorner}`);
  
  const nearbyPorts = [];
  
  for (const harbor of HARBORS) {
    const isNear = isSettlementNearPortGeometry(settlementQ, settlementR, settlementCorner, harbor);
    
    console.log(`   Harbor ${harbor.id} at (${harbor.position.q},${harbor.position.r}) edge ${harbor.position.edge}: ${isNear ? '✓ ACCESSIBLE' : '✗ not accessible'}`);
    
    if (isNear) {
      nearbyPorts.push(harbor);
    }
  }
  
  console.log(`🎯 Found ${nearbyPorts.length} accessible harbors:`, nearbyPorts.map(p => p.id));
  return nearbyPorts;
}
