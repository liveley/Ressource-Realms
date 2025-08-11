let resizeTimeout = null;

export function createMainMenuSidebar() {
  removeMainMenuSidebar();
  
  // HTML-Titel ist bereits unsichtbar (opacity: 0) - kein zusätzliches Verstecken nötig

  const gap = 5;
  const hexSpacing = 20;
  const hexCountVert = 5;
  const sidebarHeight = window.innerHeight;
  const sidebarWidth = window.innerWidth;
  let hexHeight = Math.floor((sidebarHeight - (hexCountVert - 1) * gap) / hexCountVert);
  hexHeight = Math.round(hexHeight * 1.5);
  const hexWidth = Math.round(hexHeight * Math.sqrt(3) / 2);
  const verticalOffset = hexHeight * 0.85;
  const centerOffset = (hexWidth + hexSpacing) / 2;
  const shiftX = -(hexWidth / 2);

  const terrainColors = {
    forest: '#6B8E6E',
    pasture: '#A6C48A',
    field: '#D0B763',
    hill: '#C48B68',
    mountain: '#888888',
    desert: '#C6B198'
  };

  const layout = [
    [terrainColors.field, terrainColors.mountain],
    [terrainColors.hill, terrainColors.forest, terrainColors.pasture],
    [terrainColors.desert, terrainColors.mountain, terrainColors.field],
    [terrainColors.hill, terrainColors.forest, terrainColors.pasture],
    [terrainColors.field, terrainColors.mountain]
  ];

  const seaColors = ['#387FAC', '#2F7AA8', '#4B94C2', '#6BB1D5', '#91CBE8', '#B2E1F6'];
  const seaOpacity = [0.8, 0.6, 0.5, 0.4, 0.3, 0.2];

  // Funktion um Hex zu RGBA zu konvertieren
  function hexToRgba(hex, alpha) {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }

  const sidebar = document.createElement('div');
  sidebar.id = 'resource-realms-hex-sidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.bottom = '0';
  sidebar.style.left = '0';
  sidebar.style.right = '0';
  sidebar.style.zIndex = '9999';
  sidebar.style.pointerEvents = 'none';
  sidebar.style.overflow = 'hidden';

  layout.forEach((row, rowIndex) => {
    let yOffset;
    let xStart;

    switch (rowIndex) {
      case 0: yOffset = -2 * verticalOffset; xStart = 0; break;
      case 1: yOffset = -1 * verticalOffset; xStart = centerOffset - (hexWidth + hexSpacing); break;
      case 2: yOffset = 0; xStart = 0; break;
      case 3: yOffset = 1 * verticalOffset; xStart = centerOffset - (hexWidth + hexSpacing); break;
      case 4: yOffset = 2 * verticalOffset; xStart = 0; break;
    }

    // LANDHEXES
    row.forEach((color, i) => {
      const hex = document.createElement('div');
      hex.style.position = 'absolute';
      hex.style.left = `${xStart + i * (hexWidth + hexSpacing) + shiftX}px`;
      hex.style.top = `calc(50% + ${yOffset}px)`;
      hex.style.transform = 'translateY(-50%)';
      hex.style.width = `${hexWidth}px`;
      hex.style.height = `${hexHeight}px`;
      hex.style.background = color;
      hex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      hex.style.boxShadow = '0 2px 12px #0002';
      hex.style.pointerEvents = 'auto';
      hex.style.transition = 'box-shadow 0.2s, transform 0.2s';
      hex.style.borderRadius = '12px';
      hex.style.display = 'flex';
      hex.style.alignItems = 'center';
      hex.style.justifyContent = 'center';
      hex.style.cursor = 'pointer';

      sidebar.appendChild(hex);
    });

    // ZUSÄTZLICHE HEXAGONS FÜR BUTTONS (um 2 Positionen nach rechts verschoben)
    if (rowIndex === 3) {
      // Quit Game Button (Position 3)
      const quitHex = document.createElement('div');
      quitHex.style.position = 'absolute';
      quitHex.style.left = `${xStart + 3 * (hexWidth + hexSpacing) + shiftX}px`;
      quitHex.style.top = `calc(50% + ${yOffset}px)`;
      quitHex.style.transform = 'translateY(-50%)';
      quitHex.style.width = `${hexWidth}px`;
      quitHex.style.height = `${hexHeight}px`;
      quitHex.style.background = hexToRgba(seaColors[2], seaOpacity[2]); // RGBA für Transparenz nur am Hintergrund
      quitHex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      quitHex.style.boxShadow = '0 2px 12px #0002';
      quitHex.style.pointerEvents = 'auto';
      quitHex.style.transition = 'box-shadow 0.2s, transform 0.2s';
      quitHex.style.borderRadius = '12px';
      quitHex.style.display = 'flex';
      quitHex.style.alignItems = 'center';
      quitHex.style.justifyContent = 'center';
      quitHex.style.cursor = 'pointer';
      quitHex.style.isolation = 'isolate'; // Isoliert das Element vom Stacking Context
      quitHex.style.zIndex = '10000'; // Höher als main-menu backdrop-filter
      quitHex.id = 'quit-game-hex';
      quitHex.innerHTML = `
        <span style="
          color: #ffffff;
          opacity: 1;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 28px;
          line-height: 1.1;
          text-align: center;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 1), 0 0 8px rgba(0, 0, 0, 0.8), 1px 1px 0 rgba(0, 0, 0, 1);
          user-select: none;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        ">Spiel<br>beenden</span>
      `;
      quitHex.onclick = () => {
        window.close();
      };
      
      // Hover-Effekte für bessere Sichtbarkeit
      quitHex.addEventListener('mouseenter', () => {
        quitHex.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        quitHex.style.transform = 'translateY(-50%) scale(1.05)';
      });
      quitHex.addEventListener('mouseleave', () => {
        quitHex.style.boxShadow = '0 2px 12px #0002';
        quitHex.style.transform = 'translateY(-50%) scale(1)';
      });
      
      sidebar.appendChild(quitHex);

      // Start Game Button (Position 4)
      const startHex = document.createElement('div');
      startHex.style.position = 'absolute';
      startHex.style.left = `${xStart + 4 * (hexWidth + hexSpacing) + shiftX}px`;
      startHex.style.top = `calc(50% + ${yOffset}px)`;
      startHex.style.transform = 'translateY(-50%)';
      startHex.style.width = `${hexWidth}px`;
      startHex.style.height = `${hexHeight}px`;
      startHex.style.background = hexToRgba(seaColors[3], seaOpacity[3]); // RGBA für Transparenz nur am Hintergrund
      startHex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      startHex.style.boxShadow = '0 2px 12px #0002';
      startHex.style.pointerEvents = 'auto';
      startHex.style.transition = 'box-shadow 0.2s, transform 0.2s';
      startHex.style.borderRadius = '12px';
      startHex.style.display = 'flex';
      startHex.style.alignItems = 'center';
      startHex.style.justifyContent = 'center';
      startHex.style.cursor = 'pointer';
      startHex.style.isolation = 'isolate'; // Isoliert das Element vom Stacking Context
      startHex.style.zIndex = '10000'; // Höher als main-menu backdrop-filter
      startHex.id = 'start-game-hex';
      startHex.innerHTML = `
        <span style="
          color: #ffffff;
          opacity: 1;
          font-family: 'Montserrat', sans-serif;
          font-weight: 900;
          font-size: 32px;
          line-height: 1.1;
          text-align: center;
          text-shadow: 3px 3px 6px rgba(0, 0, 0, 1), 0 0 8px rgba(0, 0, 0, 0.8), 1px 1px 0 rgba(0, 0, 0, 1);
          user-select: none;
          -webkit-font-smoothing: antialiased;
          text-rendering: optimizeLegibility;
        ">Spiel<br>starten</span>
      `;      
      startHex.onclick = () => {
        const menu = document.getElementById('main-menu');
        if (menu) menu.style.display = 'none';
        removeMainMenuSidebar();
        if (window.startGameFromMenu) {
          window.startGameFromMenu();
        } else {
          import('../main.js').then(() => {
            window.dispatchEvent(new CustomEvent('initializeGame'));
          });
        }
      };
      
      // Hover-Effekte für bessere Sichtbarkeit
      startHex.addEventListener('mouseenter', () => {
        startHex.style.boxShadow = '0 4px 20px rgba(0,0,0,0.3)';
        startHex.style.transform = 'translateY(-50%) scale(1.05)';
      });
      startHex.addEventListener('mouseleave', () => {
        startHex.style.boxShadow = '0 2px 12px #0002';
        startHex.style.transform = 'translateY(-50%) scale(1)';
      });
      
      sidebar.appendChild(startHex);
    }

    // MEERHEXES rechts neben Land
    const maxCols = Math.ceil(sidebarWidth / (hexWidth + hexSpacing)) + 2;
    for (let i = row.length; i < maxCols; i++) {
      const waterIndex = i - row.length;
      if (rowIndex === 1 && waterIndex >= 0 && (waterIndex === 0 || waterIndex === 1)) continue;

      const hex = document.createElement('div');
      hex.style.position = 'absolute';
      hex.style.left = `${xStart + i * (hexWidth + hexSpacing) + shiftX}px`;
      hex.style.top = `calc(50% + ${yOffset}px)`;
      hex.style.transform = 'translateY(-50%)';
      hex.style.width = `${hexWidth}px`;
      hex.style.height = `${hexHeight}px`;
      hex.style.background = seaColors[waterIndex % seaColors.length];
      hex.style.opacity = seaOpacity[waterIndex % seaOpacity.length];
      hex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      hex.style.pointerEvents = 'none';
      hex.style.borderRadius = '12px';
      sidebar.appendChild(hex);
    }
  });

  // ÜBERSCHRIFT dort, wo die ersten beiden Meerhexes übersprungen werden (Reihe 1)
  // Diese werden in der Meerhex-Schleife mit continue übersprungen
  const titleRowIndex = 1;
  const titleYOffset = -1 * verticalOffset; // Gleiche Y-Position wie Reihe 1
  const titleXStart = centerOffset - (hexWidth + hexSpacing); // Gleiche xStart-Berechnung wie für Reihe 1
  const row1Length = layout[1].length; // Anzahl der Landhexes in Reihe 1 (3)
  
  // Position direkt nach den Landhexes, wo die ersten beiden Meerhexes stehen würden
  const titleLeft = titleXStart + row1Length * (hexWidth + hexSpacing) + shiftX;
  const titleWidth = 2 * hexWidth + hexSpacing; // Breite von 2 Hex-Tiles plus Spacing
  
  const resourceRealmsTitle = document.createElement('div');
  resourceRealmsTitle.id = 'resource-realms-title';
  resourceRealmsTitle.style.position = 'absolute';
  resourceRealmsTitle.style.left = `${titleLeft}px`;
  resourceRealmsTitle.style.top = `calc(50% + ${titleYOffset}px)`;
  resourceRealmsTitle.style.transform = 'translateY(-50%)';
  resourceRealmsTitle.style.width = `${titleWidth}px`;
  resourceRealmsTitle.style.height = `${hexHeight}px`;
  resourceRealmsTitle.style.display = 'flex';
  resourceRealmsTitle.style.alignItems = 'center';
  resourceRealmsTitle.style.justifyContent = 'center';
  resourceRealmsTitle.style.pointerEvents = 'none';
  resourceRealmsTitle.style.zIndex = '10001'; // Über den Hex-Tiles
  
  // Dynamische Schriftgröße - aggressivere Skalierung für höhere Auflösungen
  const baseFontSize = titleWidth / 7; // Etwas größere Basis für bessere Ausnutzung des Platzes
  const resolutionMultiplier = Math.max(
    1.0, // Minimum-Multiplier
    window.innerWidth / 1920 // Lineare Skalierung basierend auf Bildschirmbreite
  );
  const dynamicFontSize = baseFontSize * resolutionMultiplier;
  
  // Begrenzung: Mindestens 28px, maximal 90px
  const finalFontSize = Math.max(28, Math.min(90, dynamicFontSize));
  
  resourceRealmsTitle.innerHTML = `
    <h1 id="animated-resource-realms-title" style="
      color: #fff;
      font-family: 'Montserrat', sans-serif;
      font-weight: 700;
      font-size: ${finalFontSize}px;
      margin: 0;
      text-align: center;
      letter-spacing: 0.05em;
      text-shadow: 0 4px 16px #000, 0 2px 0 #ffe066, 0 6px 20px #222;
      filter: drop-shadow(0 0 12px #ffe066);
      line-height: 1.2;
      animation: titleGlow 2s ease-in-out infinite;
    ">Resource Realms</h1>
  `;
  
  sidebar.appendChild(resourceRealmsTitle);

  document.body.appendChild(sidebar);

  // PROJEKTINFORMATIONS-CONTAINER (rechtes Drittel)
  const infoContainer = document.createElement('div');
  infoContainer.id = 'project-info-container';
  infoContainer.style.position = 'fixed'
  ;infoContainer.style.top = '50%';
  infoContainer.style.transform = 'translateY(-50%)';
  infoContainer.style.right = '5vw';
  infoContainer.style.width = '28vw';
  infoContainer.style.height = '60vh';
  infoContainer.style.zIndex = '10000';
  infoContainer.style.pointerEvents = 'auto';
  infoContainer.style.overflowY = 'hidden'; // Kein Scrollen mehr, da Inhalt fixiert ist
  
  // Glasmorphismus-Effekt
  infoContainer.style.background = 'rgba(255, 255, 255, 0.1)';
  infoContainer.style.backdropFilter = 'blur(10px)';
  infoContainer.style.webkitBackdropFilter = 'blur(10px)';
  infoContainer.style.border = '1px solid rgba(255, 255, 255, 0.2)';
  infoContainer.style.borderRadius = '20px';
  infoContainer.style.boxShadow = '0 8px 32px rgba(0, 0, 0, 0.3)';
  
  // Container-Inhalt
  infoContainer.style.padding = '30px';
  infoContainer.style.display = 'flex';
  infoContainer.style.flexDirection = 'column';
  infoContainer.style.justifyContent = 'center';
  infoContainer.style.alignItems = 'center';
  infoContainer.style.textAlign = 'center';
  
  // Projektinformationen hinzufügen
  infoContainer.innerHTML = `
    <div style="
      color: #256D9B; 
      font-family: 'Montserrat', sans-serif; 
      font-size: 1.1em; 
      line-height: 1.6;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    ">
      <p style="margin: 15px 0; font-size: 1.25em;">
      Dieses Projekt ist als Teil des <strong>Projektmoduls Prozesse 2025</strong> an der <strong>Hochschule München</strong> im Studiengang Informatik & Design entstanden.<strong> Gebaut von <br>Gruppe 4 − Resource Realms.</strong><br>
      
    <p style="margin: 15px 0;">
      Eine 3D-Implementierung des Spiels
      <a style="color: #4B94C2; font-weight: bold;">Resource Realms</a>, entwickelt mit 
      <a href="https://threejs.org/" target="_blank" style="color: #4B94C2; font-weight: bold; text-decoration: underline;">Three.js</a> und 
      <a href="https://www.blender.org/" target="_blank" style="color: #4B94C2; font-weight: bold; text-decoration: underline;">Blender</a>.
    </p>


    </div>
  `;
  
  document.body.appendChild(infoContainer);

  window.removeEventListener('resize', handleSidebarResize);
  window.addEventListener('resize', handleSidebarResize);
}

function handleSidebarResize() {
  clearTimeout(resizeTimeout);
  resizeTimeout = setTimeout(() => {
    createMainMenuSidebar();
  }, 100);
}

export function removeMainMenuSidebar() {
  const oldSidebar = document.getElementById('resource-realms-hex-sidebar');
  if (oldSidebar) oldSidebar.remove();
  
  const oldInfoContainer = document.getElementById('project-info-container');
  if (oldInfoContainer) oldInfoContainer.remove();
  
  const oldTitle = document.getElementById('resource-realms-title');
  if (oldTitle) oldTitle.remove();
  
  // HTML-Titel nur einblenden wenn wir ins Spiel wechseln (als Fallback)
  // Nicht wenn die Sidebar nur neu erstellt wird
  const htmlTitle = document.getElementById('main-title');
  if (htmlTitle) {
    htmlTitle.style.opacity = '0'; // Standardmäßig unsichtbar lassen
  }
}
