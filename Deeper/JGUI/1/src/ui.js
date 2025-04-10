import { CONFIG, Logger } from './config.js';
import { useGameStore } from './managers.js';

// Centralized UI Utilities (referenced in README)
export const UIUtils = {
    createDebugToggle(flag, value) {
        const label = document.createElement('label');
        label.className = 'toggle-switch';
        label.innerHTML = `
            <input type="checkbox" ${value ? 'checked' : ''}>
            <span class="toggle-slider"></span>
            ${flag.toLowerCase().replace(/_/g, ' ')}
        `;
        label.querySelector('input').addEventListener('change', (e) => {
            // Example: updating flag in store; add setDebugFlag action as needed.
            const store = useGameStore.getState();
            if (store.setDebugFlag) {
                store.setDebugFlag(flag, e.target.checked);
            } else {
                Logger.warn('UIUtils', 'setDebugFlag not defined on store');
            }
        });
        return label;
    },
    createMainMenuContent() {
        return `
            <div class="menu-content">
                <sl-button class="menu-button" onclick="window.uiManager.startNewGame()">
                    <sl-icon name="play"></sl-icon>
                    <span>New Game</span>
                </sl-button>
                <!-- ...other menu buttons per README... -->
            </div>
        `;
    },
    createInventorySlot(slotNumber) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.setAttribute('data-slot', slotNumber);
        slot.innerHTML = `
            <div class="slot-content">
                <span class="slot-number">${slotNumber + 1}</span>
            </div>
        `;
        return slot;
    }
};

export const UIDebug = {
    createMetricCard({ label, value, showBar = false, barValue = 0, unit = '' }) {
        return `
            <div class="metric-card">
                <div class="metric-header">
                    <span class="label">${label}</span>
                    <span class="value" id="${label.toLowerCase()}-value">${value}${unit}</span>
                </div>
                ${showBar ? `
                    <div class="progress-bar">
                        <div class="progress-fill" id="${label.toLowerCase()}-bar" 
                             style="width: ${barValue}%"></div>
                    </div>
                ` : ''}
            </div>
        `;
    },

    createDebugSection({ title, metrics }) {
        return `
            <div class="debug-section">
                <h3>${title}</h3>
                <div class="metric-grid">
                    ${metrics.map(metric => this.createMetricCard(metric)).join('')}
                </div>
            </div>
        `;
    },

    createDebugPanel() {
        return {
            performance: {
                title: 'Performance',
                metrics: [
                    { label: 'FPS', value: '60', showBar: true, barValue: 100 },
                    { label: 'Memory', value: '0', unit: 'MB', showBar: true },
                    { label: 'Draw Calls', value: '0' }
                ]
            },
            world: {
                title: 'World',
                metrics: [
                    { label: 'Chunks', value: '0' },
                    { label: 'Blocks', value: '0' },
                    { label: 'Entities', value: '0' }
                ]
            },
            player: {
                title: 'Player',
                metrics: [
                    { label: 'Position', value: '0, 0, 0' },
                    { label: 'Chunk', value: '0, 0' },
                    { label: 'Looking At', value: 'Nothing' }
                ]
            }
        };
    }
};

export const UISlot = {
    create({ id, size = 50, content = null }) {
        const slot = document.createElement('div');
        slot.className = 'inventory-slot';
        slot.setAttribute('data-slot-id', id);
        slot.style.width = `${size}px`;
        slot.style.height = `${size}px`;
        
        slot.innerHTML = `
            <div class="slot-content">
                <span class="slot-number">${id + 1}</span>
                ${content ? `
                    <div class="item-icon ${content.type.toLowerCase()}">
                        <span class="item-count">${content.count || ''}</span>
                    </div>
                ` : ''}
            </div>
        `;

        // Add drag and drop functionality
        slot.setAttribute('draggable', 'true');
        slot.addEventListener('dragstart', (e) => {
            e.dataTransfer.setData('text/plain', id);
            slot.classList.add('dragging');
        });
        slot.addEventListener('dragend', () => slot.classList.remove('dragging'));
        
        return slot;
    }
};

/* 
  Use UIComponents for assembling windows consistently.
  (See README for component-level specs.)
*/
export const UIComponents = {
    window({ title, content }) {
        const win = document.createElement('div');
        win.className = 'ui-window';
        win.innerHTML = `
            <div class="window-header">
                <span class="window-title">${title}</span>
                <div class="window-controls">
                    <button class="close-button">×</button>
                </div>
            </div>
            <div class="window-content">
                ${content}
            </div>
        `;
        return win;
    }
};

export class UIManager {
    constructor() {
        // Remove existing toolbar if any
        this.cleanupDuplicateToolbars();
        
        // Initialize single toolbar
        this.setupToolbar();
        this.setupHotbar();
        this.setupWindows();
        this.bindEvents();

        // Add main menu button to toolbar using the store action
        this.addMainMenuButton();

        // Subscribe to store changes
        useGameStore.subscribe(this.handleStoreChanges.bind(this));

        // Ensure proper UI layering
        this.setupUILayering();

        // Setup notifications (only once)
        this.setupNotifications();

        // Add new UI features
        this.setupModernWindows();
        this.setupContextMenus();
        this.setupTooltips();

        // Add keyboard listener for DevTools
        document.addEventListener('keydown', (e) => {
            if (e.key === 'F12') {
                e.preventDefault();
                this.toggleWindow('devtools-window');
            }
        });

        this.ensureDebugElements();
    }

    async initialize() {
        // Clear any existing UI elements first
        document.querySelectorAll('.ui-window').forEach(el => el.remove());
        document.querySelectorAll('.hotbar:not(#hotbar)').forEach(el => el.remove());

        // Setup UI in sequence
        await this.setupToolbar();
        await this.setupHotbar();
        await this.setupWindows();
        this.bindEvents();
        this.setupUILayering();

        // Initialize default state
        const store = useGameStore.getState();
        store.setPaused(false);
        store.toggleMainMenu(false);

        return this;
    }

    setupToolbar() {
        // Remove any existing toolbars first
        this.cleanupDuplicateToolbars();
        
        const toolbar = document.createElement('div');
        toolbar.className = 'toolbar';
        toolbar.innerHTML = `
            <div class="toolbar-handle">≡</div>
            <div class="toolbar-buttons">
                <sl-button class="tool-button" data-window="main-menu">
                    <sl-icon name="house"></sl-icon>
                </sl-button>
                <sl-button class="tool-button" data-window="inventory-window">
                    <sl-icon name="grid"></sl-icon>
                </sl-button>
                <sl-button class="tool-button" data-window="settings-window">
                    <sl-icon name="gear"></sl-icon>
                </sl-button>
                <sl-button class="tool-button" data-window="devtools-window">
                    <sl-icon name="terminal"></sl-icon>
                </sl-button>
            </div>
        `;
        
        const gameUI = document.querySelector('.game-ui');
        // Ensure only one toolbar exists
        const existingToolbar = gameUI.querySelector('.toolbar');
        if (existingToolbar) {
            existingToolbar.remove();
        }
        gameUI.appendChild(toolbar);
        
        // Make toolbar draggable
        this.makeDraggable(toolbar);
    }

    cleanupDuplicateToolbars() {
        // Remove all existing toolbars first
        document.querySelectorAll('.toolbar').forEach((toolbar, index) => {
            if (index > 0) { // Keep only the first toolbar
                toolbar.remove();
            }
        });
    }

    addMainMenuButton() {
        const toolbar = document.querySelector('.toolbar-buttons');
        if (!toolbar) return;

        const menuButton = document.createElement('sl-button');
        menuButton.className = 'tool-button main-menu-button';
        menuButton.innerHTML = '<sl-icon name="list"></sl-icon>';
        menuButton.addEventListener('click', () => {
            useGameStore.getState().toggleMainMenu();
        });

        toolbar.insertBefore(menuButton, toolbar.firstChild);
    }

    handleStoreChanges(state) {
        // Update UI based on store changes
        const mainMenu = document.getElementById('main-menu');
        if (mainMenu) {
            mainMenu.style.display = state.isMainMenuOpen ? 'block' : 'none';
        }

        // Update window visibility
        state.activeWindows.forEach(windowId => {
            const window = document.getElementById(windowId);
            if (window) {
                window.style.display = 'block';
            }
        });

        // Update debug flags
        Object.entries(state.debugFlags).forEach(([flag, value]) => {
            const element = document.querySelector(`[data-debug-flag="${flag}"]`);
            if (element) {
                element.checked = value;
            }
        });

        Logger.debug('UIManager', 'Store update handled', {
            mainMenuOpen: state.isMainMenuOpen,
            activeWindows: Array.from(state.activeWindows),
            isPaused: state.isPaused
        });
    }

    setupHotbar() {
        const hotbar = document.getElementById('hotbar');
        if (!hotbar) return;

        // Clear existing content
        hotbar.innerHTML = '';
        
        // Create 8 slots using UISlot
        for (let i = 0; i < 8; i++) {
            const slot = UISlot.create({
                id: i,
                size: 50,
                content: this.inventory?.hotbar[i] || null
            });
            
            // Add hotbar-specific styling
            slot.classList.add('hotbar-slot');
            if (i === this.inventory?.activeSlot) {
                slot.classList.add('active');
            }
            
            hotbar.appendChild(slot);
        }

        // Make hotbar draggable but prevent multiple instances
        this.makeDraggable(hotbar);
    }

    setupWindows() {
        // Remove any existing windows first
        document.querySelectorAll('.ui-window').forEach(el => el.remove());
        
        const windowsConfig = {
            'devtools-window': {
                title: 'Developer Tools',
                content: `
                    <div class="debug-section">
                        <div class="metric-grid">
                            <div class="metric">
                                <span class="label">Position</span>
                                <span class="value" id="player-position">0, 0, 0</span>
                            </div>
                            <div class="metric">
                                <span class="label">FPS</span>
                                <span class="value" id="fps-counter">60</span>
                            </div>
                        </div>
                    </div>
                `
            },
            'main-menu': {
                title: 'Main Menu',
                content: `
                    <sl-button-group vertical>
                        <sl-button>Resume Game</sl-button>
                        <sl-button>Save Game</sl-button>
                        <sl-button>Settings</sl-button>
                        <sl-button>Exit</sl-button>
                    </sl-button-group>
                `
            },
            'inventory-window': {
                title: 'Inventory',
                content: `
                    <div class="inventory-grid"></div>
                `
            },
            'settings-window': {
                title: 'Settings',
                content: `
                    <sl-tab-group>
                        <sl-tab slot="nav" panel="graphics">Graphics</sl-tab>
                        <sl-tab slot="nav" panel="audio">Audio</sl-tab>
                        <sl-tab slot="nav" panel="controls">Controls</sl-tab>
                        
                        <sl-tab-panel name="graphics">Graphics settings...</sl-tab-panel>
                        <sl-tab-panel name="audio">Audio settings...</sl-tab-panel>
                        <sl-tab-panel name="controls">Control settings...</sl-tab-panel>
                    </sl-tab-group>
                `
            }
        };

        // Create windows
        Object.entries(windowsConfig).forEach(([id, config]) => {
            this.createWindow(id, config);
        });
    }

    createWindow(id, config) {
        if (id === 'devtools-window') {
            const debugPanels = {
                performance: {
                    title: 'Performance',
                    metrics: [
                        { id: 'fps', label: 'FPS', showBar: true },
                        { id: 'memory', label: 'Memory', showBar: true },
                        { id: 'drawcalls', label: 'Draw Calls' }
                    ]
                },
                world: {
                    title: 'World',
                    metrics: [
                        { id: 'chunks', label: 'Active Chunks' },
                        { id: 'blocks', label: 'Total Blocks' }
                    ]
                },
                player: {
                    title: 'Player',
                    metrics: [
                        { id: 'position', label: 'Position' },
                        { id: 'chunk', label: 'Current Chunk' }
                    ]
                }
            };

            const content = this.createDevToolsContent(debugPanels);
            config.content = content;
        }

        const win = UIComponents.window({
            title: config.title,
            content: config.content
        });
        win.id = id;
        win.style.display = 'none';  // Start hidden
        document.querySelector('.game-ui').appendChild(win);
        // Add draggable behavior and event listeners as before
        const header = win.querySelector('.window-header');
        if (header) {
            this.makeDraggable(win, header);
        }
        const closeButton = win.querySelector('.close-button');
        if (closeButton) {
            closeButton.addEventListener('click', () => this.toggleWindow(id));
        }
        // For the devtools window, populate debug flags using UIUtils:
        if (id === 'devtools-window') {
            const debugPanels = UIDebug.createDebugPanel();
            const content = win.querySelector('.window-content');
            
            content.innerHTML = `
                <sl-tab-group>
                    ${Object.entries(debugPanels).map(([key, panel]) => `
                        <sl-tab slot="nav" panel="${key}">${panel.title}</sl-tab>
                    `).join('')}
                    
                    ${Object.entries(debugPanels).map(([key, panel]) => `
                        <sl-tab-panel name="${key}">
                            ${UIDebug.createDebugSection(panel)}
                        </sl-tab-panel>
                    `).join('')}
                </sl-tab-group>
            `;

            this.setupDevToolsUpdates(win);
        }

        return win;
    }

    createDevToolsContent(panels) {
        return `
            <sl-tab-group>
                ${Object.entries(panels).map(([key, panel]) => `
                    <sl-tab slot="nav" panel="${key}">${panel.title}</sl-tab>
                `).join('')}
                
                ${Object.entries(panels).map(([key, panel]) => `
                    <sl-tab-panel name="${key}">
                        <div class="debug-section">
                            <h3>${panel.title}</h3>
                            <div class="metric-grid">
                                ${panel.metrics.map(metric => `
                                    <div class="metric-card" data-metric="${metric.id}">
                                        <div class="metric-header">
                                            <span class="label">${metric.label}</span>
                                            <span class="value">--</span>
                                        </div>
                                        ${metric.showBar ? `
                                            <div class="progress-bar">
                                                <div class="progress-fill" style="width: 0%"></div>
                                            </div>
                                        ` : ''}
                                    </div>
                                `).join('')}
                            </div>
                        </div>
                    </sl-tab-panel>
                `).join('')}
            </sl-tab-group>
        `;
    }

    setupDevToolsUpdates(win) {
        if (!win) return;

        // Setup metrics update interval
        const updateInterval = setInterval(() => {
            if (win.style.display !== 'none') {
                const metrics = this.gatherMetrics();
                this.updateDebugInfo({
                    'player-position': metrics.position.value,
                    'fps-counter': metrics.fps.value,
                    'memory-usage': metrics.memory.value,
                    'draw-calls': metrics.drawcalls.value,
                    'chunks': metrics.chunks.value
                });
            }
        }, 100); // Update 10 times per second

        // Clear interval when window is closed
        win.addEventListener('sl-hide', () => clearInterval(updateInterval));
    }

    updateDebugInfo(metrics) {
        const devTools = document.getElementById('devtools-window');
        if (!devTools) return;

        Object.entries(metrics).forEach(([key, value]) => {
            // Find the metric card by data attribute
            const metricCard = devTools.querySelector(`[data-metric="${key}"] .value`);
            if (metricCard) {
                metricCard.textContent = value;
                
                // Update progress bars if they exist
                const progressBar = devTools.querySelector(`[data-metric="${key}"] .progress-fill`);
                if (progressBar) {
                    let barValue = 0;
                    switch (key) {
                        case 'fps-counter':
                            barValue = Math.min((value / 60) * 100, 100);
                            break;
                        case 'memory-usage':
                            const memValue = parseInt(value);
                            barValue = Math.min((memValue / 1024) * 100, 100); // Assuming 1GB max
                            break;
                    }
                    progressBar.style.width = `${barValue}%`;
                }
            }
        });
    }

    gatherMetrics() {
        const scene = document.querySelector('a-scene');
        const player = document.querySelector('#player-rig');
        const now = performance.now();
        const delta = now - (this.lastFpsTime || now);
        this.lastFpsTime = now;

        // Get player position with proper formatting
        let position = '0, 0, 0';
        if (player && player.object3D) {
            const pos = player.object3D.position;
            position = `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
        }
        
        return {
            fps: {
                value: Math.round(1000 / delta),
                barValue: Math.min((1000 / delta) / 60 * 100, 100)
            },
            memory: {
                value: `${Math.round(performance.memory?.usedJSHeapSize / 1048576) || 0} MB`,
                barValue: Math.min((performance.memory?.usedJSHeapSize / performance.memory?.jsHeapSizeLimit) * 100 || 0, 100)
            },
            drawcalls: {
                value: scene?.renderer?.info.render.calls || 0
            },
            position: {
                value: position
            },
            chunks: {
                value: window.game?.chunkManager?.chunks?.size || 0
            }
        };
    }

    makeDraggable(element, handle = element) {
        let isDragging = false;
        let currentX;
        let currentY;
        let initialX;
        let initialY;
        let xOffset = 0;
        let yOffset = 0;

        handle.style.cursor = 'move';
        
        const dragStart = (e) => {
            if (e.type === "touchstart") {
                initialX = e.touches[0].clientX - xOffset;
                initialY = e.touches[0].clientY - yOffset;
            } else {
                initialX = e.clientX - xOffset;
                initialY = e.clientY - yOffset;
            }
            
            if (e.target === handle) {
                isDragging = true;
                element.style.transition = 'none';
            }
        };

        const drag = (e) => {
            if (isDragging) {
                e.preventDefault();
                
                if (e.type === "touchmove") {
                    currentX = e.touches[0].clientX - initialX;
                    currentY = e.touches[0].clientY - initialY;
                } else {
                    currentX = e.clientX - initialX;
                    currentY = e.clientY - initialY;
                }

                xOffset = currentX;
                yOffset = currentY;

                element.style.transform = `translate(${currentX}px, ${currentY}px)`;
            }
        };

        const dragEnd = () => {
            isDragging = false;
            element.style.transition = '';
        };

        handle.addEventListener('mousedown', dragStart);
        document.addEventListener('mousemove', drag);
        document.addEventListener('mouseup', dragEnd);
        handle.addEventListener('touchstart', dragStart, { passive: true });
        document.addEventListener('touchmove', drag, { passive: true });
        document.addEventListener('touchend', dragEnd);
    }

    bindEvents() {
        // Tool button clicks
        document.querySelectorAll('.tool-button').forEach(button => {
            button.addEventListener('click', (e) => {
                const windowId = e.currentTarget.dataset.window;
                if (windowId) {
                    this.toggleWindow(windowId);
                }
            });
        });

        // Remove duplicate hotbar event listeners
        const hotbar = document.getElementById('hotbar');
        if (hotbar) {
            hotbar.innerHTML = ''; // Clear existing content
            this.setupHotbar(); // Recreate hotbar
        }
    }

    ensureDebugElements() {
        // Only create DevTools window if it doesn't exist
        if (!document.getElementById('devtools-window')) {
            this.createWindow('devtools-window', {
                title: 'Developer Tools',
                content: this.createDevToolsContent(UIDebug.createDebugPanel())
            });
        }
    }

    initializeState() {
        // Get stateManager from game instance or create fallback state
        if (window.game?.stateManager) {
            this.stateManager = window.game.stateManager;
        } else {
            console.warn('StateManager not found, creating fallback state');
            this.stateManager = {
                state: {
                    windows: {},
                    inventory: [],
                    activeSlot: 0,
                    metrics: {}
                },
                getState: function() { return this.state; },
                subscribe: function() { /* fallback */ }
            };
        }
    }

    setupComponents() {
        // Create draggable inventory grid
        const inventoryGrid = document.querySelector('.inventory-grid');
        if (inventoryGrid) {
            inventoryGrid.innerHTML = `
                <sl-split-panel position="25">
                    <div slot="start">
                        <sl-tree selection="multiple">
                            <sl-tree-item expanded>
                                Equipment
                                <sl-tree-item>Weapons</sl-tree-item>
                                <sl-tree-item>Armor</sl-tree-item>
                            </sl-tree-item>
                            <sl-tree-item expanded>
                                Resources
                                <sl-tree-item>Materials</sl-tree-item>
                                <sl-tree-item>Crafting</sl-tree-item>
                            </sl-tree-item>
                        </sl-tree>
                    </div>
                    <div slot="end" class="inventory-slots">
                        ${this.createInventorySlots()}
                    </div>
                </sl-split-panel>
            `;
        }

        // Create item tooltips
        this.setupTooltips();
    }

    createInventorySlots() {
        return Array(32).fill(0).map((_, i) => `
            <sl-card class="inventory-slot" data-slot="${i}">
                <sl-image
                    slot="image"
                    src="assets/empty-slot.png"
                    alt="Empty Slot">
                </sl-image>
                <sl-badge variant="neutral">${i + 1}</sl-badge>
            </sl-card>
        `).join('');
    }

    setupTooltips() {
        document.querySelectorAll('.inventory-slot').forEach(slot => {
            slot.addEventListener('mouseenter', (e) => {
                const item = this.stateManager.getState().inventory[e.target.dataset.slot];
                if (item) {
                    const tooltip = document.createElement('sl-tooltip');
                    tooltip.content = `
                        <sl-card>
                            <strong>${item.name}</strong>
                            <p>${item.description}</p>
                            ${item.stats ? `
                                <sl-rating label="Quality" value="${item.stats.quality}"></sl-rating>
                            ` : ''}
                        </sl-card>
                    `;
                    e.target.appendChild(tooltip);
                    tooltip.show();
                }
            });
        });
    }

    // Make UI elements draggable
    setupDraggable(element) {
        element.addEventListener('sl-dragstart', () => {
            element.classList.add('dragging');
        });

        element.addEventListener('sl-dragend', () => {
            element.classList.remove('dragging');
        });
    }

    // Update UI when state changes
    updateUI() {
        const state = this.stateManager.getState();

        // Update inventory slots
        state.inventory.forEach((item, index) => {
            const slot = document.querySelector(`.inventory-slot[data-slot="${index}"]`);
            if (slot) {
                const image = slot.querySelector('sl-image');
                if (item) {
                    image.src = item.icon;
                    image.alt = item.name;
                } else {
                    image.src = 'assets/empty-slot.png';
                    image.alt = 'Empty Slot';
                }
            }
        });

        // Update hotbar
        const hotbar = document.getElementById('hotbar');
        if (hotbar) {
            hotbar.innerHTML = state.hotbar.map((item, i) => `
                <sl-button-group class="hotbar-slot ${i === state.activeSlot ? 'active' : ''}" data-slot="${i}">
                    <sl-button>${i + 1}</sl-button>
                    ${item ? `
                        <sl-avatar
                            image="${item.icon}"
                            label="${item.name}">
                        </sl-avatar>
                    ` : ''}
                </sl-button-group>
            `).join('');
        }
    }

    updateDebugInfo(info) {
        // Update debug window elements instead of floating text
        const debugWindow = document.getElementById('devtools-window');
        if (!debugWindow) return;

        // Update position in player tab
        const posValue = debugWindow.querySelector('[data-metric="position"] .value');
        if (posValue && info['player-position']) {
            posValue.textContent = info['player-position'];
        }

        // Update other metrics
        Object.entries(info).forEach(([key, value]) => {
            const metric = debugWindow.querySelector(`[data-metric="${key}"] .value`);
            if (metric) {
                metric.textContent = value;
            }
        });
    }

    setupUILayering() {
        const canvas = document.querySelector('.a-canvas');
        if (canvas) {
            canvas.style.zIndex = getComputedStyle(document.documentElement)
                .getPropertyValue('--z-scene');
        }

        // Ensure proper stacking order
        const uiElements = {
            '.game-ui': 'var(--z-ui-base)',
            '.toolbar': 'var(--z-toolbar)',
            '.hotbar': 'var(--z-hotbar)',
            '.ui-window': 'var(--z-window)',
            '#loading-screen': 'var(--z-loading)'
        };

        Object.entries(uiElements).forEach(([selector, zIndex]) => {
            document.querySelectorAll(selector).forEach(el => {
                el.style.zIndex = zIndex;
                el.style.position = 'fixed';
                el.classList.add('interactive');
                el.style.pointerEvents = 'auto';
            });
        });
    }

    toggleMainMenu() {
        useGameStore.getState().toggleMainMenu();
    }

    toggleWindow(windowId) {
        const window = document.getElementById(windowId);
        if (window) {
            const isVisible = window.style.display !== 'none';
            window.style.display = isVisible ? 'none' : 'block';
        }
        
        // Update store
        useGameStore.getState().toggleWindow(windowId);
    }

    handleEscKey() {
        const store = useGameStore.getState();
        if (store.isMainMenuOpen) {
            store.toggleMainMenu();
        } else {
            store.toggleMainMenu();
            store.setPaused(true);
        }
    }

    setupInventory() {
        this.inventory = {
            slots: new Array(32).fill(null),
            hotbar: new Array(8).fill(null),
            activeSlot: 0
        };

        // Add some initial blocks to hotbar
        this.inventory.hotbar[0] = { type: 'DIRT_0', count: 64 };
        this.inventory.hotbar[1] = { type: 'STONE_0', count: 64 };
        this.inventory.hotbar[2] = { type: 'GRASS_0', count: 64 };
        
        this.updateHotbarUI();
    }

    updateHotbarUI() {
        const hotbar = document.getElementById('hotbar');
        if (!hotbar) return;

        hotbar.innerHTML = this.inventory.hotbar.map((item, i) => `
            <div class="hotbar-slot ${i === this.inventory.activeSlot ? 'active' : ''}" 
                 data-slot="${i}" 
                 data-block-type="${item?.type || ''}">
                <div class="slot-number">${i + 1}</div>
                ${item ? `
                    <div class="slot-content">
                        <div class="item-icon ${item.type.toLowerCase()}"></div>
                        <div class="item-count">${item.count}</div>
                    </div>
                ` : ''}
            </div>
        `).join('');
    }

    setupNotifications() {
        this.notifications = document.createElement('div');
        this.notifications.className = 'notification-container';
        document.querySelector('.game-ui').appendChild(this.notifications);
    }

    showNotification(message, type = 'info', duration = 3000) {
        const notification = document.createElement('div');
        notification.className = `notification ${type}`;
        notification.innerHTML = `
            <sl-icon name="${this.getIconForType(type)}"></sl-icon>
            <span>${message}</span>
        `;
        
        this.notifications.appendChild(notification);
        
        // Animate in
        requestAnimationFrame(() => notification.classList.add('visible'));
        
        // Remove after duration
        setTimeout(() => {
            notification.classList.remove('visible');
            setTimeout(() => notification.remove(), 300);
        }, duration);
    }

    getIconForType(type) {
        const icons = {
            info: 'info-circle',
            success: 'check-circle',
            warning: 'exclamation-triangle',
            error: 'exclamation-circle'
        };
        return icons[type] || icons.info;
    }

    minimizeWindow(id) {
        const window = document.getElementById(id);
        const content = window.querySelector('.window-content');
        const isMinimized = window.classList.contains('minimized');
        
        if (isMinimized) {
            content.style.display = 'block';
            window.classList.remove('minimized');
        } else {
            content.style.display = 'none';
            window.classList.add('minimized');
        }
        
        this.showNotification(`Window ${isMinimized ? 'restored' : 'minimized'}`, 'info', 1500);
    }

    makeResizable(window) {
        const resizer = document.createElement('div');
        resizer.className = 'window-resizer';
        window.appendChild(resizer);

        let originalWidth, originalHeight, startX, startY;

        const startResize = (e) => {
            originalWidth = window.offsetWidth;
            originalHeight = window.offsetHeight;
            startX = e.pageX;
            startY = e.pageY;
            
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };

        const resize = (e) => {
            const width = originalWidth + (e.pageX - startX);
            const height = originalHeight + (e.pageY - startY);
            
            window.style.width = `${Math.max(200, width)}px`;
            window.style.height = `${Math.max(100, height)}px`;
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };

        resizer.addEventListener('mousedown', startResize);
    }

    setupModernWindows() {
        const modernWindowsConfig = {
            'inventory-window': {
                title: 'Inventory',
                width: 630,
                features: ['minimize', 'resize', 'drag'],
                content: `
                    <sl-tab-group>
                        <sl-tab slot="nav" panel="inventory">Inventory</sl-tab>
                        <sl-tab slot="nav" panel="crafting">Crafting</sl-tab>
                        
                        <sl-tab-panel name="inventory">
                            <div class="inventory-grid modern">
                                ${this.createModernInventoryGrid()}
                            </div>
                        </sl-tab-panel>
                        
                        <sl-tab-panel name="crafting">
                            <div class="crafting-interface">
                                <div class="crafting-grid modern"></div>
                                <div class="crafting-output"></div>
                                <div class="recipe-book"></div>
                            </div>
                        </sl-tab-panel>
                    </sl-tab-group>
                `
            },
            'devtools-window': {
                title: 'Developer Tools',
                width: 400,
                features: ['resize', 'drag'],
                content: `
                    <sl-tab-group>
                        <sl-tab slot="nav" panel="performance">Performance</sl-tab>
                        <sl-tab slot="nav" panel="debug">Debug</sl-tab>
                        
                        <sl-tab-panel name="performance">
                            <div class="metrics-grid">
                                <sl-progress-ring value="60" label="FPS"></sl-progress-ring>
                                <sl-progress-bar value="30" label="Memory Usage"></sl-progress-bar>
                            </div>
                        </sl-tab-panel>
                        
                        <sl-tab-panel name="debug">
                            <sl-details summary="Player Info">
                                <sl-badge variant="neutral" id="player-position">0, 0, 0</sl-badge>
                                <sl-badge variant="neutral" id="player-chunk">0, 0</sl-badge>
                            </sl-details>
                        </sl-tab-panel>
                    </sl-tab-group>
                `
            }
        };

        Object.entries(modernWindowsConfig).forEach(([id, config]) => {
            this.createModernWindow(id, config);
        });
    }

    createModernWindow(id, config) {
        const window = document.createElement('div');
        window.id = id;
        window.className = 'ui-window modern';
        window.innerHTML = `
            <sl-card>
                <div slot="header" class="window-header">
                    ${config.title}
                    <div class="window-controls">
                        ${config.features.includes('minimize') ? 
                            '<sl-icon-button name="dash" class="minimize-button"></sl-icon-button>' : ''}
                        <sl-icon-button name="x" class="close-button"></sl-icon-button>
                    </div>
                </div>
                ${config.content}
            </sl-card>
        `;

        document.querySelector('.game-ui').appendChild(window);
        
        if (config.features.includes('drag')) {
            this.makeDraggable(window);
        }
        if (config.features.includes('resize')) {
            this.makeResizable(window);
        }

        return window;
    }

    createModernInventoryGrid() {
        return Array(32).fill(0).map((_, i) => `
            <sl-card class="inventory-slot" data-slot="${i}">
                <div class="slot-content">
                    <sl-avatar shape="rounded"></sl-avatar>
                    <sl-badge pill>${i + 1}</sl-badge>
                </div>
            </sl-card>
        `).join('');
    }

    setupContextMenus() {
        document.addEventListener('contextmenu', (e) => {
            const slot = e.target.closest('.inventory-slot');
            if (slot) {
                e.preventDefault();
                this.showItemContextMenu(slot, e);
            }
        });
    }

    showItemContextMenu(slot, event) {
        const menu = document.createElement('sl-menu');
        menu.className = 'context-menu';
        menu.innerHTML = `
            <sl-menu-item value="use">Use</sl-menu-item>
            <sl-menu-item value="drop">Drop</sl-menu-item>
            <sl-menu-item value="split">Split Stack</sl-menu-item>
        `;

        menu.style.position = 'fixed';
        menu.style.left = `${event.clientX}px`;
        menu.style.top = `${event.clientY}px`;

        document.body.appendChild(menu);
        
        const closeMenu = () => {
            menu.remove();
            document.removeEventListener('click', closeMenu);
        };

        document.addEventListener('click', closeMenu);
    }
}
