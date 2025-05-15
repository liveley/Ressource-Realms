import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './scene.js';
import { camera } from './camera.js';
import { loadhexagon } from './loader.js'; // stellt Loader-Funktion zur Verfügung die das GLB lädt
import { setupLights } from './lights.js';

// Renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setAnimationLoop(animate);
renderer.shadowMap.enabled = true;
document.body.appendChild(renderer.domElement);

// OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);
controls.minPolarAngle = Math.PI / 4;
controls.maxPolarAngle = Math.PI / 2;

// Achsenhelfer
scene.add(new THREE.AxesHelper(20));

const arrowPos = new THREE.Vector3(0, 0, 0);
scene.add(new THREE.ArrowHelper(new THREE.Vector3(1, 0, 0), arrowPos, 30, 0x7f2020)); // X
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 1, 0), arrowPos, 30, 0x207f20)); // Y
scene.add(new THREE.ArrowHelper(new THREE.Vector3(0, 0, 1), arrowPos, 30, 0x20207f)); // Z

setupLights(scene);
loadhexagon(scene)


// Animation
function animate() {
    renderer.render(scene, camera);
}

// Resize
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
});
