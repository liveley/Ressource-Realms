import * as THREE from 'three';

export function setupLights(scene) {
    // DirectionalLight als Sonne
    const sun = new THREE.DirectionalLight(0xfff6e0, 1.1);
    sun.position.set(10, -12, 18);
    sun.castShadow = true;
    sun.shadow.mapSize.width = 2048;
    sun.shadow.mapSize.height = 2048;
    // Schattenkamera eng um das Board legen (z.B. für ein 15x15-Board)
    sun.shadow.camera.near = 10;
    sun.shadow.camera.far = 40;
    sun.shadow.camera.left = -12;
    sun.shadow.camera.right = 12;
    sun.shadow.camera.top = 12;
    sun.shadow.camera.bottom = -12;
    sun.shadow.bias = -0.002;
    scene.add(sun);

    // HemisphereLight für realistische Grundausleuchtung
    const hemi = new THREE.HemisphereLight(0xcce6ff, 0xe6d2b5, 0.55); // Himmel, Boden, Intensität
    hemi.position.set(0, 0, 30);
    scene.add(hemi);

    // Sehr schwaches AmbientLight für minimale Grundhelligkeit
    const ambient = new THREE.AmbientLight(0xffffff, 0.04);
    scene.add(ambient);

    // Optional: leichte Akzentbeleuchtung (z.B. PointLight)
    // const accent = new THREE.PointLight(0xfff2cc, 0.15, 30);
    // accent.position.set(0, 0, 10);
    // scene.add(accent);
}

