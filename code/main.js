import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { setupLights } from './lights.js';
import { scene } from './scene.js';
import { camera } from './camera.js';
import { hexPrism } from './hexPrism.js';

setupLights(scene);

const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// Orbit Controls
const ob_controls = new OrbitControls(camera, renderer.domElement);
ob_controls.minPolarAngle = Math.PI / 4;
ob_controls.maxPolarAngle = Math.PI / 2;

// Add objects
scene.add(hexPrism);

// Achsenhilfe hinzufügen
// 🔴 X-Achse (Rot)
// 🟢 Y-Achse (Grün)
// 🔵 Z-Achse (Blau)
const axesHelper = new THREE.AxesHelper(20);
scene.add(axesHelper);

const arrowPos = new THREE.Vector3(0, 0, 0);
scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), arrowPos, 30, 0x7F2020));
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), arrowPos, 30, 0x207F20));
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), arrowPos, 30, 0x20207F));

function animate() {
  hexPrism.rotation.z += 0.001;
  renderer.render(scene, camera);
}

// Responsive
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
