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
    async loadCards(cardPaths) {
        const loadPromises = cardPaths.map((path) => {
            return new Promise((resolve, reject) => {
                // Prüfe, ob die Datei eine JPEG-Datei ist (.jpg oder .jpeg)
                // → Nur solche Dateien sollen verarbeitet werden
                const isJpeg = path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg');

                if (!isJpeg) {
                    // Wenn die Datei keine JPEG ist, gib eine Warnung aus und überspringe sie
                    console.warn(`Übersprungen: ${path} ist keine JPEG-Datei.`);
                    return reject(`Ungültiges Format: ${path}`);
                }

                // Prüfe die Datei mit fetch(), bevor sie geladen wird
                fetch(path)
                    .then(response => {
                        if (!response.ok || response.headers.get('content-length') === '0') {
                            throw new Error(`Ungültige Datei: ${path}`);
                        }
                        return response.blob();
                    })
                    .then(blob => {
                        // Erstelle eine temporäre URL für die geladene Datei
                        const objectURL = URL.createObjectURL(blob);

                        // Lade die JPEG-Textur mit der generierten URL
                        this.loader.load(
                            objectURL,
                            (texture) => {
                                // Logge erfolgreich geladene Dateien zur Kontrolle
                                console.log(`Geladen: ${path}`);
                            
                                // Filteroptionen für bessere Schärfe
                                texture.minFilter = THREE.NearestFilter;
                                texture.magFilter = THREE.NearestFilter;
                                texture.generateMipmaps = false;
                            
                                // Erstelle eine flache rechteckige Fläche (Box) mit Breite 1, Höhe 1, Tiefe 0.05
                                const geometry = new THREE.BoxGeometry(1, 1.25, 0.025);

                                // Lade zusätzliche Texturen für die Vorder- und Rückseite
                                // (Diese könntest du auch asynchron laden und per Promise abwarten – hier als synchrones Beispiel)
                                const frontTexture = new THREE.TextureLoader().load('../assets/item_ressource_card_jpg'); // Vorderseite
                                const backTexture  = new THREE.TextureLoader().load('path/to/backImage.jpg');  // Rückseite

                                // Erstelle Materialien für die einzelnen Seiten der Karte
                                const topMaterial    = new THREE.MeshBasicMaterial({ map: texture });    // Obere Seite (Bild, z. B. als Kartenrücken)
                                const creamMaterial  = new THREE.MeshBasicMaterial({ color: 0xFFFDD0 });   // Weiß-creme Ton für die Kanten und ggf. Unterseite
                                //const frontMaterial  = new THREE.MeshBasicMaterial({ map: frontTexture}); // Vordere Seite
                                const backMaterial   = new THREE.MeshBasicMaterial({ map: backTexture});  // Hintere Seite

                                // Array von Materialien in der Reihenfolge: Rechts, Links, Oben, Unten, Vorne, Hinten
                                const materials = [
                                    creamMaterial,   // Rechte Seite
                                    creamMaterial,   // Linke Seite
                                    creamMaterial,     // vordere Seite
                                    creamMaterial,   // Untere Seite
                                    topMaterial,   // obere Seite
                                    backMaterial     // untere Seite
                                ];

                                // Kombiniere Geometrie und Materialien zu einem sichtbaren Objekt (Mesh)
                                const cardMesh = new THREE.Mesh(geometry, materials);

                                // Füge die Karte dem Array hinzu (aber nicht zur Szene!)
                                this.cards.push(cardMesh);
                                resolve(cardMesh);
                            },
                            undefined, // Lade-Callback nicht notwendig
                            (error) => {
                                console.warn(`Fehler beim Laden der Datei: ${path}`, error);
                                reject(error);
                            } 
                        );
                    })
                    .catch(error => {
                        console.warn(`Fehlerhafte oder nicht unterstützte Datei: ${path}`, error);
                        reject(error);
                    });
            });
        });

        await Promise.all(loadPromises); // Warte, bis alle Karten geladen sind
    }

    // Gibt das Array aller geladenen Karten zurück
    getCards() {
        return this.cards;
    }
}

// Exportiere die Klasse, damit sie in anderen Dateien verwendet werden kann
export default CardLoader;
