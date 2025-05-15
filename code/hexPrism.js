import * as THREE from 'three';

const radius = 10;
const height = 2;

// Sechseck in der XZ-Ebene konstruieren (also waagrecht)
const shape = new THREE.Shape();
for (let i = 0; i < 6; i++) {
  const angle = (i / 6) * Math.PI * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  if (i === 0) shape.moveTo(x, z);
  else shape.lineTo(x, z);
}
shape.closePath();

// Extrusion in Y-Richtung (nach oben)
const extrudeSettings = {
  steps: 1,
  depth: height,
  bevelEnabled: false
};

const geometry = new THREE.ExtrudeGeometry(shape, extrudeSettings);

// Material in Farbe #FEF492 (hellgelb)
const material = new THREE.MeshStandardMaterial({ color: 0xfef492 });

const hexPrism = new THREE.Mesh(geometry, material);
hexPrism.position.y = 0
hexPrism.receiveShadow = true;

export { hexPrism };
