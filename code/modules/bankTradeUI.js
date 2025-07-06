// modules/bankTradeUI.js
// UI-Komponente für 4:1 Banktausch
import { resources } from './uiResources.js';
import { doBankTrade } from './bankTrade.js';

export function createBankTradeUI() {
  const tradeUI = document.createElement('div');
  tradeUI.id = 'bank-trade-ui';

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
  tradeBtn.textContent = 'Mit Bank tauschen';

  // Feedback
  const feedback = document.createElement('span');
  feedback.id = 'bank-trade-feedback';

  // Helper: Show feedback in global overlay (bottom center)
  function showGlobalFeedback(msg, color = '#c00', duration = 2500) {
    let el = document.getElementById('global-feedback');
    if (!el) {
      el = document.createElement('div');
      el.id = 'global-feedback';
      el.style.position = 'fixed';
      el.style.left = '50%';
      el.style.bottom = '2.5em';
      el.style.transform = 'translateX(-50%)';
      el.style.background = 'rgba(255,255,255,0.85)';
      el.style.color = color;
      el.style.fontWeight = 'bold';
      el.style.fontSize = '1.25em';
      el.style.padding = '0.7em 2.2em';
      el.style.borderRadius = '0.7em';
      el.style.boxShadow = '0 4px 24px #0002';
      el.style.zIndex = '99999';
      el.style.textAlign = 'center';
      el.style.fontFamily = "Montserrat, Arial, sans-serif";
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = color;
    el.style.display = 'block';
    clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  // Button-Handler - Original Version
  tradeBtn.onclick = () => {
    const giveKey = giveSelect.value;
    const getKey = getSelect.value;
    const idx = (typeof window.activePlayerIdx === 'number' && window.players && window.players.length > window.activePlayerIdx)
      ? window.activePlayerIdx : 0;
    const player = window.players ? window.players[idx] : null;
    
    if (!player) {
      showGlobalFeedback('Kein aktiver Spieler', '#c00', 3200);
      return;
    }

    const result = doBankTrade(player, giveKey, getKey);
    if (result.success) {
      const giveResource = resources.find(r => r.key === giveKey);
      const getResource = resources.find(r => r.key === getKey);
      showGlobalFeedback(
        `Tausch erfolgreich: 4x ${giveResource.symbol} → 1x ${getResource.symbol}`, 
        '#2a8c2a', 
        2200
      );
      if (window.updateResourceUI) {
        window.updateResourceUI(player, idx);
      }
    } else {
      showGlobalFeedback(result.reason || 'Tausch nicht möglich', '#c00', 3200);
    }
  };
  
  tradeUI.appendChild(giveSelect);
  tradeUI.appendChild(getSelect);
  tradeUI.appendChild(tradeBtn);
  tradeUI.appendChild(feedback);

  return tradeUI;
}