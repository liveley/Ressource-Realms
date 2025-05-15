import * as THREE from 'three';

export function setupLights(scene) {
    const light = new THREE.SpotLight(0xffffff, 1.5);
    light.position.set(20, 20, 40);
    light.castShadow = true;
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xffffff, 0.5);
    scene.add(ambient);
}
