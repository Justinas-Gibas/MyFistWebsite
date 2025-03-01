/**
 * Save System
 * 
 * Handles saving and loading game state with multiple save slots
 */
window.Game = window.Game || {};
Game.engine = Game.engine || {};
Game.engine.save = {};

(function() {
    // Storage key constants
    const SAVE_KEY_PREFIX = 'darkFantasyRPG_';
    const CURRENT_SAVE_KEY = `${SAVE_KEY_PREFIX}currentSave`;
    const SAVE_SLOTS_KEY = `${SAVE_KEY_PREFIX}saveSlots`;
    const MAX_SAVE_SLOTS = 5;
    
    // Save slot metadata
    let saveSlots = [];
    
    // Initialize save system
    Game.engine.save.init = function() {
        console.log('Initializing save system');
        loadSaveSlotData();
        return Promise.resolve();
    };
    
    // Save the current game state
    Game.engine.save.saveGame = function(slotId = 'quicksave', saveTitle = '') {
        try {
            const state = Game.engine.getState();
            
            // Add metadata
            const saveData = {
                version: '1.0',
                timestamp: Date.now(),
                playerName: state.player.name || 'Player',
                playerLevel: state.player.level,
                screenshot: captureScreenshot(),
                playTime: state.playTime || 0,
                title: saveTitle || `Level ${state.player.level} - ${new Date().toLocaleDateString()}`,
                state: state
            };
            
            // Store in localStorage
            localStorage.setItem(`${SAVE_KEY_PREFIX}${slotId}`, JSON.stringify(saveData));
            
            // Update save slots list
            updateSaveSlotsList(slotId, saveData);
            
            console.log(`Game saved successfully to slot: ${slotId}`);
            Game.engine.events.emit('game:saved', { slotId });
            
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            Game.engine.events.emit('game:saveError', { error });
            return false;
        }
    };
    
    // Load a saved game
    Game.engine.save.loadGame = function(slotId = 'quicksave') {
        try {
            const saveDataJson = localStorage.getItem(`${SAVE_KEY_PREFIX}${slotId}`);
            
            if (!saveDataJson) {
                console.error(`No save data found for slot: ${slotId}`);
                return false;
            }
            
            const saveData = JSON.parse(saveDataJson);
            
            // Check version compatibility
            if (saveData.version !== '1.0') {
                console.warn(`Save data version mismatch: ${saveData.version} vs 1.0`);
            }
            
            // Set the game state
            Game.engine.setState(saveData.state);
            
            // Update current save slot
            localStorage.setItem(CURRENT_SAVE_KEY, slotId);
            
            console.log(`Game loaded successfully from slot: ${slotId}`);
            Game.engine.events.emit('game:loaded', { slotId });
            
            return true;
        } catch (error) {
            console.error('Failed to load game:', error);
            Game.engine.events.emit('game:loadError', { error });
            return false;
        }
    };
    
    // Delete a saved game
    Game.engine.save.deleteSave = function(slotId) {
        try {
            localStorage.removeItem(`${SAVE_KEY_PREFIX}${slotId}`);
            
            // Update save slots list
            saveSlots = saveSlots.filter(slot => slot.id !== slotId);
            saveSaveSlotsData();
            
            console.log(`Save deleted successfully: ${slotId}`);
            Game.engine.events.emit('game:saveDeleted', { slotId });
            
            return true;
        } catch (error) {
            console.error('Failed to delete save:', error);
            return false;
        }
    };
    
    // Get all available save slots
    Game.engine.save.getSaveSlots = function() {
        return [...saveSlots];
    };
    
    // Capture a screenshot for the save thumbnail
    function captureScreenshot() {
        try {
            const scene = document.querySelector('a-scene');
            const dataURL = scene.components.screenshot.getCanvas('perspective').toDataURL('image/jpeg', 0.5);
            return dataURL;
        } catch (error) {
            console.warn('Failed to capture screenshot for save:', error);
            return null;
        }
    }
    
    // Load save slot metadata
    function loadSaveSlotData() {
        try {
            const slotsJson = localStorage.getItem(SAVE_SLOTS_KEY);
            saveSlots = slotsJson ? JSON.parse(slotsJson) : [];
        } catch (error) {
            console.error('Failed to load save slots data:', error);
            saveSlots = [];
        }
    }
    
    // Save save slot metadata
    function saveSaveSlotsData() {
        localStorage.setItem(SAVE_SLOTS_KEY, JSON.stringify(saveSlots));
    }
    
    // Update the save slots list with new save data
    function updateSaveSlotsList(slotId, saveData) {
        // Find existing slot or create new
        const existingSlotIndex = saveSlots.findIndex(slot => slot.id === slotId);
        
        const slotMeta = {
            id: slotId,
            title: saveData.title,
            timestamp: saveData.timestamp,
            playerName: saveData.playerName,
            playerLevel: saveData.playerLevel,
            screenshot: saveData.screenshot
        };
        
        if (existingSlotIndex >= 0) {
            saveSlots[existingSlotIndex] = slotMeta;
        } else {
            saveSlots.push(slotMeta);
        }
        
        // Keep only up to MAX_SAVE_SLOTS autosaves
        const autoSaves = saveSlots.filter(slot => slot.id.startsWith('auto_'));
        if (autoSaves.length > MAX_SAVE_SLOTS) {
            // Sort by timestamp (oldest first)
            autoSaves.sort((a, b) => a.timestamp - b.timestamp);
            
            // Remove oldest auto saves
            const toRemove = autoSaves.slice(0, autoSaves.length - MAX_SAVE_SLOTS);
            saveSlots = saveSlots.filter(slot => {
                if (slot.id.startsWith('auto_')) {
                    return !toRemove.some(remove => remove.id === slot.id);
                }
                return true;
            });
            
            // Actually delete the save files
            toRemove.forEach(slot => {
                localStorage.removeItem(`${SAVE_KEY_PREFIX}${slot.id}`);
            });
        }
        
        // Save the updated slots data
        saveSaveSlotsData();
    }
})();
