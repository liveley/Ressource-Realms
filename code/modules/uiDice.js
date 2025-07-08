// === UI: Würfeln-Button ===
// modules/uiDice.js
// Würfel-UI für Catan 3D

let diceUI = null;
let diceResult = null;
let diceBtn = null;
let diceBar = null;

// callback: Funktion, die beim Klick auf "Würfeln" ausgeführt wird
export function createDiceUI(onRoll, parent) {
  diceUI = document.createElement('div');
  diceUI.id = 'dice-ui';
  diceUI.style.display = 'flex';
  diceUI.style.flexDirection = 'column';
  diceUI.style.alignItems = 'center';
  diceUI.style.justifyContent = 'flex-end';
  diceUI.style.margin = '0';
  diceUI.style.padding = '0';
  diceUI.style.boxSizing = 'border-box';

  // Ergebnis über dem Button
  const resultDiv = document.createElement('div');
  resultDiv.id = 'dice-result';
  resultDiv.style.color = '#fff';
  resultDiv.style.fontSize = '2em';
  resultDiv.style.minWidth = '2em';
  resultDiv.style.minHeight = '1.5em';
  resultDiv.style.textShadow = '0 2px 8px #000';
  resultDiv.style.fontFamily = "'Montserrat', Arial, sans-serif";
  resultDiv.style.display = 'block';
  resultDiv.style.marginBottom = '0.3em';
  resultDiv.style.textAlign = 'center';

  // Button wie die anderen Action-Buttons
  const diceButton = document.createElement('button');
  diceButton.id = 'roll-dice';
  diceButton.style.fontSize = '2.5em';
  diceButton.style.padding = '0.4em';
  diceButton.style.margin = '0';
  diceButton.style.cursor = 'pointer';
  diceButton.style.borderRadius = '6px';
  diceButton.style.aspectRatio = 'auto';
  diceButton.textContent = '🎲';

  diceUI.appendChild(resultDiv);
  diceUI.appendChild(diceButton);

  if (parent) {
    parent.appendChild(diceUI);
  } else {
    document.body.appendChild(diceUI);
  }

  diceBtn = diceButton;
  diceResult = resultDiv;

  // ZUERST ins DOM einfügen, dann erst getElementById!
  if (parent) {
    parent.appendChild(diceUI);
  } else {
    document.body.appendChild(diceUI);
  }

  diceBtn = document.getElementById('roll-dice');
  diceResult = document.getElementById('dice-result');

  if (!diceBtn) {
    console.error('Würfeln-Button konnte nicht gefunden werden!');
    return;
  }

  diceBtn.onclick = () => {
    if (typeof onRoll === 'function') onRoll();
  };
}

export function setDiceResult(sum) {
  if (diceResult) {
    diceResult.textContent = sum;
    diceResult.style.color = '#fff';
  }
}

/**
 * Block the dice button with a reason message
 * @param {string} reason - The reason to show why dice are blocked
 */
export function blockDiceRolls(reason = "Aktion erforderlich") {
  if (!diceBtn) return;
  
  // Store the original click handler
  diceBtn._origOnClick = diceBtn.onclick;
  diceBtn.onclick = () => {}; // Empty handler
  
  // Add visual indication
  diceBtn.style.opacity = "0.5";
  diceBtn.style.cursor = "not-allowed";
  diceBtn.disabled = true;
    // Show reason only as tooltip
  diceBtn.title = `Würfeln blockiert: ${reason}`;
}

/**
 * Unblock the dice button
 */
export function unblockDiceRolls() {
  if (!diceBtn) return;
  
  // Restore original click handler
  if (diceBtn._origOnClick) {
    diceBtn.onclick = diceBtn._origOnClick;
    diceBtn._origOnClick = null;
  }
    // Remove visual indication
  diceBtn.style.opacity = "1";
  diceBtn.style.cursor = "pointer";
  diceBtn.disabled = false;
  diceBtn.title = "";
}
