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

  const seaColors = ['#256D9B', '#2F7AA8', '#4B94C2', '#6BB1D5', '#91CBE8', '#B2E1F6'];
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

      if (rowIndex === 3 && i === 2) {
        hex.id = 'start-game-hex';
        hex.innerHTML = '<span style="color: white; font-weight: bold; font-size: 40px; line-height: 1; text-align: center; text-shadow: 1px 1px 2px #000;">Spiel<br>starten</span>';
        hex.onclick = () => {
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
      } else if (rowIndex === 3 && i === 1) {
        hex.id = 'quit-game-hex';
        hex.innerHTML = '<span style="color: white; font-weight: bold; font-size: 40px; line-height: 1; text-align: center; text-shadow: 1px 1px 2px #000;">Spiel<br>beenden</span>';
        hex.onclick = () => {
          window.close();
        };
      }

      sidebar.appendChild(hex);
    });

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
}
