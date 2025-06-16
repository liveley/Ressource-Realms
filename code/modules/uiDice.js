// modules/uiDice.js
// Würfel-UI für Catan 3D

let diceUI = null;
let diceResult = null;
let diceBtn = null;

// callback: Funktion, die beim Klick auf "Würfeln" ausgeführt wird
export function createDiceUI(onRoll) {
  diceUI = document.createElement('div');
  diceUI.id = 'dice-ui';
  diceUI.style.position = 'absolute';
  diceUI.style.top = '2em';
  diceUI.style.left = '2em';
  diceUI.style.zIndex = '5';
  diceUI.style.display = 'flex';
  diceUI.style.flexDirection = 'column';
  diceUI.style.alignItems = 'flex-start';
  document.body.appendChild(diceUI);

  diceUI.innerHTML = `
    <button id="roll-dice" style="font-size: 1.5em; padding: 0.5em 2em; margin-bottom: 0.5em; cursor: pointer;">Würfeln</button>
    <div id="dice-result" style="color: #fff; font-size: 2em; min-width: 2em; min-height: 1.5em; text-shadow: 0 2px 8px #000; font-family: 'Montserrat', Arial, sans-serif; display: inline-block; margin-left: 1em; vertical-align: middle;"></div>
  `;

  diceBtn = document.getElementById('roll-dice');
  diceResult = document.getElementById('dice-result');

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
