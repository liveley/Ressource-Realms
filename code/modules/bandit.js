// Handles loading, showing, and positioning the bandit (Räuber) model on the board
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let bandit = null;
let banditLoaded = false;
let banditGroup = new THREE.Group();

export function loadBanditModel(scene, onLoaded) {
    if (banditLoaded) {
        if (onLoaded) onLoaded(banditGroup);
        return;
    }
    const loader = new GLTFLoader();
    loader.load('./models/bandit.glb', (gltf) => {
        bandit = gltf.scene;
        bandit.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Optional: make the bandit more visible
                child.material.emissive = new THREE.Color(0x222222);
            }
        });
        bandit.scale.set(1.5, 1.5, 1.5); // Make bandit larger for visibility
        banditGroup.add(bandit);
        banditLoaded = true;
        if (onLoaded) onLoaded(banditGroup);
    });
}

export function showBanditOnTile(scene, tilePosition) {
    showBanditMessage(); // Schriftzug anzeigen
    if (!banditLoaded) {
        loadBanditModel(scene, () => {
            placeBandit(tilePosition);
            if (!scene.children.includes(banditGroup)) {
                scene.add(banditGroup);
            }
        });
    } else {
        placeBandit(tilePosition);
        if (!scene.children.includes(banditGroup)) {
            scene.add(banditGroup);
        }
    }
}

function showBanditMessage() {
    let msg = document.getElementById('bandit-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'bandit-message';
        msg.style.position = 'fixed';
        msg.style.left = '50%';
        msg.style.bottom = '3em';
        msg.style.transform = 'translateX(-50%)';
        msg.style.background = 'rgba(34,34,34,0.92)';
        msg.style.color = '#ffe066';
        msg.style.fontSize = '2em';
        msg.style.fontFamily = "'Montserrat', Arial, sans-serif";
        msg.style.padding = '0.7em 2em';
        msg.style.borderRadius = '12px';
        msg.style.boxShadow = '0 2px 12px #0006';
        msg.style.zIndex = '100';
        msg.style.textAlign = 'center';
        document.body.appendChild(msg);
    }
    msg.textContent = 'Der Räuber ist erschienen!';
    msg.style.display = 'block';
    setTimeout(() => { msg.style.display = 'none'; }, 3500);
}

function placeBandit(tilePosition) {
    banditGroup.position.set(tilePosition.x, tilePosition.y, tilePosition.z + 3.2); // Slightly above tile (Z-Achse)
    banditGroup.rotation.set(Math.PI / 2, 0, 0); // 90° um X-Achse nach oben
    banditGroup.visible = true;
}

export function hideBandit() {
    banditGroup.visible = false;
}