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
  tradeBtn.style.background = '#ffe066';
  tradeBtn.style.cursor = 'pointer';

  // Feedback
  const feedback = document.createElement('span');
  feedback.id = 'bank-trade-feedback';
  feedback.style.marginLeft = '1em';
  feedback.style.fontSize = '0.98em';

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
