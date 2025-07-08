// test/testLongestRoad.js
// Comprehensive test for longest road calculation

import { 
  calculateLongestRoad
} from '../modules/victoryPoints.js';

import { 
  debugRoadConnections 
} from '../modules/debugging/victoryPointsTestingUtils.js';

console.log('=== LONGEST ROAD TESTS ===');

// Test 1: Single road
console.log('\n--- Test 1: Single road ---');
const testPlayer1 = {
  roads: [
    { q: 0, r: 0, edge: 0 }
  ]
};
const length1 = calculateLongestRoad(testPlayer1);
console.log('Expected: 1, Got:', length1);
console.log('✓ Test 1 passed:', length1 === 1);

// Test 2: Two connected roads (sequential edges on same tile)
console.log('\n--- Test 2: Two connected roads on same tile ---');
const testPlayer2 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Top-right edge
    { q: 0, r: 0, edge: 1 }  // Right edge
  ]
};
const length2 = calculateLongestRoad(testPlayer2);
console.log('Expected: 2, Got:', length2);
debugRoadConnections(testPlayer2.roads);
console.log('✓ Test 2 passed:', length2 === 2);

// Test 3: Two unconnected roads
console.log('\n--- Test 3: Two unconnected roads ---');
const testPlayer3 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Top-right edge
    { q: 0, r: 0, edge: 3 }  // Bottom-left edge (not connected)
  ]
};
const length3 = calculateLongestRoad(testPlayer3);
console.log('Expected: 1, Got:', length3);
debugRoadConnections(testPlayer3.roads);
console.log('✓ Test 3 passed:', length3 === 1);

// Test 4: Three roads in a line
console.log('\n--- Test 4: Three roads in a line ---');
const testPlayer4 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Top-right edge
    { q: 0, r: 0, edge: 1 }, // Right edge
    { q: 0, r: 0, edge: 2 }  // Bottom-right edge
  ]
};
const length4 = calculateLongestRoad(testPlayer4);
console.log('Expected: 3, Got:', length4);
debugRoadConnections(testPlayer4.roads);
console.log('✓ Test 4 passed:', length4 === 3);

// Test 5: Five roads across multiple tiles (typical chain)
console.log('\n--- Test 5: Five roads across tiles ---');
const testPlayer5 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Center tile, top-right edge
    { q: 1, r: -1, edge: 3 }, // Adjacent tile, bottom-left edge (should connect)
    { q: 1, r: -1, edge: 4 }, // Same tile, left edge
    { q: 0, r: 0, edge: 5 }, // Back to center, top-left edge
    { q: 0, r: 0, edge: 4 }  // Center tile, left edge
  ]
};
const length5 = calculateLongestRoad(testPlayer5);
console.log('Expected: 5, Got:', length5);
debugRoadConnections(testPlayer5.roads);
console.log('✓ Test 5 passed:', length5 === 5);

// Test 6: Branching roads (should find longest path)
console.log('\n--- Test 6: Branching roads ---');
const testPlayer6 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Center
    { q: 0, r: 0, edge: 1 }, // Branch 1
    { q: 0, r: 0, edge: 2 }, // Branch 1 continues
    { q: 0, r: 0, edge: 5 }, // Branch 2
    { q: 0, r: 0, edge: 4 }  // Branch 2 continues
  ]
};
const length6 = calculateLongestRoad(testPlayer6);
console.log('Expected: 3, Got:', length6);
debugRoadConnections(testPlayer6.roads);
console.log('✓ Test 6 passed:', length6 === 3);

// Test 7: Real-world example (5 roads that should form a chain)
console.log('\n--- Test 7: Real-world 5-road chain ---');
const testPlayer7 = {
  roads: [
    { q: 0, r: 0, edge: 0 }, // Start at center
    { q: 0, r: 0, edge: 1 }, // Continue clockwise
    { q: 1, r: 0, edge: 4 }, // Move to adjacent tile
    { q: 1, r: 0, edge: 5 }, // Continue
    { q: 1, r: 0, edge: 0 }  // Continue
  ]
};
const length7 = calculateLongestRoad(testPlayer7);
console.log('Expected: 5, Got:', length7);
debugRoadConnections(testPlayer7.roads);
console.log('✓ Test 7 passed:', length7 === 5);

console.log('\n=== ALL TESTS COMPLETE ===');

// Export for browser testing
if (typeof window !== 'undefined') {
  window.testLongestRoad = function() {
    console.log('Running longest road tests...');
    
    const tests = [
      { name: 'Single road', player: testPlayer1, expected: 1 },
      { name: 'Two connected roads', player: testPlayer2, expected: 2 },
      { name: 'Two unconnected roads', player: testPlayer3, expected: 1 },
      { name: 'Three roads in a line', player: testPlayer4, expected: 3 },
      { name: 'Five roads across tiles', player: testPlayer5, expected: 5 },
      { name: 'Branching roads', player: testPlayer6, expected: 3 },
      { name: 'Real-world chain', player: testPlayer7, expected: 5 }
    ];
    
    let passed = 0;
    let failed = 0;
    
    tests.forEach(test => {
      const actual = calculateLongestRoad(test.player);
      if (actual === test.expected) {
        console.log(`✓ ${test.name}: PASSED (${actual})`);
        passed++;
      } else {
        console.log(`✗ ${test.name}: FAILED (expected ${test.expected}, got ${actual})`);
        failed++;
      }
    });
    
    console.log(`\nResults: ${passed} passed, ${failed} failed`);
    return { passed, failed };
  };
}
