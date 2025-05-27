import { CONFIG, Logger } from './config.js';
import { TextureManager, TextureGenerator, chunkGenerator } from './generators.js';

class ChunkManager {
    constructor() {
        if (!CONFIG.FLAGS.ENABLE_CHUNK_GENERATION) {
            Logger.info('ChunkManager', 'Chunk management disabled by flag');
            return;
        }

        this.chunks = new Map();
        this.chunkCount = 0;
        this.CHUNK_SIZE = CONFIG.WORLD.CHUNK_SIZE;
        this.container = document.querySelector('#world-container');
        
        if (!this.container) {
            Logger.error('ChunkManager', 'Could not find world-container element!');
            return;
        }
    }

    createChunk(position) {
        if (this.chunkCount >= CONFIG.DEBUG_OPTIONS.MAX_CHUNKS) {
            Logger.warn('ChunkManager', 'Max chunk limit reached');
            return null;
        }

        const key = `${position.x},${position.y},${position.z}`;
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }

        return new Promise((resolve) => {
            const chunk = document.createElement('a-entity');
            chunk.setAttribute('chunk', {
                position: position,
                size: this.CHUNK_SIZE,
                chunkData: chunkGenerator.generateChunkData(position)
            });

            chunk.setAttribute('position', `${position.x * this.CHUNK_SIZE} ${position.y * this.CHUNK_SIZE} ${position.z * this.CHUNK_SIZE}`);

            this.chunks.set(key, chunk);
            this.container.appendChild(chunk);
            this.chunkCount++;

            // Listen for the loaded event to resolve the promise
            chunk.addEventListener('loaded', () => resolve(chunk), { once: true });
        });
    }

    getOrCreateChunk(position) {
        const key = `${position.x},${position.y},${position.z}`;
        if (this.chunks.has(key)) {
            return this.chunks.get(key);
        }
        return this.createChunk(position);
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

class UIManager {
    constructor() {
        this.DEBUG = CONFIG.DEBUG;
        this.windows = new Map();  // Add this line
        this.metrics = new Map();  // Add this line
        this.toolbarButtons = new Map();  // Add this line
        this.inventory = new Array(32).fill(null);  // Add this line
        this.hotbar = new Array(8).fill(null);  // Add this line
        this.activeHotbarSlot = 0;  // Add this line
        this.inventoryVisible = false;  // Add this line
        
        // Initialize after properties are set
        this.setupDebugFlags();
        this.setupEventListeners();
        this.initializeUI();
        
        // Start performance monitoring
        this.lastFrameTime = performance.now();
        this.frameCount = 0;
        this.startPerformanceMonitoring();

        // Initialize stats panel as hidden on startup
        requestAnimationFrame(() => {
            const scene = document.querySelector('a-scene');
            if (scene) {
                // Make sure stats are initialized first
                scene.setAttribute('stats', 'true');
                // Then hide them after a short delay
                setTimeout(() => {
                    if (!CONFIG.FLAGS.SHOW_DEBUG_STATS) {
                        scene.setAttribute('stats', 'false');
                    }
                }, 100);
            }
        });

        // Initialize stats with a proper lifecycle
        this.initializeStats();

        // Initialize main menu visibility state
        this.windows.set('main-menu', {
            element: document.getElementById('main-menu'),
            visible: false
        });

        // Set up menu button listener
        const menuButton = document.querySelector('[data-window="main-menu"]');
        if (menuButton) {
            menuButton.addEventListener('click', () => this.toggleWindow('main-menu'));
        }

        // Set up escape key listener for menu
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.toggleWindow('main-menu');
            }
        });
    }

    initializeStats() {
        // Wait for scene to be ready
        const scene = document.querySelector('a-scene');
        if (!scene) {
            setTimeout(() => this.initializeStats(), 100);
            return;
        }

        // First ensure stats component exists and is initialized
        scene.setAttribute('stats', '');
        
        // Wait a frame for stats to initialize
        requestAnimationFrame(() => {
            // Get the stats panel element
            const statsPanel = document.querySelector('.rs-base');
            if (statsPanel) {
                // Force stats to be visible first for proper initialization
                statsPanel.style.display = 'block';
                
                // Then apply the initial state after a short delay
                setTimeout(() => {
                    CONFIG.FLAGS.SHOW_DEBUG_STATS = false;  // Set initial state to false
                    statsPanel.style.display = 'none';
                    
                    // Update checkbox state
                    const checkbox = document.getElementById('flag-debug-stats');
                    if (checkbox) {
                        checkbox.checked = false;
                    }

                    Logger.info('UIManager', 'Stats panel initialized and hidden');
                }, 100);
            }
        });
    }

    setupDebugFlags() {
        // Ensure initial state matches CONFIG.FLAGS
        Object.entries(CONFIG.FLAGS).forEach(([flag, value]) => {
            const element = document.getElementById(`flag-${flag.toLowerCase()}`);
            if (element) {
                // Make sure initial state matches the config
                element.checked = value;
            }
        });
    }

    initializeUI() {
        // Initialize all UI windows
        ['settings-panel', 'debug-window', 'performance-window'].forEach(id => {
            const element = document.getElementById(id);
            if (element) {
                this.windows.set(id, {
                    element,
                    visible: false
                });
            }
        });

        // Initialize toggle states
        this.setToggleState('toggle-debug-window', CONFIG.DEBUG);
        this.setToggleState('toggle-wireframe', CONFIG.FLAGS.WIREFRAME_MODE);
        this.setToggleState('toggle-chunk-bounds', CONFIG.FLAGS.SHOW_CHUNK_BOUNDS);

        // Generate inventory slots
        this.initializeInventory();
        this.initializeHotbar();
        this.initializeDraggableWindows();
    }

    initializeDraggableWindows() {
        document.querySelectorAll('.draggable').forEach(window => {
            const header = window.querySelector('.window-header');
            if (!header) return;

            // Create dragging state for each window
            const dragState = {
                isDragging: false,
                initialX: 0,
                initialY: 0
            };

            // Mouse Events
            header.addEventListener('mousedown', (e) => this.startDragging(e, window, header, dragState));
            document.addEventListener('mousemove', (e) => this.onDrag(e, window, dragState));
            document.addEventListener('mouseup', () => dragState.isDragging = false);

            // Touch Events
            header.addEventListener('touchstart', (e) => this.startDragging(e, window, header, dragState), { passive: true });
            document.addEventListener('touchmove', (e) => this.onDrag(e, window, dragState), { passive: false });
            document.addEventListener('touchend', () => dragState.isDragging = false);
        });
    }

    startDragging(e, window, header, dragState) {
        const touch = e.type === 'touchstart' ? e.touches[0] : e;
        if (e.target === header || e.target.parentNode === header) {
            dragState.isDragging = true;
            const bounds = window.getBoundingClientRect();
            const transform = new DOMMatrix(window.style.transform);
            dragState.initialX = touch.clientX - transform.m41;
            dragState.initialY = touch.clientY - transform.m42;
        }
    }

    onDrag(e, window, dragState) {
        if (!dragState.isDragging) return;
        e.preventDefault();
        
        const touch = e.type === 'touchmove' ? e.touches[0] : e;
        const currentX = touch.clientX - dragState.initialX;
        const currentY = touch.clientY - dragState.initialY;

        // Constrain to viewport
        const bounds = window.getBoundingClientRect();
        const maxX = document.documentElement.clientWidth - bounds.width;
        const maxY = document.documentElement.clientHeight - bounds.height;
        
        const constrainedX = Math.min(Math.max(0, currentX), maxX);
        const constrainedY = Math.min(Math.max(0, currentY), maxY);

        window.style.transform = `translate(${constrainedX}px, ${constrainedY}px)`;
    }

    // NEW: Add the missing setToggleState method
    setToggleState(toggleId, state) {
        const toggle = document.getElementById(toggleId);
        if (toggle) {
            toggle.checked = state;
        }
    }

    initializeInventory() {
        const inventoryGrid = document.getElementById('inventory-grid');
        for (let i = 0; i < 32; i++) {
            const slot = document.createElement('div');
            slot.className = 'inventory-slot';
            slot.setAttribute('data-slot', i);
            slot.addEventListener('click', () => this.handleSlotClick(i));
            inventoryGrid.appendChild(slot);
        }
    }

    initializeHotbar() {
        const hotbar = document.getElementById('hotbar');
        // Clear existing slots first
        hotbar.innerHTML = '';
        
        // Create exactly 8 slots
        for (let i = 0; i < 8; i++) {
            const slot = document.createElement('div');
            slot.className = 'hotbar-slot';
            slot.setAttribute('data-slot', i);
            slot.addEventListener('click', () => this.selectHotbarSlot(i));
            hotbar.appendChild(slot);
        }
    }

    setupEventListeners() {
        // Window toggle listeners
        document.getElementById('toggle-debug-window')?.addEventListener('change', (e) => {
            this.toggleWindow('debug-window', e.target.checked);
        });

        document.getElementById('toggle-performance-window')?.addEventListener('change', (e) => {
            this.toggleWindow('performance-window', e.target.checked);
        });

        // Debug flag listeners
        document.getElementById('toggle-wireframe')?.addEventListener('change', (e) => {
            CONFIG.FLAGS.WIREFRAME_MODE = e.target.checked;
            this.refreshWorld();
        });

        document.getElementById('toggle-chunk-bounds')?.addEventListener('change', (e) => {
            CONFIG.FLAGS.SHOW_CHUNK_BOUNDS = e.target.checked;
            this.refreshWorld();
        });

        // Add RS-stats toggle
        document.getElementById('toggle-rs-stats')?.addEventListener('change', (e) => {
            this.toggleRSStats(e.target.checked);
        });

        // Keyboard shortcuts
        window.addEventListener('keydown', (e) => {
            if (e.key === 'F3') {
                this.toggleWindow('debug-window');
            }
            if (e.key === 'F4') {
                this.toggleWindow('performance-window');
            }
            if (e.key === 'F10') {
                this.toggleWindow('settings-panel');
            }
            if (e.key === 'Tab') {
                e.preventDefault();
                this.toggleInventory();
            }
            if (e.key >= '1' && e.key <= '8') {
                this.selectHotbarSlot(parseInt(e.key) - 1);
            }
        });
    }

    toggleRSStats(enabled) {
        const prevState = CONFIG.FLAGS.SHOW_DEBUG_STATS;
        CONFIG.FLAGS.SHOW_DEBUG_STATS = enabled;
        
        const statsPanel = document.querySelector('.rs-base');
        if (statsPanel) {
            statsPanel.style.display = enabled ? 'block' : 'none';
            Logger.info('UIManager', `Performance stats ${enabled ? 'enabled' : 'disabled'}`);
        } else if (enabled) {
            Logger.warn('UIManager', 'Stats panel not found, reinitializing...');
            this.initializeStats();
        }

        // Update checkbox state
        const checkbox = document.getElementById('flag-debug-stats');
        if (checkbox) {
            checkbox.checked = enabled;
        }

        // Log the state change
        Logger.info('UIManager', `Stats visibility changed: ${prevState} -> ${enabled}`);
    }

    toggleWindow(windowId, force) {
        const window = this.windows.get(windowId);
        if (!window) {
            Logger.warn('UIManager', `Window ${windowId} not found`);
            return;
        }

        const newState = force !== undefined ? force : !window.visible;
        window.visible = newState;
        window.element.style.display = newState ? 'block' : 'none';
        window.element.classList.toggle('visible', newState);

        // Update toolbar button state
        const button = this.toolbarButtons.get(windowId);
        if (button) {
            button.classList.toggle('active', newState);
        }

        // Update debug info if it's the debug window
        if (windowId === 'debug-window') {
            CONFIG.DEBUG = newState;
            this.updateDebugInfo({
                'debug-state': newState ? 'enabled' : 'disabled'
            });
        }

        Logger.info('UIManager', `Window ${windowId} ${newState ? 'shown' : 'hidden'}`);
    }

    startPerformanceMonitoring() {
        const updateMetrics = () => {
            this.updateFPS();
            this.updateMemory();
            this.updateDrawCalls();
            requestAnimationFrame(updateMetrics);
        };
        requestAnimationFrame(updateMetrics);
    }

    updateFPS() {
        const now = performance.now();
        const delta = now - this.lastFrameTime;
        this.frameCount++;
        if (delta >= 1000) {
            this.lastFPS = (this.frameCount / delta) * 1000;
            this.frameCount = 0;
            this.lastFrameTime = now;
            this.updateMetric('fps', this.lastFPS.toFixed(1));
        }
    }

    updateMemory() {
        if (performance.memory) {
            const usedJSHeapSize = performance.memory.usedJSHeapSize / 1048576; // Convert to MB
            this.updateMetric('memory', usedJSHeapSize.toFixed(2));
        }
    }

    updateDrawCalls() {
        // Assuming you have a way to get the number of draw calls
        const drawCalls = this.getDrawCalls();
        this.updateMetric('drawCalls', drawCalls);
    }

    updateMetric(name, value) {
        this.metrics.set(name, value);
        const element = document.getElementById(`metric-${name}`);
        if (element) {
            element.textContent = value;
        }
    }

    getDrawCalls() {
        // Placeholder for actual draw call count retrieval
        return Math.floor(Math.random() * 100);
    }

    refreshWorld() {
        document.dispatchEvent(new CustomEvent('refreshWorld'));
    }

    toggleInventory() {
        this.inventoryVisible = !this.inventoryVisible;
        document.getElementById('inventory-panel').classList.toggle('visible');
    }

    toggleDebug() {
        this.debugVisible = !this.debugVisible;
        document.getElementById('debug-panel').classList.toggle('visible');
    }

    selectHotbarSlot(index) {
        const slots = document.querySelectorAll('.hotbar-slot');
        slots.forEach(slot => slot.classList.remove('active'));
        slots[index].classList.add('active');
        this.activeHotbarSlot = index;
        this.updateHotbarSelection();
    }

    handleSlotClick(index) {
        // Handle inventory slot interaction
        if (this.inventory[index]) {
            this.moveItemToHotbar(index);
        }
    }

    moveItemToHotbar(fromSlot) {
        const item = this.inventory[fromSlot];
        const hotbarSlot = this.activeHotbarSlot;
        
        // Swap items between inventory and hotbar
        this.hotbar[hotbarSlot] = item;
        this.inventory[fromSlot] = null;
        
        this.updateInventoryDisplay();
        this.updateHotbarDisplay();
    }

    updateInventoryDisplay() {
        const slots = document.querySelectorAll('.inventory-slot');
        this.inventory.forEach((item, i) => {
            if (item) {
                slots[i].style.backgroundColor = item.color || 'rgba(255, 255, 255, 0.1)';
                slots[i].textContent = item.count || '';
            } else {
                slots[i].style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                slots[i].textContent = '';
            }
        });
    }

    updateHotbarDisplay() {
        const slots = document.querySelectorAll('.hotbar-slot');
        this.hotbar.forEach((item, i) => {
            if (item) {
                slots[i].style.backgroundColor = item.color || 'rgba(255, 255, 255, 0.1)';
                slots[i].textContent = item.count || '';
            } else {
                slots[i].style.backgroundColor = 'rgba(255, 255, 255, 0.1)';
                slots[i].textContent = '';
            }
        });
    }

    updateHotbarSelection() {
        if (this.DEBUG) {
            console.log(`Selected hotbar slot: ${this.activeHotbarSlot}`);
        }
    }

    addItemToInventory(item) {
        const emptySlot = this.inventory.findIndex(slot => slot === null);
        if (emptySlot !== -1) {
            this.inventory[emptySlot] = item;
            this.updateInventoryDisplay();
            return true;
        }
        return false;
    }

    clearChunks() {
        Logger.info('UIManager', 'Clearing all chunks');
        const container = document.querySelector('#world-container');
        while (container.firstChild) {
            container.removeChild(container.firstChild);
        }
        this.updateDebugInfo({
            'chunk-count': '0',
            'total-blocks': '0'
        });
    }

    updateDebugInfo(data) {
        Object.entries(data).forEach(([key, value]) => {
            const element = document.getElementById(key);
            if (element && element.textContent !== value) {  // Only update if value changed
                element.textContent = typeof value === 'number' ? value.toFixed(2) : value;
                
                // Add visual feedback
                element.classList.remove('updated');
                void element.offsetWidth; // Force reflow
                element.classList.add('updated');
                
                // Remove highlight after animation
                setTimeout(() => element.classList.remove('updated'), 300);
            }
        });
    }

    toggleFlag(flagName) {
        if (flagName in CONFIG.FLAGS) {
            CONFIG.FLAGS[flagName] = !CONFIG.FLAGS[flagName];
            Logger.info('UIManager', `Toggle ${flagName}: ${CONFIG.FLAGS[flagName]}`);
            
            // Update all chunk materials when flags change
            const chunks = document.querySelectorAll('[chunk]');
            chunks.forEach(chunk => {
                if (chunk.components.chunk) {
                    chunk.components.chunk.update();
                }
            });
        }
    }

    setTestMode(mode) {
        const testConfig = CONFIG.DEBUG_OPTIONS.TEST_MODES[mode];
        if (!testConfig) return;

        // Apply settings from test mode
        if (testConfig.settings) {
            Object.entries(testConfig.settings).forEach(([flag, value]) => {
                CONFIG.FLAGS[flag] = value;
                this.setToggleState(`flag-${flag.toLowerCase()}`, value);
            });
        }

        // Handle texture settings
        CONFIG.TEXTURES.ENABLED = Boolean(testConfig.useTextures);
        this.setToggleState('toggle-textures', CONFIG.TEXTURES.ENABLED);

        // Regenerate world with new settings
        this.regenerateWorld();
    }

    toggleTextures(enabled) {
        CONFIG.TEXTURES.ENABLED = enabled;
        this.regenerateBlocks();
    }

    setTextureResolution(resolution) {
        CONFIG.TEXTURES.RESOLUTION = parseInt(resolution);
        if (CONFIG.TEXTURES.ENABLED) {
            this.regenerateBlocks();
        }
    }

    generateTextures() {
        if (!window.game?.textureManager) {
            Logger.warn('UIManager', 'Texture manager not available');
            return;
        }

        const resolution = CONFIG.TEXTURES.RESOLUTION;
        Object.keys(CONFIG.TEXTURES.TYPES).forEach(type => {
            const textureConfig = CONFIG.TEXTURES.TYPES[type];
            window.game.textureManager.generateTextureForType(type, textureConfig, resolution);
        });

        Logger.info('UIManager', 'Generated textures', { 
            resolution, 
            types: Object.keys(CONFIG.TEXTURES.TYPES) 
        });
    }

    updateTextureControls() {
        const textureToggle = document.getElementById('toggle-textures');
        const resolutionSelect = document.getElementById('texture-resolution');
        if (textureToggle) textureToggle.checked = CONFIG.TEXTURES.ENABLED;
        if (resolutionSelect) resolutionSelect.value = CONFIG.TEXTURES.RESOLUTION.toString();
    }

    regenerateWorld() {
        Logger.info('UIManager', 'Regenerating world with current settings');
        if (window.game) {
            window.game.chunkManager.clear();
            window.game.initializeWorld();
            this.syncDebugFlags();
        }
    }

    initializeToolbar() {
        const toolbar = document.querySelector('.window-toolbar');
        if (!toolbar) return;

        // Setup existing buttons
        toolbar.querySelectorAll('.tool-button').forEach(button => {
            const windowId = button.dataset.window;
            if (windowId) {
                this.toolbarButtons.set(windowId, button);
                button.addEventListener('click', () => {
                    this.toggleWindow(windowId);
                    this.updateToolbarButton(windowId);
                });
            }
        });
    }

    addToolbarButton(id, icon, title, onClick) {
        const toolbar = document.querySelector('.window-toolbar');
        if (!toolbar) return;

        const button = document.createElement('button');
        button.className = 'tool-button';
        button.dataset.window = id;
        button.title = title;
        button.innerHTML = `<i class="fas fa-${icon}"></i>${title[0]}`;
        
        if (onClick) {
            button.addEventListener('click', onClick);
        }

        this.toolbarButtons.set(id, button);
        toolbar.appendChild(button);
        
        return button;
    }

    updateToolbarButton(windowId) {
        const button = this.toolbarButtons.get(windowId);
        const window = this.windows.get(windowId);
        
        if (button && window) {
            button.classList.toggle('active', window.visible);
        }
    }

    syncDebugFlags() {
        // Sync all flag states with UI
        Object.entries(CONFIG.FLAGS).forEach(([flag, value]) => {
            const element = document.getElementById(`flag-${flag.toLowerCase()}`);
            if (element) {
                element.checked = value;
            }
        });
    }

    toggleRStats(enabled) {
        if (enabled) {
            // Initialize R-stats if not already done
            if (!window.rStats) {
                const rStatsConfig = {
                    CSSPath: 'path/to/rstats.css',
                    values: {
                        fps: { caption: 'FPS', below: 30 },
                        calls: { caption: 'Calls' },
                        raf: { caption: 'RAF' },
                        memory: { caption: 'Memory' }
                    }
                };
                window.rStats = new rStats(rStatsConfig);
            }
            document.querySelector('.rs-base').style.display = 'block';
        } else {
            if (document.querySelector('.rs-base')) {
                document.querySelector('.rs-base').style.display = 'none';
            }
        }
    }

    toggleFPSGraph(enabled) {
        const graphContainer = document.getElementById('fps-graph');
        if (enabled) {
            if (!graphContainer) {
                this.createFPSGraph();
            }
            graphContainer.style.display = 'block';
        } else if (graphContainer) {
            graphContainer.style.display = 'none';
        }
    }

    handleResize() {
        // Handle window resize for all UI elements
        this.windows.forEach((window, id) => {
            const element = window.element;
            if (!element) return;

            // Reset position if window is off-screen
            const bounds = element.getBoundingClientRect();
            if (bounds.right > window.innerWidth || bounds.bottom > window.innerHeight) {
                element.style.transform = 'translate(0, 0)';
            }
        });
    }

    createMainMenu() {
        return `
        <div class="window-header">
            <span class="window-title">Main Menu</span>
            <button class="action-button" onclick="uiManager.toggleWindow('main-menu', false)">×</button>
        </div>
        <div class="menu-content">
            <button class="menu-button" onclick="uiManager.startNewGame()">New Game</button>
            <button class="menu-button" onclick="uiManager.toggleWindow('settings-panel')">Settings</button>
            <button class="menu-button" onclick="uiManager.toggleWindow('debug-window')">Debug</button>
            <button class="menu-button" onclick="uiManager.toggleInventory()">Inventory</button>
            <div class="menu-separator"></div>
            <button class="menu-button warning" onclick="uiManager.exitGame()">Exit Game</button>
        </div>`;
    }

    initializeMainMenu() {
        const mainMenu = document.createElement('div');
        mainMenu.id = 'main-menu';
        mainMenu.className = 'ui-window main-menu draggable';
        mainMenu.innerHTML = this.createMainMenu();
        document.body.appendChild(mainMenu);
        this.windows.set('main-menu', { element: mainMenu, visible: false });
    }

    startNewGame() {
        // Add game start logic here
        this.toggleWindow('main-menu', false);
    }

    exitGame() {
        if (confirm('Are you sure you want to exit?')) {
            window.location.reload();
        }
    }
}

export { ChunkManager, VoxelManager, UIManager };
