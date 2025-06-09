// cards.js
import * as THREE from 'three';
import { scene } from './scene.js';
import CardLoader from './loader_jpeg.js';

// Beispielhafte Default-Konfiguration für Karten (nur front und back)
const defaultCardConfigs = [
  {
    front: "/assets/item_card_wood.jpg", // Vorderseite
    back: "/assets/item_card_wood.jpg"   // Rückseite
  }
  // Weitere Kartenkonfigurationen lassen sich hier ergänzen...
];

class CardManager {
  constructor() {
    this.cardLoader = new CardLoader();
    this.cards = [];
  }

  // Lädt Karten und fügt sie zur Szene hinzu anhand der Konfigurationen
  async loadAndPlaceCards(configs) {
    const loadPromises = configs.map(async (config, index) => {
      console.log(`Lade Karte ${index}: Konfiguration`, config);
      
      // Lade nur Front- und Back-Textur
      const frontTexture = await this.cardLoader.loadTexture(config.front);
      console.log(`Front-Texture für Karte ${index} geladen:`, frontTexture);
      
      const backTexture = await this.cardLoader.loadTexture(config.back);
      console.log(`Back-Texture für Karte ${index} geladen:`, backTexture);
      
      // Erstelle ein creamMaterial für Seiten ohne Bild
      const creamMaterial = new THREE.MeshBasicMaterial({ color: 0xFFFDD0 });
  
      // BoxGeometry Reihung: [Rechts, Links, Oben, Unten, Vorne, Hinten]
      // Nur die vordere und hintere Seite erhalten Bilder.
      const materials = [
        creamMaterial,                                        // Rechte Seite
        creamMaterial,                                        // Linke Seite
        creamMaterial,                                        // Obere Seite
        creamMaterial,                                        // Untere Seite
        new THREE.MeshBasicMaterial({ map: frontTexture }),   // Vordere Seite
        new THREE.MeshBasicMaterial({ map: backTexture })     // Hintere Seite
      ];
  
      // Erstelle die flache Box-Geometrie der Kartenform
      const geometry = new THREE.BoxGeometry(1, 1.25, 0.025);
  
      // Erstelle das Mesh und setze Position und Rotation
      const cardMesh = new THREE.Mesh(geometry, materials);
      cardMesh.position.set(4.5, 0, 3);
      cardMesh.rotation.z = Math.PI / 2;
      
      console.log(`Karte ${index} erstellt:`, cardMesh);
      return cardMesh;
    });
  
    this.cards = await Promise.all(loadPromises);
    this.cards.forEach(card => scene.add(card));
  
    console.log(`${this.cards.length} Karte(n) zur Szene hinzugefügt.`);
  }

  // Lädt alle Karten aus der Default-Konfiguration
  async loadAllCards() {
    console.log("Lade alle Karten aus der Default-Konfiguration...");
    await this.loadAndPlaceCards(defaultCardConfigs);
  }

  getCards() {
    return this.cards;
  }
}

export default CardManager;
