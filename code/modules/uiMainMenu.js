let resizeTimeout = null;

export function createMainMenuSidebar() {
  removeMainMenuSidebar();

  const sidebar = document.createElement('div');
  sidebar.id = 'catan-hex-sidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.top = '0';
  sidebar.style.bottom = '0';
  sidebar.style.width = 'min(50vw, 550px)';
  sidebar.style.zIndex = '9999';
  //sidebar.style.background = 'linear-gradient(135deg, #f4e2d8 0%, #ba5370 100%)';
  sidebar.style.pointerEvents = 'none';
  sidebar.style.overflow = 'hidden';
  //sidebar.style.boxShadow = '2px 0 16px #0002';

  const gap = 5;
  const hexSpacing = 20;
  const hexCountVert = 5;
  const sidebarHeight = window.innerHeight;
  let hexHeight = Math.floor((sidebarHeight - (hexCountVert - 1) * gap) / hexCountVert);
  hexHeight = Math.round(hexHeight * 1.5);
  const hexWidth = Math.round(hexHeight * Math.sqrt(3) / 2);

  const verticalOffset = hexHeight * 0.85;
  const centerOffset = (hexWidth + hexSpacing) / 2;
  const shiftX = -(hexWidth / 2); // ganze Layout nach links verschoben

  // Gemutete Farbtöne für die Ressourcen
  const terrainColors = {
    forest: '#6B8E6E',
    pasture: '#A6C48A',
    field: '#D0B763',
    hill: '#C48B68',
    mountain: '#888888',
    desert: '#C6B198'
  };

  // Verteilung in 2-3-4-3-2 Layout (Wüste ganz links in der Mitte)
  const layout = [
    [terrainColors.field, terrainColors.mountain],
    [terrainColors.hill, terrainColors.forest, terrainColors.pasture],
    [terrainColors.desert, terrainColors.mountain, terrainColors.field], // Mitte gekürzt
    [terrainColors.hill, terrainColors.forest, terrainColors.pasture],
    [terrainColors.field, terrainColors.mountain]
  ];

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
      sidebar.appendChild(hex);
    });
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
  const old = document.getElementById('catan-hex-sidebar');
  if (old) old.remove();
}
