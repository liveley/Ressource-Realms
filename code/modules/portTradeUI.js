// modules/portTradeUI.js
// Port-Handels-UI für Catan 3D - separates Pop-up-Fenster für Hafen-Handel

import { resources } from './uiResources.js';
import { doPortTrade, getAvailablePortTrades, getBestTradeRates, formatTradeRatesDisplay } from './portTrade.js';

let portTradeUI = null;
let isPortTradeUIVisible = false;

/**
 * Erstellt das Port-Trade-Pop-up-UI
 * @returns {HTMLElement} Port trade UI element
 */
export function createPortTradeUI() {
  if (portTradeUI) return portTradeUI;
  
  // Haupt-Container (Modal-Style)
  const modal = document.createElement('div');
  modal.id = 'port-trade-modal';
  modal.style.cssText = `
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.7);
    display: none;
    justify-content: center;
    align-items: center;
    z-index: 10000;
    font-family: 'Montserrat', Arial, sans-serif;
  `;
  
  // Popup-Fenster
  const popup = document.createElement('div');
  popup.style.cssText = `
    background: linear-gradient(135deg, #2c3e50, #34495e);
    border: 2px solid #3498db;
    border-radius: 15px;
    padding: 25px;
    max-width: 500px;
    width: 90%;
    color: white;
    box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
    position: relative;
  `;
  
  // Header
  const header = document.createElement('div');
  header.innerHTML = `
    <h2 style="margin: 0 0 20px 0; color: #3498db; text-align: center; font-size: 1.5em;">
      🏗️ Hafen-Handel
    </h2>
  `;
  
  // Close-Button
  const closeBtn = document.createElement('button');
  closeBtn.innerHTML = '✕';
  closeBtn.style.cssText = `
    position: absolute;
    top: 10px;
    right: 15px;
    background: none;
    border: none;
    color: #bdc3c7;
    font-size: 20px;
    cursor: pointer;
    padding: 5px;
    border-radius: 50%;
    width: 30px;
    height: 30px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  closeBtn.onmouseover = () => closeBtn.style.background = 'rgba(255, 255, 255, 0.1)';
  closeBtn.onmouseout = () => closeBtn.style.background = 'none';
  closeBtn.onclick = () => hidePortTradeUI();
  
  // Handelsraten-Anzeige
  const ratesDisplay = document.createElement('div');
  ratesDisplay.id = 'port-rates-display';
  ratesDisplay.style.cssText = `
    background: rgba(52, 73, 94, 0.8);
    border-radius: 8px;
    padding: 15px;
    margin-bottom: 20px;
    border-left: 4px solid #27ae60;
  `;
  
  // Handel-Sektion
  const tradeSection = document.createElement('div');
  tradeSection.style.cssText = `
    display: flex;
    flex-direction: column;
    gap: 15px;
  `;
  
  // Abgeben-Sektion
  const giveSection = document.createElement('div');
  giveSection.innerHTML = `
    <label style="display: block; margin-bottom: 8px; color: #e74c3c; font-weight: bold;">
      ⬆️ Abgeben:
    </label>
  `;
  
  const giveSelect = document.createElement('select');
  giveSelect.id = 'port-trade-give';
  giveSelect.style.cssText = `
    width: 100%;
    padding: 10px;
    border: 2px solid #34495e;
    border-radius: 8px;
    background: #2c3e50;
    color: white;
    font-size: 14px;
    cursor: pointer;
  `;
  
  // Erhalten-Sektion
  const getSection = document.createElement('div');
  getSection.innerHTML = `
    <label style="display: block; margin-bottom: 8px; color: #27ae60; font-weight: bold;">
      ⬇️ Erhalten:
    </label>
  `;
  
  const getSelect = document.createElement('select');
  getSelect.id = 'port-trade-get';
  getSelect.style.cssText = giveSelect.style.cssText;
  
  // Tausch-Vorschau
  const previewSection = document.createElement('div');
  previewSection.id = 'port-trade-preview';
  previewSection.style.cssText = `
    background: rgba(52, 152, 219, 0.2);
    border: 2px solid #3498db;
    border-radius: 8px;
    padding: 15px;
    text-align: center;
    margin: 15px 0;
    min-height: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
  `;
  
  // Handel-Button
  const tradeBtn = document.createElement('button');
  tradeBtn.id = 'port-trade-execute';
  tradeBtn.innerHTML = '🚢 Handel ausführen';
  tradeBtn.style.cssText = `
    width: 100%;
    padding: 15px;
    background: linear-gradient(135deg, #27ae60, #2ecc71);
    border: none;
    border-radius: 8px;
    color: white;
    font-size: 16px;
    font-weight: bold;
    cursor: pointer;
    transition: all 0.3s ease;
    margin-top: 10px;
  `;
  tradeBtn.onmouseover = () => {
    tradeBtn.style.background = 'linear-gradient(135deg, #229954, #27ae60)';
    tradeBtn.style.transform = 'translateY(-2px)';
  };
  tradeBtn.onmouseout = () => {
    tradeBtn.style.background = 'linear-gradient(135deg, #27ae60, #2ecc71)';
    tradeBtn.style.transform = 'translateY(0)';
  };
  
  // Event-Handler für Dropdown-Änderungen
  function updateTradePreview() {
    const giveKey = giveSelect.value;
    const getKey = getSelect.value;
    
    if (!giveKey || !getKey || giveKey === getKey) {
      previewSection.innerHTML = '<span style="color: #bdc3c7;">Wähle Ressourcen für den Handel</span>';
      tradeBtn.disabled = true;
      tradeBtn.style.opacity = '0.5';
      return;
    }
    
    const player = getCurrentPlayer();
    if (!player) return;
    
    const availableTrades = getAvailablePortTrades(player);
    const validTrade = availableTrades.find(t => t.give === giveKey && t.get === getKey);
    
    if (validTrade) {
      const giveResource = resources.find(r => r.key === giveKey);
      const getResource = resources.find(r => r.key === getKey);
      
      previewSection.innerHTML = `
        <div style="display: flex; align-items: center; justify-content: center; gap: 15px;">
          <span style="color: #e74c3c; font-weight: bold;">${validTrade.costAmount}x ${giveResource.symbol}</span>
          <span style="color: #3498db; font-size: 18px;">→</span>
          <span style="color: #27ae60; font-weight: bold;">1x ${getResource.symbol}</span>
          <span style="color: #f39c12; font-weight: bold;">(${validTrade.rate})</span>
        </div>
      `;
      tradeBtn.disabled = false;
      tradeBtn.style.opacity = '1';
    } else {
      previewSection.innerHTML = '<span style="color: #e74c3c;">❌ Handel nicht möglich</span>';
      tradeBtn.disabled = true;
      tradeBtn.style.opacity = '0.5';
    }
  }
  
  giveSelect.onchange = updateTradePreview;
  getSelect.onchange = updateTradePreview;
  
  // Handel ausführen
  tradeBtn.onclick = () => {
    const giveKey = giveSelect.value;
    const getKey = getSelect.value;
    const player = getCurrentPlayer();
    
    if (!player || !giveKey || !getKey) return;
    
    const result = doPortTrade(player, giveKey, getKey);
    
    if (result.success) {
      const giveResource = resources.find(r => r.key === giveKey);
      const getResource = resources.find(r => r.key === getKey);
      
      showGlobalFeedback(
        `🚢 Hafen-Handel: ${result.costAmount}x ${giveResource.symbol} → 1x ${getResource.symbol}`,
        '#27ae60',
        2500
      );
      
      // UI aktualisieren
      if (window.updateResourceUI) {
        const playerIndex = window.activePlayerIdx || 0;
        window.updateResourceUI(player, playerIndex);
      }
      
      // Port-UI aktualisieren
      updatePortTradeUI();
      
    } else {
      showGlobalFeedback(result.reason || 'Handel nicht möglich', '#e74c3c', 3000);
    }
  };
  
  // Elemente zusammenfügen
  giveSection.appendChild(giveSelect);
  getSection.appendChild(getSelect);
  tradeSection.appendChild(giveSection);
  tradeSection.appendChild(getSection);
  
  popup.appendChild(header);
  popup.appendChild(closeBtn);
  popup.appendChild(ratesDisplay);
  popup.appendChild(tradeSection);
  popup.appendChild(previewSection);
  popup.appendChild(tradeBtn);
  
  modal.appendChild(popup);
  document.body.appendChild(modal);
  
  // Modal schließen bei Klick außerhalb
  modal.onclick = (e) => {
    if (e.target === modal) hidePortTradeUI();
  };
  
  portTradeUI = modal;
  return modal;
}

/**
 * Zeigt das Port-Trade-UI an
 */
export function showPortTradeUI() {
  if (!portTradeUI) createPortTradeUI();
  
  updatePortTradeUI();
  portTradeUI.style.display = 'flex';
  isPortTradeUIVisible = true;
}

/**
 * Versteckt das Port-Trade-UI
 */
export function hidePortTradeUI() {
  if (portTradeUI) {
    portTradeUI.style.display = 'none';
    isPortTradeUIVisible = false;
  }
}

/**
 * Toggle Port-Trade-UI Sichtbarkeit
 */
export function togglePortTradeUI() {
  if (isPortTradeUIVisible) {
    hidePortTradeUI();
  } else {
    showPortTradeUI();
  }
}

/**
 * Aktualisiert das Port-Trade-UI mit aktuellen Spielerdaten
 */
export function updatePortTradeUI() {
  if (!portTradeUI) return;
  
  const player = getCurrentPlayer();
  if (!player) return;
  
  const giveSelect = document.getElementById('port-trade-give');
  const getSelect = document.getElementById('port-trade-get');
  const ratesDisplay = document.getElementById('port-rates-display');
  
  // Handelsraten anzeigen
  ratesDisplay.innerHTML = `
    <h4 style="margin: 0 0 10px 0; color: #27ae60;">🏗️ Verfügbare Handelsraten:</h4>
    <p style="margin: 0; color: #ecf0f1;">${formatTradeRatesDisplay(player)}</p>
  `;
  
  // Dropdowns aktualisieren
  const bestRates = getBestTradeRates(player);
  
  // Give-Dropdown
  giveSelect.innerHTML = '';
  for (const resource of resources) {
    const option = document.createElement('option');
    option.value = resource.key;
    const playerAmount = player.resources[resource.key] || 0;
    const requiredAmount = bestRates[resource.key].amount;
    const canAfford = playerAmount >= requiredAmount;
    
    option.textContent = `${resource.symbol} ${resource.name} (${playerAmount}/${requiredAmount}) - ${bestRates[resource.key].rate}`;
    option.disabled = !canAfford;
    option.style.color = canAfford ? 'white' : '#95a5a6';
    
    giveSelect.appendChild(option);
  }
  
  // Get-Dropdown  
  getSelect.innerHTML = '';
  for (const resource of resources) {
    const option = document.createElement('option');
    option.value = resource.key;
    const bankAmount = window.bank[resource.key] || 0;
    const available = bankAmount > 0;
    
    option.textContent = `${resource.symbol} ${resource.name} (Bank: ${bankAmount})`;
    option.disabled = !available;
    option.style.color = available ? 'white' : '#95a5a6';
    
    getSelect.appendChild(option);
  }
  
  // Vorschau aktualisieren
  const updateEvent = new Event('change');
  giveSelect.dispatchEvent(updateEvent);
}

/**
 * Hilfsfunktion: Aktuellen Spieler abrufen
 * @returns {Object|null} Current player object
 */
function getCurrentPlayer() {
  const playerIndex = window.activePlayerIdx || 0;
  return (window.players && window.players[playerIndex]) || null;
}

/**
 * Hilfsfunktion: Globales Feedback anzeigen
 * @param {string} msg - Message to display
 * @param {string} color - Text color
 * @param {number} duration - Display duration in ms
 */
function showGlobalFeedback(msg, color = '#e74c3c', duration = 2500) {
  let el = document.getElementById('global-feedback');
  if (!el) {
    el = document.createElement('div');
    el.id = 'global-feedback';
    el.style.cssText = `
      position: fixed;
      left: 50%;
      bottom: 100px;
      transform: translateX(-50%);
      background: rgba(0, 0, 0, 0.9);
      color: white;
      font-weight: bold;
      font-size: 16px;
      padding: 15px 25px;
      border-radius: 10px;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
      z-index: 99999;
      text-align: center;
      font-family: 'Montserrat', Arial, sans-serif;
      border: 2px solid currentColor;
    `;
    document.body.appendChild(el);
  }
  
  el.textContent = msg;
  el.style.color = color;
  el.style.borderColor = color;
  el.style.display = 'block';
  
  clearTimeout(el._hideTimeout);
  el._hideTimeout = setTimeout(() => {
    el.style.display = 'none';
  }, duration);
}

/**
 * Prüft ob das Port-Trade-UI sichtbar ist
 * @returns {boolean}
 */
export function isPortTradeUIOpen() {
  return isPortTradeUIVisible;
}

// Export für externe Nutzung
export { portTradeUI };
