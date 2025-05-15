import * as THREE from 'three';

const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  1000
);
camera.position.set(0, 40, 40);
camera.up.set(0, 0, 1); // Z-Achse zeigt nach oben

export { camera };
