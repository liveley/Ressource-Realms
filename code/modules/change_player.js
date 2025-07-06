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
  // Prüfe, ob der Button schon existiert
  if (document.getElementById('player-switch-btn')) return;
  // Button im Stil des Würfeln- und Bauen-Buttons
  const btn = document.createElement('button');
  btn.id = 'player-switch-btn';
  btn.style.fontSize = '2.5em';
  btn.style.padding = '0.4em';
  btn.style.margin = '0';
  btn.style.cursor = 'pointer';
  btn.style.borderRadius = '6px';
  btn.style.aspectRatio = 'auto';
  btn.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
  btn.style.border = 'none';
  btn.style.boxShadow = '0 2px 8px #0001';
  btn.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s, font-size 0.18s';
  btn.style.outline = 'none';
  btn.style.fontFamily = "'Montserrat', Arial, sans-serif";
  btn.style.fontWeight = '700';
  btn.style.color = '#222';
  btn.style.minWidth = 'clamp(100px, 14vw, 180px)';
  btn.style.minHeight = 'clamp(56px, 3.5em, 80px)';
  btn.style.padding = 'clamp(0.3em, 1vw, 0.7em) clamp(1.2em, 3vw, 2.2em)';
  btn.style.boxSizing = 'border-box';

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
  // Button in das gewünschte Parent-Element einfügen (z.B. Action Bar)
  if (parent) {
    parent.appendChild(btn);
  } else {
    document.body.appendChild(btn);
  }
}
