// cards.js
import * as THREE from 'three';
import { scene } from './scene.js';
import CardLoader from './loader_jpeg.js';

// Beispielhafte Default-Konfiguration für Karten (nur front und back)
const resourceCards = [
  // Ressourcen-Karten
  {
    front: "/assets/item_card_wood.jpeg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/item_card_wool.jpeg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/item_card_wheat.jpeg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/item_card_ore.jpeg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/item_card_clay.jpeg",
    back: "/assets/item_card_back.jpeg"
  }
];

const infoCards = [
  // Infokarten (kein Back-Material)
  {
    front: "/assets/baukosten_card.jpg"
  },
  {
    front: "/assets/handelsstrasse_card.jpg"
  },
  {
    front: "/assets/rittermacht_card.jpg"
  }
];

const developmentCards = [
  // Entwicklungs-Karten
  {
    front: "/assets/development_bibliothek_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_erfindung_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_kathedrale_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_marktplatz_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_monopol_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_parlament_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_ritter_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_strassenbau_card.jpg",
    back: "/assets/item_card_back.jpeg"
  },
  {
    front: "/assets/development_universitaet_card.jpg",
    back: "/assets/item_card_back.jpeg"
  }
];

class CardManager {
  constructor() {
    this.cardLoader = new CardLoader();
    this.cards = [];
  }

  // Lädt Karten und fügt sie zur Szene hinzu anhand der Konfigurationen
  async loadAndPlaceCards(cardConfigs, cardType) {
    const loadPromises = cardConfigs.map(async (config, index) => {
      console.log(`Lade Karte ${index}: Konfiguration`, config);

      // Lade die Front-Textur
      const frontTexture = await this.cardLoader.loadTexture(config.front);
      console.log(`Front-Texture für Karte ${index} geladen:`, frontTexture);

      // Lade die Back-Textur, falls vorhanden
      const backTexture = config.back ? await this.cardLoader.loadTexture(config.back) : null;
      console.log(`Back-Texture für Karte ${index} geladen:`, backTexture);

      // Erstelle ein creamMaterial für Seiten ohne Bild
      const creamMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFDD0 });

      // BoxGeometry je nach Kartentyp anpassen
      let geometry;
      if (cardType === "info") {
        geometry = new THREE.BoxGeometry(4, 4.75, 0.025); // Größere Infokarten
      } else {
        geometry = new THREE.BoxGeometry(2, 3, 0.025); // Standardgröße für andere Karten
      }

      // Erstelle die Materialien unter Berücksichtigung der Rückseite
      const materials = [
        creamMaterial, // Rechte Seite
        creamMaterial, // Linke Seite
        creamMaterial, // Obere Seite
        creamMaterial, // Untere Seite
        new THREE.MeshBasicMaterial({ map: frontTexture }), // Vordere Seite
        backTexture ? new THREE.MeshBasicMaterial({ map: backTexture }) : creamMaterial // Hintere Seite (fallback auf creamMaterial)
      ];

      const cardMesh = new THREE.Mesh(geometry, materials);

      // Position abhängig vom Kartentyp
      if (cardType === "resource") {
        cardMesh.position.set(-4.75 + index * 2.4, -18, 4.5);
      } else if (cardType === "info") {
        cardMesh.position.set(-4.75 + index * 5, -18, 12.5);
      } else if (cardType === "development") {
        cardMesh.position.set(-4.75 + index * 2.4, -18, 8.5);
      }

      cardMesh.rotation.x = Math.PI / 2; // Karten aufstellen

      console.log(`Karte ${index} erstellt:`, cardMesh);
      return cardMesh;
    });

    const loadedCards = await Promise.all(loadPromises);
    loadedCards.forEach(card => scene.add(card));
    this.cards.push(...loadedCards);

    console.log(`${loadedCards.length} ${cardType}-Karte(n) zur Szene hinzugefügt.`);
  }

  // Lädt alle Karten aus den verschiedenen Konfigurationen
  async loadAllCards() {
    console.log("Lade alle Karten aus den Default-Konfigurationen...");
    await this.loadAndPlaceCards(resourceCards, "resource");
    await this.loadAndPlaceCards(infoCards, "info");
    await this.loadAndPlaceCards(developmentCards, "development");
  }

  getCards() {
    return this.cards;
  }
}

export default CardManager;
