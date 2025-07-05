// modules/developmentCardsUI.js
// UI-Komponente für Entwicklungskarten-Kauf und Anzeige
import { buyDevelopmentCard, canBuyDevelopmentCard } from './developmentCards.js';

export function createDevelopmentCardsUI({ getPlayer, getBank, getDeck, onBuy } = {}) {
  const devUI = document.createElement('div');
  devUI.id = 'development-cards-ui';
  devUI.style.marginTop = '0.7em';
  devUI.style.background = 'rgba(255,255,255,0.96)';
  devUI.style.borderRadius = '0.5em';
  devUI.style.padding = '0.5em 1.2em 0.5em 0.8em';
  devUI.style.boxShadow = '0 2px 8px #0001';
  devUI.style.display = 'flex';
  devUI.style.alignItems = 'center';
  devUI.style.gap = '0.7em';
  devUI.style.fontSize = '1em';

  // Kaufen-Button
  const buyBtn = document.createElement('button');
  buyBtn.textContent = 'Entwicklungskarte kaufen';
  buyBtn.style.fontWeight = 'bold';
  buyBtn.style.fontSize = '1em';
  buyBtn.style.height = '2.4em';
  buyBtn.style.lineHeight = '2.4em';
  buyBtn.style.padding = '0 1.2em';
  buyBtn.style.borderRadius = '0.4em';
  buyBtn.style.border = 'none';
  buyBtn.style.background = 'linear-gradient(90deg, #ffe066 80%, #fffbe6 100%)';
  buyBtn.style.color = '#222';
  buyBtn.style.cursor = 'pointer';
  buyBtn.style.boxShadow = '0 2px 8px #ffe06644';
  buyBtn.style.display = 'inline-flex';
  buyBtn.style.alignItems = 'center';
  buyBtn.onmouseenter = function() {
    this.style.background = 'linear-gradient(90deg, #ffd700 90%, #fffbe6 100%)';
    this.style.boxShadow = '0 4px 16px #ffe06677';
  };
  buyBtn.onmouseleave = function() {
    this.style.background = 'linear-gradient(90deg, #ffe066 80%, #fffbe6 100%)';
    this.style.boxShadow = '0 2px 8px #ffe06644';
  };

  // Übersicht-Button
  const overviewBtn = document.createElement('button');
  overviewBtn.textContent = 'Karten-Übersicht';
  overviewBtn.style.fontWeight = 'bold';
  overviewBtn.style.fontSize = '1em';
  overviewBtn.style.height = '2.4em';
  overviewBtn.style.lineHeight = '2.4em';
  overviewBtn.style.padding = '0 1.2em';
  overviewBtn.style.borderRadius = '0.4em';
  overviewBtn.style.border = 'none';
  overviewBtn.style.background = 'linear-gradient(90deg, #b5d6ff 80%, #e6f2ff 100%)';
  overviewBtn.style.color = '#222';
  overviewBtn.style.cursor = 'pointer';
  overviewBtn.style.boxShadow = '0 2px 8px #b5d6ff44';
  overviewBtn.style.display = 'inline-flex';
  overviewBtn.style.alignItems = 'center';
  overviewBtn.style.marginLeft = '0.3em';
  overviewBtn.onmouseenter = function() {
    this.style.background = 'linear-gradient(90deg, #7ec0fa 90%, #e6f2ff 100%)';
    this.style.boxShadow = '0 4px 16px #b5d6ff77';
  };
  overviewBtn.onmouseleave = function() {
    this.style.background = 'linear-gradient(90deg, #b5d6ff 80%, #e6f2ff 100%)';
    this.style.boxShadow = '0 2px 8px #b5d6ff44';
  };

  // Pop-Up für Kartenübersicht
  const popup = document.createElement('div');
  popup.id = 'devcard-popup';
  popup.style.position = 'fixed';
  popup.style.left = '50%';
  popup.style.top = '50%';
  popup.style.transform = 'translate(-50%, -50%)';
  popup.style.background = 'rgba(255,255,255,0.98)';
  popup.style.borderRadius = '0.7em';
  popup.style.boxShadow = '0 8px 32px #0004';
  popup.style.padding = '2em 2.5em 1.5em 2.5em';
  popup.style.zIndex = '100000';
  popup.style.display = 'none';
  popup.style.minWidth = '320px';
  popup.style.maxWidth = '90vw';
  popup.style.maxHeight = '80vh';
  popup.style.overflowY = 'auto';
  popup.style.fontFamily = 'Montserrat, Arial, sans-serif';

  // Schließen-Button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = 'Schließen';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '1em';
  closeBtn.style.right = '1.5em';
  closeBtn.style.background = '#ffe066';
  closeBtn.style.border = 'none';
  closeBtn.style.borderRadius = '0.4em';
  closeBtn.style.padding = '0.3em 1.2em';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.style.cursor = 'pointer';
  closeBtn.onclick = () => { popup.style.display = 'none'; };
  popup.appendChild(closeBtn);

  // Kartenliste im Pop-Up
  const popupList = document.createElement('div');
  popupList.id = 'devcard-popup-list';
  popupList.style.display = 'flex';
  popupList.style.flexWrap = 'wrap';
  popupList.style.gap = '1em';
  popupList.style.marginTop = '2.5em';
  popup.appendChild(popupList);
  document.body.appendChild(popup);

  // Hilfsfunktion: Bildpfad für Kartentyp
  function getCardImage(card) {
    switch(card.type) {
      case 'knight':
        return 'assets/development_ritter_card.jpg';
      case 'road_building':
        return 'assets/development_strassenbau_card.jpg';
      case 'monopoly':
        return 'assets/development_monopol_card.jpg';
      case 'year_of_plenty':
        return 'assets/development_erfindung_card.jpg';
      case 'victory_point':
        // Zufällig eine der Siegpunktkarten (Bibliothek, Kathedrale, Universität, Parlament, Marktplatz)
        const vpImgs = [
          'assets/development_bibliothek_card.jpg',
          'assets/development_kathedrale_card.jpg',
          'assets/development_universitaet_card.jpg',
          'assets/development_parlament_card.jpg',
          'assets/development_marktplatz_card.jpg'
        ];
        // Optional: Karte merken, damit sie nicht wechselt (hier: zufällig pro Anzeige)
        return vpImgs[Math.floor(Math.random() * vpImgs.length)];
      default:
        return 'assets/item_card_back.jpeg';
    }
  }

  overviewBtn.onclick = () => {
    // Render die Kartenübersicht
    const player = getPlayer();
    popupList.innerHTML = '';
    const hand = (player.developmentCards || []).concat((player.newDevelopmentCards || []));
    if (!hand.length) {
      popupList.textContent = 'Keine Entwicklungskarten.';
      popupList.style.color = '#888';
    } else {
      hand.forEach((card, idx) => {
        let label = '';
        let isNew = idx >= (player.developmentCards?.length || 0);
        switch(card.type) {
          case 'knight': label = 'Ritter'; break;
          case 'road_building': label = 'Straßenbau'; break;
          case 'monopoly': label = 'Monopol'; break;
          case 'year_of_plenty': label = 'Erfindung'; break;
          case 'victory_point': label = 'Siegpunkt (verdeckt)'; break;
          default: label = card.type;
        }
        const cardDiv = document.createElement('div');
        cardDiv.style.background = isNew ? 'linear-gradient(90deg,#eee 70%,#ffe066 100%)' : 'linear-gradient(90deg,#fff 70%,#cde7b0 100%)';
        cardDiv.style.border = '1.5px solid #bbb';
        cardDiv.style.borderRadius = '0.4em';
        cardDiv.style.padding = '0.7em 1.5em';
        cardDiv.style.display = 'flex';
        cardDiv.style.flexDirection = 'column';
        cardDiv.style.alignItems = 'center';
        cardDiv.style.gap = '0.5em';
        cardDiv.style.fontWeight = isNew ? 'normal' : 'bold';
        cardDiv.style.opacity = card.type === 'victory_point' ? 0.7 : 1;
        cardDiv.style.fontSize = '1.1em';
        cardDiv.title = isNew ? 'Diese Karte kann erst ab nächster Runde gespielt werden.' : '';
        // Bild
        const img = document.createElement('img');
        img.src = getCardImage(card);
        img.alt = label;
        img.style.width = '110px';
        img.style.height = 'auto';
        img.style.borderRadius = '0.3em';
        img.style.boxShadow = '0 2px 8px #0002';
        img.style.marginBottom = '0.3em';
        cardDiv.appendChild(img);
        // Label
        const labelDiv = document.createElement('div');
        labelDiv.textContent = label + (isNew && card.type !== 'victory_point' ? ' (neu)' : '');
        labelDiv.style.textAlign = 'center';
        labelDiv.style.fontSize = '1em';
        labelDiv.style.color = isNew ? '#c00' : '#222';
        cardDiv.appendChild(labelDiv);
        popupList.appendChild(cardDiv);
      });
    }
    popup.style.display = 'block';
  };

  // Feedback
  const feedback = document.createElement('span');
  feedback.id = 'devcard-buy-feedback';
  feedback.style.marginLeft = '1em';
  feedback.style.fontSize = '0.98em';

  // Kaufen-Handler
  buyBtn.onclick = () => {
    const player = getPlayer();
    const bank = getBank();
    const deck = getDeck();
    const result = buyDevelopmentCard(player, bank, deck);
    if (result.success) {
      showGlobalFeedback('Entwicklungskarte gekauft!', '#2a8c2a', 2200);
      if (onBuy) onBuy(result.card);
    } else {
      showGlobalFeedback(result.reason || 'Kauf nicht möglich', '#c00', 3200);
    }
  };

  devUI.appendChild(buyBtn);
  devUI.appendChild(overviewBtn);
  devUI.appendChild(feedback);

  // === Hand-Anzeige ===
  // (entfernt, da Übersicht jetzt im Pop-Up erfolgt)
  // const handContainer = document.createElement('div');
  // handContainer.id = 'devcard-hand-container';
  // handContainer.style.display = 'flex';
  // handContainer.style.gap = '0.5em';
  // handContainer.style.marginTop = '0.5em';
  // handContainer.style.alignItems = 'center';
  // handContainer.style.flexWrap = 'wrap';
  // devUI.appendChild(handContainer);

  // function renderHand() {
  //   const player = getPlayer();
  //   if (!player) return;
  //   // Combine playable and new cards, but mark new ones (not playable this turn)
  //   const hand = (player.developmentCards || []).concat((player.newDevelopmentCards || []));
  //   handContainer.innerHTML = '';
  //   if (!hand.length) {
  //     handContainer.textContent = 'Keine Entwicklungskarten.';
  //     handContainer.style.color = '#888';
  //     return;
  //   }
  //   hand.forEach((card, idx) => {
  //     // Hide victory points (show as verdeckt)
  //     let label = '';
  //     let icon = '';
  //     let isNew = idx >= (player.developmentCards?.length || 0);
  //     switch(card.type) {
  //       case 'knight': icon = '🛡️'; label = 'Ritter'; break;
  //       case 'road_building': icon = '🛤️'; label = 'Straßenbau'; break;
  //       case 'monopoly': icon = '🃏'; label = 'Monopol'; break;
  //       case 'year_of_plenty': icon = '🎁'; label = 'Erfindung'; break;
  //       case 'victory_point': icon = '❓'; label = 'Siegpunkt (verdeckt)'; break;
  //       default: icon = '❔'; label = card.type;
  //     }
  //     const cardDiv = document.createElement('div');
  //     cardDiv.style.background = isNew ? 'linear-gradient(90deg,#eee 70%,#ffe066 100%)' : 'linear-gradient(90deg,#fff 70%,#cde7b0 100%)';
  //     cardDiv.style.border = '1.5px solid #bbb';
  //     cardDiv.style.borderRadius = '0.4em';
  //     cardDiv.style.padding = '0.3em 0.8em';
  //     cardDiv.style.display = 'flex';
  //     cardDiv.style.alignItems = 'center';
  //     cardDiv.style.gap = '0.5em';
  //     cardDiv.style.fontWeight = isNew ? 'normal' : 'bold';
  //     cardDiv.style.opacity = card.type === 'victory_point' ? 0.7 : 1;
  //     cardDiv.title = isNew ? 'Diese Karte kann erst ab nächster Runde gespielt werden.' : '';
  //     cardDiv.innerHTML = `<span style="font-size:1.3em;">${icon}</span> <span>${label}</span>` + (isNew && card.type !== 'victory_point' ? ' <span style="font-size:0.9em;color:#c00;">(neu)</span>' : '');
  //     handContainer.appendChild(cardDiv);
  //   });
  // }

  // Update hand on buy or when requested
  function updateAll() {
    // Keine Handanzeige mehr nötig
  }

  // Expose update function for outside triggers (e.g. player switch)
  devUI.updateDevHand = updateAll;

  // Optionally, update hand after buying
  if (onBuy) {
    const origOnBuy = onBuy;
    onBuy = (...args) => { origOnBuy(...args); updateAll(); };
  }

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
      el.style.fontFamily = 'Montserrat, Arial, sans-serif';
      el.style.padding = '0.7em 2.2em';
      el.style.borderRadius = '0.7em';
      el.style.boxShadow = '0 4px 24px #0002';
      el.style.zIndex = '99999';
      el.style.textAlign = 'center';
      document.body.appendChild(el);
    }
    el.textContent = msg;
    el.style.color = color;
    el.style.display = 'block';
    clearTimeout(el._hideTimeout);
    el._hideTimeout = setTimeout(() => { el.style.display = 'none'; }, duration);
  }

  return devUI;
}
