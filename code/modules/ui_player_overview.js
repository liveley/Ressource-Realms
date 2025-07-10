// === UI: Spieler-Übersicht (oben links) ===
// ui_player_overview.js
// Zeigt zwei kompakte Spieler-Overviews mit Avatar-Kreis in Spielerfarbe, Name und einer kompakten Wertezeile
// Wertezeile enthält: Siegpunkte, Straßen, Siedlungen, Städte, Ressourcenkarten, Entwicklungskarten
// Hebt den aktiven Spieler visuell hervor (goldener Rahmen und Leuchteffekt)

import { getVictoryPointsForDisplay, initializeVictoryPoints, calculateVictoryPoints } from './victoryPoints.js';

export function createPlayerOverviews(players, getActivePlayerIdx) {
  // Container für die Overviews (wird nur einmal erstellt)
  let container = document.getElementById('player-overview-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'player-overview-container';
    container.style.position = 'fixed';
    container.style.top = '18px';
    container.style.left = '18px';
    container.style.display = 'flex';
    container.style.flexDirection = 'row';
    container.style.gap = '2.5em';
    container.style.zIndex = '1002'; // sehr hoch, immer sichtbar
    container.style.pointerEvents = 'none'; // Overlays nicht blockieren
    document.body.appendChild(container);
  }

  // Achievement-Anzeige erstellen oder aktualisieren
  createOrUpdateAchievementDisplay(players, getActivePlayerIdx);

  // Vorherige Inhalte löschen (z. B. bei Spielerwechsel)
  container.innerHTML = '';

  // Für jeden Spieler eine kompakte Box erzeugen
  players.forEach((player, idx) => {
    const isActive = idx === getActivePlayerIdx();
    // Initialize victory points if not already done
    if (!player.victoryPoints) {
      initializeVictoryPoints([player]);
    }
    // Siegpunkte-Anzeige vorbereiten (vor Avatar-Kreis!)
    let vpDisplay;
    if (!player) {
      vpDisplay = { display: '0', hidden: 0 };
    } else {
      vpDisplay = getVictoryPointsForDisplay(player, isActive);
    }

    const box = document.createElement('div');
    box.className = 'player-overview-box';
    // Box-Styling: kompakt, mit Rahmen und Schatten, nach links versetzt (Offset)
    box.style.minHeight = '54px';
    box.style.background = isActive ? '#fff' : '#f4f4f4';
    box.style.border = `3px solid ${isActive ? '#ffd700' : '#ccc'}`;
    box.style.borderRadius = '12px';
    box.style.boxShadow = isActive ? '0 0 12px 4px #ffd70088' : '0 2px 6px #0002';
    box.style.padding = '0.7em 2.2em 0.7em 1.5em'; // mehr Platz für Text und Werte
    box.style.display = 'flex';
    box.style.flexDirection = 'column';
    box.style.justifyContent = 'center';
    box.style.transition = 'all 0.3s ease';
    box.style.position = 'relative';
    box.style.left = '0'; // Kein Offset mehr, Box startet am linken Rand

    // Kopfzeile mit Avatar, Name und Wertezeile nebeneinander
    const header = document.createElement('div');
    header.style.display = 'flex';
    header.style.alignItems = 'center';
    header.style.justifyContent = 'flex-start';
    header.style.gap = '0.4em'; // enger
    header.style.width = '100%';

    // Avatar-Kreis in Spielerfarbe mit Siegpunkte-Anzeige, halb über dem Info-Rechteck
    const avatar = document.createElement('div');
    avatar.style.width = '54px';
    avatar.style.height = '54px';
    avatar.style.borderRadius = '50%';
    avatar.style.background = player.color ? `#${player.color.toString(16).padStart(6, '0')}` : '#888';
    avatar.style.border = isActive ? '3.5px solid #ffd700' : '2px solid #333';
    avatar.style.display = 'flex';
    avatar.style.alignItems = 'center';
    avatar.style.justifyContent = 'center';
    avatar.style.boxShadow = isActive ? '0 0 16px 4px #ffd70088' : '0 2px 8px #0002';
    avatar.style.marginRight = '0.7em';
    avatar.style.position = 'relative';
    avatar.style.left = '-20px'; // Avatar ragt nach links über die Box hinaus
    avatar.style.right = 'unset';
    avatar.style.top = 'unset';
    avatar.style.transform = 'none';
    avatar.style.pointerEvents = 'auto';
    // Siegpunkte-Zahl in die Mitte
    const vpNum = document.createElement('span');
    vpNum.textContent = vpDisplay.display;
    vpNum.title = `Siegpunkte${vpDisplay.hidden > 0 ? ' (inklusive versteckter Punkte)' : ''}`;
    vpNum.style.fontWeight = 'bold';
    vpNum.style.fontSize = '1.45em';
    vpNum.style.color = isActive ? '#222' : '#333';
    vpNum.style.textShadow = isActive ? '0 0 8px #ffd70088' : '0 1px 2px #fff8';
    avatar.appendChild(vpNum);
    header.appendChild(avatar);

    // Name + Wertezeile in einer Spalte
    const infoBlock = document.createElement('div');
    infoBlock.style.display = 'flex';
    infoBlock.style.flexDirection = 'column';
    infoBlock.style.justifyContent = 'center';
    infoBlock.style.marginLeft = '-36px'; // rückt Name und Werte näher an den Avatar ran

    // Spielername
    const nameDiv = document.createElement('div');
    nameDiv.textContent = player.name;
    nameDiv.style.fontWeight = 'bold';
    nameDiv.style.fontSize = '1.25em'; // größer
    nameDiv.style.fontFamily = 'Montserrat, Arial, sans-serif'; // modernere Schrift
    nameDiv.style.marginBottom = '0.05em'; // weniger Abstand
    infoBlock.appendChild(nameDiv);

    // Kompakte Wertezeile mit Symbolen (ohne Siegpunkte)
    const stats = document.createElement('div');
    stats.style.display = 'flex';
    stats.style.flexWrap = 'wrap';
    stats.style.gap = '0.4em';
    stats.style.fontSize = '0.92em';
    // Check for special achievements
    const hasLongestRoad = player.victoryPoints?.longestRoad > 0;
    const hasLargestArmy = player.victoryPoints?.largestArmy > 0;
    // Calculate total development cards (current + new)
    const totalDevCards = (player.developmentCards?.length ?? 0) + (player.newDevelopmentCards?.length ?? 0);
    const knightsPlayed = player.knightsPlayed ?? 0;
    stats.innerHTML = `
      <span title="Straßen (längste: ${player.longestRoadLength ?? 0})">🛣️ ${player.roads?.length ?? 0}</span>
      <span title="Siedlungen">🏠 ${player.settlements?.length ?? 0}</span>
      <span title="Städte">🏛️ ${player.cities?.length ?? 0}</span>
      <span title="Ressourcenkarten">📦 ${player.resources ? Object.values(player.resources).reduce((a,b)=>a+b,0) : 0}</span>
      <span title="Entwicklungskarten (Ritter gespielt: ${knightsPlayed})">🎴 ${totalDevCards}</span>
    `;
    infoBlock.appendChild(stats);
    header.appendChild(infoBlock);
    box.appendChild(header);

    // Box in Container einfügen
    container.appendChild(box);
  });
}

// Aktualisiert die Spielerübersicht (z. B. nach Spielerwechsel oder Bauaktion)
export function updatePlayerOverviews(players, getActivePlayerIdx) {
  // Update victory points for all players first
  players.forEach(player => {
    if (typeof window.updateAllVictoryPoints === 'function') {
      window.updateAllVictoryPoints(player, players);
    }
  });
  
  createPlayerOverviews(players, getActivePlayerIdx);
}

// Erstellt oder aktualisiert die Achievement-Anzeige
function createOrUpdateAchievementDisplay(players, getActivePlayerIdx) {
  let achievementContainer = document.getElementById('achievement-display');
  
  if (!achievementContainer) {
    achievementContainer = document.createElement('div');
    achievementContainer.id = 'achievement-display';
    achievementContainer.style.position = 'fixed';
    achievementContainer.style.top = '17%';
    achievementContainer.style.left = '6%';
    achievementContainer.style.background = 'rgba(255, 255, 255, 0.95)';
    achievementContainer.style.borderRadius = '12px';
    achievementContainer.style.padding = '1em';
    achievementContainer.style.boxShadow = '0 4px 16px rgba(0,0,0,0.15)';
    achievementContainer.style.border = '2px solid #ddd';
    achievementContainer.style.minWidth = '220px';
    achievementContainer.style.zIndex = '6';
    achievementContainer.style.fontFamily = 'Montserrat, Arial, sans-serif';
    document.body.appendChild(achievementContainer);
  }

  // Achievement-Inhalt aktualisieren
  let content = '<div style="font-weight: bold; font-size: 1.1em; margin-bottom: 0.8em; color: #333; text-align: center;">🏆 Achievements</div>';
  
  // Längste Handelsstraße
  const longestRoadPlayer = players.find(p => p.victoryPoints?.longestRoad > 0);
  if (longestRoadPlayer) {
    content += `<div style="margin-bottom: 0.5em; padding: 0.5em; background: linear-gradient(90deg, #fff3cd, #ffeaa7); border-radius: 6px; border-left: 4px solid #f39c12;">
      <strong>🛣️ Längste Handelsstraße</strong><br>
      <span style="color: #e67e22;">${longestRoadPlayer.name}</span> (${longestRoadPlayer.longestRoadLength || 0} Straßen)
    </div>`;
  } else {
    content += `<div style="margin-bottom: 0.5em; padding: 0.5em; background: #f8f9fa; border-radius: 6px; color: #666;">
      <strong>🛣️ Längste Handelsstraße</strong><br>
      <span style="font-size: 0.9em;">Noch niemand (min. 5 Straßen)</span>
    </div>`;
  }
  
  // Größte Rittermacht
  const largestArmyPlayer = players.find(p => p.victoryPoints?.largestArmy > 0);
  if (largestArmyPlayer) {
    content += `<div style="margin-bottom: 0.5em; padding: 0.5em; background: linear-gradient(90deg, #d4edda, #c3e6cb); border-radius: 6px; border-left: 4px solid #28a745;">
      <strong>⚔️ Größte Rittermacht</strong><br>
      <span style="color: #155724;">${largestArmyPlayer.name}</span> (${largestArmyPlayer.knightsPlayed || 0} Ritter)
    </div>`;
  } else {
    content += `<div style="margin-bottom: 0.5em; padding: 0.5em; background: #f8f9fa; border-radius: 6px; color: #666;">
      <strong>⚔️ Größte Rittermacht</strong><br>
      <span style="font-size: 0.9em;">Noch niemand (min. 3 Ritter)</span>
    </div>`;
  }
  
  achievementContainer.innerHTML = content;
}
