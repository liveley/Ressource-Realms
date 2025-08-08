// modules/developmentCards.js
// Entwicklungskarten-Deck und Spieler-Logik für Resource Realms 3D

import { addVictoryPointCard, checkWinCondition } from './victoryPoints.js';

const CARD_TYPES = [
  { type: 'knight', count: 5 },
  { type: 'road_building', count: 2 },
  { type: 'monopoly', count: 2 },
  { type: 'year_of_plenty', count: 2 },
  { type: 'victory_point', count: 3 }
];

// Erzeugt ein gemischtes Deck aller Entwicklungskarten
export function createDevelopmentDeck() {
  let deck = [];
  CARD_TYPES.forEach(card => {
    for (let i = 0; i < card.count; i++) {
      deck.push({ type: card.type });
    }
  });
  // Mischen (Fisher-Yates)
  for (let i = deck.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [deck[i], deck[j]] = [deck[j], deck[i]];
  }
  return deck;
}

// Initialisiert die Entwicklungskarten für alle Spieler
export function initPlayerDevCards(player) {
  player.developmentCards = [];
  player.newDevelopmentCards = [];
}

// Prüft, ob ein Spieler eine Entwicklungskarte kaufen kann (Kosten und Karten im Deck)
export function canBuyDevelopmentCard(player, bank, deck) {
  if (!player || !bank || !deck) return { success: false, reason: 'Fehlende Daten' };
  if (deck.length === 0) return { success: false, reason: 'Keine Entwicklungskarten mehr' };
  if ((player.resources.wheat || 0) < 1 || (player.resources.sheep || 0) < 1 || (player.resources.ore || 0) < 1) {
    return { success: false, reason: 'Nicht genug Ressourcen' };
  }
  if ((bank.wheat || 0) < 1 || (bank.sheep || 0) < 1 || (bank.ore || 0) < 1) {
    return { success: false, reason: 'Bank hat nicht genug Ressourcen' };
  }
  return { success: true };
}

// Führt den Kauf einer Entwicklungskarte aus
export function buyDevelopmentCard(player, bank, deck) {
  const check = canBuyDevelopmentCard(player, bank, deck);
  if (!check.success) return check;
  
  // Check development card hand limit (maximum 5 cards in Resource Realms)
  const totalDevCards = (player.developmentCards || []).length + (player.newDevelopmentCards || []).length;
  if (totalDevCards >= 5) {
    return { success: false, reason: 'Maximale Anzahl an Entwicklungskarten erreicht (5)' };
  }
  
  // Ressourcen abziehen
  player.resources.wheat--;
  player.resources.sheep--;
  player.resources.ore--;
  bank.wheat++;
  bank.sheep++;
  bank.ore++;
  
  // Karte ziehen
  const card = deck.pop();
  player.newDevelopmentCards.push(card);
  
  // If it's a victory point card, add VP immediately
  if (card.type === 'victory_point') {
    addVictoryPointCard(player);
  }
  
  return { success: true, card };
}
