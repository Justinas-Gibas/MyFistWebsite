import { create } from 'https://esm.sh/zustand';
import { CONFIG, Logger } from './config.js';
import { TextureManager, TextureGenerator, ChunkGenerator, BlockSystem } from './generators.js';

// Add Zustand store at the top
export const useGameStore = create((set, get) => ({
    // UI State
    isMainMenuOpen: false,
    activeWindows: new Set(),
    debugFlags: {},
    isPaused: false,

    // Actions
    toggleMainMenu: () => set(state => ({
        isMainMenuOpen: !state.isMainMenuOpen,
        isPaused: !state.isMainMenuOpen // Pause when menu opens
    })),

    toggleWindow: (windowId) => set(state => {
        const newActiveWindows = new Set(state.activeWindows);
        if (newActiveWindows.has(windowId)) {
            newActiveWindows.delete(windowId);
        } else {
            newActiveWindows.add(windowId);
        }
        Logger.info('Store', `Window ${windowId} toggled`, { isOpen: newActiveWindows.has(windowId) });
        return { activeWindows: newActiveWindows };
    }),

    setPaused: (isPaused) => set({ isPaused })
}));

class ChunkManager {
    constructor() {
        // Initialize Map immediately
        this.chunks = new Map();
        this.chunkCount = 0;
        this.CHUNK_SIZE = CONFIG.WORLD.CHUNK_SIZE;

        // Get container after initialization
        this.container = document.querySelector('#world-container');
        
        if (!this.container) {
            Logger.error('ChunkManager', 'Could not find world-container element!');
            return;
        }

        if (!CONFIG.FLAGS.SECTIONS.WORLD_GENERATION.ENABLE_CHUNK_GENERATION) {
            Logger.info('ChunkManager', 'Chunk management disabled by flag');
            return;
        }
    }

    // Add helper method to check if chunk exists
    hasChunk(key) {
        return this.chunks && this.chunks.has(key);
    }

    // Update getOrCreateChunk to use the key consistently
    getOrCreateChunk(position) {
        const key = `${position.x},${position.y},${position.z}`;
        if (this.hasChunk(key)) {
            return this.chunks.get(key);
        }
        // Generate a new chunk using the generator from generators.js
        return this.createChunk(position);
    }

    // Update createChunk to use consistent key format
    createChunk(position) {
        if (this.chunkCount >= CONFIG.DEBUG_OPTIONS.MAX_CHUNKS) {
            Logger.warn('ChunkManager', 'Max chunk limit reached');
            return null;
        }

        const key = `${position.x},${position.y},${position.z}`;
        if (this.hasChunk(key)) {
            return this.chunks.get(key);
        }

        return new Promise((resolve) => {
            const chunk = document.createElement('a-entity');
            // Generate chunk data using the generator function
            const chunkData = ChunkGenerator.prototype.generateChunkData(position);
            chunk.setAttribute('chunk', {
                position: position,
                size: this.CHUNK_SIZE,
                chunkData: chunkData
            });
            chunk.setAttribute('position', `${position.x * this.CHUNK_SIZE} ${position.y * this.CHUNK_SIZE} ${position.z * this.CHUNK_SIZE}`);

            this.chunks.set(key, chunk);
            this.container.appendChild(chunk);
            this.chunkCount++;

            // Wait until the chunk is fully loaded before resolving
            chunk.addEventListener('loaded', () => resolve(chunk), { once: true });
        });
    }

    removeChunk(position) {
        const key = `${position.x},${position.y},${position.z}`;
        const chunk = this.chunks.get(key);
        if (chunk) {
            this.container.removeChild(chunk);
            this.chunks.delete(key);
            this.chunkCount--;
        }
    }

    clear() {
        this.chunks.forEach(chunk => this.container.removeChild(chunk));
        this.chunks.clear();
        this.chunkCount = 0;
    }

    // Remove all other chunk management methods as they're now in game.js
}

class VoxelManager {
    constructor() {
        Logger.info('VoxelManager', `Initializing version ${CONFIG.VERSIONS.VOXEL_MANAGER}`);
        this.voxelSize = CONFIG.SIZES.VOXEL;
        this.blocksPerVoxel = CONFIG.SIZES.BLOCK / CONFIG.SIZES.VOXEL;
        this.voxels = new Map();
    }

    createVoxel(localPosition, type = 'solid') {
        const voxel = document.createElement('a-entity');
        voxel.setAttribute('voxel', {
            size: this.voxelSize,
            type: type
        });
        voxel.setAttribute('position', `${
            localPosition.x * this.voxelSize
        } ${
            localPosition.y * this.voxelSize
        } ${
            localPosition.z * this.voxelSize
        }`);
        
        const key = `${localPosition.x},${localPosition.y},${localPosition.z}`;
        this.voxels.set(key, voxel);
        return voxel;
    }

    removeVoxel(position) {
        const key = `${position.x},${position.y},${position.z}`;
        const voxel = this.voxels.get(key);
        if (voxel) {
            voxel.parentNode.removeChild(voxel);
            this.voxels.delete(key);
        }
    }
}

// Removed UIManager from here. Its logic now resides in ui.js.

class GameInitializer {
    constructor() {
        this.chunkManager = null;
        this.voxelManager = null;
        // Remove UIManager initialization from here
    }

    async initialize() {
        try {
            // Initialize only chunk and voxel managers
            this.chunkManager = new ChunkManager();
            this.voxelManager = new VoxelManager();
            
            await this.initializeScene();
            
            // Get initial player position
            const playerRig = document.querySelector('#player-rig');
            if (playerRig) {
                const position = playerRig.getAttribute('position');
                const chunkPos = this.calculateChunkPosition(position);
                await this.loadChunksAroundPosition(chunkPos);
            }
            
            return this;
        } catch (error) {
            Logger.error('GameInitializer', 'Failed to initialize:', error);
            throw error;
        }
    }

    // ...rest of the GameInitializer methods...
}

class StateManager {
    constructor() {
        this.subscribers = new Set();
        this.state = {
            // UI State
            windows: {
                debug: false,
                inventory: false,
                settings: false
            },
            // Inventory State
            inventory: [],
            activeSlot: 0,
            // Game State
            paused: false,
            menuVisible: false,
            currentScene: 'main',
            metrics: {
                fps: 0,
                memory: 0,
                drawCalls: 0
            },
            lastUIClick: null   // New property for last UI click data
        };
    }

    // State update methods
    setState(updater) {
        const newState = typeof updater === 'function' 
            ? updater(this.state)
            : updater;
        
        this.state = { ...this.state, ...newState };
        this.notifySubscribers();
    }

    // Window management
    toggleWindow(windowName) {
        this.setState(state => ({
            windows: {
                ...state.windows,
                [windowName]: !state.windows[windowName]
            }
        }));
    }

    // Inventory management
    addItem(item) {
        this.setState(state => ({
            inventory: [...state.inventory, item]
        }));
    }

    removeItem(index) {
        this.setState(state => ({
            inventory: state.inventory.filter((_, i) => i !== index)
        }));
    }

    setActiveSlot(slot) {
        this.setState({ activeSlot: slot });
    }

    // Game state management
    togglePause() {
        this.setState(state => ({ paused: !state.paused }));
    }

    updateMetrics(metrics) {
        this.setState(state => ({
            metrics: { ...state.metrics, ...metrics }
        }));
    }

    recordUIClick(uiClickData) {
        // uiClickData should include details like windowId, timestamp, source, etc.
        this.setState({ lastUIClick: uiClickData });
        Logger.info('StateManager', 'UI click recorded', uiClickData);
    }

    // Subscription system
    subscribe(callback) {
        this.subscribers.add(callback);
        return () => this.subscribers.delete(callback);
    }

    notifySubscribers() {
        this.subscribers.forEach(callback => callback(this.state));
    }

    // Getters
    getState() {
        return this.state;
    }

    getWindow(windowId) {
        return this.state.windows[windowId];
    }

    isWindowVisible(windowId) {
        return this.state.windows[windowId] || false;
    }
}

// Remove UIStateManager class since it's now merged into StateManager

export { ChunkManager, VoxelManager, StateManager, GameInitializer };

export class InventoryManager {
    constructor() {
        this.inventory = {
            grid: new Array(32).fill(null),
            hotbar: new Array(8).fill(null),
            activeSlot: 0,
            maxStack: 64
        };

        this.blockTypes = new Map([
            ['dirt', { maxStack: 64, icon: 'dirt_0' }],
            ['stone', { maxStack: 64, icon: 'stone_0' }],
            ['grass', { maxStack: 64, icon: 'grass_0' }]
        ]);
    }

    addItem(itemType, count = 1) {
        // First try to add to existing stacks
        let remaining = count;
        
        // Check hotbar first
        remaining = this.addToExistingStacks(this.inventory.hotbar, itemType, remaining);
        
        // Then check main inventory
        if (remaining > 0) {
            remaining = this.addToExistingStacks(this.inventory.grid, itemType, remaining);
        }

        // If we still have items, find empty slots
        if (remaining > 0) {
            remaining = this.addToEmptySlots(this.inventory.hotbar, itemType, remaining);
            if (remaining > 0) {
                remaining = this.addToEmptySlots(this.inventory.grid, itemType, remaining);
            }
        }

        // Return true if all items were added
        return remaining === 0;
    }

    addToExistingStacks(container, itemType, count) {
        const itemInfo = this.blockTypes.get(itemType);
        if (!itemInfo) return count;

        for (let i = 0; i < container.length && count > 0; i++) {
            const slot = container[i];
            if (slot && slot.type === itemType && slot.count < itemInfo.maxStack) {
                const space = itemInfo.maxStack - slot.count;
                const adding = Math.min(space, count);
                slot.count += adding;
                count -= adding;
            }
        }
        return count;
    }

    addToEmptySlots(container, itemType, count) {
        const itemInfo = this.blockTypes.get(itemType);
        if (!itemInfo) return count;

        for (let i = 0; i < container.length && count > 0; i++) {
            if (!container[i]) {
                const stackSize = Math.min(count, itemInfo.maxStack);
                container[i] = {
                    type: itemType,
                    count: stackSize,
                    icon: itemInfo.icon
                };
                count -= stackSize;
            }
        }
        return count;
    }

    getActiveItem() {
        return this.inventory.hotbar[this.inventory.activeSlot];
    }
}
