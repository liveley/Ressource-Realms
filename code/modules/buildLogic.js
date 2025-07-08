// buildLogic.js
// Zentrale Spiellogik für Siedlungen und Städte

import { 
  initializeVictoryPoints, 
  updateLongestRoad, 
  getCanonicalRoad,
  updateAllVictoryPoints
} from './victoryPoints.js';

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

// Ressourcenprüfung für Straße
export function canBuildRoad(player) {
  const r = player.resources;
  return r.wood >= 1 && r.clay >= 1;
}

// Siedlung bauen (ohne Platzierungslogik)
export function buildSettlement(player, q, r, corner) {
  // Ensure VP system is initialized for this player
  initializeVictoryPoints([player]);
  // Defensive programming: ensure settlements array exists
  if (!player.settlements) player.settlements = [];
  
  // Nur Spielfeld-Update, KEIN Ressourcenabzug mehr!
  player.settlements.push({ q, r, corner });
  
  // Update victory points - use global players array with proper checks
  if (window.players && Array.isArray(window.players)) {
    updateAllVictoryPoints(player, window.players);
  }
  
  return true;
}

// Stadt bauen (Upgrade)
export function buildCity(player, q, r, corner) {
  // Ensure VP system is initialized for this player
  initializeVictoryPoints([player]);
  // Defensive programming: ensure arrays exist
  if (!player.settlements) player.settlements = [];
  if (!player.cities) player.cities = [];
  
  // Nur Spielfeld-Update, KEIN Ressourcenabzug mehr!
  const idx = player.settlements.findIndex(s => s.q === q && s.r === r && s.corner === corner);
  if (idx === -1) return false;
  player.settlements.splice(idx, 1);
  player.cities.push({ q, r, corner });
  
  // Update victory points - use global players array with proper checks
  if (window.players && Array.isArray(window.players)) {
    updateAllVictoryPoints(player, window.players);
  }
  
  return true;
}

// Stadt bauen (Upgrade, mit Validierung)
export function tryBuildCity(player, q, r, corner) {
  // Prüfe, ob mindestens ein angrenzendes Tile Land ist
  if (!hasAtLeastOneLandTileAdjacent(q, r, corner)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)' };
  }
  // Limit: Maximal 4 Städte pro Spieler
  if (player.cities && player.cities.length >= 4) {
    return { success: false, reason: 'Du hast keine Städte mehr übrig (Limit: 4)' };
  }
  // Prüfe alle äquivalenten Ecken auf bestehende Siedlung/Stadt
  const equivalents = getEquivalentCorners(q, r, corner);
  for (const eq of equivalents) {
    if (!player.settlements.some(s => s.q === eq.q && s.r === eq.r && s.corner === eq.corner)) {
      // Keine eigene Siedlung an dieser physischen Ecke
      continue;
    }
    // Ressourcen prüfen
    if (!canBuildCity(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
    // Bauen & Ressourcen abziehen
    player.resources.wheat -= 2;
    player.resources.ore -= 3;
    // Ressourcen zurück an die Bank
    if (window.bank) {
      window.bank.wheat = (window.bank.wheat || 0) + 2;
      window.bank.ore = (window.bank.ore || 0) + 3;
    }
    buildCity(player, eq.q, eq.r, eq.corner);
    return { success: true };
  }
  return { success: false, reason: 'Keine eigene Siedlung an dieser Stelle' };
}

// === Platzierungsregel: Siedlungen müssen mindestens 2 Ecken Abstand haben ===
export function isSettlementPlacementValid(q, r, corner, allPlayers) {
  // Jede Siedlung/Stadt eines beliebigen Spielers darf nicht direkt benachbart sein
  // Wichtig: Wir müssen die äquivalenten Ecken sowohl der neuen Position als auch der bestehenden Siedlungen berücksichtigen
  const newEquivalents = getEquivalentCorners(q, r, corner);
  
  for (const player of allPlayers) {
    for (const s of [...player.settlements, ...player.cities]) {
      const existingEquivalents = getEquivalentCorners(s.q, s.r, s.corner);
      
      // Prüfe alle Kombinationen von äquivalenten Ecken auf Adjacenz
      for (const newEq of newEquivalents) {
        for (const existingEq of existingEquivalents) {
          // Exakt gleiche Ecke ist verboten
          if (newEq.q === existingEq.q && newEq.r === existingEq.r && newEq.corner === existingEq.corner) {
            return false;
          }
          // Benachbarte Ecken sind verboten
          if (areCornersAdjacent(newEq.q, newEq.r, newEq.corner, existingEq.q, existingEq.r, existingEq.corner)) {
            return false;
          }
        }
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
  // Debug-Ausgabe
  console.log(`Prüfe Straßenanbindung für Siedlung an (${q},${r}) Ecke ${corner}`);
  console.log(`Spieler hat ${player.roads ? player.roads.length : 0} Straßen:`, player.roads);
  
  // Für jede eigene Straße prüfen, ob sie an diese Ecke angrenzt
  // Prüfe alle äquivalenten Ecken (physische Ecke!)
  const equivalents = getEquivalentCorners(q, r, corner);
  console.log(`Äquivalente Ecken:`, equivalents);
  
  if (!player.roads || player.roads.length === 0) return false;
  
  for (const eq of equivalents) {
    for (const road of player.roads) {
      const isAdjacent = isRoadAdjacentToCorner(road, eq.q, eq.r, eq.corner);
      console.log(`Straße ${JSON.stringify(road)} an Ecke (${eq.q},${eq.r}):${eq.corner}? ${isAdjacent}`);
      if (isAdjacent) {
        return true;
      }
    }
  }
  return false;
}

// Hilfsfunktion: Prüft, ob eine Straße an eine bestimmte Ecke angrenzt
function isRoadAdjacentToCorner(road, q, r, corner) {
  // Eine Straße entlang der Kante 'edge' verbindet die Ecken 'edge' und '(edge + 1) % 6'
  // Wir müssen prüfen, ob die gewünschte Ecke eine der beiden ist (oder deren Äquivalente)
  
  console.log(`  Prüfe Straße ${JSON.stringify(road)} gegen Ecke (${q},${r}):${corner}`);
  
  // Straße hat das Format {q, r, edge, ...}
  if (road.q !== undefined && road.r !== undefined && road.edge !== undefined) {
    // Die Straße verbindet zwei Ecken auf dem Straßen-Tile
    const roadCorner1 = road.edge;
    const roadCorner2 = (road.edge + 1) % 6;
    
    console.log(`    Straße verbindet Ecken (${road.q},${road.r}):${roadCorner1} und (${road.q},${road.r}):${roadCorner2}`);
    
    // Prüfe, ob die gewünschte Ecke eine der beiden Straßen-Ecken ist (mit Äquivalenz)
    const equivalentsCorner1 = getEquivalentCorners(road.q, road.r, roadCorner1);
    const equivalentsCorner2 = getEquivalentCorners(road.q, road.r, roadCorner2);
    
    for (const eq1 of equivalentsCorner1) {
      if (eq1.q === q && eq1.r === r && eq1.corner === corner) {
        console.log(`    Match: Ecke (${q},${r}):${corner} ist äquivalent zu (${road.q},${road.r}):${roadCorner1}`);
        return true;
      }
    }
    
    for (const eq2 of equivalentsCorner2) {
      if (eq2.q === q && eq2.r === r && eq2.corner === corner) {
        console.log(`    Match: Ecke (${q},${r}):${corner} ist äquivalent zu (${road.q},${road.r}):${roadCorner2}`);
        return true;
      }
    }
    
    console.log(`    Keine Übereinstimmung gefunden`);
    return false;
  }
  
  // Fallback für neue Datenstruktur mit q1,r1,corner1 und q2,r2,corner2
  if (road.q1 !== undefined && road.r1 !== undefined && road.corner1 !== undefined) {
    const match1 = (road.q1 === q && road.r1 === r && road.corner1 === corner);
    const match2 = (road.q2 === q && road.r2 === r && road.corner2 === corner);
    console.log(`    Endpunkt 1: (${road.q1},${road.r1}):${road.corner1} -> ${match1}`);
    console.log(`    Endpunkt 2: (${road.q2},${road.r2}):${road.corner2} -> ${match2}`);
    return match1 || match2;
  }
  
  return false;
}

// Helper: Prüft, ob ein Tile ein Landfeld ist (kein Wasser, keine Wüste)
export function isLandTile(q, r) {
  // Prüfe, ob das Tile laut tileMeshes ein Wasserfeld ist
  if (typeof window.tileMeshes === 'object') {
    const mesh = window.tileMeshes[`${q},${r}`];
    if (!mesh) return false;
    // Wasser-Tiles haben name === 'water.glb'
    if (mesh.name && mesh.name.startsWith('water')) return false;
    // Wüste (center) ist jetzt erlaubt!
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
  // Wüste (0,0) ist jetzt erlaubt!
  return true;
}

// Helper: Gibt alle 3 Tiles zurück, die an eine Ecke angrenzen
export function getTilesAdjacentToCorner(q, r, corner) {
  const tiles = [{ q, r }]; // Das aktuelle Tile
  
  // Eine Ecke wird von 3 Tiles geteilt
  // Ecke N liegt zwischen den Kanten N-1 und N
  // Die anderen beiden Tiles sind die Nachbarn in diesen Richtungen
  const edge1 = (corner + 5) % 6; // Vorherige Kante (N-1)
  const edge2 = corner; // Aktuelle Kante (N)
  
  const [nq1, nr1] = neighborAxial(q, r, edge1);
  const [nq2, nr2] = neighborAxial(q, r, edge2);
  
  tiles.push({ q: nq1, r: nr1 });
  tiles.push({ q: nq2, r: nr2 });
  
  return tiles;
}

// Helper: Prüft, ob mindestens eines der angrenzenden Tiles ein Landfeld ist
export function hasAtLeastOneLandTileAdjacent(q, r, corner) {
  // Einfacherer Ansatz: Prüfe das aktuelle Tile und die beiden Nachbartiles
  // die diese Ecke teilen
  
  // Das aktuelle Tile
  if (isLandTile(q, r)) {
    return true;
  }
  
  // Die beiden Nachbartiles die diese Ecke teilen
  const edge1 = (corner + 5) % 6; // Vorherige Kante
  const edge2 = corner; // Aktuelle Kante
  
  const [nq1, nr1] = neighborAxial(q, r, edge1);
  const [nq2, nr2] = neighborAxial(q, r, edge2);
  
  if (isLandTile(nq1, nr1) || isLandTile(nq2, nr2)) {
    return true;
  }
  
  return false;
}

// Gibt alle äquivalenten Ecken für eine physische Ecke zurück
export function getEquivalentCorners(q, r, corner) {
  const eq = [{ q, r, corner }];
  const n1 = getNeighborCorner(q, r, corner);
  eq.push({ q: n1.q, r: n1.r, corner: n1.corner });
  const n2 = getNeighborCorner(n1.q, n1.r, n1.corner);
  eq.push({ q: n2.q, r: n2.r, corner: n2.corner });
  return eq;
}

// Siedlung bauen (mit Platzierungslogik)
export function tryBuildSettlement(player, q, r, corner, allPlayers, {requireRoad = true, ignoreDistanceRule = false, ignoreResourceRule = false} = {}) {
  // Limit: Maximal 5 Siedlungen pro Spieler
  if (player.settlements && player.settlements.length >= 5) {
    return { success: false, reason: 'Du hast keine Siedlungen mehr übrig (Limit: 5)' };
  }
  if (!hasAtLeastOneLandTileAdjacent(q, r, corner)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)' };
  }
  // Prüfe alle äquivalenten Ecken auf bestehende Siedlung/Stadt
  const equivalents = getEquivalentCorners(q, r, corner);
  for (const other of allPlayers) {
    for (const eq of equivalents) {
      if (
        other.settlements.some(s => s.q === eq.q && s.r === eq.r && s.corner === eq.corner) ||
        other.cities.some(c => c.q === eq.q && c.r === eq.r && c.corner === eq.corner)
      ) {
        return { success: false, reason: 'Hier steht bereits eine Siedlung/Stadt (egal von welchem Feld)' };
      }
    }
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
  // Abstand zu anderen Siedlungen/Städten prüfen (für alle äquivalenten Ecken!)
  if (!ignoreDistanceRule) {
    const equivalents = getEquivalentCorners(q, r, corner);
    for (const eq of equivalents) {
      if (!isSettlementPlacementValid(eq.q, eq.r, eq.corner, allPlayers)) {
        return { success: false, reason: 'Zu nah an anderer Siedlung/Stadt' };
      }
    }
  }
  // Straßenanbindung prüfen (außer bei Startaufstellung)
  if (requireRoad && !isSettlementConnectedToOwnRoad(player, q, r, corner)) return { success: false, reason: 'Keine eigene Straße an dieser Ecke' };
  // Bauen & Ressourcen abziehen
  player.resources.wood--;
  player.resources.clay--;
  player.resources.wheat--;
  player.resources.sheep--;
  // Ressourcen zurück an die Bank
  if (window.bank) {
    window.bank.wood = (window.bank.wood || 0) + 1;
    window.bank.clay = (window.bank.clay || 0) + 1;
    window.bank.wheat = (window.bank.wheat || 0) + 1;
    window.bank.sheep = (window.bank.sheep || 0) + 1;
  }
  buildSettlement(player, q, r, corner);
  return { success: true };
}

// === Nur-Prüf-Funktion für Build-Preview (ohne Ressourcenabzug, ohne Bauen) ===
export function canPlaceSettlement(player, q, r, corner, allPlayers, {requireRoad = true, ignoreDistanceRule = false, ignoreResourceRule = false} = {}) {
  if (!hasAtLeastOneLandTileAdjacent(q, r, corner)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)' };
  }
  
  // Ressourcen prüfen
  if (!ignoreResourceRule && !canBuildSettlement(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  
  // Abstandsregel prüfen (für alle äquivalenten Ecken!)
  if (!ignoreDistanceRule) {
    const equivalents = getEquivalentCorners(q, r, corner);
    for (const eq of equivalents) {
      if (!isSettlementPlacementValid(eq.q, eq.r, eq.corner, allPlayers)) {
        return { success: false, reason: 'Zu nah an anderer Siedlung/Stadt' };
      }
    }
  }
  
  // Straßenanbindung prüfen (außer bei Startaufstellung)
  if (requireRoad && !isSettlementConnectedToOwnRoad(player, q, r, corner)) return { success: false, reason: 'Keine eigene Straße an dieser Ecke' };
  
  return { success: true };
}

export function canPlaceCity(player, q, r, corner) {
  // Prüfe, ob mindestens ein angrenzendes Tile Land ist
  if (!hasAtLeastOneLandTileAdjacent(q, r, corner)) {
    return { success: false, reason: 'Hier kann nicht gebaut werden (kein angrenzendes Landfeld)' };
  }
  
  // Prüfe alle äquivalenten Ecken auf eigene Siedlung
  const equivalents = getEquivalentCorners(q, r, corner);
  for (const eq of equivalents) {
    if (player.settlements.some(s => s.q === eq.q && s.r === eq.r && s.corner === eq.corner)) {
      if (!canBuildCity(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
      return { success: true };
    }
  }
  return { success: false, reason: 'Keine eigene Siedlung an dieser Stelle' };
}

// Prüft, ob an dieser Kante schon eine Straße liegt (egal von wem)
function isRoadOccupied(q, r, edge, allPlayers) {
  for (const player of allPlayers) {
    if (!player.roads) continue;
    for (const road of player.roads) {
      if (
        (road.q === q && road.r === r && road.edge === edge) ||
        (road.q === neighborAxial(q, r, edge)[0] && road.r === neighborAxial(q, r, edge)[1] && road.edge === (edge + 3) % 6)
      ) {
        return true;
      }
    }
  }
  return false;
}

// Hilfsfunktion: Nachbarfeld für eine Kante (aus game_board.js kopiert)
function neighborAxial(q, r, edge) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  return [q + directions[edge][0], r + directions[edge][1]];
}

export function tryBuildRoad(player, q, r, edge, allPlayers, {ignoreResourceRule = false} = {}) {
  // Ensure VP system is initialized for this player
  initializeVictoryPoints([player]);
  // Limit: Maximal 15 Straßen pro Spieler
  if (player.roads && player.roads.length >= 15) {
    return { success: false, reason: 'Du hast keine Straßen mehr übrig (Limit: 15)' };
  }
  // Erlaube Straßenbau, wenn mindestens EIN angrenzendes Feld Land ist (Wüste ist erlaubt)
  const [nq, nr] = neighborAxial(q, r, edge);
  if (!isLandTile(q, r) && !isLandTile(nq, nr)) {
    return { success: false, reason: 'Straßenbau auf Wasser nicht erlaubt' };
  }
  if (!ignoreResourceRule && !canBuildRoad(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  if (isRoadOccupied(q, r, edge, allPlayers)) return { success: false, reason: 'Hier liegt schon eine Straße' };
  // TODO: Anbindung an eigene Straße/Siedlung prüfen (optional)
  // Ressourcen abziehen nur wenn nicht ignoreResourceRule
  if (!ignoreResourceRule) {
    player.resources.wood--;
    player.resources.clay--;
    // Ressourcen zurück an die Bank
    if (window.bank) {
      window.bank.wood = (window.bank.wood || 0) + 1;
      window.bank.clay = (window.bank.clay || 0) + 1;
    }
  }
  if (!player.roads) player.roads = [];
  
  // Speichere beide Endpunkte der Straße für die Adjazenzprüfung
  // Eine Straße entlang der Kante 'edge' verbindet die Ecken 'edge' und '(edge + 1) % 6' auf demselben Tile
  const roadData = {
    q1: q, r1: r, corner1: edge,                    // Erste Ecke der Straße
    q2: q, r2: r, corner2: (edge + 1) % 6,         // Zweite Ecke der Straße (gleiche Tile)
    q, r, edge // optional, falls noch woanders genutzt
  };
  
  // Use canonical coordinates to prevent duplicates
  const canonicalRoad = getCanonicalRoad(roadData);
  player.roads.push(canonicalRoad);
  
  // Update longest road after building - use proper parameter passed to function
  if (allPlayers && Array.isArray(allPlayers)) {
    updateLongestRoad(allPlayers);
  }
  
  return { success: true };
}

// Nur-Prüf-Funktion für Preview
export function canPlaceRoad(player, q, r, edge, allPlayers, {ignoreResourceRule = false} = {}) {
  // Erlaube Straßenbau, wenn mindestens EIN angrenzendes Feld Land ist (Wüste ist erlaubt)
  const [nq, nr] = neighborAxial(q, r, edge);
  if (!isLandTile(q, r) && !isLandTile(nq, nr)) {
    return { success: false, reason: 'Straßenbau auf Wasser nicht erlaubt' };
  }
  if (!ignoreResourceRule && !canBuildRoad(player)) return { success: false, reason: 'Nicht genug Ressourcen' };
  if (isRoadOccupied(q, r, edge, allPlayers)) return { success: false, reason: 'Hier liegt schon eine Straße' };
  // TODO: Anbindung an eigene Straße/Siedlung prüfen (optional)
  return { success: true };
}

// TODO: UI-Integration
