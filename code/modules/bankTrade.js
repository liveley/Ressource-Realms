// modules/bankTrade.js
// Standard 4:1 Banktausch für Resource Realms
// Exportierte Funktion für UI und Logik

import { resources } from './uiResources.js';

/**
 * Prüft, ob der Spieler einen 4:1-Tausch mit der Bank machen kann
 * @param {object} player - Das Spielerobjekt
 * @param {string} giveKey - Rohstoff, der abgegeben werden soll (z.B. 'wood')
 * @param {string} getKey - Rohstoff, der genommen werden soll (z.B. 'wheat')
 * @returns {object} { success: boolean, reason?: string }
 */
export function canBankTrade(player, giveKey, getKey) {
  if (!player || !window.bank) return { success: false, reason: 'Kein Spieler oder Bank nicht initialisiert' };
  if (!resources.some(r => r.key === giveKey) || !resources.some(r => r.key === getKey)) {
    return { success: false, reason: 'Ungültiger Rohstoff' };
  }
  if (giveKey === getKey) return { success: false, reason: 'Tausch identischer Rohstoffe nicht erlaubt' };
  if ((player.resources[giveKey] || 0) < 4) return { success: false, reason: 'Nicht genug Rohstoffe zum Tauschen' };
  if ((window.bank[getKey] || 0) < 1) return { success: false, reason: 'Bank hat diesen Rohstoff nicht mehr' };
  return { success: true };
}

/**
 * Führt einen 4:1-Banktausch aus (ohne UI)
 * @param {object} player - Das Spielerobjekt
 * @param {string} giveKey - Rohstoff, der abgegeben wird
 * @param {string} getKey - Rohstoff, der genommen wird
 * @returns {object} { success: boolean, reason?: string }
 */
export function doBankTrade(player, giveKey, getKey) {
  const check = canBankTrade(player, giveKey, getKey);
  if (!check.success) return check;
  player.resources[giveKey] -= 4;
  window.bank[giveKey] += 4;
  player.resources[getKey] = (player.resources[getKey] || 0) + 1;
  window.bank[getKey] -= 1;
  return { success: true };
}

// Optional: Hilfsfunktion für alle möglichen Tauschoptionen für einen Spieler
export function getAvailableBankTrades(player) {
  if (!player) return [];
  return resources.flatMap(give => {
    if ((player.resources[give.key] || 0) < 4) return [];
    return resources.filter(get => get.key !== give.key && (window.bank[get.key] || 0) > 0)
      .map(get => ({ give: give.key, get: get.key }));
  });
}
