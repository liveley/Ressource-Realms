// Simple game loading management
let gameConfig = null;
let isGameInitialized = false;

// Load configuration
async function loadGameConfig() {
  try {
    const response = await fetch('./index.json');
    gameConfig = await response.json();
    return gameConfig;
  } catch (error) {
    console.error('Failed to load game configuration:', error);
    return null;
  }
}

// Show the actual game loading overlay
function showGameLoadingOverlay() {
  const overlay = document.getElementById('game-loading-overlay');
  const loadingText = document.getElementById('game-loading-text');
  const loadingDetails = document.getElementById('game-loading-details');
  
  overlay.style.display = 'flex';
  startHexSpinner(); // Ensure spinner always starts
  
  // Update loading text periodically to show progress
  const loadingSteps = [
    { text: 'Terrain wird geladen...', details: 'Hexagon-Felder werden generiert...' },
    { text: 'Ressourcen werden platziert...', details: 'Holz, Lehm, Weizen, Wolle und Erz werden verteilt...' },
    { text: 'Nummern-Token werden hinzugefügt...', details: 'Würfelzahlen werden auf die Felder gesetzt...' },
    { text: 'Wächter wird initialisiert...', details: 'Der Wächter wird auf dem Wüstenfeld platziert...' },
    { text: 'Benutzeroberfläche wird vorbereitet...', details: 'Buttons und Menüs werden erstellt...' },
    { text: 'Spiel wird finalisiert...', details: 'Letzte Vorbereitungen werden getroffen...' }
  ];
  
  let currentStep = 0;
  const stepInterval = setInterval(() => {
    if (currentStep < loadingSteps.length) {
      loadingText.textContent = loadingSteps[currentStep].text;
      loadingDetails.textContent = loadingSteps[currentStep].details;
      currentStep++;
    } else {
      clearInterval(stepInterval);
    }
  }, 800);
  
  return stepInterval;
}

// Hide the game loading overlay
function hideGameLoadingOverlay() {
  const overlay = document.getElementById('game-loading-overlay');
  overlay.style.display = 'none';
  stopHexSpinner(); // Ensure spinner always stops
}

// Initialize everything when DOM is loaded
window.addEventListener('DOMContentLoaded', async () => {
  console.log('DOM geladen, initialisiere Spiel...');
  
  const menu = document.getElementById('main-menu');
  
  // Load configuration
  gameConfig = await loadGameConfig();
  
  // Initialize main menu sidebar
  try {
    const { createMainMenuSidebar } = await import('./modules/uiMainMenu.js');
    createMainMenuSidebar();
    console.log('Main menu sidebar created successfully');
  } catch (error) {
    console.error('Error creating main menu sidebar:', error);
  }
  
  // Funktion für Start-Button (sowohl HTML als auch Hexagon)
  window.startGameFromMenu = async () => {
    if (isGameInitialized) return;
    
    console.log('Start-Button wurde geklickt!');
    
    // Hide menu and show loading overlay
    menu.style.display = 'none';
    const loadingInterval = showGameLoadingOverlay();
    
    // Remove main menu sidebar
    try {
      const { removeMainMenuSidebar } = await import('./modules/uiMainMenu.js');
      removeMainMenuSidebar();
      console.log('Main menu sidebar removed successfully');
    } catch (error) {
      console.error('Error removing main menu sidebar:', error);
    }
    
    try {
      // Wait for main.js to be ready and trigger game initialization
      await new Promise((resolve) => {
        // Listen for game ready event
        window.addEventListener('gameReady', resolve, { once: true });
        
        // Trigger game initialization
        window.dispatchEvent(new CustomEvent('initializeGame'));
        
        // Fallback timeout in case something goes wrong
        setTimeout(resolve, 10000); // 10 second fallback
      });
      
      isGameInitialized = true;
      clearInterval(loadingInterval);
      
      // Small delay to ensure everything is ready
      setTimeout(() => {
        hideGameLoadingOverlay();
        console.log('Game loading complete!');
      }, 500);
      
    } catch (error) {
      console.error('Error during game initialization:', error);
      clearInterval(loadingInterval);
      hideGameLoadingOverlay();
      
      // Show error and return to menu
      alert('Fehler beim Laden des Spiels. Bitte versuchen Sie es erneut.');
      menu.style.display = 'flex';
    }
  };
});

// 3D-Look für Überschrift animieren (leichtes Schimmern)
function animateTitle() {
  const title = document.getElementById('main-title');
  if (!title) return;
  
  let titleAnimT = 0;
  
  function animate() {
    titleAnimT += 0.03;
    const glow = 0.7 + 0.3 * Math.sin(titleAnimT);
    title.style.filter = `drop-shadow(0 0 ${16 + 8 * glow}px #ffe066)`;
    requestAnimationFrame(animate);
  }
  
  animate();
}

// Start title animation when DOM is loaded
window.addEventListener('DOMContentLoaded', animateTitle);

// --- Smooth Hexagon Spinner (single interval, zero overlap) ---
let spinnerTimer = null;
const STEP_MS = 240;             // 200 ms bright + 40 ms gap

function startHexSpinner() {
  const hexes = document.querySelectorAll('.game-loading-spinner .hex');
  if (!hexes.length || spinnerTimer) return;    // already running?

  let i = 0;
  hexes[i].classList.add('highlight');          // first light

  spinnerTimer = setInterval(() => {
    hexes[i].classList.remove('highlight');     // start fade‑out
    i = (i + 1) % hexes.length;                 // next hex
    hexes[i].classList.add('highlight');        // instant full bright
  }, STEP_MS);
}

function stopHexSpinner() {
  clearInterval(spinnerTimer);
  spinnerTimer = null;
  document
    .querySelectorAll('.game-loading-spinner .hex')
    .forEach(h => h.classList.remove('highlight'));
}