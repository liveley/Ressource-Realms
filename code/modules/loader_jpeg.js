// loader_jpeg.js
import * as THREE from 'three';

// Diese Klasse lädt JPEG-Bilder als Texturen
class CardLoader {
    constructor() {
        // Erstellt einen Loader, um Bilddateien (Texturen) zu laden
        this.loader = new THREE.TextureLoader();
    }

    // Lädt eine einzelne Textur aus dem angegebenen Pfad und gibt ein Promise zurück
    async loadTexture(path) {
        return new Promise((resolve, reject) => {
            // Prüfe, ob die Datei eine JPEG-Datei ist (.jpg oder .jpeg)
            const isJpeg = path.toLowerCase().endsWith('.jpg') || path.toLowerCase().endsWith('.jpeg');
            if (!isJpeg) {
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
                            console.log(`Geladen: ${path}`);
                            
                            // Filteroptionen für bessere Schärfe
                            texture.minFilter = THREE.NearestFilter;
                            texture.magFilter = THREE.NearestFilter;
                            texture.generateMipmaps = false;
                            resolve(texture);
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
    }
}

export default CardLoader;
