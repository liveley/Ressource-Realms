import * as THREE from 'three';

// Entfernt alle Siedlungs- und Stadt-Meshes aus der Szene
export function removeAllSettlementAndCityMeshes(scene) {
  if (!scene || typeof scene.traverse !== 'function') return;
  scene.children.slice().forEach(obj => {
    if (
      obj.userData &&
      (obj.userData.type === 'settlement' || obj.userData.type === 'city')
    ) {
      scene.remove(obj);
    }
  });
}

// Entfernt alle Straßen-Meshes aus der Szene
export function removeAllRoadMeshes(scene) {
  if (!scene || typeof scene.traverse !== 'function') return;
  scene.children.slice().forEach(obj => {
    if (obj.userData && obj.userData.type === 'road') {
      scene.remove(obj);
    }
  });
}
