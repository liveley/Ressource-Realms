// modules/dice.js
import * as THREE from 'three';

export function rollDice() {
  // Simuliere zwei Würfel (2-12)
  return Math.floor(Math.random() * 6 + 1) + Math.floor(Math.random() * 6 + 1);
}

// 3D-Würfelanzeige (ohne Physik, einfache Animation)
export function showDice(scene, value, pos = { x: 0, y: 0, z: 2 }) {
  // Entferne alte Würfel
  const old = scene.getObjectByName('diceGroup');
  if (old) scene.remove(old);

  // Zwei Würfelwerte berechnen
  let left = Math.floor(Math.random() * 6 + 1);
  let right = value - left;
  if (right < 1 || right > 6) {
    right = Math.floor(Math.random() * 6 + 1);
    left = value - right;
    if (left < 1 || left > 6) left = right = Math.floor(Math.random() * 6 + 1);
  }

  const diceGroup = new THREE.Group();
  diceGroup.name = 'diceGroup';

  // Hilfsfunktion für einen einzelnen Würfel
  function createSingleDice(val, offsetX) {
    const geometry = new THREE.BoxGeometry(2, 2, 2);
    const material = new THREE.MeshStandardMaterial({ color: 0xffffff, metalness: 0, roughness: 0.2 });
    const mesh = new THREE.Mesh(geometry, material);
    // Zahl als Sprite
    const canvas = document.createElement('canvas');
    canvas.width = 128; canvas.height = 128;
    const ctx = canvas.getContext('2d');
    ctx.clearRect(0, 0, 128, 128);
    ctx.fillStyle = '#222';
    ctx.font = 'bold 80px Montserrat, Arial';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(val, 64, 64);
    const texture = new THREE.CanvasTexture(canvas);
    const spriteMat = new THREE.SpriteMaterial({ map: texture });
    const sprite = new THREE.Sprite(spriteMat);
    sprite.scale.set(2, 2, 1);
    sprite.position.set(0, 0, 1.5);
    // Gruppe für Würfel und Zahl
    const single = new THREE.Group();
    single.add(mesh);
    single.add(sprite);
    single.position.x = offsetX;
    return single;
  }

  // Beide Würfel erzeugen (leicht versetzt)
  const dice1 = createSingleDice(left, -1.2);
  const dice2 = createSingleDice(right, 1.2);
  diceGroup.add(dice1);
  diceGroup.add(dice2);

  // Startposition hoch über dem Board
  diceGroup.position.set(pos.x, pos.y, 12); // Start noch höher (vorher 28)
  scene.add(diceGroup);

  // Zielposition
  const targetZ = 1; // Die Mitte des Würfels liegt auf z=1, damit die Unterseite auf z=0 (Brettoberfläche) liegt
  let t1 = 0, t2 = 0;
  const duration1 = 1.1 + Math.random() * 0.2; // kleine Varianz
  const duration2 = 1.1 + Math.random() * 0.2;
  // Zufällige Endrotationen
  const endRot1 = {
    x: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
    y: Math.PI / 4 + (Math.random() - 0.5) * 0.5
  };
  const endRot2 = {
    x: Math.PI / 4 + (Math.random() - 0.5) * 0.5,
    y: Math.PI / 4 + (Math.random() - 0.5) * 0.5
  };
  // Startz für beide Würfel leicht unterschiedlich
  const startZ1 = 12 + Math.random() * 1.5;
  const startZ2 = 12 + Math.random() * 1.5;

  function animateFall() {
    if (!scene.getObjectByName('diceGroup')) return;
    t1 += 1/60;
    t2 += 1/60;
    // Ease-out für beide
    const p1 = Math.min(1, t1 / duration1);
    const p2 = Math.min(1, t2 / duration2);
    dice1.position.z = startZ1 - (startZ1 - targetZ) * (p1 * p1 * (2 - p1));
    dice2.position.z = startZ2 - (startZ2 - targetZ) * (p2 * p2 * (2 - p2));
    dice1.rotation.x = Math.PI * 2 * (1 - p1) + endRot1.x * p1;
    dice1.rotation.y = Math.PI * 2 * (1 - p1) + endRot1.y * p1;
    dice2.rotation.x = Math.PI * 2 * (1 - p2) + endRot2.x * p2;
    dice2.rotation.y = Math.PI * 2 * (1 - p2) + endRot2.y * p2;
    if (p1 < 1 || p2 < 1) {
      requestAnimationFrame(animateFall);
    } else {
      dice1.position.z = targetZ;
      dice2.position.z = targetZ;
      dice1.rotation.x = endRot1.x;
      dice1.rotation.y = endRot1.y;
      dice2.rotation.x = endRot2.x;
      dice2.rotation.y = endRot2.y;
    }
  }
  animateFall();
}
