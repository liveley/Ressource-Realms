import * as THREE from 'three';

export function setupLights(scene) {
    const light = new THREE.SpotLight(0xffede6, 30);
    light.position.set(0, 0, 10);
    light.castShadow = true;
    scene.add(light);

    const ambient = new THREE.AmbientLight(0xfdf2c8, 0.05);
    scene.add(ambient);
}
