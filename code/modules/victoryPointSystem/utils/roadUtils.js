// victoryPointSystem/utils/roadUtils.js
// Road connectivity and calculation utilities

import { FLOAT_TOLERANCE, HEX_SIZE } from './constants.js';

/**
 * Get vertices of a road
 * @param {Object} road - Road object {q, r, edge}
 * @returns {Array} Array of vertex objects
 */
export function getRoadVertices(road) {
  const { q, r, edge } = road;
  
  // Map edge to the two corners it connects
  const edgeToCorners = {
    0: [0, 1], // Top edge: corners 0 and 1
    1: [1, 2], // Top-right edge: corners 1 and 2
    2: [2, 3], // Bottom-right edge: corners 2 and 3
    3: [3, 4], // Bottom edge: corners 3 and 4
    4: [4, 5], // Bottom-left edge: corners 4 and 5
    5: [5, 0]  // Top-left edge: corners 5 and 0
  };
  
  const corners = edgeToCorners[edge] || [0, 1];
  return corners.map(corner => ({ q, r, corner }));
}

/**
 * Get unique key for a road
 * @param {Object} road - Road object
 * @returns {string} Unique key
 */
export function getRoadKey(road) {
  return `${road.q},${road.r},${road.edge}`;
}

/**
 * Check if two vertices are at the same location (hex coordinates)
 * @param {Object} v1 - First vertex {q, r, corner}
 * @param {Object} v2 - Second vertex {q, r, corner}
 * @returns {boolean} True if vertices are at the same location
 */
export function areVerticesEqual(v1, v2) {
  // Direct match for hex coordinates (exact integer comparison)
  if (v1.q === v2.q && v1.r === v2.r && v1.corner === v2.corner) {
    return true;
  }
  
  // Check equivalent vertices (same physical location, different coordinate representation)
  const equivalents1 = getEquivalentVertices(v1);
  const equivalents2 = getEquivalentVertices(v2);
  
  return equivalents1.some(eq1 => 
    equivalents2.some(eq2 => 
      eq1.q === eq2.q && eq1.r === eq2.r && eq1.corner === eq2.corner
    )
  );
}

/**
 * Get all equivalent representations of a vertex (simplified based on axial coordinates)
 * @param {Object} vertex - Vertex object {q, r, corner}
 * @returns {Array} Array of equivalent vertex objects
 */
export function getEquivalentVertices(vertex) {
  const { q, r, corner } = vertex;
  
  // Each vertex is shared by exactly 3 tiles
  // Using the axial coordinate system with directions: [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  // For corner N on tile (q,r), the equivalent representations are:
  // - Current tile: (q, r, corner)
  // - Neighbor in direction (corner-1)%6: corner becomes (corner+2)%6
  // - Neighbor in direction corner: corner becomes (corner+4)%6
  
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  const equivalents = [{ q, r, corner }];
  
  // Add representation from neighbor in direction (corner-1)%6
  const dir1 = (corner + 5) % 6; // (corner - 1) % 6 with wrap-around
  const neighbor1 = [q + directions[dir1][0], r + directions[dir1][1]];
  equivalents.push({ q: neighbor1[0], r: neighbor1[1], corner: (corner + 2) % 6 });
  
  // Add representation from neighbor in direction corner
  const dir2 = corner;
  const neighbor2 = [q + directions[dir2][0], r + directions[dir2][1]];
  equivalents.push({ q: neighbor2[0], r: neighbor2[1], corner: (corner + 4) % 6 });
  
  return equivalents;
}

/**
 * Check if two roads are connected using the EXACT same logic as the game's isRoadOccupied
 * @param {Object} road1 - First road {q, r, edge}
 * @param {Object} road2 - Second road {q, r, edge}
 * @returns {boolean} True if roads are connected
 */
export function areRoadsConnectedVertex(road1, road2) {
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  // Method 1: Same physical edge (different tile perspectives)
  const [nq1, nr1] = [road1.q + directions[road1.edge][0], road1.r + directions[road1.edge][1]];
  const oppositeEdge1 = (road1.edge + 3) % 6;
  
  if (nq1 === road2.q && nr1 === road2.r && oppositeEdge1 === road2.edge) {
    return true; // Same physical edge
  }
  
  const [nq2, nr2] = [road2.q + directions[road2.edge][0], road2.r + directions[road2.edge][1]];
  const oppositeEdge2 = (road2.edge + 3) % 6;
  
  if (nq2 === road1.q && nr2 === road1.r && oppositeEdge2 === road1.edge) {
    return true; // Same physical edge (other direction)
  }
  
  // Method 2: Adjacent roads on same tile (share a vertex)
  if (road1.q === road2.q && road1.r === road2.r) {
    const edgeDiff = Math.abs(road1.edge - road2.edge);
    if (edgeDiff === 1 || edgeDiff === 5) { // Adjacent edges (including wrap-around 0-5)
      return true;
    }
  }
  
  // Method 3: Roads on different tiles that share a vertex
  // Use a more robust approach - check if roads share any vertex
  const vertices1 = getRoadVertices(road1);
  const vertices2 = getRoadVertices(road2);
  
  for (const v1 of vertices1) {
    for (const v2 of vertices2) {
      if (areVerticesEqual(v1, v2)) {
        return true;
      }
    }
  }
  
  return false;
}

/**
 * Get endpoints of a road in world coordinates
 * @param {Object} road - Road object {q, r, edge}
 * @returns {Array} Array of {x, y} coordinates
 */
export function getRoadEndpoints(road) {
  const { q, r, edge } = road;
  
  // Convert hex coordinates to world coordinates
  const centerX = q * 1.5;
  const centerY = (r + q * 0.5) * Math.sqrt(3);
  
  // Hex vertex offsets (corners)
  const vertices = [
    { x: 0, y: 1 },           // 0: top
    { x: 0.866, y: 0.5 },     // 1: top-right
    { x: 0.866, y: -0.5 },    // 2: bottom-right
    { x: 0, y: -1 },          // 3: bottom
    { x: -0.866, y: -0.5 },   // 4: bottom-left
    { x: -0.866, y: 0.5 }     // 5: top-left
  ];
  
  // Scale vertices to match hex size
  vertices.forEach(v => {
    v.x *= HEX_SIZE;
    v.y *= HEX_SIZE;
  });
  
  // Map edge to the two vertices it connects
  const edgeToVertices = {
    0: [0, 1], // Top edge: top to top-right
    1: [1, 2], // Top-right edge: top-right to bottom-right
    2: [2, 3], // Bottom-right edge: bottom-right to bottom
    3: [3, 4], // Bottom edge: bottom to bottom-left
    4: [4, 5], // Bottom-left edge: bottom-left to top-left
    5: [5, 0]  // Top-left edge: top-left to top
  };
  
  const vertexIndices = edgeToVertices[edge] || [0, 1];
  
  return vertexIndices.map(i => ({
    x: centerX + vertices[i].x,
    y: centerY + vertices[i].y
  }));
}

/**
 * Get canonical road representation to prevent duplicates
 * Roads can be represented from either end, so we normalize to a standard form
 * @param {Object} road - Road object with q, r, edge
 * @returns {Object} Canonical road representation
 */
export function getCanonicalRoad(road) {
  const { q, r, edge } = road;
  
  // Calculate neighbor tile coordinates
  const directions = [
    [+1, 0], [0, +1], [-1, +1], [-1, 0], [0, -1], [+1, -1]
  ];
  
  const [nq, nr] = [q + directions[edge][0], r + directions[edge][1]];
  const neighborEdge = (edge + 3) % 6;
  
  // Choose the canonical representation based on tile coordinates
  // Use lexicographic ordering: smaller q first, then smaller r, then smaller edge
  if (q < nq || (q === nq && r < nr) || (q === nq && r === nr && edge < neighborEdge)) {
    return { q, r, edge };
  } else {
    return { q: nq, r: nr, edge: neighborEdge };
  }
}
