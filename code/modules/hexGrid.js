// Import des HexGrid-Moduls    ->  import { createHexGrid } from './hexGrid.js'; 
// Hex-Grid hinzufügen  ->  scene.add(createHexGrid());

// hexGrid.js
import * as THREE from 'three';

export function createHexGrid(radius = 3, rows = 20, cols = 20, color = 0xC0C0C0) {
    const hexGrid = new THREE.Group();
    const hexPoints = [
        new THREE.Vector3(Math.cos(0) * radius, Math.sin(0) * radius, 0),
        new THREE.Vector3(Math.cos(Math.PI / 3) * radius, Math.sin(Math.PI / 3) * radius, 0),
        new THREE.Vector3(Math.cos(2 * Math.PI / 3) * radius, Math.sin(2 * Math.PI / 3) * radius, 0),
        new THREE.Vector3(Math.cos(Math.PI) * radius, Math.sin(Math.PI) * radius, 0),
        new THREE.Vector3(Math.cos(4 * Math.PI / 3) * radius, Math.sin(4 * Math.PI / 3) * radius, 0),
        new THREE.Vector3(Math.cos(5 * Math.PI / 3) * radius, Math.sin(5 * Math.PI / 3) * radius, 0),
        new THREE.Vector3(Math.cos(0) * radius, Math.sin(0) * radius, 0) // Zurück zum Anfang
    ];

    for (let row = 0; row < rows; row++) {
        for (let col = 0; col < cols; col++) {
            const xOffset = col * radius * 1.5;
            const yOffset = row * radius * Math.sqrt(3) + (col % 2 === 1 ? radius * Math.sqrt(3) / 2 : 0);

            const hexLines = new THREE.BufferGeometry().setFromPoints(hexPoints.map(p => new THREE.Vector3(p.x + xOffset, p.y + yOffset, 0)));
            const hexMaterial = new THREE.LineBasicMaterial({ color: color });

            hexGrid.add(new THREE.Line(hexLines, hexMaterial));
        }
    }

    // Hex-Grid zentrieren
    hexGrid.position.set(- (cols * radius * 1.5) / 2, - (rows * radius * Math.sqrt(3)) / 2, 0);

    return hexGrid;
}
