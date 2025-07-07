# Catan 3D - Turn-Based System

## Überblick

Das Catan 3D-Spiel verfügt über ein vollständig refaktoriertes, robustes Turn-Based-System, das alle Spieler- und Phasenzustände zentral verwaltet.

## Architektur

### Single Source of Truth: `turnController.js`

Der `turnController` ist die **einzige Quelle der Wahrheit** für:
- ✅ Aktiver Spieler (`window.activePlayerIdx`)
- ✅ Aktuelle Spielphase (`currentPhase`)
- ✅ Phasenübergänge und Validierung
- ✅ UI-Updates über Callback-System

### Kernprinzipien

1. **Keine direkten Zugriffe** auf `window.activePlayerIdx` außerhalb des turnControllers
2. **Alle Module importieren** `getActivePlayerIdx()` und `setActivePlayerIdx()` direkt
3. **Callback-basierte UI-Updates** für synchrone Zustandsänderungen
4. **Robuste Fehlerbehandlung** und Validierung auf allen Ebenen

## API-Referenz

### Spieler-Management

```javascript
import { getActivePlayerIdx, setActivePlayerIdx, nextPlayer } from './modules/turnController.js';

// Aktuellen Spieler abrufen
const currentPlayer = getActivePlayerIdx(); // 0, 1, 2, ...

// Spieler wechseln (mit Validierung)
const success = setActivePlayerIdx(1); // true/false

// Zum nächsten Spieler wechseln
const success = nextPlayer(); // true/false
```

### Phasen-Management

```javascript
import { 
  getCurrentPhase, 
  setPhase, 
  nextPhase, 
  TURN_PHASES 
} from './modules/turnController.js';

// Aktuelle Phase abrufen
const phase = getCurrentPhase(); // 'dice', 'trade', 'build', 'end'

// Phase setzen
const success = setPhase(TURN_PHASES.BUILD); // true/false

// Zur nächsten Phase wechseln
const success = nextPhase(); // true/false
```

### Aktions-Validierung

```javascript
import { canRollDice, canTrade, canBuild } from './modules/turnController.js';

if (canRollDice()) {
  // Würfeln ist erlaubt
}

if (canTrade()) {
  // Handeln ist erlaubt
}

if (canBuild()) {
  // Bauen ist erlaubt
}
```

### UI-Updates mit Callbacks

```javascript
import { onPhaseChange, onPlayerSwitch } from './modules/turnController.js';

// Bei Phasenwechsel
onPhaseChange((newPhase) => {
  console.log(`Phase changed to: ${newPhase}`);
  updateMyUI();
});

// Bei Spielerwechsel
onPlayerSwitch((newPlayerIndex) => {
  console.log(`Player switched to: ${newPlayerIndex}`);
  updatePlayerUI(newPlayerIndex);
});
```

### Cleanup (Memory-Leak-Prevention)

```javascript
import { 
  removePhaseChangeCallback, 
  removePlayerSwitchCallback,
  cleanupTurnController 
} from './modules/turnController.js';

// Einzelne Callbacks entfernen
removePhaseChangeCallback(myCallback);
removePlayerSwitchCallback(myCallback);

// Komplettes Cleanup (bei Spiel-Ende)
cleanupTurnController();
```

## Debugging und Validierung

### Spielzustand validieren

```javascript
import { validateGameState } from './modules/turnController.js';

if (!validateGameState()) {
  console.error('Game state is invalid!');
}
```

### Debug-Modus

```javascript
import { setDebugFreeBuild } from './modules/turnController.js';

// Debug-Modus aktivieren (erlaubt Bauen in jeder Phase)
setDebugFreeBuild(true);
```

### Test-Suite ausführen

```javascript
// In der Browser-Konsole
testTurnController(); // Vollständige Tests
quickTest(); // Schnelle Überprüfung
```

## Modul-Integration

### Neues Modul erstellen

```javascript
// myModule.js
import { getActivePlayerIdx, onPhaseChange } from './turnController.js';

export function initMyModule() {
  // Setup UI-Updates
  onPhaseChange((phase) => {
    updateMyModuleUI(phase);
  });
  
  // Aktuellen Spieler verwenden
  function doSomething() {
    const player = window.players[getActivePlayerIdx()];
    // ... Logik mit dem aktuellen Spieler
  }
}

function updateMyModuleUI(phase) {
  // UI basierend auf der neuen Phase aktualisieren
}
```

### Bestehendes Modul migrieren

1. **Import hinzufügen:**
   ```javascript
   import { getActivePlayerIdx } from './turnController.js';
   ```

2. **Direkte Zugriffe ersetzen:**
   ```javascript
   // ❌ Alt
   const player = window.players[window.activePlayerIdx];
   
   // ✅ Neu
   const player = window.players[getActivePlayerIdx()];
   ```

3. **Callbacks für UI-Updates:**
   ```javascript
   import { onPlayerSwitch } from './turnController.js';
   
   onPlayerSwitch((playerIndex) => {
     updateMyUI(playerIndex);
   });
   ```

## Best Practices

### ✅ DO

- **Verwende immer** `getActivePlayerIdx()` statt direkter Zugriffe
- **Registriere Callbacks** für UI-Updates bei Zustandsänderungen
- **Validiere Eingaben** bevor du `setActivePlayerIdx()` aufrufst
- **Cleanup Callbacks** beim Zerstören von Modulen
- **Verwende die Validierungs-APIs** (`canBuild()`, `canTrade()`, etc.)

### ❌ DON'T

- **Greife niemals direkt** auf `window.activePlayerIdx` zu
- **Vergiss nicht** Callbacks zu cleanup
- **Verändere den Zustand nicht** ohne die API-Funktionen
- **Verwende keine lokalen Kopien** des Spieler-Index
- **Race Conditions vermeiden** - verlasse dich auf das System

## Fehlerbehebung

### Häufige Probleme

**Problem:** UI wird nicht aktualisiert bei Spielerwechsel
```javascript
// Lösung: Callback registrieren
onPlayerSwitch((playerIndex) => {
  updateMyUI(playerIndex);
});
```

**Problem:** "Invalid player index" Fehler
```javascript
// Lösung: Validierung vorher prüfen
if (isValidPlayerIndex(newIndex)) {
  setActivePlayerIdx(newIndex);
}
```

**Problem:** Bauen funktioniert nicht
```javascript
// Lösung: Phase prüfen
if (canBuild()) {
  // Bauen ist erlaubt
} else {
  console.log('Not in building phase');
}
```

### Debug-Informationen

```javascript
// Vollständige Zustandsinfo in Konsole
console.log('Current Player:', getActivePlayerIdx());
console.log('Current Phase:', getCurrentPhase());
console.log('Can Build:', canBuild());
console.log('Can Trade:', canTrade());
console.log('Game State Valid:', validateGameState());
```

## Migration von Legacy-Code

Wenn du auf Legacy-Code stößt, der das alte System verwendet:

1. **Finde direkte Zugriffe:** Suche nach `window.activePlayerIdx`
2. **Ersetze durch API:** Verwende `getActivePlayerIdx()`
3. **Füge Callbacks hinzu:** Für UI-Updates
4. **Teste gründlich:** Verwende die Test-Suite
5. **Cleanup:** Entferne alte Event-Listener

## Performance

Das System ist optimiert für:
- ✅ **Minimale Callback-Aufrufe** (nur bei tatsächlichen Änderungen)
- ✅ **Batch-Updates** (mehrere Änderungen in einem Callback)
- ✅ **Memory-efficient** (Cleanup-Funktionen)
- ✅ **Fast validation** (O(1) für die meisten Operationen)

## Support

Bei Problemen mit dem Turn-Based-System:

1. **Teste zuerst** mit `validateGameState()`
2. **Prüfe die Konsole** auf Fehlermeldungen
3. **Verwende die Test-Suite** für systematische Diagnose
4. **Dokumentiere** den Fehler mit Debug-Informationen
