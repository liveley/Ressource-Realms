// placementIndex.js - lightweight index for fast settlement/city distance rule checks
import { getCanonicalCorner, getEquivalentCorners, getNeighborCorner } from './geometryUtils.js';

const OCCUPIED = new Map(); // key -> { q,r,corner, type:'settlement'|'city', playerIndex }
let initialized = false;

function key(c){ return `${c.q},${c.r},${c.corner}`; }

export function buildIndexFromPlayers(players){
  OCCUPIED.clear();
  players.forEach((p,pi)=>{
    (p.settlements||[]).forEach(s=>{
      const c = getCanonicalCorner(s.q,s.r,s.corner); OCCUPIED.set(key(c), { ...c, type:'settlement', playerIndex:pi });
    });
    (p.cities||[]).forEach(s=>{
      const c = getCanonicalCorner(s.q,s.r,s.corner); OCCUPIED.set(key(c), { ...c, type:'city', playerIndex:pi });
    });
  });
  initialized = true;
}

function ensure(players){ if(!initialized) buildIndexFromPlayers(players); }

export function markOccupy(q,r,corner,type,players){ ensure(players); const c=getCanonicalCorner(q,r,corner); OCCUPIED.set(key(c), { ...c,type }); }
export function unmarkOccupy(q,r,corner,players){ ensure(players); const c=getCanonicalCorner(q,r,corner); OCCUPIED.delete(key(c)); }

// Return true if blocked; optionally collect reasons
export function isBlockedByDistance(q,r,corner,players, collect){
  ensure(players);
  // If canonical corner already occupied -> blocked
  const canon = getCanonicalCorner(q,r,corner);
  if (OCCUPIED.has(key(canon))) { if(collect) collect.push({type:'same', blocker: OCCUPIED.get(key(canon))}); return true; }
  // Check adjacency: any occupied corner adjacent to any equivalent corner
  const equivalents = getEquivalentCorners(q,r,corner);
  for(const eq of equivalents){
    // Adjacent same-tile corners (eq.corner +/-1) and neighbor corner counterpart
    const sameTileAdj = [ (eq.corner+5)%6, (eq.corner+1)%6 ];
    for(const ac of sameTileAdj){
      const adjCanon = getCanonicalCorner(eq.q, eq.r, ac);
      const occ = OCCUPIED.get(key(adjCanon));
      if(occ){ if(collect) collect.push({type:'adjacent', blocker: occ}); return true; }
    }
    const neighbor = getNeighborCorner(eq.q, eq.r, eq.corner); // already returns one of the three equivalent; its adjacent along path counted via other eq loops
    // Also check neighbor's adjacent corners that meet at the shared edge: (neighbor.corner+1)%6 and (neighbor.corner+5)%6 may duplicate but harmless
    const neighAdjSet = [neighbor.corner, (neighbor.corner+1)%6, (neighbor.corner+5)%6];
    for(const nc of neighAdjSet){
      const adjCanon2 = getCanonicalCorner(neighbor.q, neighbor.r, nc);
      const occ2 = OCCUPIED.get(key(adjCanon2));
      if(occ2){ if(collect) collect.push({type:'adjacent', blocker: occ2}); return true; }
    }
  }
  return false;
}

export function resetPlacementIndex(){ OCCUPIED.clear(); initialized=false; }
