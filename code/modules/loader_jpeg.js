// loader_jpeg.js
import * as THREE from 'three';

// Diese Klasse lädt JPEG-Bilder und erstellt daraus Kartenobjekte in einer Three.js-Szene
class CardLoader {
    constructor() {
        // Erstellt einen Loader, um Bilddateien (Texturen) zu laden
        this.loader = new THREE.TextureLoader();

        // Array zum Speichern der geladenen Karten (als Meshes)
        this.cards = [];
    }

    // Lädt eine Liste von Bildpfaden und erstellt daraus Kartenobjekte
    loadCards(cardPaths) {
        cardPaths.forEach((path, index) => {
            // Prüfe, ob die Datei eine JPEG-Datei ist (.jpg oder .jpeg)
            // → Nur solche Dateien sollen verarbeitet werden
            const isJpeg = path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg');

            if (!isJpeg) {
                // Wenn die Datei keine JPEG ist, gib eine Warnung aus und überspringe sie
                console.warn(`Übersprungen: ${path} ist keine JPEG-Datei.`);
                return;
            }

            // Lade die JPEG-Textur
            this.loader.load(
                path,
                (texture) => {
                    // Logge erfolgreich geladene Dateien zur Kontrolle
                    console.log(`Geladen: ${path}`);

                    // Erstelle eine flache rechteckige Fläche (Plane) mit Breite 1, Höhe 1
                    // → Ändere z. B. auf (1.4, 2.0) für realistischere Spielkartenproportionen
                    const geometry = new THREE.PlaneGeometry(1, 1);

                    // Material mit der geladenen Textur (Bild) – ohne Lichtreflexionen
                    // → MeshBasicMaterial reagiert nicht auf Lichtquellen
                    // → Für realistischere Effekte kannst du MeshStandardMaterial verwenden
                    const material = new THREE.MeshBasicMaterial({ map: texture });

                    // Kombiniere Geometrie und Material zu einem sichtbaren Objekt (Mesh)
                    const cardMesh = new THREE.Mesh(geometry, material);

                    // Positioniere die Karte im Raum:
                    // X: Abstand zwischen Karten (index * 1.5 → jede Karte 1.5 Einheiten weiter rechts)
                    // Y: 0 → auf Bodenhöhe
                    // Z: 0 → keine Tiefe
                    //
                    // → Position.set(x, y, z)
                    //    x: negativ = links, positiv = rechts
                    //    y: negativ = unten, positiv = oben
                    //    z: negativ = weiter hinten, positiv = näher zur Kamera
                    //
                    // → Ändere z. B. Y auf 1, um Karten höher zu platzieren
                    cardMesh.position.set(index * 1.5, 1, 3);

                    // Füge die Karte dem Array hinzu
                    this.cards.push(cardMesh);
                }
            );
        });
    }

    // Gibt das Array aller geladenen Karten zurück
    getCards() {
        return this.cards;
    }
}

// Exportiere die Klasse, damit sie in anderen Dateien verwendet werden kann
export default CardLoader;
