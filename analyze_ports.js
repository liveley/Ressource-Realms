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

console.log('Häfen-Verteilung:');
PORTS.forEach(port => {
  console.log(`${port.id}: (${port.position.q},${port.position.r}) edge ${port.position.edge}`);
});

console.log('\nEdge-Verteilung im Uhrzeigersinn:');
const edgeCount = {};
PORTS.forEach(port => {
  edgeCount[port.position.edge] = (edgeCount[port.position.edge] || 0) + 1;
});

for (let edge = 0; edge < 6; edge++) {
  const count = edgeCount[edge] || 0;
  const directions = ['rechts', 'rechts-unten', 'links-unten', 'links', 'links-oben', 'rechts-oben'];
  console.log(`Edge ${edge} (${directions[edge]}): ${count} Häfen`);
}

// Berechne für jeden Hafen seine Nachbar-Landfelder
const directions = [
  [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
];

function neighborAxial(q, r, edge) {
  return [q + directions[edge][0], r + directions[edge][1]];
}

console.log('\nNachbar-Landfelder für jeden Hafen:');
PORTS.forEach(port => {
  const { q, r, edge } = port.position;
  
  // Finde alle 6 Nachbarn des Wasser-Tiles
  const neighbors = [];
  for (let i = 0; i < 6; i++) {
    const [nq, nr] = neighborAxial(q, r, i);
    neighbors.push(`(${nq},${nr})`);
  }
  
  console.log(`${port.id} at (${q},${r}) edge ${edge}:`);
  console.log(`  Nachbarn: ${neighbors.join(', ')}`);
  
  // Der Hafen zeigt zur edge - welche Landfelder grenzen an diese edge?
  // Edge verbindet corner edge und corner (edge+1)%6
  const corner1 = edge;
  const corner2 = (edge + 1) % 6;
  
  console.log(`  Harbor edge ${edge} verbindet corners ${corner1} und ${corner2}`);
  
  // Finde die angrenzenden Landfelder basierend auf corner-Nachbarschaft
  const [land1q, land1r] = neighborAxial(q, r, corner1);
  const [land2q, land2r] = neighborAxial(q, r, corner2);
  
  console.log(`  Angrenzende Landfelder: (${land1q},${land1r}) und (${land2q},${land2r})`);
  console.log('');
});

// === TEST: WELCHER HAFEN IST WIRKLICH AN (2,-2)? ===
const settlementQ = 2, settlementR = -2;

console.log('=== WELCHER HAFEN IST WIRKLICH AN (2,-2)? ===');
console.log('Settlement position:', settlementQ, settlementR);
console.log();

PORTS.forEach(port => {
  const { q: portQ, r: portR, edge: portEdge } = port.position;
  
  const harborCorner1 = portEdge;
  const harborCorner2 = (portEdge + 1) % 6;
  
  const [landTile1Q, landTile1R] = neighborAxial(portQ, portR, harborCorner1);
  const [landTile2Q, landTile2R] = neighborAxial(portQ, portR, harborCorner2);
  
  const isOnTile1 = (settlementQ === landTile1Q && settlementR === landTile1R);
  const isOnTile2 = (settlementQ === landTile2Q && settlementR === landTile2R);
  
  if (isOnTile1 || isOnTile2) {
    console.log('✓ MATCH:', port.id, 'at ('+portQ+','+portR+') edge', portEdge);
    console.log('  Adjacent land tiles: ('+landTile1Q+','+landTile1R+') and ('+landTile2Q+','+landTile2R+')');
    console.log('  Settlement matches:', isOnTile1 ? 'tile1' : 'tile2');
  } else {
    console.log('✗', port.id, '- tiles: ('+landTile1Q+','+landTile1R+') and ('+landTile2Q+','+landTile2R+')');
  }
});
