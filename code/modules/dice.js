// modules/dice.js
import * as THREE from 'three';
import * as CANNON from 'cannon-es';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import { getDebugDiceValue } from './debugging/diceDebug.js';
import { isInRobberPlacementMode } from './bandit.js';

// Re-export debug functions for backward compatibility
export { setDebugDiceValue, toggleDebugDiceMode } from './debugging/diceDebug.js';

export function rollDice() {
  // Check if robber placement is active - block dice if so
  if (isInRobberPlacementMode()) {
    console.log('Dice roll blocked: Robber placement in progress');
    return null; // Return null to indicate blocked roll
  }
  
  // Check if we're forcing a specific value for debugging
  const debugValue = getDebugDiceValue();
  if (debugValue !== null) {
    // For a forced 7, use 1+6 or 2+5 or 3+4 randomly
    if (debugValue === 7) {
      const options = [[1,6], [2,5], [3,4]];
      const choice = options[Math.floor(Math.random() * options.length)];
      window.lastDice = { left: choice[0], right: choice[1], sum: 7 };
      return 7;
    }
    
    // For other values, just split somewhat randomly
    const left = Math.min(6, Math.max(1, Math.floor(debugValue / 2)));
    const right = debugValue - left;
    window.lastDice = { left, right, sum: debugValue };
    return debugValue;
  }
  
  // Normal random dice roll
  const left = Math.floor(Math.random() * 6 + 1);
  const right = Math.floor(Math.random() * 6 + 1);
  window.lastDice = { left, right, sum: left + right };
  return left + right;
}

// 3D-Würfelanzeige (ohne Physik, einfache Animation)
export function showDice(scene, value, pos = { x: 0, y: 0, z: 2 }) {
  // Entferne alte Würfel
  const old = scene.getObjectByName('diceGroup');
  if (old) scene.remove(old);

  // Zwei Würfelwerte aus window.lastDice verwenden, falls vorhanden
  let left = 1, right = 1;
  if (window.lastDice && window.lastDice.sum === value) {
    left = window.lastDice.left;
    right = window.lastDice.right;
  } else {
    left = Math.floor(Math.random() * 6 + 1);
    right = value - left;
    if (right < 1 || right > 6) {
      right = Math.floor(Math.random() * 6 + 1);
      left = value - right;
      if (left < 1 || left > 6) left = right = Math.floor(Math.random() * 6 + 1);
    }
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

// Globale Physik-Welt für die Würfel
let world, diceBodies = [], diceMeshes = [], groundBody;
let diceGLB = null; // Das geladene GLB-Modell für die Würfel

// Lade das dice.glb-Modell einmalig
const gltfLoader = new GLTFLoader();
gltfLoader.load('./models/dice.glb', (gltf) => {
  diceGLB = gltf.scene;
});

export function setupDicePhysics() {
  // Physik-Welt initialisieren
  world = new CANNON.World({ gravity: new CANNON.Vec3(0, 0, -30) });
  world.broadphase = new CANNON.NaiveBroadphase();
  world.solver.iterations = 10;

  // Boden (unsichtbar, damit Würfel nicht durchfallen)
  groundBody = new CANNON.Body({ mass: 0, shape: new CANNON.Plane() });
  world.addBody(groundBody);
}

export function throwPhysicsDice(scene) {
  if (!world) setupDicePhysics();
  // Alte Würfel entfernen
  diceBodies.forEach(b => world.removeBody(b));
  diceMeshes.forEach(m => scene.remove(m));
  diceBodies = [];
  diceMeshes = [];

  // Zwei Würfel erzeugen
  for (let i = 0; i < 2; i++) {
    // Physik-Body
    const scale = 1; // Jetzt exakt 1 (Kantenlänge 2)
    const shape = new CANNON.Box(new CANNON.Vec3(scale, scale, scale)); // Box mit Kantenlänge 2
    const body = new CANNON.Body({ mass: 1, shape });
    body.position.set(i === 0 ? -1.2 : 1.2, 0, 12);
    // Zufälliger Impuls und Drehimpuls
    body.velocity.set((Math.random()-0.5)*8, (Math.random()-0.5)*8, -5-Math.random()*5);
    body.angularVelocity.set(Math.random()*10, Math.random()*10, Math.random()*10);
    world.addBody(body);
    diceBodies.push(body);
    // === Mesh: GLB oder Platzhalter ===
    let mesh;
    if (diceGLB) {
      mesh = diceGLB.clone();
      mesh.traverse(child => {
        if (child.isMesh) {
          child.castShadow = true;
          child.receiveShadow = true;
        }
      });
      mesh.scale.set(scale, scale, scale); // Skaliere GLB auf gleiche Größe wie Physikbox
    } else {
      const geometry = new THREE.BoxGeometry(scale*2, scale*2, scale*2);
      const material = new THREE.MeshStandardMaterial({ color: 0xffffff });
      mesh = new THREE.Mesh(geometry, material);
      mesh.castShadow = true;
      mesh.receiveShadow = true;
    }
    scene.add(mesh);
    diceMeshes.push(mesh);
  }
}

// Hilfsfunktion: Bestimme die obenliegende Zahl eines Würfels anhand der Rotation
function getDiceTopNumber(mesh) {
  // ANPASSUNG: Seitenzuordnung für dein Modell (bitte ggf. anpassen!)
  // Beispiel: +Z = 1, -Z = 6, +Y = 2, -Y = 5, +X = 3, -X = 4
  // Wenn dein Modell anders ist, ändere die Zuordnung unten:
  const up = new THREE.Vector3(0, 0, 1);
  const localAxes = [
    { dir: new THREE.Vector3(0, 0, 1), num: 6 }, // +Z
    { dir: new THREE.Vector3(0, 0, -1), num: 1 }, // -Z
    { dir: new THREE.Vector3(0, 1, 0), num: 5 }, // +Y
    { dir: new THREE.Vector3(0, -1, 0), num: 2 }, // -Y
    { dir: new THREE.Vector3(1, 0, 0), num: 3 }, // +X
    { dir: new THREE.Vector3(-1, 0, 0), num: 4 }  // -X
  ];
  let maxDot = -1, topNum = 1;
  let debugArr = [];
  for (const axis of localAxes) {
    const worldDir = axis.dir.clone().applyQuaternion(mesh.quaternion);
    const dot = worldDir.dot(up);
    debugArr.push({num: axis.num, dot: dot.toFixed(3)});
    if (dot > maxDot) {
      maxDot = dot;
      topNum = axis.num;
    }
  }
  // Debug-Ausgabe: Welche Seite wurde erkannt?
  console.log('Würfel-Orientierung:', debugArr, 'Erkannt oben:', topNum);
  return topNum;
}

// Im Haupt-Renderloop aufrufen:
export function updateDicePhysics() {
  if (!world) return;
  world.step(1/60);
  for (let i = 0; i < diceBodies.length; i++) {
    const b = diceBodies[i], m = diceMeshes[i];
    m.position.copy(b.position);
    m.position.z += 0.7; // Noch etwas tiefer für perfekten Kontakt
    m.quaternion.copy(b.quaternion);
  }
  // === Nach dem Auswürfeln: Augenzahlen erkennen und Summe setzen ===
  if (window.setDiceResultFromPhysics) {
    // Prüfe, ob beide Würfel wirklich liegen (kaum Bewegung)
    const threshold = 0.15; // Geschwindigkeitsschwelle
    const allResting = diceBodies.every(b =>
      b.velocity.length() < threshold && b.angularVelocity.length() < threshold
    );
    
    if (allResting) {
      // Use a short timeout to allow the dice to settle fully
      setTimeout(() => {
        if (!window.setDiceResultFromPhysics) return; // Another call already handled it
        
        // Check if we're in debug mode - if so, force result to the debug value
        const debugValue = getDebugDiceValue();
        if (debugValue !== null) {
          console.log(`🎲 Debug mode activated: forcing dice to show ${debugValue}`);
          // For a forced 7, use 1+6 or 2+5 or 3+4 randomly
          if (debugValue === 7) {
            const options = [[1,6], [2,5], [3,4]];
            const choice = options[Math.floor(Math.random() * options.length)];
            window.setDiceResultFromPhysics({ left: choice[0], right: choice[1], sum: 7 });
          } else {
            // For other values, just split somewhat randomly
            const left = Math.min(6, Math.max(1, Math.floor(debugValue / 2)));
            const right = debugValue - left;
            window.setDiceResultFromPhysics({ left, right, sum: debugValue });
          }
        } else {
          // Normal dice roll result from physics
          const left = getDiceTopNumber(diceMeshes[0]);
          const right = getDiceTopNumber(diceMeshes[1]);
          const sum = left + right;
          window.setDiceResultFromPhysics({ left, right, sum });
        }
        window.setDiceResultFromPhysics = null; // Nur einmal pro Wurf
      }, 300); // Short delay to ensure dice have settled
    }
  }
}
