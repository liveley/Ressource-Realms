import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const hexGroup = new THREE.Group();

export function loadhexagon(scene) {
 loader.load('./models/center.glb', (gltf) => {
    const hex = gltf.scene;

    // Optional: Rotieren, wenn nötig (damit es waagrecht liegt)
    hex.rotation.x = -Math.PI / 2;

    // Optional: Zentrieren, falls es nicht schon im Modellzentrum liegt
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