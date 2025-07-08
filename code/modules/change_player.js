// === UI: Spielerwechsel-Button ===
// change_player.js
// Modul für das Umschalten des aktiven Spielers und Anzeige des Wechsel-Buttons

/**
 * Erstellt ein Dropdown zur Spielerwahl und hängt es an das angegebene Parent-Element an.
 * @param {HTMLElement} parent - Das Element, an das das Dropdown angehängt wird.
 * @param {Array} players - Die Spieler-Objekte (mit .name).
 * @param {Function} getActivePlayerIdx - Funktion, die den aktuellen Spielerindex zurückgibt.
 * @param {Function} setActivePlayerIdx - Funktion, die den neuen Spielerindex setzt.
 * @returns {HTMLSelectElement} Das erzeugte Select-Element
 */
export function createPlayerSelect(parent, players, getActivePlayerIdx, setActivePlayerIdx) {
  const playerSelectSpan = document.createElement('span');
  const sel = document.createElement('select');
  sel.id = 'player-select';
  players.forEach((p, i) => {
    const opt = document.createElement('option');
    opt.value = i;
    opt.textContent = p.name;
    sel.appendChild(opt);
  });
  sel.value = getActivePlayerIdx();
  sel.onchange = e => setActivePlayerIdx(parseInt(e.target.value));
  playerSelectSpan.appendChild(sel);
  parent.appendChild(playerSelectSpan);
  return sel;
}

/**
 * Erstellt und platziert den Spielerwechsel-Button im gleichen Stil und Größe wie der Würfeln-Button,
 * aber mit zusätzlichem kleinen Text "Spieler" unter dem Symbol.
 * @param {Array} players - Die Spieler-Objekte (mit .name).
 * @param {Function} getActivePlayerIdx - Funktion, die den aktuellen Spielerindex zurückgibt.
 * @param {Function} setActivePlayerIdx - Funktion, die den neuen Spielerindex setzt.
 * @param {HTMLElement} [parent] - Optionales Elternelement, in das der Button eingefügt wird.
 */
export function showPlayerSwitchButton(players, getActivePlayerIdx, setActivePlayerIdx, parent) {
  // Prüfe, ob der Button schon existiert
  if (document.getElementById('player-switch-btn')) return;
  // Button im Stil des Würfeln-Buttons
  const btn = document.createElement('button');
  btn.id = 'player-switch-btn';
  btn.style.width = 'auto';
  btn.style.height = 'auto';
  btn.style.display = 'flex';
  btn.style.flexDirection = 'column';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';
  btn.style.padding = '0.4em';
  btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
  btn.style.border = 'none';
  btn.style.borderRadius = '6px';
  btn.style.boxShadow = '0 2px 8px #0001';
  btn.style.cursor = 'pointer';
  btn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
  btn.style.outline = 'none';
  btn.style.fontFamily = "'Montserrat', Arial, sans-serif";
  btn.style.fontWeight = '700';
  btn.style.color = '#222';
  btn.style.fontSize = '2.5em';
  btn.style.marginBottom = '0.5em';

  // Emoji (gleiche Größe wie Würfeln)
  const emoji = document.createElement('span');
  emoji.textContent = '🔄';
  emoji.style.fontSize = '1em';
  emoji.style.lineHeight = '1';
  btn.appendChild(emoji);

  // Text "Spieler" darunter, kleiner
  const label = document.createElement('span');
  label.textContent = 'Spieler';
  label.style.fontSize = '0.32em';
  label.style.color = '#222';
  label.style.marginTop = '0.1em';
  btn.appendChild(label);

  // Klick-Handler: Wechselt zum nächsten Spieler
  btn.onclick = () => {
    const idx = getActivePlayerIdx();
    const nextIdx = (idx + 1) % players.length;
    setActivePlayerIdx(nextIdx);
  };
  // In angegebenes Parent-Element einfügen, sonst body
  if (parent) {
    parent.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }
}

/**
 * Platziert den Spielerwechsel-Button unabhängig vom Build-Menü direkt an body (unten rechts).
 * @param {Array} players - Die Spieler-Objekte (mit .name).
 * @param {Function} getActivePlayerIdx - Funktion, die den aktuellen Spielerindex zurückgibt.
 * @param {Function} setActivePlayerIdx - Funktion, die den neuen Spielerindex setzt.
 */
export function placePlayerSwitchButton(players, getActivePlayerIdx, setActivePlayerIdx, parent) {
  // Vorherigen Button entfernen, falls vorhanden
  const oldBtn = document.getElementById('player-switch-btn');
  if (oldBtn) oldBtn.remove();

  // Button erstellen
  const btn = document.createElement('button');
  btn.id = 'player-switch-btn';
  btn.classList.add('main-action-btn', 'player-switch-btn');
  btn.style.fontSize = 'clamp(1.5em, 2.5vw, 2.5em)';
  btn.style.padding = 'clamp(0.3em, 0.5vw, 0.4em)';
  btn.style.margin = 'clamp(0.1em, 0.2vw, 0)';
  btn.style.borderRadius = 'clamp(4px, 0.5vw, 6px)';
  btn.style.aspectRatio = '1 / 1';
  btn.style.width = 'clamp(2.4em, 3.8vw, 3.4em)';
  btn.style.height = 'clamp(2.4em, 3.8vw, 3.4em)';
  btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
  btn.style.border = 'none';
  btn.style.boxShadow = '0 2px 8px #0001';
  btn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
  btn.style.outline = 'none';
  btn.style.fontFamily = "'Montserrat', Arial, sans-serif";
  btn.style.fontWeight = '700';
  btn.style.color = '#222';
  btn.style.display = 'flex';
  btn.style.flexDirection = 'column';
  btn.style.alignItems = 'center';
  btn.style.justifyContent = 'center';

  // Emoji: Dynamisch je nach State
  const emoji = document.createElement('span');
  emoji.style.fontSize = '1em';
  emoji.style.lineHeight = '1';
  emoji.style.flex = '0 0 auto';
  btn.appendChild(emoji);

  // Label für nächsten Spieler oder Würfeln
  const label = document.createElement('span');
  label.id = 'player-switch-label';
  label.style.fontSize = '0.85em';
  label.style.marginTop = '0.1em';
  label.style.lineHeight = '1';
  btn.appendChild(label);

  // State: 0 = Würfeln, 1 = Spielerwechsel
  let state = 0;
  function updatePlayerSwitchLabel() {
    if (state === 0) {
      emoji.textContent = '🎲';
      label.textContent = 'Würfeln';
    } else {
      emoji.textContent = '🔄';
      const idx = getActivePlayerIdx();
      const nextIdx = (idx + 1) % players.length;
      label.textContent = players[nextIdx].name;
    }
  }
  updatePlayerSwitchLabel();

  // Klick-Handler: Erst würfeln, dann Spielerwechsel
  btn.onclick = () => {
    if (state === 0) {
      // RICHTIGE Würfelfunktion wie im Würfeln-Button aus main.js
      if (typeof window.throwPhysicsDice === 'function' && typeof window.scene !== 'undefined') {
        window.throwPhysicsDice(window.scene);
        if (typeof window.setDiceResultFromPhysics === 'function') {
          // Ergebnis-Callback bleibt wie gehabt
        }
      } else {
        // Fallback: Dummy-Logik
        console.log('Würfeln! (Hier eigene Würfelfunktion einbauen)');
      }
      state = 1;
      updatePlayerSwitchLabel();
    } else {
      const idx = getActivePlayerIdx();
      const nextIdx = (idx + 1) % players.length;
      setActivePlayerIdx(nextIdx);
      state = 0;
      updatePlayerSwitchLabel();
    }
  };

  // Button in das gewünschte Parent-Element einfügen (z.B. Action Bar)
  if (parent) {
    parent.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }
}
