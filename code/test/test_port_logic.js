// test/test_port_logic.js
// Test-Skript für die neue Hafenlogik

import { getPortsNearSettlement, debugPortCorners, PORTS } from '../modules/portSystem.js';

/**
 * Testet die neue Hafenlogik mit verschiedenen Siedlungspositionen
 */
function testNewPortLogic() {
  console.log('=== Testing New Port Logic ===');
  
  // Zuerst alle gültigen Ecken für alle Häfen anzeigen
  debugPortCorners();
  
  // Test-Siedlungen an verschiedenen Positionen
  const testSettlements = [
    // Beispiel-Siedlungen (ersetze diese mit echten Positionen aus deinem Spiel)
    { q: 2, r: -1, corner: 4, description: 'Test bei Hafen 1' },
    { q: 1, r: -2, corner: 1, description: 'Test bei Hafen 2' },
    { q: 0, r: -2, corner: 3, description: 'Test an der Küste (sollte keinen Hafen finden)' },
    { q: -1, r: -1, corner: 2, description: 'Test bei Hafen 3' },
    { q: -2, r: 1, corner: 0, description: 'Test bei Hafen 4' },
  ];
  
  console.log('\n=== Testing Settlement Positions ===');
  
  for (const settlement of testSettlements) {
    console.log(`\nTesting: ${settlement.description}`);
    console.log(`Settlement at (${settlement.q}, ${settlement.r}, corner ${settlement.corner})`);
    
    const nearbyPorts = getPortsNearSettlement(settlement.q, settlement.r, settlement.corner);
    
    if (nearbyPorts.length > 0) {
      console.log(`✅ Found ${nearbyPorts.length} port(s):`);
      for (const port of nearbyPorts) {
        console.log(`   - ${port.id}: ${port.type} ${port.ratio} at water tile (${port.position.q}, ${port.position.r})`);
      }
    } else {
      console.log('❌ No ports found');
    }
  }
  
  console.log('\n=== Test Complete ===');
}

/**
 * Führe Vergleichstest zwischen alter und neuer Logik durch
 * (Kommentiere die alte Funktion temporär wieder ein um zu vergleichen)
 */
function compareLogic() {
  console.log('\n=== Logic Comparison ===');
  console.log('Um die alte vs neue Logik zu vergleichen:');
  console.log('1. Kommentiere die alte isSettlementNearPort Funktion wieder ein');
  console.log('2. Benenne sie in isSettlementNearPortOLD um');
  console.log('3. Führe beide Versionen mit den gleichen Eingaben aus');
  console.log('4. Vergleiche die Ergebnisse');
}

// Exportiere die Test-Funktionen
export { testNewPortLogic, compareLogic };

// Auto-Run wenn direkt ausgeführt
if (typeof window !== 'undefined' && window.location) {
  // Im Browser ausführen
  console.log('Port Logic Test loaded. Call testNewPortLogic() to run tests.');
} else {
  // In Node.js ausführen (falls unterstützt)
  testNewPortLogic();
}
