import * as THREE from 'three';
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js';
import { scene } from './modules/scene.js';
import { camera } from './modules/camera.js';
import { loadhexagon } from './loader.js'; // stellt Loader-Funktion zur Verfügung die das GLB lädt
import { setupLights } from './modules/lights.js';
import { createHexGrid } from './modules/hexGrid.js'; 
import { createDirectionArrows } from './modules/directionArrows.js'; 

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
controls.minDistance = 10;  // Minimaler Zoom (z. B. 10 Einheiten vom Zentrum)
controls.maxDistance = 55; // Maximaler Zoom (z. B. 100 Einheiten vom Zentrum)

scene.add(createHexGrid());
createDirectionArrows(scene);

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
