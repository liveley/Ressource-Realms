// modules/uiSettingsMenu.js
// Settings/Info-Menu mit Tile-Info, Spielregeln, Kostenübersicht und Spiel beenden
import { isInfoOverlayEnabled } from './uiTileInfo.js';

let settingsMenuOpen = false;
let settingsButton = null;
let settingsPopup = null;

// Toggle-Funktion für Tile-Info (importiert aus uiTileInfo.js)
let tileInfoToggleFunction = null;

export function createSettingsMenu() {
  // Settings-Button erstellen (oben links, quadratisch)
  createSettingsButton();
  
  // Settings-Popup erstellen
  createSettingsPopup();
  
  console.log('Settings-Menu erstellt:', settingsButton, settingsPopup);
}

function createSettingsButton() {
  // Container für Settings-Button (oben links)
  let settingsContainer = document.getElementById('settings-ui');
  if (!settingsContainer) {
    settingsContainer = document.createElement('div');
    settingsContainer.id = 'settings-ui';
    settingsContainer.style.position = 'absolute';
    settingsContainer.style.top = '8em';
    settingsContainer.style.left = '2em';
    settingsContainer.style.zIndex = '15';
    document.body.appendChild(settingsContainer);
  }

  // Settings-Button (quadratisch, wie tile-info Button)
  settingsButton = document.createElement('button');
  settingsButton.id = 'settings-button';
  settingsButton.title = 'Einstellungen & Info';
  settingsButton.textContent = '⚙️'; // Zahnrad-Symbol
  settingsButton.style.fontSize = '1.8em';
  settingsButton.style.padding = '0.3em';
  settingsButton.style.width = '2.4em';
  settingsButton.style.height = '2.4em';
  settingsButton.style.borderRadius = '7px';
  settingsButton.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
  settingsButton.style.border = 'none';
  settingsButton.style.fontFamily = "'Montserrat', Arial, sans-serif";
  settingsButton.style.fontWeight = '700';
  settingsButton.style.cursor = 'pointer';
  settingsButton.style.boxShadow = '0 2px 8px #0001';
  settingsButton.style.transition = 'background 0.18s, box-shadow 0.18s, transform 0.12s';
  settingsButton.style.display = 'flex';
  settingsButton.style.alignItems = 'center';
  settingsButton.style.justifyContent = 'center';
  settingsButton.style.color = '#222';
  
  // Hover-Effekte
  settingsButton.onmouseenter = () => {
    settingsButton.style.background = 'linear-gradient(90deg, #ffd700 70%, #fffbe6 100%)';
    settingsButton.style.boxShadow = '0 4px 12px #ffe06644';
    settingsButton.style.transform = 'translateY(-1px)';
  };
  settingsButton.onmouseleave = () => {
    settingsButton.style.background = 'linear-gradient(90deg, #ffe066 60%, #fffbe6 100%)';
    settingsButton.style.boxShadow = '0 2px 8px #0001';
    settingsButton.style.transform = 'translateY(0)';
  };

  // Click-Handler
  settingsButton.onclick = () => {
    toggleSettingsMenu();
  };

  settingsContainer.appendChild(settingsButton);
}

function createSettingsPopup() {
  // Settings-Popup (Modal)
  settingsPopup = document.createElement('div');
  settingsPopup.id = 'settings-popup';
  settingsPopup.style.position = 'fixed';
  settingsPopup.style.left = '50%';
  settingsPopup.style.top = '50%';
  settingsPopup.style.transform = 'translate(-50%, -50%)';
  settingsPopup.style.background = 'rgba(255,255,255,0.98)';
  settingsPopup.style.borderRadius = '0.8em';
  settingsPopup.style.boxShadow = '0 8px 32px #0004';
  settingsPopup.style.padding = '2em 2.5em 1.5em 2.5em';
  settingsPopup.style.zIndex = '100000';
  settingsPopup.style.display = 'none';
  settingsPopup.style.minWidth = '400px';
  settingsPopup.style.maxWidth = '90vw';
  settingsPopup.style.maxHeight = '80vh';
  settingsPopup.style.overflowY = 'auto';
  settingsPopup.style.fontFamily = 'Montserrat, Arial, sans-serif';

  // Header
  const header = document.createElement('div');
  header.style.marginBottom = '1.5em';
  header.style.textAlign = 'center';
  header.style.borderBottom = '2px solid #eee';
  header.style.paddingBottom = '0.8em';
  
  const title = document.createElement('h2');
  title.textContent = 'Einstellungen & Info';
  title.style.margin = '0';
  title.style.fontSize = '1.5em';
  title.style.color = '#333';
  title.style.fontWeight = '700';
  header.appendChild(title);

  // Schließen-Button
  const closeBtn = document.createElement('button');
  closeBtn.textContent = '✕';
  closeBtn.style.position = 'absolute';
  closeBtn.style.top = '1em';
  closeBtn.style.right = '1.5em';
  closeBtn.style.background = 'none';
  closeBtn.style.border = 'none';
  closeBtn.style.fontSize = '1.5em';
  closeBtn.style.cursor = 'pointer';
  closeBtn.style.color = '#666';
  closeBtn.style.fontWeight = 'bold';
  closeBtn.onclick = () => hideSettingsMenu();
  settingsPopup.appendChild(closeBtn);

  // Content Container
  const content = document.createElement('div');
  content.style.display = 'flex';
  content.style.flexDirection = 'column';
  content.style.gap = '1.5em';

  // 1. Tile-Info Sektion
  const tileInfoSection = createTileInfoSection();
  content.appendChild(tileInfoSection);

  // 2. Kostenübersicht Sektion
  const costsSection = createCostsSection();
  content.appendChild(costsSection);

  // 3. Spielregeln Sektion
  const rulesSection = createRulesSection();
  content.appendChild(rulesSection);

  // 4. Spiel beenden Sektion
  const quitSection = createQuitSection();
  content.appendChild(quitSection);

  settingsPopup.appendChild(header);
  settingsPopup.appendChild(content);
  document.body.appendChild(settingsPopup);
}

function createTileInfoSection() {
  const section = document.createElement('div');
  section.style.padding = '1em';
  section.style.background = '#f8f9fa';
  section.style.borderRadius = '0.5em';
  section.style.border = '1px solid #eee';

  const sectionTitle = document.createElement('h3');
  sectionTitle.textContent = 'Feld-Informationen';
  sectionTitle.style.margin = '0 0 0.8em 0';
  sectionTitle.style.fontSize = '1.2em';
  sectionTitle.style.color = '#333';
  section.appendChild(sectionTitle);

  const description = document.createElement('p');
  description.textContent = 'Zeigt beim Überfahren mit der Maus Informationen über die verschiedenen Feldtypen an.';
  description.style.margin = '0 0 1em 0';
  description.style.fontSize = '0.95em';
  description.style.color = '#666';
  section.appendChild(description);

  // Toggle-Button für Tile-Info
  const toggleBtn = document.createElement('button');
  toggleBtn.id = 'tile-info-toggle-btn';
  toggleBtn.style.fontSize = '1em';
  toggleBtn.style.padding = '0.5em 1.5em';
  toggleBtn.style.borderRadius = '0.4em';
  toggleBtn.style.border = 'none';
  toggleBtn.style.cursor = 'pointer';
  toggleBtn.style.fontWeight = 'bold';
  toggleBtn.style.transition = 'background 0.2s';
  
  // Funktion zum Updaten des Toggle-Buttons
  function updateTileInfoToggle() {
    const enabled = isInfoOverlayEnabled();
    toggleBtn.textContent = enabled ? 'Feld-Info: AN' : 'Feld-Info: AUS';
    toggleBtn.style.background = enabled ? '#2a8c2a' : '#c44';
    toggleBtn.style.color = '#fff';
  }
  
  updateTileInfoToggle();
  
  toggleBtn.onclick = () => {
    // Nutze die bestehende Toggle-Funktion vom Original-Button
    const originalToggleBtn = document.getElementById('toggle-info-overlay');
    if (originalToggleBtn) {
      originalToggleBtn.click();
      setTimeout(updateTileInfoToggle, 50); // Kurz warten, dann UI updaten
    }
  };
  
  section.appendChild(toggleBtn);
  return section;
}

function createCostsSection() {
  const section = document.createElement('div');
  section.style.padding = '1em';
  section.style.background = '#f8f9fa';
  section.style.borderRadius = '0.5em';
  section.style.border = '1px solid #eee';

  const sectionTitle = document.createElement('h3');
  sectionTitle.textContent = 'Baukosten';
  sectionTitle.style.margin = '0 0 0.8em 0';
  sectionTitle.style.fontSize = '1.2em';
  sectionTitle.style.color = '#333';
  section.appendChild(sectionTitle);

  const costs = [
    { name: 'Siedlung', cost: '🪵 🧱 🌾 🐑' },
    { name: 'Stadt', cost: '🌾🌾 ⚙️⚙️⚙️' },
    { name: 'Straße', cost: '🪵 🧱' },
    { name: 'Entwicklungskarte', cost: '🌾 🐑 ⚙️' }
  ];

  const costsList = document.createElement('div');
  costsList.style.display = 'flex';
  costsList.style.flexDirection = 'column';
  costsList.style.gap = '0.5em';

  costs.forEach(item => {
    const costItem = document.createElement('div');
    costItem.style.display = 'flex';
    costItem.style.justifyContent = 'space-between';
    costItem.style.alignItems = 'center';
    costItem.style.fontSize = '0.95em';
    costItem.style.padding = '0.3em 0';
    costItem.style.borderBottom = '1px solid #ddd';

    const nameSpan = document.createElement('span');
    nameSpan.textContent = item.name;
    nameSpan.style.fontWeight = 'bold';
    nameSpan.style.color = '#333';

    const costSpan = document.createElement('span');
    costSpan.textContent = item.cost;
    costSpan.style.fontSize = '1.1em';

    costItem.appendChild(nameSpan);
    costItem.appendChild(costSpan);
    costsList.appendChild(costItem);
  });

  section.appendChild(costsList);
  return section;
}

function createRulesSection() {
  const section = document.createElement('div');
  section.style.padding = '1em';
  section.style.background = '#f8f9fa';
  section.style.borderRadius = '0.5em';
  section.style.border = '1px solid #eee';

  const sectionTitle = document.createElement('h3');
  sectionTitle.textContent = 'Spielregeln (Kurzfassung)';
  sectionTitle.style.margin = '0 0 0.8em 0';
  sectionTitle.style.fontSize = '1.2em';
  sectionTitle.style.color = '#333';
  section.appendChild(sectionTitle);

  const rules = [
    '🎲 Würfeln → Ressourcen erhalten',
    '🏘️ Siedlungen/Städte an Kreuzungen bauen',
    '🛤️ Straßen an Kanten bauen',
    '🏬 Im Markt: Ressourcen tauschen & Karten kaufen',
    '🎯 Bei 7: Räuber versetzen',
    '🃏 Entwicklungskarten spielen für Vorteile',
    '🏆 Ziel: 10 Siegpunkte erreichen'
  ];

  const rulesList = document.createElement('div');
  rulesList.style.display = 'flex';
  rulesList.style.flexDirection = 'column';
  rulesList.style.gap = '0.4em';

  rules.forEach(rule => {
    const ruleItem = document.createElement('div');
    ruleItem.textContent = rule;
    ruleItem.style.fontSize = '0.95em';
    ruleItem.style.color = '#555';
    ruleItem.style.padding = '0.2em 0';
    rulesList.appendChild(ruleItem);
  });

  section.appendChild(rulesList);
  return section;
}

function createQuitSection() {
  const section = document.createElement('div');
  section.style.padding = '1em';
  section.style.background = '#fff2f2';
  section.style.borderRadius = '0.5em';
  section.style.border = '1px solid #ffcccc';

  const sectionTitle = document.createElement('h3');
  sectionTitle.textContent = 'Spiel beenden';
  sectionTitle.style.margin = '0 0 0.8em 0';
  sectionTitle.style.fontSize = '1.2em';
  sectionTitle.style.color = '#c44';
  section.appendChild(sectionTitle);

  const description = document.createElement('p');
  description.textContent = 'Beendet das aktuelle Spiel und kehrt zum Hauptmenü zurück.';
  description.style.margin = '0 0 1em 0';
  description.style.fontSize = '0.95em';
  description.style.color = '#666';
  section.appendChild(description);

  const quitBtn = document.createElement('button');
  quitBtn.textContent = 'Spiel beenden';
  quitBtn.style.fontSize = '1em';
  quitBtn.style.padding = '0.5em 1.5em';
  quitBtn.style.borderRadius = '0.4em';
  quitBtn.style.border = 'none';
  quitBtn.style.background = '#c44';
  quitBtn.style.color = '#fff';
  quitBtn.style.cursor = 'pointer';
  quitBtn.style.fontWeight = 'bold';
  quitBtn.style.transition = 'background 0.2s';

  quitBtn.onmouseenter = () => {
    quitBtn.style.background = '#a33';
  };
  quitBtn.onmouseleave = () => {
    quitBtn.style.background = '#c44';
  };

  quitBtn.onclick = () => {
    // Bestätigungs-Dialog
    const confirmed = confirm('Möchten Sie das Spiel wirklich beenden und zum Hauptmenü zurückkehren?');
    if (confirmed) {
      // Spiel beenden und zum Hauptmenü zurückkehren
      hideSettingsMenu();
      quitGame();
    }
  };

  section.appendChild(quitBtn);
  return section;
}

function toggleSettingsMenu() {
  if (settingsMenuOpen) {
    hideSettingsMenu();
  } else {
    showSettingsMenu();
  }
}

function showSettingsMenu() {
  if (settingsPopup) {
    settingsPopup.style.display = 'block';
    settingsMenuOpen = true;
    
    // Update Tile-Info Toggle Status
    const toggleBtn = document.getElementById('tile-info-toggle-btn');
    if (toggleBtn) {
      const enabled = isInfoOverlayEnabled();
      toggleBtn.textContent = enabled ? 'Feld-Info: AN' : 'Feld-Info: AUS';
      toggleBtn.style.background = enabled ? '#2a8c2a' : '#c44';
    }
  }
}

function hideSettingsMenu() {
  if (settingsPopup) {
    settingsPopup.style.display = 'none';
    settingsMenuOpen = false;
  }
}

function quitGame() {
  // Spiel zurücksetzen und Hauptmenü anzeigen
  try {
    // Reload the page to reset everything
    window.location.reload();
  } catch (error) {
    console.error('Fehler beim Beenden des Spiels:', error);
    // Fallback: Hauptmenü anzeigen
    const mainMenu = document.getElementById('main-menu');
    if (mainMenu) {
      mainMenu.style.display = 'flex';
    }
  }
}

// Exportiere die Funktionen
export { showSettingsMenu, hideSettingsMenu, toggleSettingsMenu };
