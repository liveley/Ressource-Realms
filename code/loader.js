import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const hexGroup = new THREE.Group();

export function loadhexagon(scene) {
 loader.load('./models/center.glb', (gltf) => {
    const hex = gltf.scene;

    // Rotate to lie flat
    hex.rotation.x = -Math.PI / 2;

    // Rotate to point a tip downward
    hex.rotation.y = Math.PI / 6;

    // Scale it up
    hex.scale.set(3, 3, 3); 

    hex.position.set(0, 0, 0);

    hex.traverse((child) => {
        if (child.isMesh) {
            child.castShadow = true;
            child.receiveShadow = true;
        }
    });

    hexGroup.add(hex);
    scene.add(hexGroup);
}, undefined, (error) => {
    console.error('Error loading GLB file:', error);
});
}