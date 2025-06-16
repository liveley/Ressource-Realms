// ui_general.js
// Zeigt zwei kompakte Spieler-Overviews mit Avatar-Kreis in Spielerfarbe, Name und einer kompakten Wertezeile
// Wertezeile enthält: Siegpunkte, Straßen, Siedlungen, Städte, Ressourcenkarten, Entwicklungskarten
// Hebt den aktiven Spieler visuell hervor (goldener Rahmen und Leuchteffekt)

export function createPlayerOverviews(players, getActivePlayerIdx) {
  // Container für die Overviews (wird nur einmal erstellt)
  let container = document.getElementById('player-overview-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'player-overview-container';
    container.style.position = 'fixed';
    container.style.top = '2%';
    container.style.left = '17%';
    container.style.transform = 'translateX(-50%)';
    container.style.display = 'flex';
    container.style.gap = '1.5em';
    container.style.zIndex = '1000';
    document.body.appendChild(container);
  }

  // Vorherige Inhalte löschen (z. B. bei Spielerwechsel)
  container.innerHTML = '';

  // Für jeden Spieler eine kompakte Box erzeugen
  players.forEach((player, idx) => {
    const isActive = idx === getActivePlayerIdx();

    const box = document.createElement('div');
    box.className = 'player-overview-box';

    // Box-Styling: kompakt, mit Rahmen und Schatten
    //box.style.width = '180px';
    box.style.minHeight = '80px';
    box.style.background = isActive ? '#fff' : '#f4f4f4';
    box.style.border = `3px solid ${isActive ? '#ffd700' : '#ccc'}`;
    box.style.borderRadius = '12px';
    box.style.boxShadow = isActive ? '0 0 12px 4px #ffd70088' : '0 2px 6px #0002';
    box.style.padding = '0.6em 0.6em';
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.justifyContent = 'center';
    box.style.transition = 'all 0.3s ease';

    // Kopfzeile mit Avatar, Name und Wertezeile nebeneinander
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'flex-start';
    header.style.gap = '0.6em';
    header.style.width = '100%';

    // Avatar-Kreis in Spielerfarbe
    const avatar = document.createElement('div');
    avatar.style.width = '36px';
    avatar.style.height = '36px';
    avatar.style.borderRadius = '50%';
    avatar.style.background = player.color ? `#${player.color.toString(16).padStart(6, '0')}` : '#888';
    avatar.style.border = '2px solid #333';
    header.appendChild(avatar);

    // Name + Wertezeile in einer Spalte
    const infoBlock = document.createElement('div');
    infoBlock.style.display = 'flex';
    infoBlock.style.flexDirection = 'column';
    infoBlock.style.justifyContent = 'center';

    // Spielername
    const nameDiv = document.createElement('div');
    nameDiv.textContent = player.name;
    nameDiv.style.fontWeight = 'bold';
    nameDiv.style.fontSize = '1em';
    nameDiv.style.marginBottom = '0.2em';
    infoBlock.appendChild(nameDiv);

    // Kompakte Wertezeile mit Symbolen
    const stats = document.createElement('div');
    stats.style.display = 'flex';
    stats.style.flexWrap = 'wrap';
    stats.style.gap = '0.4em';
    stats.style.fontSize = '0.85em';

    // Siegpunkte (berechnet, falls nicht gesetzt)
    const vpValue = player.victoryPoints != null
      ? player.victoryPoints
      : (player.settlements?.length || 0) + 2 * (player.cities?.length || 0);

    stats.innerHTML = `
      <span title="Siegpunkte">🏆 ${vpValue}</span>
      <span title="Straßen">🛣️ ${player.roads?.length ?? 0}</span>
      <span title="Ressourcenkarten">📦 ${player.resources ? Object.values(player.resources).reduce((a,b)=>a+b,0) : 0}</span>
      <span title="Entwicklungskarten">🎴 ${player.developmentCards?.length ?? 0}</span>
    `;

    infoBlock.appendChild(stats);
    header.appendChild(infoBlock);
    box.appendChild(header);

    // Box in Container einfügen
    container.appendChild(box);
  });
}

// Aktualisiert die Spielerübersicht (z. B. nach Spielerwechsel oder Bauaktion)
export function updatePlayerOverviews(players, getActivePlayerIdx) {
  createPlayerOverviews(players, getActivePlayerIdx);
}
