// buildLogic.js
// Zentrale Spiellogik für Siedlungen und Städte

// Beispiel-Spielerstruktur (kann später erweitert werden)
export const players = [
  {
    name: 'Spieler 1',
    color: 0xd7263d,
    settlements: [], // {q, r, corner}
    cities: [],      // {q, r, corner}
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 }
  },
  {
    name: 'Spieler 2',
    color: 0x277da1,
    settlements: [],
    cities: [],
    resources: { wood: 0, clay: 0, wheat: 0, sheep: 0, ore: 0 }
  }
];

// Ressourcenprüfung für Siedlung
export function canBuildSettlement(player) {
  const r = player.resources;
  return r.wood >= 1 && r.clay >= 1 && r.wheat >= 1 && r.sheep >= 1;
}

// Ressourcenprüfung für Stadt
export function canBuildCity(player) {
  const r = player.resources;
  return r.wheat >= 2 && r.ore >= 3;
}

// Siedlung bauen (ohne Platzierungslogik)
export function buildSettlement(player, q, r, corner) {
  // Nur Spielfeld-Update, KEIN Ressourcenabzug mehr!
  player.settlements.push({ q, r, corner });
  return true;
}

// Stadt bauen (Upgrade)
export function buildCity(player, q, r, corner) {
  // Nur Spielfeld-Update, KEIN Ressourcenabzug mehr!
  const idx = player.settlements.findIndex(s => s.q === q && s.r === r && s.corner === corner);
  if (idx === -1) return false;
  player.settlements.splice(idx, 1);
  player.cities.push({ q, r, corner });
  return true;
}

// Stadt bauen (Upgrade, mit Validierung)
export function tryBuildCity(player, q, r, corner) {
  // Ressourcen prüfen
  if (!canBuildCity(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  // Muss bereits eigene Siedlung an dieser Stelle haben
  const idx = player.settlements.findIndex(s => s.q === q && s.r === r && s.corner === corner);
  if (idx === -1) return { success: false, reason: 'Keine eigene Siedlung an dieser Stelle' };
  // Bauen & Ressourcen abziehen
  player.resources.wheat -= 2;
  player.resources.ore -= 3;
  buildCity(player, q, r, corner);
  return { success: true };
}

// === Platzierungsregel: Siedlungen müssen mindestens 2 Ecken Abstand haben ===
export function isSettlementPlacementValid(q, r, corner, allPlayers) {
  // Jede Siedlung/Stadt eines beliebigen Spielers darf nicht direkt benachbart sein
  for (const player of allPlayers) {
    for (const s of [...player.settlements, ...player.cities]) {
      if (areCornersAdjacent(q, r, corner, s.q, s.r, s.corner)) {
        return false;
      }
      // Auch exakt gleiche Ecke ist verboten
      if (q === s.q && r === s.r && corner === s.corner) {
        return false;
      }
    }
  }
  return true;
}

// Hilfsfunktion: Sind zwei Ecken benachbart? (gleiche Ecke oder Nachbarfeld, angrenzende Ecke)
function areCornersAdjacent(q1, r1, c1, q2, r2, c2) {
  // Gleiches Feld, angrenzende Ecke
  if (q1 === q2 && r1 === r2 && Math.abs(c1 - c2) === 1) return true;
  if (q1 === q2 && r1 === r2 && Math.abs(c1 - c2) === 5) return true; // Ecke 0 und 5 sind benachbart
  // Nachbarfeld, angrenzende Ecke
  const neighbor = getNeighborCorner(q1, r1, c1);
  if (neighbor.q === q2 && neighbor.r === r2 && neighbor.corner === c2) return true;
  return false;
}

// Hilfsfunktion: Gibt die angrenzende Ecke im Nachbarfeld zurück
function getNeighborCorner(q, r, corner) {
  // Reihenfolge der Ecken: 0-5 im Uhrzeigersinn
  // Jede Ecke gehört zu drei Feldern, aber wir prüfen nur das direkt angrenzende Nachbarfeld
  // Die Zuordnung hängt von der Hex-Topologie ab
  // Für Ecke i: Nachbarfeld in Richtung i, dort Ecke (i+4)%6
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  const dir = directions[corner];
  return { q: q + dir[0], r: r + dir[1], corner: (corner + 4) % 6 };
}

// === Platzierungsregel: Siedlung muss an eigene Straße angrenzen (außer bei Startaufstellung) ===
export function isSettlementConnectedToOwnRoad(player, q, r, corner) {
  // Für jede eigene Straße prüfen, ob sie an diese Ecke angrenzt
  if (!player.roads || player.roads.length === 0) return false;
  for (const road of player.roads) {
    if (isRoadAdjacentToCorner(road, q, r, corner)) {
      return true;
    }
  }
  return false;
}

// Hilfsfunktion: Prüft, ob eine Straße an eine bestimmte Ecke angrenzt
function isRoadAdjacentToCorner(road, q, r, corner) {
  // Eine Straße verbindet immer zwei Ecken (A und B)
  // Wir prüfen, ob die gewünschte Ecke eine der beiden ist
  return (
    (road.q1 === q && road.r1 === r && road.corner1 === corner) ||
    (road.q2 === q && road.r2 === r && road.corner2 === corner)
  );
}

// Helper: Prüft, ob ein Tile ein Landfeld ist (kein Wasser, keine Wüste)
function isLandTile(q, r) {
  // Prüfe, ob das Tile laut tileMeshes ein Wasserfeld ist
  if (typeof window.tileMeshes === 'object') {
    const mesh = window.tileMeshes[`${q},${r}`];
    if (!mesh) return false;
    // Wasser-Tiles haben name === 'water.glb'
    if (mesh.name && mesh.name.startsWith('water')) return false;
    // Wüste
    if (mesh.name && mesh.name.startsWith('center')) return false;
    return true;
  }
  // Fallback: explizite Liste der Wasserkoordinaten (aus game_board.js)
  const waterCoords = [
    [3,-1],[3,-2],[3,-3],[2,-3],[1,-3],[0,-3],[-1,-2],[-2,-1],[-3,1],[-3,2],[-3,0],[-3,3],[-2,3],[-1,3],[0,3],[1,2],[2,1],[3,0],
    [4,-1],[4,-2],[4,-3],[3,-4],[2,-4],[1,-4],[0,-4],[-1,-3],[-2,-2],[-3,-1],[-4,0],[-4,1],[-4,2],[-4,3],[-3,4],[-2,4],[-1,4],[0,4],[1,3],[2,2],[3,1],[4,0],[4,-4],[-4,4],
    [5,-1],[5,-2],[5,-3],[5,-4],[4,-5],[3,-5],[2,-5],[1,-5],[0,-5],[-1,-4],[-2,-3],[-3,-2],[-4,-1],[-5,0],[-5,1],[-5,2],[-5,3],[-5,4],[-4,5],[-3,5],[-2,5],[-1,5],[0,5],[1,4],[2,3],[3,2],[4,1],[5,0],[-5,5],[5,-5]
  ];
  for (const [wq, wr] of waterCoords) {
    if (q === wq && r === wr) return false;
  }
  // Wüste
  if (q === 0 && r === 0) return false;
  return true;
}

// Siedlung bauen (mit Platzierungslogik)
export function tryBuildSettlement(player, q, r, corner, allPlayers, {requireRoad = true, ignoreDistanceRule = false, ignoreResourceRule = false} = {}) {
  // Verhindere Bau auf Wasser- oder Wüsten-Tiles
  if (!isLandTile(q, r)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein Landfeld)' };
  }
  // Bereits eigene Siedlung/Stadt an dieser Ecke?
  if (player.settlements.some(s => s.q === q && s.r === r && s.corner === corner) ||
      player.cities.some(c => c.q === q && c.r === r && c.corner === corner)) {
    return { success: false, reason: 'Hier steht bereits deine Siedlung/Stadt' };
  }
  // Irgendein Spieler hat an dieser Ecke schon gebaut?
  for (const other of allPlayers) {
    if (other !== player && (other.settlements.some(s => s.q === q && s.r === r && s.corner === corner) ||
      other.cities.some(c => c.q === q && c.r === r && c.corner === corner))) {
      return { success: false, reason: 'Hier steht bereits eine Siedlung/Stadt' };
    }
  }
  // Ressourcen prüfen
  if (!ignoreResourceRule && !canBuildSettlement(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  // Abstand zu anderen Siedlungen/Städten prüfen
  if (!ignoreDistanceRule && !isSettlementPlacementValid(q, r, corner, allPlayers)) return { success: false, reason: 'Zu nah an anderer Siedlung/Stadt' };
  // Straßenanbindung prüfen (außer bei Startaufstellung)
  if (requireRoad && !isSettlementConnectedToOwnRoad(player, q, r, corner)) return { success: false, reason: 'Keine eigene Straße an dieser Ecke' };
  // Bauen & Ressourcen abziehen
  player.resources.wood--;
  player.resources.clay--;
  player.resources.wheat--;
  player.resources.sheep--;
  buildSettlement(player, q, r, corner);
  return { success: true };
}

// === Nur-Prüf-Funktion für Build-Preview (ohne Ressourcenabzug, ohne Bauen) ===
export function canPlaceSettlement(player, q, r, corner, allPlayers, {requireRoad = true, ignoreDistanceRule = false, ignoreResourceRule = false} = {}) {
  if (!isLandTile(q, r)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein Landfeld)' };
  }
  // Bereits eigene Siedlung/Stadt an dieser Ecke?
  if (player.settlements.some(s => s.q === q && s.r === r && s.corner === corner) ||
      player.cities.some(c => c.q === q && c.r === r && c.corner === corner)) {
    return { success: false, reason: 'Hier steht bereits deine Siedlung/Stadt' };
  }
  // Irgendein Spieler hat an dieser Ecke schon gebaut?
  for (const other of allPlayers) {
    if (other !== player && (other.settlements.some(s => s.q === q && s.r === r && s.corner === corner) ||
      other.cities.some(c => c.q === q && c.r === r && c.corner === corner))) {
      return { success: false, reason: 'Hier steht bereits eine Siedlung/Stadt' };
    }
  }
  if (!ignoreResourceRule && !canBuildSettlement(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  if (!ignoreDistanceRule && !isSettlementPlacementValid(q, r, corner, allPlayers)) return { success: false, reason: 'Zu nah an anderer Siedlung/Stadt' };
  if (requireRoad && !isSettlementConnectedToOwnRoad(player, q, r, corner)) return { success: false, reason: 'Keine eigene Straße an dieser Ecke' };
  return { success: true };
}

export function canPlaceCity(player, q, r, corner) {
  if (!canBuildCity(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  const idx = player.settlements.findIndex(s => s.q === q && s.r === r && s.corner === corner);
  if (idx === -1) return { success: false, reason: 'Keine eigene Siedlung an dieser Stelle' };
  return { success: true };
}

// TODO: UI-Integration
