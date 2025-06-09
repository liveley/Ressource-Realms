// cards.js
import { scene } from './scene';
import CardLoader from './loader_jpeg';

// Diese Klasse verwaltet die Platzierung der Karten in der Szene
class CardManager {
    constructor() {
        this.cardLoader = new CardLoader();
    }

    // Lädt Karten und fügt sie zur Szene hinzu
    async loadAndPlaceCards(cardPaths) {
        await this.cardLoader.loadCards(cardPaths); // Warte auf das Laden der Karten

        const cards = this.cardLoader.getCards(); // Jetzt sind die Karten verfügbar

        if (cards.length === 0) {
            console.warn('Keine Karten geladen – überprüfe Pfade oder Dateiformate.');
            return;
        }

        cards.forEach((cardMesh, index) => {
            // Positioniere die Karte im Raum
            cardMesh.position.set(4.5, 0, 3 + index); // Beispiel: Karten leicht versetzt anordnen
            cardMesh.rotation.z = Math.PI / 2; // Karte um 90° im Uhrzeigersinn drehen

            // Füge die Karte zur Szene hinzu
            scene.add(cardMesh);
        });

        console.log(`${cards.length} Karte(n) zur Szene hinzugefügt.`);
    }
}

// Exportiere die Klasse, damit sie in anderen Dateien verwendet werden kann
export default CardManager;
