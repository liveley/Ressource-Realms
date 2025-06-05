import * as THREE from 'three';

// Erstellt drei Platzhalter-Spielkarten mit unterschiedlichen Symbolen
export function createPlaceholderCards(scene) {
    const cardData = [
        { color: 0xffe066, symbol: '🌾', name: 'Weizen' },
        { color: 0x8fd19e, symbol: '🐑', name: 'Schaf' },
        { color: 0xdeb887, symbol: '🌲', name: 'Holz' }
    ];
    cardData.forEach((data, i) => {
        // Karte (Rechteck)
        const geometry = new THREE.BoxGeometry(2, 3, 0.1);
        const material = new THREE.MeshStandardMaterial({ color: data.color });
        const card = new THREE.Mesh(geometry, material);
        // Verschiebe die Karten weiter nach unten und etwas nach vorne
        card.position.set(i * 2.5 - 2.5, -16, 4);
        // Symbol als Canvas-Textur
        const canvas = document.createElement('canvas');
        canvas.width = 128; canvas.height = 192;
        const ctx = canvas.getContext('2d');
        ctx.fillStyle = '#fff';
        ctx.fillRect(0, 0, 128, 192);
        ctx.font = '80px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillStyle = '#333';
        ctx.fillText(data.symbol, 64, 96);
        ctx.font = '24px Arial';
        ctx.fillText(data.name, 64, 170);
        const texture = new THREE.CanvasTexture(canvas);
        const symbolMat = new THREE.MeshBasicMaterial({ map: texture });
        // Vorderseite ersetzen
        card.material = [material, material, material, material, symbolMat, material];
        scene.add(card);
    });
}
