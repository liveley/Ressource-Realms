const PORTS = [
  { id: 'port_generic_1', position: { q: 3, r: -1, edge: 5 } },
  { id: 'port_ore', position: { q: 3, r: -3, edge: 4 } },
  { id: 'port_generic_2', position: { q: 1, r: -3, edge: 4 } },
  { id: 'port_wheat', position: { q: -1, r: -2, edge: 3 } },
  { id: 'port_clay', position: { q: -3, r: 2, edge: 2 } },
  { id: 'port_generic_3', position: { q: -3, r: 0, edge: 1 } },
  { id: 'port_wood', position: { q: -2, r: 3, edge: 1 } },
  { id: 'port_generic_4', position: { q: 0, r: 3, edge: 0 } },
  { id: 'port_sheep', position: { q: 2, r: 1, edge: 0 } }
];

function neighborAxial(q, r, edge) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  return [q + directions[edge][0], r + directions[edge][1]];
}

console.log('=== LANDFELDER MIT HAFENZUGANG ===');
console.log();

// Erstelle Map von Landfeld zu Häfen
const landToHarbors = new Map();

PORTS.forEach(port => {
  const { q: portQ, r: portR, edge: portEdge } = port.position;
  
  const harborCorner1 = portEdge;
  const harborCorner2 = (portEdge + 1) % 6;
  
  const [landTile1Q, landTile1R] = neighborAxial(portQ, portR, harborCorner1);
  const [landTile2Q, landTile2R] = neighborAxial(portQ, portR, harborCorner2);
  
  // Füge zu Map hinzu
  const key1 = `${landTile1Q},${landTile1R}`;
  const key2 = `${landTile2Q},${landTile2R}`;
  
  if (!landToHarbors.has(key1)) landToHarbors.set(key1, []);
  if (!landToHarbors.has(key2)) landToHarbors.set(key2, []);
  
  landToHarbors.get(key1).push(port.id);
  landToHarbors.get(key2).push(port.id);
});

// Sortiert ausgeben
const sortedLands = Array.from(landToHarbors.keys()).sort();

sortedLands.forEach(landKey => {
  const harbors = landToHarbors.get(landKey);
  console.log(`Land tile (${landKey}): ${harbors.join(', ')}`);
});

console.log();
console.log('=== BESONDERE LANDFELDER ===');

// Finde Landfelder mit mehreren Häfen
const multiHarborLands = Array.from(landToHarbors.entries())
  .filter(([land, harbors]) => harbors.length > 1);

if (multiHarborLands.length > 0) {
  console.log('Landfelder mit mehreren Häfen:');
  multiHarborLands.forEach(([land, harbors]) => {
    console.log(`  (${land}): ${harbors.join(', ')}`);
  });
} else {
  console.log('Jedes Landfeld hat maximal einen Hafen.');
}

// Teste spezifische Koordinaten
console.log();
console.log('=== TEST SPEZIFISCHE KOORDINATEN ===');
const testCoords = ['2,-2', '1,-2', '3,-2', '2,-1', '2,-3'];

testCoords.forEach(coord => {
  const harbors = landToHarbors.get(coord);
  if (harbors && harbors.length > 0) {
    console.log(`✓ (${coord}): ${harbors.join(', ')}`);
  } else {
    console.log(`✗ (${coord}): Kein Hafenzugang`);
  }
});
