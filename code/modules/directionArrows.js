// directionArrows.js -> ersetzt axesHelper
// Import der Richtungsanzeiger ->  import { createDirectionArrows } from './directionArrows.js'; 
// Richtungsanzeiger hinzufügen ->  createDirectionArrows(scene);

import * as THREE from 'three';

export function createDirectionArrows(scene) {
    const arrowPos = new THREE.Vector3(0, 0, 0);

    const arrowSize = 30;

    // Rote X-Achsen-Pfeile
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), arrowPos, arrowSize, 0x7F2020));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(-1, 0, 0), arrowPos, arrowSize, 0x7F2020));
    addLabel(scene, "X+", new THREE.Vector3(arrowSize, 0, 0), 0xff0000);
    addLabel(scene, "X-", new THREE.Vector3(-arrowSize, 0, 0), 0xff0000);

    // Grüne Y-Achsen-Pfeile
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), arrowPos, arrowSize, 0x207F20));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, -1, 0), arrowPos, arrowSize, 0x207F20));
    addLabel(scene, "Y+", new THREE.Vector3(0, arrowSize, 0), 0x00ff00);
    addLabel(scene, "Y-", new THREE.Vector3(0, -arrowSize, 0), 0x00ff00);

    // Blaue Z-Achsen-Pfeile
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), arrowPos, arrowSize, 0x20207F));
    scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, -1), arrowPos, arrowSize, 0x20207F));
    addLabel(scene, "Z+", new THREE.Vector3(0, 0, arrowSize), 0x0000ff);
    addLabel(scene, "Z-", new THREE.Vector3(0, 0, -arrowSize), 0x0000ff);
}

// Funktion zum Hinzufügen von Textbeschriftungen
function addLabel(scene, text, position, color) {
    const spriteMaterial = new THREE.SpriteMaterial({ 
        map: createTextTexture(text, color), 
        transparent: true 
    });
    const sprite = new THREE.Sprite(spriteMaterial);
    sprite.position.copy(position);
    sprite.scale.set(5, 2.5, 1); // Größe der Textbeschriftung anpassen
    scene.add(sprite);
}

// Funktion zur Erstellung einer Text-Textur
function createTextTexture(text, color) {
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    canvas.width = 256;
    canvas.height = 128;

    context.fillStyle = `rgb(${(color >> 16) & 255}, ${(color >> 8) & 255}, ${color & 255})`;
    context.font = '50px Arial';
    context.fillText(text, 50, 75);

    const texture = new THREE.Texture(canvas);
    texture.needsUpdate = true;
    return texture;
}

