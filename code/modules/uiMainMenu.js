let resizeTimeout = null;

export function createMainMenuSidebar() {
  removeMainMenuSidebar();

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

  const sidebar = document.createElement('div');
  sidebar.id = 'catan-hex-sidebar';
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
      quitHex.style.background = seaColors[2]; // Meerhex-Farbe
      quitHex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      quitHex.style.boxShadow = '0 2px 12px #0002';
      quitHex.style.pointerEvents = 'auto';
      quitHex.style.transition = 'box-shadow 0.2s, transform 0.2s';
      quitHex.style.borderRadius = '12px';
      quitHex.style.display = 'flex';
      quitHex.style.alignItems = 'center';
      quitHex.style.justifyContent = 'center';
      quitHex.style.cursor = 'pointer';
      quitHex.id = 'quit-game-hex';
      quitHex.innerHTML = `
        <span style="
          color: #ffffff !important;
          font-family: 'Montserrat', sans-serif;
          font-weight: bold;
          font-size: 32px;
          line-height: 1;
          text-align: center;
          background: transparent !important;
          text-shadow: none !important;
          border: none !important;
          outline: none !important;
          text-decoration: none !important;
        ">Spiel<br>beenden</span>
      `;
      quitHex.onclick = () => {
        window.close();
      };
      sidebar.appendChild(quitHex);

      // Start Game Button (Position 4)
      const startHex = document.createElement('div');
      startHex.style.position = 'absolute';
      startHex.style.left = `${xStart + 4 * (hexWidth + hexSpacing) + shiftX}px`;
      startHex.style.top = `calc(50% + ${yOffset}px)`;
      startHex.style.transform = 'translateY(-50%)';
      startHex.style.width = `${hexWidth}px`;
      startHex.style.height = `${hexHeight}px`;
      startHex.style.background = seaColors[4]; // Meerhex-Farbe
      startHex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
      startHex.style.boxShadow = '0 2px 12px #0002';
      startHex.style.pointerEvents = 'auto';
      startHex.style.transition = 'box-shadow 0.2s, transform 0.2s';
      startHex.style.borderRadius = '12px';
      startHex.style.display = 'flex';
      startHex.style.alignItems = 'center';
      startHex.style.justifyContent = 'center';
      startHex.style.cursor = 'pointer';
      startHex.id = 'start-game-hex';
      startHex.innerHTML = `
        <span style="
          color: #ffffff !important;
          font-family: 'Montserrat', sans-serif;
          font-weight: bold;
          font-size: 40px;
          line-height: 1;
          text-align: center;
          background: transparent !important;
          text-shadow: none !important;
          border: none !important;
          outline: none !important;
          text-decoration: none !important;
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
    <h2 style="
      color: white; 
      font-family: 'Montserrat', sans-serif; 
      font-weight: bold; 
      font-size: 2.2em; 
      margin: 0 0 20px 0;
      text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
    "></h2>
    
    <div style="
      color: #256D9B; 
      font-family: 'Montserrat', sans-serif; 
      font-size: 1.1em; 
      line-height: 1.6;
      text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.3);
    ">
      <p style="margin: 15px 0; font-size: 1.25em;">
      Dieses Projekt ist als Teil des <strong>Projektmoduls Prozesse 2025</strong> an der <strong>Hochschule München</strong> im Studiengang Studiengang Informatik & Design entstanden.<strong> Gebaut von Gruppe 4</strong><br>
      
    <p style="margin: 15px 0;">
      Eine 3D-Implementierung des beliebten Brettspiels 
      <a href="https://www.catan.de/" target="_blank" style="color: #4B94C2; font-weight: bold; text-decoration: underline;">
        Catan
      </a>, entwickelt mit 
      <a href="https://threejs.org/" target="_blank" style="color: #4B94C2; font-weight: bold; text-decoration: underline;">
        Three.js
      </a> und 
      <a href="https://www.blender.org/" target="_blank" style="color: #4B94C2; font-weight: bold; text-decoration: underline;">
        Blender
      </a>.
    </p>

      <p>
        Weitere Informationen
        <a 
          href="https://gitlab.lrz.de/ab-2025sose/pp/groupprojects/projektrepo-gruppe4" 
          target="_blank"
          style="color: #4B94C2; font-weight: bold; text-decoration: underline;"
        >
          auf Gitlab.
        </a>
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
  const oldSidebar = document.getElementById('catan-hex-sidebar');
  if (oldSidebar) oldSidebar.remove();
  
  const oldInfoContainer = document.getElementById('project-info-container');
  if (oldInfoContainer) oldInfoContainer.remove();
}
