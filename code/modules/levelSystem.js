/**
 * LevelSystem - Verwaltet das Level-Fortschritt-System für Spieler
 * 
 * Dieses System ersetzt das Victory Points System und implementiert ein Level-basiertes
 * Fortschrittssystem mit spezifischen Objektiven für jeden Level.
 * 
 * @author Team 4
 * @version 1.0.0
 */

/**
 * Hauptklasse für das Level-System
 * Verwaltet Level-Fortschritt, Objectives und Boni für alle Spieler
 */
export class LevelSystem {
    /**
     * Konstruktor für das Level-System
     * @param {Array} players - Array der Spieler-Objekte (wird nicht direkt modifiziert)
     * @param {Object} options - Optionale Konfiguration
     */
    constructor(players = [], options = {}) {
        console.log('[LevelSystem] Initialisiere Level-System...');
        
        // Grundkonfiguration
        this.maxLevel = options.maxLevel || 6;
        this.debug = options.debug || true;
        
        // Spieler-Level-Daten (getrennt von Spieler-Objekten)
        this.playerLevels = new Map();
        this.playerProgress = new Map();
        this.playerBonuses = new Map();
        
        // Level-Anforderungen definieren
        this.levelRequirements = this._initializeLevelRequirements();
        
        // Level-Boni definieren
        this.levelBonuses = this._initializeLevelBonuses();
        
        // Event-System für Benachrichtigungen
        this.eventCallbacks = new Map();
        
        // Spieler initialisieren
        this._initializePlayers(players);
        
        if (this.debug) {
            console.log('[LevelSystem] Initialisierung abgeschlossen');
            console.log('[LevelSystem] Spieler:', this.playerLevels.size);
            console.log('[LevelSystem] Max Level:', this.maxLevel);
        }
    }

    /**
     * Initialisiert die Level-Anforderungen
     * @private
     * @returns {Object} Level-Anforderungen-Konfiguration
     */
    _initializeLevelRequirements() {
        if (this.debug) console.log('[LevelSystem] Lade Level-Anforderungen...');
        
        return {
            2: {
                description: "Baue 2 Strukturen und 2 Straßen",
                requirements: {
                    buildings: 2,    // Siedlungen/Basen
                    roads: 2        // Straßen/Brücken
                }
            },
            3: {
                description: "Führe 3 Handel durch und erreiche die Hauptinsel",
                requirements: {
                    trades: 3,              // Erfolgreiche Handel
                    reachedMainIsland: true // Brücke zur Hauptinsel gebaut
                }
            },
            4: {
                description: "Baue 1 Stadt-Upgrade und besitze 5 verschiedene Ressourcentypen",
                requirements: {
                    cityUpgrades: 1,        // Stadt-Upgrades
                    differentResources: 5   // Verschiedene Ressourcentypen gleichzeitig
                }
            },
            5: {
                description: "Baue Brückenverbindungen aus 2 Richtungen zur Hauptinsel und spiele 3 Aktivityskarten",
                requirements: {
                    mainIslandBridges: 2,   // Brücken zur Hauptinsel aus verschiedenen Richtungen
                    activityCards: 3        // Gespielte Aktivityskarten
                }
            },
            6: {
                description: "Kontrolliere 3 Siedlungen auf der Hauptinsel und habe die meisten Brückensegmente",
                requirements: {
                    mainIslandSettlements: 3,   // Siedlungen auf Hauptinsel
                    mostBridges: true           // Meiste Brückensegmente im Spiel
                }
            }
        };
    }

    /**
     * Initialisiert die Level-Boni
     * @private
     * @returns {Object} Level-Boni-Konfiguration
     */
    _initializeLevelBonuses() {
        if (this.debug) console.log('[LevelSystem] Lade Level-Boni...');
        
        return {
            2: {
                description: "+1 Ressource pro Runde",
                bonus: {
                    extraResourcePerTurn: 1
                }
            },
            3: {
                description: "Vergünstigte Baukosten",
                bonus: {
                    discountedBuilding: true,
                    buildingDiscount: 0.5  // 50% Rabatt auf erste Struktur pro Runde
                }
            },
            4: {
                description: "Zusätzliche Kartenzüge",
                bonus: {
                    extraCardDraw: 1
                }
            },
            5: {
                description: "Spezielle Gebäude verfügbar",
                bonus: {
                    specialBuildings: true,
                    unlockBuildings: ['fortress', 'tradingPost', 'lighthouse']
                }
            }
        };
    }

    /**
     * Initialisiert Spieler im Level-System
     * @private
     * @param {Array} players - Spieler-Array
     */
    _initializePlayers(players) {
        if (this.debug) console.log('[LevelSystem] Initialisiere Spieler...');
        
        players.forEach((player, index) => {
            const playerId = player.id || index;
            
            // Initial Level 1 für alle Spieler
            this.playerLevels.set(playerId, 1);
            
            // Leere Fortschritts-Tracking
            this.playerProgress.set(playerId, {
                buildings: 0,
                roads: 0,
                trades: 0,
                reachedMainIsland: false,
                cityUpgrades: 0,
                differentResources: 0,
                mainIslandBridges: 0,
                activityCards: 0,
                mainIslandSettlements: 0,
                totalBridges: 0
            });
            
            // Keine aktiven Boni zu Beginn
            this.playerBonuses.set(playerId, {});
            
            if (this.debug) {
                console.log(`[LevelSystem] Spieler ${playerId} initialisiert - Level 1`);
            }
        });
    }

    /**
     * Aktualisiert den Fortschritt eines Spielers
     * @param {number|string} playerId - Spieler-ID
     * @param {Object} progressData - Neue Fortschrittsdaten
     * @returns {boolean} True wenn Level-Up erfolgt ist
     */
    updateProgress(playerId, progressData) {
        if (this.debug) {
            console.log(`[LevelSystem] Update Fortschritt für Spieler ${playerId}:`, progressData);
        }

        // Validierung
        if (!this.playerProgress.has(playerId)) {
            console.error(`[LevelSystem] ERROR: Spieler ${playerId} nicht gefunden!`);
            return false;
        }

        // Fortschritt aktualisieren
        const currentProgress = this.playerProgress.get(playerId);
        const updatedProgress = { ...currentProgress, ...progressData };
        this.playerProgress.set(playerId, updatedProgress);

        if (this.debug) {
            console.log(`[LevelSystem] Neuer Fortschritt für Spieler ${playerId}:`, updatedProgress);
        }

        // Prüfe auf Level-Up
        return this.checkForLevelUp(playerId);
    }

    /**
     * Prüft ob ein Spieler ein Level-Up verdient hat
     * @param {number|string} playerId - Spieler-ID
     * @returns {boolean} True wenn Level-Up erfolgt ist
     */
    checkForLevelUp(playerId) {
        const currentLevel = this.playerLevels.get(playerId);
        const nextLevel = currentLevel + 1;

        if (this.debug) {
            console.log(`[LevelSystem] Prüfe Level-Up für Spieler ${playerId} (Level ${currentLevel} → ${nextLevel})`);
        }

        // Maximales Level bereits erreicht?
        if (nextLevel > this.maxLevel) {
            if (this.debug) {
                console.log(`[LevelSystem] Spieler ${playerId} hat bereits maximales Level erreicht`);
            }
            return false;
        }

        // Gibt es Anforderungen für nächstes Level?
        if (!this.levelRequirements[nextLevel]) {
            console.error(`[LevelSystem] ERROR: Keine Anforderungen für Level ${nextLevel} definiert!`);
            return false;
        }

        // Prüfe Anforderungen
        const requirements = this.levelRequirements[nextLevel].requirements;
        const progress = this.playerProgress.get(playerId);
        const meetsRequirements = this._checkRequirements(playerId, requirements, progress);

        if (meetsRequirements) {
            return this._performLevelUp(playerId, nextLevel);
        }

        return false;
    }

    /**
     * Prüft ob alle Anforderungen für ein Level erfüllt sind
     * @private
     * @param {number|string} playerId - Spieler-ID
     * @param {Object} requirements - Level-Anforderungen
     * @param {Object} progress - Aktueller Spieler-Fortschritt
     * @returns {boolean} True wenn alle Anforderungen erfüllt sind
     */
    _checkRequirements(playerId, requirements, progress) {
        if (this.debug) {
            console.log(`[LevelSystem] Prüfe Anforderungen für Spieler ${playerId}:`);
            console.log('[LevelSystem] Benötigt:', requirements);
            console.log('[LevelSystem] Aktuell:', progress);
        }

        for (const [requirement, needed] of Object.entries(requirements)) {
            let currentValue = progress[requirement];

            // Spezielle Behandlung für bestimmte Anforderungen
            if (requirement === 'mostBridges') {
                currentValue = this._hasMostBridges(playerId);
            } else if (requirement === 'differentResources') {
                // Hier würde man die aktuellen Ressourcen prüfen
                // Für jetzt nehmen wir den gespeicherten Wert
            }

            // Anforderung prüfen
            if (typeof needed === 'boolean') {
                if (currentValue !== needed) {
                    if (this.debug) {
                        console.log(`[LevelSystem] Anforderung '${requirement}' nicht erfüllt: ${currentValue} ≠ ${needed}`);
                    }
                    return false;
                }
            } else if (typeof needed === 'number') {
                if (currentValue < needed) {
                    if (this.debug) {
                        console.log(`[LevelSystem] Anforderung '${requirement}' nicht erfüllt: ${currentValue} < ${needed}`);
                    }
                    return false;
                }
            }
        }

        if (this.debug) {
            console.log(`[LevelSystem] Alle Anforderungen für Spieler ${playerId} erfüllt!`);
        }
        return true;
    }

    /**
     * Führt ein Level-Up für einen Spieler durch
     * @private
     * @param {number|string} playerId - Spieler-ID
     * @param {number} newLevel - Neues Level
     * @returns {boolean} True wenn Level-Up erfolgreich
     */
    _performLevelUp(playerId, newLevel) {
        console.log(`[LevelSystem] 🎉 LEVEL UP! Spieler ${playerId}: Level ${newLevel}`);

        // Level aktualisieren
        this.playerLevels.set(playerId, newLevel);

        // Boni anwenden
        if (this.levelBonuses[newLevel]) {
            const bonuses = this.levelBonuses[newLevel].bonus;
            const currentBonuses = this.playerBonuses.get(playerId);
            this.playerBonuses.set(playerId, { ...currentBonuses, ...bonuses });

            if (this.debug) {
                console.log(`[LevelSystem] Neue Boni für Spieler ${playerId}:`, bonuses);
            }
        }

        // Event feuern
        this._fireEvent('levelUp', {
            playerId,
            newLevel,
            bonuses: this.levelBonuses[newLevel],
            description: this.levelRequirements[newLevel]?.description
        });

        // Spiel gewonnen?
        if (newLevel >= this.maxLevel) {
            console.log(`[LevelSystem] 🏆 SPIEL GEWONNEN! Spieler ${playerId} hat Level ${this.maxLevel} erreicht!`);
            this._fireEvent('gameWon', { playerId, level: newLevel });
        }

        return true;
    }

    /**
     * Prüft ob ein Spieler die meisten Brücken hat
     * @private
     * @param {number|string} playerId - Spieler-ID
     * @returns {boolean} True wenn Spieler die meisten Brücken hat
     */
    _hasMostBridges(playerId) {
        const playerBridges = this.playerProgress.get(playerId)?.totalBridges || 0;
        let maxBridges = 0;
        let playersWithMax = 0;

        // Finde maximale Brückenanzahl
        for (const [id, progress] of this.playerProgress.entries()) {
            const bridges = progress.totalBridges || 0;
            if (bridges > maxBridges) {
                maxBridges = bridges;
                playersWithMax = 1;
            } else if (bridges === maxBridges) {
                playersWithMax++;
            }
        }

        // Spieler hat die meisten UND ist allein an der Spitze
        const result = playerBridges === maxBridges && playersWithMax === 1;
        
        if (this.debug) {
            console.log(`[LevelSystem] Brücken-Check für Spieler ${playerId}: ${playerBridges}/${maxBridges} (allein: ${playersWithMax === 1}) = ${result}`);
        }

        return result;
    }

    /**
     * Registriert einen Event-Callback
     * @param {string} eventType - Event-Typ ('levelUp', 'gameWon', etc.)
     * @param {Function} callback - Callback-Funktion
     */
    on(eventType, callback) {
        if (!this.eventCallbacks.has(eventType)) {
            this.eventCallbacks.set(eventType, []);
        }
        this.eventCallbacks.get(eventType).push(callback);

        if (this.debug) {
            console.log(`[LevelSystem] Event-Listener registriert: ${eventType}`);
        }
    }

    /**
     * Feuert ein Event
     * @private
     * @param {string} eventType - Event-Typ
     * @param {Object} data - Event-Daten
     */
    _fireEvent(eventType, data) {
        if (this.debug) {
            console.log(`[LevelSystem] Event gefeuert: ${eventType}`, data);
        }

        const callbacks = this.eventCallbacks.get(eventType);
        if (callbacks) {
            callbacks.forEach(callback => {
                try {
                    callback(data);
                } catch (error) {
                    console.error(`[LevelSystem] ERROR in Event-Callback für ${eventType}:`, error);
                }
            });
        }
    }

    /**
     * Gibt aktuelles Level eines Spielers zurück
     * @param {number|string} playerId - Spieler-ID
     * @returns {number} Aktuelles Level
     */
    getPlayerLevel(playerId) {
        return this.playerLevels.get(playerId) || 1;
    }

    /**
     * Gibt aktuellen Fortschritt eines Spielers zurück
     * @param {number|string} playerId - Spieler-ID
     * @returns {Object} Fortschrittsdaten
     */
    getPlayerProgress(playerId) {
        return { ...this.playerProgress.get(playerId) } || {};
    }

    /**
     * Gibt aktive Boni eines Spielers zurück
     * @param {number|string} playerId - Spieler-ID
     * @returns {Object} Aktive Boni
     */
    getPlayerBonuses(playerId) {
        return { ...this.playerBonuses.get(playerId) } || {};
    }

    /**
     * Gibt die aktuellen Objectives für einen Spieler zurück
     * @param {number|string} playerId - Spieler-ID
     * @returns {Object|null} Nächste Level-Anforderungen
     */
    getCurrentObjectives(playerId) {
        const currentLevel = this.getPlayerLevel(playerId);
        const nextLevel = currentLevel + 1;

        if (nextLevel > this.maxLevel) {
            return null; // Maximales Level erreicht
        }

        const requirements = this.levelRequirements[nextLevel];
        const progress = this.getPlayerProgress(playerId);

        return {
            targetLevel: nextLevel,
            description: requirements.description,
            requirements: requirements.requirements,
            currentProgress: progress,
            completed: this._checkRequirements(playerId, requirements.requirements, progress)
        };
    }

    /**
     * Prüft ob das Spiel beendet ist
     * @returns {Object|null} Gewinner-Informationen oder null
     */
    checkGameEnd() {
        for (const [playerId, level] of this.playerLevels.entries()) {
            if (level >= this.maxLevel) {
                return {
                    winner: playerId,
                    level: level,
                    gameEnded: true
                };
            }
        }
        return null;
    }

    /**
     * Debug-Informationen ausgeben
     * @param {number|string} playerId - Spieler-ID (optional, alle wenn nicht angegeben)
     */
    debugInfo(playerId = null) {
        console.log('=== LevelSystem Debug Info ===');
        
        if (playerId !== null) {
            // Einzelner Spieler
            console.log(`Spieler ${playerId}:`);
            console.log('  Level:', this.getPlayerLevel(playerId));
            console.log('  Fortschritt:', this.getPlayerProgress(playerId));
            console.log('  Boni:', this.getPlayerBonuses(playerId));
            console.log('  Nächste Objectives:', this.getCurrentObjectives(playerId));
        } else {
            // Alle Spieler
            for (const [id] of this.playerLevels.entries()) {
                this.debugInfo(id);
                console.log('---');
            }
        }
        
        const gameEnd = this.checkGameEnd();
        console.log('Spiel beendet:', gameEnd);
        console.log('==============================');
    }
}

/**
 * Hilfsfunktion zum einfachen Erstellen eines LevelSystems
 * @param {Array} players - Spieler-Array
 * @param {Object} options - Optionale Konfiguration
 * @returns {LevelSystem} Neue LevelSystem-Instanz
 */
export function createLevelSystem(players, options = {}) {
    console.log('[LevelSystem] Erstelle neues Level-System...');
    return new LevelSystem(players, options);
}

// Export der Klasse als Default
export default LevelSystem;
