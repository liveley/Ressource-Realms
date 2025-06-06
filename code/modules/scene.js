import * as THREE from 'three';

const scene = new THREE.Scene();

// Skybox-Texturen laden
const loader = new THREE.CubeTextureLoader();
const skybox = loader.load([
  './textures/skybox_px.jpg', // posX
  './textures/skybox_nx.jpg', // negX
  './textures/skybox_py.jpg', // posY
  './textures/skybox_ny.jpg', // negY
  './textures/skybox_pz.jpg', // posZ
  './textures/skybox_nz.jpg'  // negZ
]);
scene.background = skybox;

export { scene };
