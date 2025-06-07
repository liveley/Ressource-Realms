// Import des loader-Moduls    ->  import {  } from './loader.js'; oder from '../loader.js'; 

import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

const loader = new GLTFLoader();

// Funktion zum Laden eines einzelnen Tiles
export function loadTile(filename, callback) {
  loader.load(`./models/${filename}`, (gltf) => {
    const tile = gltf.scene;

    tile.rotation.x = Math.PI / 2;
    tile.rotation.y = Math.PI / 6;
    tile.scale.set(2.6, 2.6, 2.6);

    // Zufällige zusätzliche Drehung um die Y-Achse in 60°-Schritten
    const randomHexRotation = Math.floor(Math.random() * 6) * (Math.PI / 3);
    tile.rotation.y += randomHexRotation;

    tile.traverse((child) => {
      if (child.isMesh) {
        child.castShadow = true;
        child.receiveShadow = true;
      }
    });

    callback(tile);
  }, undefined, (error) => {
    console.error(`Fehler beim Laden der GLB-Datei (${filename}):`, error);
  });
}
