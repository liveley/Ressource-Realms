// modules/loader.js
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();
const hexGroup = new THREE.Group();

// Abstände zwischen Hex-Kacheln (an Radius angepasst)
const HEX_RADIUS = 3;
const HEX_WIDTH = Math.sqrt(3) * HEX_RADIUS;
const HEX_HEIGHT = HEX_RADIUS * 1.5;

const tilePaths = [
  'clay.glb',
  'ore.glb',
  'sheep.glb',
  'wheat.glb',
  'wood.glb',
  'water.glb'
];

const tilePositions = [
  [1, 0],
  [1, -1],
  [0, -1],
  [-1, 0],
  [-1, 1],
  [0, 1],
];

function axialToWorld(q, r) {
  const x = HEX_RADIUS * 3/2 * q;
  const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
  const z = 0; // Höhe immer 0
  return [x, y, z];
}

function loadTile(filename, position, scene) {
  loader.load(`./models/${filename}`, (gltf) => {
    const tile = gltf.scene;

    tile.rotation.x = Math.PI / 2; // Flipped!
    tile.rotation.y = Math.PI / 6; // 45 Grad um Y-Achse

    tile.scale.set(3, 3, 3);
    tile.position.set(...position);

    tile.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    hexGroup.add(tile);
    scene.add(hexGroup);
  }, undefined, (error) => {
    console.error(`Error loading GLB file (${filename}):`, error);
  });
}

export function loadhexagon(scene) {
  // Center tile
  const centerPos = axialToWorld(0, 0);
  loadTile('center.glb', centerPos, scene);

  // Surrounding tiles
  tilePaths.forEach((file, index) => {
    const [q, r] = tilePositions[index];
    const pos = axialToWorld(q, r);
    loadTile(file, pos, scene);
  });
}