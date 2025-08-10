// modules/developmentCardsUI.js
// UI-Komponente für Entwicklungskarten-Kauf und Anzeige
import { buyDevelopmentCard, canBuyDevelopmentCard } from './developmentCards.js';
import { resources } from './uiResources.js';
import { showBanditOnTile } from './bandit.js';
import { playKnight, updateLongestRoad } from './victoryPoints.js';

// Debug: Alle Entwicklungskarten immer spielbar machen
window.ALLOW_ALL_DEV_CARDS_PLAY = true;

export function createDevelopmentCardsUI({ getPlayer, getBank, getDeck, onBuy, getScene, getTileMeshes } = {}) {
  const devUI = document.createElement('div');
  devUI.id = 'development-cards-ui';
  devUI.style.display = 'none'; // Standardmäßig ausgeblendet
  devUI.style.marginTop = '0.7em';
  devUI.style.background = 'rgba(255,255,255,0.96)';
  devUI.style.borderRadius = '0.5em';
  devUI.style.padding = '0.5em 1.2em 0.5em 0.8em';
  devUI.style.boxShadow = '0 2px 8px #0001';
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
  
  // Funktion zum Aktualisieren des Button-Texts
  function updateOverviewButtonText() {
    const player = getPlayer();
    const totalCards = (player.developmentCards || []).length + (player.newDevelopmentCards || []).length;
    const playedKnights = player.knightsPlayed || 0;
    overviewBtn.textContent = `🎴 Karten (${totalCards}) ⚔️ (${playedKnights})`;
  }
  
  // Initial button text
  updateOverviewButtonText();
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

  // Titel für das Popup
  const popupTitle = document.createElement('div');
  popupTitle.textContent = '📊 Entwicklungskarten-Übersicht';
  popupTitle.style.fontSize = '1.5em';
  popupTitle.style.fontWeight = 'bold';
  popupTitle.style.textAlign = 'center';
  popupTitle.style.marginBottom = '0.5em';
  popupTitle.style.color = '#2a5aa0';
  popup.appendChild(popupTitle);

  // Statistiken unter dem Titel
  const statsSubheader = document.createElement('div');
  statsSubheader.id = 'dev-cards-stats';
  statsSubheader.style.fontSize = '0.9em';
  statsSubheader.style.textAlign = 'center';
  statsSubheader.style.marginBottom = '1.5em';
  statsSubheader.style.color = '#666';
  popup.appendChild(statsSubheader);

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
        return 'assets/development_guardian_card.png';
      case 'road_building':
        return 'assets/development_pathfinder_card.png';
      case 'monopoly':
        return 'assets/development_trade_master_card.png';
      case 'year_of_plenty':
        return 'assets/development_inventor_card.png';
      case 'victory_point':
        // Zufällig eine der Siegpunktkarten (Bibliothek, Kathedrale, Universität, Parlament, Marktplatz)
        const vpImgs = [
          'assets/development_library_card.png',
          'assets/development_cathedral_card.png',
          'assets/development_university_card.png',
          'assets/development_council_card.png',
          'assets/development_market_card.png'
        ];
        // Optional: Karte merken, damit sie nicht wechselt (hier: zufällig pro Anzeige)
        return vpImgs[Math.floor(Math.random() * vpImgs.length)];
      default:
        return 'assets/item_card_back.png';
    }
  }

  // Hilfsfunktion: Karte aus Hand entfernen
  function removeDevCardFromHand(player, idx) {
    if (idx < player.developmentCards.length) {
      player.developmentCards.splice(idx, 1);
    } else {
      player.newDevelopmentCards.splice(idx - player.developmentCards.length, 1);
    }
  }

  // Logik für Karteneffekte (Stub)
  function playDevCard(card, idx, player) {
    if (card.type === 'year_of_plenty') {
      // Erfindung: 2 beliebige Ressourcen aus der Bank wählen
      showYearOfPlentyDialog(player);
      removeDevCardFromHand(player, idx);
      if (typeof devUI.updateDevHand === 'function') devUI.updateDevHand();
      popup.style.display = 'none';
      if (onBuy) onBuy();
      return;
    }
    if (card.type === 'monopoly') {
      showMonopolyDialog(player);
      removeDevCardFromHand(player, idx);
      if (typeof devUI.updateDevHand === 'function') devUI.updateDevHand();
      popup.style.display = 'none';
      if (onBuy) onBuy();
      return;
    }
    switch(card.type) {
      case 'knight':
        // Ritter: Wächter verschieben + Largest Army tracking
        if (typeof getScene === 'function' && typeof getTileMeshes === 'function') {
          const scene = getScene();
          const tileMeshes = getTileMeshes();
          // Starte Wächterplatzierung (UI/UX: Info anzeigen)
          showGlobalFeedback('Ritter gespielt! Wähle ein Feld für den Wächter.', '#2a8c2a', 3000);
          // Korrekt: tileNumbers als zweites Argument übergeben
          if (typeof window.startRobberPlacement === 'function') {
            window.startRobberPlacement(tileMeshes, window.tileNumbers);
          }
          // Update knight count and check for largest army
          if (window.players && Array.isArray(window.players)) {
            playKnight(player, window.players);
            // Update the button text to reflect new knight count
            updateOverviewButtonText();
            // Trigger full UI update to refresh achievement display
            if (typeof window.updateAllUI === 'function') {
              window.updateAllUI();
            }
          }
        } else {
          showGlobalFeedback('Wächterplatzierung nicht möglich (Szene oder Tiles fehlen)', '#c00', 3000);
        }
        break;
      case 'road_building': {
        // Straßenbau: Aktiviere Modus für 2 kostenlose Straßen
        if (!window._roadBuildingMode) {
          window._roadBuildingMode = {
            roadsLeft: 2,
            player: player,
            finish: () => {
              window._roadBuildingMode = null;
              showGlobalFeedback('Straßenbau abgeschlossen!', '#2a8c2a', 2500);
              // Update longest road after road building
              if (window.players && Array.isArray(window.players)) {
                updateLongestRoad(window.players);
                // Trigger full UI update to refresh achievement display
                if (typeof window.updateAllUI === 'function') {
                  window.updateAllUI();
                }
              }
            }
          };
          showGlobalFeedback('Straßenbau gespielt! Baue 2 Straßen kostenlos.', '#2a8c2a', 3500);
        }
        removeDevCardFromHand(player, idx);
        if (typeof devUI.updateDevHand === 'function') devUI.updateDevHand();
        popup.style.display = 'none';
        if (onBuy) onBuy();
        return;
      }
      default:
        showGlobalFeedback('Diese Karte kann nicht ausgespielt werden.', '#c00', 3000);
        return;
    }
    removeDevCardFromHand(player, idx);
    if (typeof devUI.updateDevHand === 'function') devUI.updateDevHand();
    popup.style.display = 'none';
    if (onBuy) onBuy();
  }

  // Erfindung: Dialog für Ressourcenauswahl
  function showYearOfPlentyDialog(player) {
    // Overlay
    let overlay = document.getElementById('year-of-plenty-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'year-of-plenty-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.25)';
    overlay.style.zIndex = '100001';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    // Dialog
    const dialog = document.createElement('div');
    dialog.style.background = 'rgba(255,255,255,0.98)';
    dialog.style.borderRadius = '0.7em';
    dialog.style.boxShadow = '0 8px 32px #0004';
    dialog.style.padding = '2em 2.5em 1.5em 2.5em';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.alignItems = 'center';
    dialog.style.gap = '1.2em';
    dialog.style.fontFamily = 'Montserrat, Arial, sans-serif';
    dialog.style.minWidth = '320px';
    dialog.style.maxWidth = '90vw';

    const title = document.createElement('div');
    title.textContent = 'Erfindung: Wähle 2 Ressourcen aus der Bank';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '1.2em';
    title.style.marginBottom = '0.5em';
    dialog.appendChild(title);

    // Ressourcenauswahl
    const selects = [];
    for (let i = 0; i < 2; i++) {
      const sel = document.createElement('select');
      sel.style.fontSize = '1.1em';
      sel.style.margin = '0 0.7em';
      resources.forEach(r => {
        const opt = document.createElement('option');
        opt.value = r.key;
        opt.textContent = `${r.symbol} ${r.name} (${window.bank[r.key] ?? 0})`;
        sel.appendChild(opt);
      });
      selects.push(sel);
      dialog.appendChild(sel);
    }

    // Bestätigen-Button
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Nehmen';
    okBtn.style.background = '#2a8c2a';
    okBtn.style.color = '#fff';
    okBtn.style.border = 'none';
    okBtn.style.borderRadius = '0.3em';
    okBtn.style.padding = '0.5em 2em';
    okBtn.style.fontWeight = 'bold';
    okBtn.style.fontSize = '1.1em';
    okBtn.style.cursor = 'pointer';
    okBtn.onclick = () => {
      const res1 = selects[0].value;
      const res2 = selects[1].value;
      if (!window.bank[res1] || window.bank[res1] < 1 || !window.bank[res2] || window.bank[res2] < 1) {
        showGlobalFeedback('Bank hat nicht genug Ressourcen!', '#c00', 3000);
        return;
      }
      player.resources[res1]++;
      player.resources[res2]++;
      window.bank[res1]--;
      window.bank[res2]--;
      if (typeof window.updateResourceUI === 'function') window.updateResourceUI(player);
      showGlobalFeedback(`Du hast ${resources.find(r=>r.key===res1).name} und ${resources.find(r=>r.key===res2).name} erhalten!`, '#2a8c2a', 3000);
      overlay.remove();
    };
    dialog.appendChild(okBtn);

    // Abbrechen-Button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.background = '#bbb';
    cancelBtn.style.color = '#222';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '0.3em';
    cancelBtn.style.padding = '0.5em 2em';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.fontSize = '1.1em';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.marginLeft = '1.2em';
    cancelBtn.onclick = () => overlay.remove();
    dialog.appendChild(cancelBtn);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  // Monopol: Dialog für Ressourcenauswahl
  function showMonopolyDialog(player) {
    let overlay = document.getElementById('monopoly-overlay');
    if (overlay) overlay.remove();
    overlay = document.createElement('div');
    overlay.id = 'monopoly-overlay';
    overlay.style.position = 'fixed';
    overlay.style.left = '0';
    overlay.style.top = '0';
    overlay.style.width = '100vw';
    overlay.style.height = '100vh';
    overlay.style.background = 'rgba(0,0,0,0.25)';
    overlay.style.zIndex = '100001';
    overlay.style.display = 'flex';
    overlay.style.alignItems = 'center';
    overlay.style.justifyContent = 'center';

    const dialog = document.createElement('div');
    dialog.style.background = 'rgba(255,255,255,0.98)';
    dialog.style.borderRadius = '0.7em';
    dialog.style.boxShadow = '0 8px 32px #0004';
    dialog.style.padding = '2em 2.5em 1.5em 2.5em';
    dialog.style.display = 'flex';
    dialog.style.flexDirection = 'column';
    dialog.style.alignItems = 'center';
    dialog.style.gap = '1.2em';
    dialog.style.fontFamily = 'Montserrat, Arial, sans-serif';
    dialog.style.minWidth = '320px';
    dialog.style.maxWidth = '90vw';

    const title = document.createElement('div');
    title.textContent = 'Monopol: Wähle eine Ressource';
    title.style.fontWeight = 'bold';
    title.style.fontSize = '1.2em';
    title.style.marginBottom = '0.5em';
    dialog.appendChild(title);

    const sel = document.createElement('select');
    sel.style.fontSize = '1.1em';
    sel.style.margin = '0 0.7em';
    resources.forEach(r => {
      const opt = document.createElement('option');
      opt.value = r.key;
      opt.textContent = `${r.symbol} ${r.name}`;
      sel.appendChild(opt);
    });
    dialog.appendChild(sel);

    // Bestätigen-Button
    const okBtn = document.createElement('button');
    okBtn.textContent = 'Monopol ausführen';
    okBtn.style.background = '#2a8c2a';
    okBtn.style.color = '#fff';
    okBtn.style.border = 'none';
    okBtn.style.borderRadius = '0.3em';
    okBtn.style.padding = '0.5em 2em';
    okBtn.style.fontWeight = 'bold';
    okBtn.style.fontSize = '1.1em';
    okBtn.style.cursor = 'pointer';
    okBtn.onclick = () => {
      const resKey = sel.value;
      let totalTaken = 0;
      let playerName = player.name || 'Du';
      // Alle anderen Spieler durchsuchen
      if (typeof window.getAllPlayers === 'function') {
        const allPlayers = window.getAllPlayers();
        allPlayers.forEach(p => {
          if (p !== player && p.resources && typeof p.resources[resKey] === 'number') {
            totalTaken += p.resources[resKey];
            player.resources[resKey] += p.resources[resKey];
            p.resources[resKey] = 0;
          }
        });
        if (typeof window.updateResourceUI === 'function') window.updateResourceUI(player);
        showGlobalFeedback(`${playerName} erhält ${totalTaken}x ${resources.find(r=>r.key===resKey).name} von allen Spielern!`, '#2a8c2a', 3500);
      } else {
        showGlobalFeedback('Spielerliste nicht verfügbar!', '#c00', 2500);
      }
      overlay.remove();
    };
    dialog.appendChild(okBtn);

    // Abbrechen-Button
    const cancelBtn = document.createElement('button');
    cancelBtn.textContent = 'Abbrechen';
    cancelBtn.style.background = '#bbb';
    cancelBtn.style.color = '#222';
    cancelBtn.style.border = 'none';
    cancelBtn.style.borderRadius = '0.3em';
    cancelBtn.style.padding = '0.5em 2em';
    cancelBtn.style.fontWeight = 'bold';
    cancelBtn.style.fontSize = '1.1em';
    cancelBtn.style.cursor = 'pointer';
    cancelBtn.style.marginLeft = '1.2em';
    cancelBtn.onclick = () => overlay.remove();
    dialog.appendChild(cancelBtn);

    overlay.appendChild(dialog);
    document.body.appendChild(overlay);
  }

  overviewBtn.onclick = () => {
    // Render die Kartenübersicht
    const player = getPlayer();
    popupList.innerHTML = '';
    
    // Update statistics in the subheader
    const statsSubheader = document.getElementById('dev-cards-stats');
    const totalCards = (player.developmentCards || []).length + (player.newDevelopmentCards || []).length;
    const playedKnights = player.knightsPlayed || 0;
    const hasLargestArmy = player.victoryPoints?.largestArmy > 0;
    
    if (statsSubheader) {
      statsSubheader.innerHTML = `
        🎴 Karten gesamt: <strong>${totalCards}</strong> | 
        ⚔️ Ritter gespielt: <strong>${playedKnights}</strong>${hasLargestArmy ? ' (Größte Rittermacht)' : ''}
      `;
    }
    
    const hand = (player.developmentCards || []).concat((player.newDevelopmentCards || []));
    if (!hand.length) {
      const noCardsDiv = document.createElement('div');
      noCardsDiv.textContent = 'Keine Entwicklungskarten vorhanden.';
      noCardsDiv.style.color = '#888';
      noCardsDiv.style.textAlign = 'center';
      noCardsDiv.style.fontSize = '1.1em';
      noCardsDiv.style.marginTop = '2em';
      popupList.appendChild(noCardsDiv);
    } else {
      hand.forEach((card, idx) => {
        let label = '';
        // Debug: Alle Karten als spielbar behandeln, wenn window.ALLOW_ALL_DEV_CARDS_PLAY gesetzt ist
        let isNew = idx >= (player.developmentCards?.length || 0);
        if (window.ALLOW_ALL_DEV_CARDS_PLAY) isNew = false;
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
        // Play-Button (immer anzeigen außer Siegpunkte)
        if (card.type !== 'victory_point') {
          const playBtn = document.createElement('button');
          playBtn.textContent = 'Spielen';
          playBtn.style.marginTop = '0.2em';
          playBtn.style.background = isNew ? '#aaa' : '#2a8c2a';
          playBtn.style.color = '#fff';
          playBtn.style.border = 'none';
          playBtn.style.borderRadius = '0.3em';
          playBtn.style.padding = '0.3em 1.2em';
          playBtn.style.fontWeight = 'bold';
          playBtn.style.cursor = isNew ? 'not-allowed' : 'pointer';
          playBtn.style.width = '90px';
          playBtn.style.fontSize = '1em';
          playBtn.style.boxShadow = '0 2px 8px #2a8c2a33';
          playBtn.style.display = 'block';
          playBtn.disabled = isNew;
          playBtn.onclick = (event) => {
            if (event) event.stopPropagation();
            if (isNew) {
              showGlobalFeedback('Diese Karte kann erst ab nächster Runde gespielt werden.', '#c00', 2500);
              return;
            }
            playDevCard(card, idx, player);
          };
          cardDiv.appendChild(playBtn);
        }
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


  // Update hand on buy or when requested
  function updateAll() {
    updateOverviewButtonText();
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
