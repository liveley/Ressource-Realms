// Handles loading, showing, and positioning the bandit (Räuber) model on the board
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';

let bandit = null;
let banditLoaded = false;
let banditGroup = new THREE.Group();

// Track current robber position and selection state
let currentRobberTile = { q: 0, r: 0 }; // Start on desert tile (0,0)
let isSelectingRobberTile = false;
let validRobberTiles = []; // Will store valid tiles for robber placement
let scene = null; // Store reference to scene
const HEX_RADIUS = 3; // Match the radius used by game board for distance calculations

// Function to consistently get the exact center of a tile in world coordinates
// This ensures the robber is always placed in the center, regardless of tile position calculation
export function getTileCenter(q, r, tileMeshes) {
    const tileKey = `${q},${r}`;
    const tileMesh = tileMeshes[tileKey];
    
    if (tileMesh) {
        // Method 1: Use the world position of the mesh directly
        // This is the most reliable way to get the center position
        const worldPosition = new THREE.Vector3();
        tileMesh.getWorldPosition(worldPosition);
        
        // For debugging, also calculate bounding box center
        const boundingBoxCenter = new THREE.Vector3();
        const boundingBox = new THREE.Box3().setFromObject(tileMesh);
        boundingBox.getCenter(boundingBoxCenter);
        
        console.log(`Tile ${q},${r} world position:`, worldPosition);
        console.log(`Tile ${q},${r} bounding box center:`, boundingBoxCenter);
        
        // Use the world position, but ensure fixed height
        const center = new THREE.Vector3(
            worldPosition.x,
            worldPosition.y,
            3.2 // Fixed height above tile
        );
        
        console.log(`Final center position for tile ${q},${r}:`, center);
        return center;
    } else {
        console.warn(`No mesh found for tile ${q},${r}, falling back to calculation`);
        
        // Fallback: Calculate position using the game board's coordinate system (most reliable)
        const x = HEX_RADIUS * 3/2 * q;
        const y = HEX_RADIUS * Math.sqrt(3) * (r + q/2);
        
        const center = new THREE.Vector3(x, y, 3.2);
        console.log(`Calculated position for tile ${q},${r} (fallback):`, center);
        return center;
    }
}

export function loadBanditModel(gameScene, onLoaded) {
    scene = gameScene; // Store scene reference
    if (banditLoaded) {
        if (onLoaded) onLoaded(banditGroup);
        return;
    }
    const loader = new GLTFLoader();
    loader.load('./models/bandit.glb', (gltf) => {
        bandit = gltf.scene;
        bandit.traverse((child) => {
            if (child.isMesh) {
                child.castShadow = true;
                child.receiveShadow = true;
                // Optional: make the bandit more visible
                child.material.emissive = new THREE.Color(0x222222);
            }
        });
        bandit.scale.set(1.5, 1.5, 1.5); // Make bandit larger for visibility
        banditGroup.add(bandit);
        banditLoaded = true;
        if (onLoaded) onLoaded(banditGroup);
    });
}

// Place robber on initial desert tile
export function initializeRobber(gameScene, tilePosition, tileMeshes) {
    console.log("Initializing robber on desert tile");
    
    // Make sure scene is stored for later use
    scene = gameScene;
    
    loadBanditModel(gameScene, () => {
        // Get accurate position for the desert tile (0,0)
        const accuratePosition = getTileCenter(0, 0, tileMeshes);
        console.log("Initializing robber with accurate position:", accuratePosition);
        
        // Place the robber without animation for initialization
        placeBandit(accuratePosition);
        
        // Make sure the robber is added to the scene
        if (!gameScene.children.includes(banditGroup)) {
            gameScene.add(banditGroup);
            console.log("Added robber to scene");
        }
    });
}

export function showBanditOnTile(gameScene, q, r, tileMeshes) {
    scene = gameScene; // Store scene reference
    
    // Get accurate position for this tile
    const accuratePosition = getTileCenter(q, r, tileMeshes);
    console.log(`Showing bandit on tile ${q},${r} with accurate position:`, accuratePosition);
    
    if (!banditLoaded) {
        loadBanditModel(gameScene, () => {
            placeBandit(accuratePosition);
            if (!gameScene.children.includes(banditGroup)) {
                gameScene.add(banditGroup);
            }
        });
    } else {
        placeBandit(accuratePosition);
        if (!gameScene.children.includes(banditGroup)) {
            gameScene.add(banditGroup);
        }
    }
}

// Display message that a 7 was rolled and robber needs to be moved
export function showRobberSelectionMessage() {
    let msg = document.getElementById('bandit-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'bandit-message';
        msg.style.position = 'fixed';
        msg.style.left = '50%';
        msg.style.bottom = '3em';
        msg.style.transform = 'translateX(-50%)';
        msg.style.background = 'rgba(34,34,34,0.92)';
        msg.style.color = '#ffe066';
        msg.style.fontSize = '2em';
        msg.style.fontFamily = "'Montserrat', Arial, sans-serif";
        msg.style.padding = '0.7em 2em';
        msg.style.borderRadius = '12px';
        msg.style.boxShadow = '0 2px 12px #0006';
        msg.style.zIndex = '100';
        msg.style.textAlign = 'center';
        document.body.appendChild(msg);
    }
    
    // Simple message without extras
    msg.textContent = 'Eine 7 wurde gewürfelt! Wähle ein Feld für den Räuber.';
    msg.style.display = 'block';
}

// Display message that robber has been moved
function showBanditMessage() {
    let msg = document.getElementById('bandit-message');
    if (!msg) {
        msg = document.createElement('div');
        msg.id = 'bandit-message';
        msg.style.position = 'fixed';
        msg.style.left = '50%';
        msg.style.bottom = '3em';
        msg.style.transform = 'translateX(-50%)';
        msg.style.background = 'rgba(34,34,34,0.92)';
        msg.style.color = '#ffe066';
        msg.style.fontSize = '2em';
        msg.style.fontFamily = "'Montserrat', Arial, sans-serif";
        msg.style.padding = '0.7em 2em';
        msg.style.borderRadius = '12px';
        msg.style.boxShadow = '0 2px 12px #0006';
        msg.style.zIndex = '100';
        msg.style.textAlign = 'center';
        document.body.appendChild(msg);
    }
    
    // Simple confirmation message
    msg.textContent = 'Der Räuber wurde bewegt!';
    msg.style.display = 'block';
    
    setTimeout(() => { 
        if (msg) msg.style.display = 'none'; 
    }, 2500);
}

// Place the robber on a tile
function placeBandit(tilePosition) {
    console.log("Placing bandit at position:", tilePosition);
    
    // We now expect tilePosition to be a THREE.Vector3 from getTileCenter
    let x, y, z;
    
    if (tilePosition instanceof THREE.Vector3) {
        // Using our accurate tile center calculation
        x = tilePosition.x;
        y = tilePosition.y; 
        z = tilePosition.z; // Already set to our desired height (3.2)
        console.log("Using accurate Vector3 coordinates from getTileCenter");
    } else {
        // Fallback for backward compatibility
        console.warn("Unexpected position object type, trying to adapt");
        x = tilePosition.x || 0;
        y = tilePosition.y || 0;
        z = 3.2; // Fixed height
    }
    
    console.log(`Exact placement coordinates: x=${x}, y=${y}, z=${z}`);
    
    // Print position to log to help with debugging
    console.log(`Placing bandit at final position: x=${x}, y=${y}, z=${z}`);
    
    // Use exact positioning for robber placement
    banditGroup.position.set(x, y, z);
    banditGroup.rotation.set(Math.PI / 2, 0, 0); // 90° rotation on X-axis to point upward
    banditGroup.visible = true;
      // Simple animation dropping the robber from above
    const animatePlacement = () => {
        // Store the final target position
        const targetX = x;
        const targetY = y;
        const startHeight = 8; // Start height for animation
        const endHeight = z; // Final height (should be 3.2)
        const duration = 500; // Animation duration in ms
        const startTime = Date.now();
        
        // Initial position at the start of animation
        // Set the bandit's initial position exactly above the target position
        banditGroup.position.set(targetX, targetY, startHeight);
        banditGroup.visible = true;
        
        console.log(`Starting animation at position: x=${targetX}, y=${targetY}, z=${startHeight}`);
        
        const updatePosition = () => {
            const elapsed = Date.now() - startTime;
            const progress = Math.min(1, elapsed / duration);
            
            // Cubic ease-out for smooth drop with slight slowdown at the end
            const easeOut = (t) => {
                return 1 - Math.pow(1 - t, 3);
            };
            
            // Calculate the new height based on animation progress
            const newHeight = startHeight - (startHeight - endHeight) * easeOut(progress);
            
            // Update only the vertical position, keeping x and y unchanged
            banditGroup.position.set(targetX, targetY, newHeight);
            
            if (progress < 1) {
                requestAnimationFrame(updatePosition);
            } else {
                // Ensure final position is exactly at the target location
                banditGroup.position.set(targetX, targetY, endHeight);
                console.log(`Animation complete. Final position: x=${targetX}, y=${targetY}, z=${endHeight}`);
            }
        };
        
        updatePosition();
    };
    
    animatePlacement();
}

// Hide the robber
export function hideBandit() {
    banditGroup.visible = false;
}

// Start robber tile selection mode
export function startRobberPlacement(tileMeshes, tileNumbers) {
    // Only allow starting if not already in selection mode
    if (isSelectingRobberTile) return false;
    
    isSelectingRobberTile = true;
    validRobberTiles = [];
    
    // Track valid tiles but don't highlight them
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        const [q, r] = key.split(',').map(Number);
        
        // Skip desert tile (0,0) and current robber position
        if (!(q === 0 && r === 0) && !(q === currentRobberTile.q && r === currentRobberTile.r)) {
            validRobberTiles.push({ q, r, key, mesh });
            // No highlighting - removed
        }
    });
    
    console.log(`Robber selection started. ${validRobberTiles.length} valid tiles available.`);
    
    // Show debug indicator for robber selection mode
    const debugIndicator = document.createElement('div');
    debugIndicator.id = 'robber-selection-indicator';
    debugIndicator.textContent = '🔴 RÄUBERAUSWAHL AKTIV';
    debugIndicator.style.position = 'fixed';
    debugIndicator.style.top = '10em';
    debugIndicator.style.right = '20px';
    debugIndicator.style.padding = '5px 10px';
    debugIndicator.style.backgroundColor = 'rgba(255, 100, 0, 0.85)';
    debugIndicator.style.color = 'white';
    debugIndicator.style.borderRadius = '5px';
    debugIndicator.style.zIndex = '1000';
    debugIndicator.style.fontFamily = "'Montserrat', Arial, sans-serif";
    debugIndicator.style.fontSize = '0.85em';
    debugIndicator.style.fontWeight = 'bold';
    debugIndicator.style.boxShadow = '0 2px 8px rgba(0,0,0,0.4)';
    document.body.appendChild(debugIndicator);
    
    // Display message
    showRobberSelectionMessage();
    
    // Return true to indicate we're in selection mode
    return true;
}

// Placeholder function kept for API compatibility but does nothing now
// since we no longer highlight tiles for robber placement
function highlightTile(mesh, isHighlighted) {
    // Function intentionally left empty - no highlighting
    return;
}

// Handle a tile selection for robber placement
export function handleTileSelection(intersection, tileMeshes, getTilePosition) {
    if (!isSelectingRobberTile) return false;
    
    const selectedObject = intersection.object;
    let selectedTileKey = null;
    let selectedTileMesh = null;
    
    // Log the selected object to help with debugging
    console.log("Selected object for robber placement:", selectedObject);
    
    // ENHANCED SEARCH: Try to find the tile through multiple methods
    
    // METHOD 1: Check if the object itself is a tile
    Object.entries(tileMeshes).forEach(([key, mesh]) => {
        if (mesh === selectedObject) {
            selectedTileKey = key;
            selectedTileMesh = mesh;
            console.log(`Direct tile match found: ${key}`);
        }
    });
    
    // METHOD 2: Check if the object has a tileKey in userData
    if (!selectedTileKey && selectedObject.userData && selectedObject.userData.tileKey) {
        selectedTileKey = selectedObject.userData.tileKey;
        selectedTileMesh = tileMeshes[selectedTileKey];
        console.log(`Found tile via direct userData: ${selectedTileKey}`);
    }
    
    // METHOD 3: Check if the object is a number token (these have tileKey in userData)
    if (!selectedTileKey && selectedObject.userData && selectedObject.userData.type === 'numberToken') {
        if (selectedObject.userData.tileKey) {
            selectedTileKey = selectedObject.userData.tileKey;
            selectedTileMesh = tileMeshes[selectedTileKey];
            console.log(`Found tile via number token: ${selectedTileKey}`);
        }
    }
    
    // METHOD 4: Search up the parent chain
    if (!selectedTileKey) {
        let currentObj = selectedObject;
        let searchDepth = 0;
        const MAX_SEARCH_DEPTH = 10;  // Increase the search depth
        
        while (currentObj && !selectedTileKey && searchDepth < MAX_SEARCH_DEPTH) {
            console.log(`Checking object at depth ${searchDepth}:`, currentObj.name || "unnamed", currentObj);
            
            // Try direct tile match at this level
            Object.entries(tileMeshes).forEach(([key, mesh]) => {
                if (mesh === currentObj) {
                    selectedTileKey = key;
                    selectedTileMesh = mesh;
                    console.log(`Found tile match in parent chain: ${key}`);
                }
            });
            
            // Check userData at this level
            if (!selectedTileKey && currentObj.userData) {
                if (currentObj.userData.tileKey) {
                    selectedTileKey = currentObj.userData.tileKey;
                    selectedTileMesh = tileMeshes[selectedTileKey];
                    console.log(`Found tile via userData in parent chain: ${selectedTileKey}`);
                }
                
                // Special case for number tokens
                if (!selectedTileKey && currentObj.userData.type === 'numberToken') {
                    if (currentObj.userData.tileKey) {
                        selectedTileKey = currentObj.userData.tileKey;
                        selectedTileMesh = tileMeshes[selectedTileKey];
                        console.log(`Found tile via number token in parent chain: ${selectedTileKey}`);
                    }
                }
                
                // Try to extract from name if it follows q,r pattern
                if (!selectedTileKey && currentObj.name && /^-?\d+,-?\d+$/.test(currentObj.name)) {
                    selectedTileKey = currentObj.name;
                    selectedTileMesh = tileMeshes[selectedTileKey];
                    console.log(`Found tile via name pattern: ${selectedTileKey}`);
                }
            }
            
            // If not found, try parent
            if (!selectedTileKey && currentObj.parent) {
                currentObj = currentObj.parent;
                searchDepth++;
            } else {
                break;
            }
        }
    }
    
    // METHOD 5: Last resort - try inferring from intersection point if no other methods worked
    if (!selectedTileKey) {
        console.log("Trying to infer tile from intersection point");
        const point = intersection.point;
        
        // Find the closest tile to the intersection point
        let closestTile = null;
        let closestDistance = Infinity;
        
        Object.entries(tileMeshes).forEach(([key, mesh]) => {
            const [q, r] = key.split(',').map(Number);
            const tilePos = getTilePosition(q, r);
            
            // Convert the position to a Vector3 if it's not already one
            const tileVector = tilePos instanceof THREE.Vector3 ? 
                tilePos : 
                new THREE.Vector3(tilePos.x, 0, tilePos.y); // Note: might need adjusting based on coordinate system
            
            const distance = point.distanceTo(tileVector);
            
            // Check if this is the closest tile we've found so far
            if (distance < closestDistance && distance < HEX_RADIUS * 1.5) { // Within 1.5x radius of hex
                closestDistance = distance;
                closestTile = key;
            }
        });
        
        if (closestTile) {
            selectedTileKey = closestTile;
            selectedTileMesh = tileMeshes[selectedTileKey];
            console.log(`Inferred tile from position: ${selectedTileKey}, distance: ${closestDistance}`);
        }
    }
    
    // If we found a tile through any method, proceed with placement
    if (selectedTileKey) {
        const [q, r] = selectedTileKey.split(',').map(Number);
        console.log(`Found tile at q=${q}, r=${r}, checking if it's valid for robber placement`);
        
        // Check if it's a valid selection (not desert and not current position)
        if (!(q === 0 && r === 0) && !(q === currentRobberTile.q && r === currentRobberTile.r)) {
            console.log(`Placing robber on tile ${selectedTileKey}`);
              // Update current robber position
            currentRobberTile = { q, r };
            
            // Get the world position of the tile center using our accurate center calculation
            const tilePosition = getTileCenter(q, r, tileMeshes);
            console.log("Accurate tile center position:", tilePosition);
            
            // Place the robber using accurate center position
            placeBandit(tilePosition);
            // Exit selection mode
            isSelectingRobberTile = false;
            validRobberTiles = [];
            
            // Hide selection message
            let msg = document.getElementById('bandit-message');
            if (msg) msg.style.display = 'none';
            
            // Remove the robber selection indicator
            let indicator = document.getElementById('robber-selection-indicator');
            if (indicator && indicator.parentNode) {
                indicator.parentNode.removeChild(indicator);
            }
            
            // Show confirmation message
            showBanditMessage();
            
            // Dispatch event that robber was moved
            window.dispatchEvent(new CustomEvent('robberMoved', { 
                detail: { q, r, key: selectedTileKey }
            }));
            
            return true;        } else {
            console.log(`Tile ${selectedTileKey} is not valid for robber placement (desert or current position)`);
            
            // Show specific error message for invalid tiles
            const errorMsg = document.createElement('div');
            errorMsg.textContent = `Der Räuber kann nicht auf diesem Feld platziert werden${(q === 0 && r === 0) ? ' (Wüste)' : ' (aktuell blockiert)'}`;
            errorMsg.style.position = 'fixed';
            errorMsg.style.left = '50%';
            errorMsg.style.top = '10%';
            errorMsg.style.transform = 'translateX(-50%)';
            errorMsg.style.background = 'rgba(255,50,50,0.9)';
            errorMsg.style.color = 'white';
            errorMsg.style.padding = '10px 20px';
            errorMsg.style.borderRadius = '5px';
            errorMsg.style.fontFamily = "'Montserrat', Arial, sans-serif";
            errorMsg.style.zIndex = '1000';
            document.body.appendChild(errorMsg);
            setTimeout(() => document.body.removeChild(errorMsg), 3000);
        }
    } else {
        console.log("No tile found for the clicked object");
        
        // Show a more helpful error message
        const errorMsg = document.createElement('div');
        errorMsg.textContent = "Klick nicht erkannt. Bitte klicke direkt auf ein Feld oder eine Zahlenkarte.";
        errorMsg.style.position = 'fixed';
        errorMsg.style.left = '50%';
        errorMsg.style.top = '10%';
        errorMsg.style.transform = 'translateX(-50%)';
        errorMsg.style.background = 'rgba(255,50,50,0.9)';
        errorMsg.style.color = 'white';
        errorMsg.style.padding = '10px 20px';
        errorMsg.style.borderRadius = '5px';
        errorMsg.style.fontFamily = "'Montserrat', Arial, sans-serif";
        errorMsg.style.zIndex = '1000';
        document.body.appendChild(errorMsg);
        setTimeout(() => document.body.removeChild(errorMsg), 3000);
    }
    
    return false;
}

// Get current robber position
export function getRobberPosition() {
    return { ...currentRobberTile };
}

// Check if we're currently in robber placement mode
export function isInRobberPlacementMode() {
    return isSelectingRobberTile;
}

// Cancel robber placement mode
export function cancelRobberPlacement() {
    if (!isSelectingRobberTile) return;
      // Exit selection mode
    isSelectingRobberTile = false;
    validRobberTiles = [];
    
    // Hide message
    let msg = document.getElementById('bandit-message');
    if (msg) msg.style.display = 'none';
    
    // Remove the robber selection indicator
    let indicator = document.getElementById('robber-selection-indicator');
    if (indicator && indicator.parentNode) {
        indicator.parentNode.removeChild(indicator);
    }
    
    // Show simple cancellation message
    const cancelMsg = document.createElement('div');
    cancelMsg.textContent = 'Räuberplatzierung abgebrochen';
    cancelMsg.style.position = 'fixed';
    cancelMsg.style.left = '50%';
    cancelMsg.style.bottom = '3em';
    cancelMsg.style.transform = 'translateX(-50%)';
    cancelMsg.style.background = 'rgba(34,34,34,0.92)';
    cancelMsg.style.color = '#ff9966';
    cancelMsg.style.fontSize = '1.5em';
    cancelMsg.style.fontFamily = "'Montserrat', Arial, sans-serif";
    cancelMsg.style.padding = '0.5em 1.5em';
    cancelMsg.style.borderRadius = '8px';
    cancelMsg.style.zIndex = '100';
    document.body.appendChild(cancelMsg);
    
    // Remove after 2 seconds
    setTimeout(() => {
        if (cancelMsg.parentNode) {
            document.body.removeChild(cancelMsg);
        }
    }, 2000);
}