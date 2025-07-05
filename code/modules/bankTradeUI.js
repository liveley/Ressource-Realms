// modules/bankTradeUI.js
// UI-Komponente für 4:1 Banktausch
import { resources } from './uiResources.js';
import { doBankTrade } from './bankTrade.js';

export function createBankTradeUI() {
  const tradeUI = document.createElement('div');
  tradeUI.id = 'bank-trade-ui';
  tradeUI.style.marginTop = '0.7em';
  tradeUI.style.background = 'rgba(255,255,255,0.96)';
  tradeUI.style.borderRadius = '0.5em';
  tradeUI.style.padding = '0.5em 1.2em 0.5em 0.8em';
  tradeUI.style.boxShadow = '0 2px 8px #0001';
  tradeUI.style.display = 'flex';
  tradeUI.style.alignItems = 'center';
  tradeUI.style.gap = '0.7em';
  tradeUI.style.fontSize = '1em';

  // Dropdowns für Auswahl
  const giveSelect = document.createElement('select');
  giveSelect.id = 'bank-trade-give';
  resources.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.key;
    opt.textContent = `4x ${r.symbol} (${r.name})`;
    giveSelect.appendChild(opt);
  });
  const getSelect = document.createElement('select');
  getSelect.id = 'bank-trade-get';
  resources.forEach(r => {
    const opt = document.createElement('option');
    opt.value = r.key;
    opt.textContent = `1x ${r.symbol} (${r.name})`;
    getSelect.appendChild(opt);
  });

  // Button
  const tradeBtn = document.createElement('button');
  tradeBtn.textContent = 'Mit Bank tauschen (4:1)';
  tradeBtn.style.fontWeight = 'bold';
  tradeBtn.style.padding = '0.2em 1.2em';
  tradeBtn.style.borderRadius = '0.4em';
  tradeBtn.style.border = 'none';
  tradeBtn.style.background = 'linear-gradient(90deg, #ffe066 80%, #fffbe6 100%)';
  tradeBtn.style.color = '#222';
  tradeBtn.style.cursor = 'pointer';
  tradeBtn.style.boxShadow = '0 2px 8px #ffe06644';

  // Feedback
  const feedback = document.createElement('span');
  feedback.id = 'bank-trade-feedback';
  feedback.style.marginLeft = '1em';
  feedback.style.fontSize = '0.98em';

  // Style Dropdowns
  const selectStyle = `
    background: #fffbe6;
    border: 1.5px solid #ffe066;
    border-radius: 0.4em;
    font-family: 'Montserrat', Arial, sans-serif;
    font-size: 1em;
    color: #222;
    padding: 0.18em 0.7em 0.18em 0.5em;
    margin: 0 0.1em;
    box-shadow: 0 1px 4px #ffe06633;
    outline: none;
    transition: border-color 0.2s;
  `;
  giveSelect.style.cssText = selectStyle;
  getSelect.style.cssText = selectStyle;
  giveSelect.onfocus = getSelect.onfocus = function() {
    this.style.borderColor = '#ffd700';
  };
  giveSelect.onblur = getSelect.onblur = function() {
    this.style.borderColor = '#ffe066';
  };

  // Button-Handler
  tradeBtn.onclick = () => {
    const giveKey = giveSelect.value;
    const getKey = getSelect.value;
    const idx = (typeof window.activePlayerIdx === 'number' && window.players && window.players.length > window.activePlayerIdx)
      ? window.activePlayerIdx : 0;
    const player = window.players ? window.players[idx] : null;
    if (!player) return;
    const result = doBankTrade(player, giveKey, getKey);
    if (result.success) {
      feedback.textContent = `Tausch erfolgreich: 4x ${giveKey} → 1x ${getKey}`;
      feedback.style.color = '#2a8c2a';
      if (window.updateResourceUI) window.updateResourceUI(player, idx);
    } else {
      feedback.textContent = result.reason || 'Tausch nicht möglich';
      feedback.style.color = '#c00';
    }
  };

  tradeUI.appendChild(giveSelect);
  tradeUI.appendChild(getSelect);
  tradeUI.appendChild(tradeBtn);
  tradeUI.appendChild(feedback);

  return tradeUI;
}
