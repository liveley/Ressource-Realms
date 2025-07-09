// modules/portTrade.js
// Port-Handels-Logik für Catan 3D - adaptiert von bankTrade.js
// Ermöglicht 2:1 und 3:1 Handel über Häfen

import { resources } from './uiResources.js';
import { getPlayerTradeRates } from './portSystem.js';

/**
 * Prüft, ob der Spieler einen Port-Tausch machen kann
 * @param {Object} player - Das Spielerobjekt
 * @param {string} giveKey - Rohstoff, der abgegeben werden soll (z.B. 'wood')
 * @param {string} getKey - Rohstoff, der genommen werden soll (z.B. 'wheat')
 * @returns {Object} { success: boolean, reason?: string, rate?: string, costAmount?: number }
 */
export function canPortTrade(player, giveKey, getKey) {
  // Grundlegende Validierung
  if (!player || !window.bank) {
    return { success: false, reason: 'Kein Spieler oder Bank nicht initialisiert' };
  }
  
  if (!resources.some(r => r.key === giveKey) || !resources.some(r => r.key === getKey)) {
    return { success: false, reason: 'Ungültiger Rohstoff' };
  }
  
  if (giveKey === getKey) {
    return { success: false, reason: 'Tausch identischer Rohstoffe nicht erlaubt' };
  }
  
  // Handelsraten für diesen Spieler ermitteln
  const tradeRates = getPlayerTradeRates(player);
  
  // Beste verfügbare Rate für die gewünschte Ressource finden
  let requiredAmount = tradeRates[giveKey] || 4; // Standard 4:1 falls kein Port
  
  // Falls generic rate besser ist, verwende diese
  if (tradeRates.generic < requiredAmount) {
    requiredAmount = tradeRates.generic;
  }
  
  // Prüfe ob Spieler genug Ressourcen hat
  if ((player.resources[giveKey] || 0) < requiredAmount) {
    return { 
      success: false, 
      reason: `Nicht genug ${giveKey}. Benötigt: ${requiredAmount}, verfügbar: ${player.resources[giveKey] || 0}`,
      rate: `${requiredAmount}:1`,
      costAmount: requiredAmount
    };
  }
  
  // Prüfe ob Bank die gewünschte Ressource hat
  if ((window.bank[getKey] || 0) < 1) {
    return { 
      success: false, 
      reason: `Bank hat keinen ${getKey} mehr`,
      rate: `${requiredAmount}:1`,
      costAmount: requiredAmount
    };
  }
  
  return { 
    success: true, 
    rate: `${requiredAmount}:1`,
    costAmount: requiredAmount
  };
}

/**
 * Führt einen Port-Tausch aus (ohne UI)
 * @param {Object} player - Das Spielerobjekt
 * @param {string} giveKey - Rohstoff, der abgegeben wird
 * @param {string} getKey - Rohstoff, der genommen wird
 * @returns {Object} { success: boolean, reason?: string, rate?: string, costAmount?: number }
 */
export function doPortTrade(player, giveKey, getKey) {
  const check = canPortTrade(player, giveKey, getKey);
  if (!check.success) return check;
  
  const costAmount = check.costAmount;
  
  // Ausführen des Tauschs
  player.resources[giveKey] -= costAmount;
  window.bank[giveKey] += costAmount;
  player.resources[getKey] = (player.resources[getKey] || 0) + 1;
  window.bank[getKey] -= 1;
  
  console.log(`Port trade executed: ${costAmount}x ${giveKey} → 1x ${getKey} (${check.rate})`);
  
  return { 
    success: true, 
    rate: check.rate,
    costAmount: costAmount
  };
}

/**
 * Ermittelt alle verfügbaren Port-Tausch-Optionen für einen Spieler
 * @param {Object} player - Das Spielerobjekt
 * @returns {Array<Object>} Array of available trades { give: string, get: string, rate: string, costAmount: number }
 */
export function getAvailablePortTrades(player) {
  if (!player) return [];
  
  const trades = [];
  const tradeRates = getPlayerTradeRates(player);
  
  // Für jeden Rohstoff, den der Spieler abgeben könnte
  for (const giveResource of resources) {
    const giveKey = giveResource.key;
    
    // Beste Rate für diese Ressource ermitteln
    let requiredAmount = tradeRates[giveKey] || 4;
    if (tradeRates.generic < requiredAmount) {
      requiredAmount = tradeRates.generic;
    }
    
    // Prüfe ob Spieler genug von dieser Ressource hat
    if ((player.resources[giveKey] || 0) < requiredAmount) continue;
    
    // Für jeden Rohstoff, den der Spieler bekommen könnte
    for (const getResource of resources) {
      const getKey = getResource.key;
      
      // Nicht mit sich selbst tauschen
      if (giveKey === getKey) continue;
      
      // Prüfe ob Bank diese Ressource hat
      if ((window.bank[getKey] || 0) < 1) continue;
      
      trades.push({
        give: giveKey,
        get: getKey,
        rate: `${requiredAmount}:1`,
        costAmount: requiredAmount
      });
    }
  }
  
  return trades;
}

/**
 * Prüft ob ein Spieler überhaupt Zugang zu Häfen hat
 * @param {Object} player - Das Spielerobjekt
 * @returns {boolean} True wenn Spieler mindestens einen Hafen nutzen kann
 */
export function playerHasPortAccess(player) {
  const rates = getPlayerTradeRates(player);
  
  // Wenn mindestens eine Rate besser als 4:1 ist, hat der Spieler Port-Zugang
  return Object.values(rates).some(rate => rate < 4);
}

/**
 * Ermittelt die besten Handelsraten für jeden Rohstoff für einen Spieler
 * @param {Object} player - Das Spielerobjekt
 * @returns {Object} Best trade rates { wood: { rate: '2:1', amount: 2 }, ... }
 */
export function getBestTradeRates(player) {
  const rates = getPlayerTradeRates(player);
  const bestRates = {};
  
  for (const resource of resources) {
    const key = resource.key;
    let bestRate = rates[key] || 4;
    
    // Prüfe ob generic rate besser ist
    if (rates.generic < bestRate) {
      bestRate = rates.generic;
    }
    
    bestRates[key] = {
      rate: `${bestRate}:1`,
      amount: bestRate
    };
  }
  
  return bestRates;
}

/**
 * Formatiert Handelsraten für die Anzeige
 * @param {Object} player - Das Spielerobjekt
 * @returns {string} Formatted string describing player's trade rates
 */
export function formatTradeRatesDisplay(player) {
  const rates = getPlayerTradeRates(player);
  const parts = [];
  
  // Generic rate
  if (rates.generic < 4) {
    parts.push(`Allgemein: ${rates.generic}:1`);
  }
  
  // Resource-specific rates
  for (const resource of resources) {
    const key = resource.key;
    if (rates[key] < 4 && rates[key] < rates.generic) {
      parts.push(`${resource.symbol}: ${rates[key]}:1`);
    }
  }
  
  if (parts.length === 0) {
    return 'Keine Häfen verfügbar (Standard 4:1)';
  }
  
  return parts.join(', ');
}

// Hilfsfunktion: Prüfe ob ein spezifischer Handel möglich ist (für UI-Validierung)
export function validateSpecificTrade(player, giveKey, getKey, expectedCost) {
  const check = canPortTrade(player, giveKey, getKey);
  return check.success && check.costAmount === expectedCost;
}
