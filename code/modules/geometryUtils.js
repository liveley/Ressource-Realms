// geometryUtils.js - shared hex corner/vertex equivalence + canonicalization
// Axial directions (pointy-top)
const DIRECTIONS = [ [1,0],[0,1],[-1,1],[-1,0],[0,-1],[1,-1] ];

export function neighborAxial(q,r,dir){
  if(typeof dir !== 'number' || dir<0 || dir>5){
    if (typeof console !== 'undefined') console.warn('[geometryUtils] neighborAxial invalid dir', dir);
    return [q,r];
  }
  const d = DIRECTIONS[dir];
  if(!d){
    if (typeof console !== 'undefined') console.warn('[geometryUtils] direction not found', dir);
    return [q,r];
  }
  return [q+d[0], r+d[1]];
}

export function getNeighborCorner(q,r,corner){
  if(typeof corner !== 'number' || corner<0 || corner>5){
    if (typeof console !== 'undefined') console.warn('[geometryUtils] getNeighborCorner invalid corner', corner);
    return { q, r, corner: 0 };
  }
  const [nq,nr] = neighborAxial(q,r,corner);
  return { q:nq, r:nr, corner:(corner+4)%6 };
}

export function getEquivalentCorners(q,r,corner){
  if(typeof corner !== 'number' || corner<0 || corner>5){
    corner = ((corner||0)%6+6)%6; // normalize
  }
  // A physische Ecke wird von genau 3 Hexes geteilt. Unser einfacher Traversal über zwei Nachbarn liefert diese.
  try {
    const a = {q,r,corner};
    const b = getNeighborCorner(q,r,corner);
    const c = getNeighborCorner(b.q,b.r,b.corner);
    // Deduplicate falls degeneriert
    const out = [a,b,c];
    const seen = new Set();
    return out.filter(v=>{ const k=`${v.q},${v.r},${v.corner}`; if(seen.has(k)) return false; seen.add(k); return true; });
  } catch(e){
    if (typeof console !== 'undefined') console.warn('[geometryUtils] getEquivalentCorners error', e);
    return [{q,r,corner:corner||0}];
  }
}

export function getCanonicalCorner(q,r,corner){
  const eq = getEquivalentCorners(q,r,corner)
    .map(e=>({q:e.q,r:e.r,corner:e.corner}))
    .sort((x,y)=> x.q - y.q || x.r - y.r || x.corner - y.corner);
  return eq[0];
}

export function areSamePhysicalCorner(a,b){
  if(!a||!b) return false;
  const ca = getCanonicalCorner(a.q,a.r,a.corner);
  const cb = getCanonicalCorner(b.q,b.r,b.corner);
  return ca.q===cb.q && ca.r===cb.r && ca.corner===cb.corner;
}

export function getEquivalentVertices(v){
  return getEquivalentCorners(v.q,v.r,v.corner);
}
