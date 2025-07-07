// Erstellt die linke Hexfeld-Sidebar für den Startbildschirm
let resizeTimeout = null;

export function createMainMenuSidebar() {
  // Vorherige Sidebar entfernen, falls vorhanden
  removeMainMenuSidebar();

  // Hexagon-Koordinaten für die rechte Hälfte eines klassischen Catan-Felds (2,3,4,3,2)
  // Wir nehmen nur die "rechte" Hälfte (q >= 0)
  // Axiale Koordinaten: (q, r)
  const hexCoords = [
    [0, -2], [1.25, -2],
    [0.5, -0.75], [1.75, -0.75],
    [0, 0.5], [1.25, 0.5], [2.5, 0.5],
    [0.5, 2], [1.75, 2],
    [0, 3.5], [1.25, 3.5]
  ];
  // Farben auf die Anzahl der Hexes begrenzen
  const colors = [
    "#f4d35e", "#ee964b", "#f95738", "#43aa8b", "#577590",
    "#b5ead7", "#ffdac1", "#ffb7b2", "#b5ead7", "#c7ceea",
  ];

  // Sidebar-Container
  const sidebar = document.createElement('div');
  sidebar.id = 'catan-hex-sidebar';
  sidebar.style.position = 'fixed';
  sidebar.style.left = '0';
  sidebar.style.top = '0';
  sidebar.style.bottom = '0';
  sidebar.style.width = 'min(38vw, 340px)';
  sidebar.style.zIndex = '10';
  sidebar.style.background = 'linear-gradient(135deg, #f4e2d8 0%, #ba5370 100%)';
  sidebar.style.pointerEvents = 'none';
  sidebar.style.overflow = 'hidden';
  sidebar.style.borderTopRightRadius = '32px';
  sidebar.style.borderBottomRightRadius = '32px';
  sidebar.style.boxShadow = '2px 0 16px #0002';

  // Layout-Parameter
  const gap = 10; // px Abstand zwischen Hexes
  const hexCountVert = 5; // Maximale Anzahl Hexes vertikal (wie beim Catan-Feld)
  const sidebarHeight = window.innerHeight;
  // Berechne die maximale Hexhöhe so, dass alles reinpasst (inkl. Gaps)
  const hexHeight = Math.floor((sidebarHeight - (hexCountVert - 1) * gap) / hexCountVert);
  const hexWidth = Math.round(hexHeight * Math.sqrt(3) / 2);

  // Offset für die Sidebar, damit alles mittig ist
  const minQ = Math.min(...hexCoords.map(([q, _]) => q));
  const minR = Math.min(...hexCoords.map(([_, r]) => r));

  // Container für alle Hexes (absolute Positionierung)
  const hexContainer = document.createElement('div');
  hexContainer.style.position = 'relative';
  hexContainer.style.width = '100%';
  hexContainer.style.height = '100%';

  // Hilfsfunktion: axiale Koordinaten zu Pixel
  function axialToPixel(q, r) {
    // Pointy-top Hexes
    const x = (q - minQ) * (hexWidth + gap * 0.5);
    const y = (r - minR) * (hexHeight * 0.75 + gap * 0.25);
    return { x, y };
  }

  hexCoords.forEach(([q, r], idx) => {
    const { x, y } = axialToPixel(q, r);
    const hex = document.createElement('div');
    hex.style.position = 'absolute';
    hex.style.left = `${x}px`;
    hex.style.top = `${y}px`;
    hex.style.width = `${hexWidth}px`;
    hex.style.height = `${hexHeight}px`;
    hex.style.background = colors[idx % colors.length];
    hex.style.clipPath = 'polygon(50% 0%, 100% 25%, 100% 75%, 50% 100%, 0% 75%, 0% 25%)';
    hex.style.boxShadow = '0 2px 12px #0003';
    hex.style.pointerEvents = 'auto';
    hex.style.transition = 'box-shadow 0.2s, transform 0.2s';
    hex.style.borderRadius = '12px';
    // hex.textContent = `${q},${r}`; // Debug
    hexContainer.appendChild(hex);
  });

  sidebar.appendChild(hexContainer);
  document.body.appendChild(sidebar);

  // Responsiv: Bei Resize neu berechnen (debounced)
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
  let old = document.getElementById('catan-hex-sidebar');
  if (old) old.remove();
}
