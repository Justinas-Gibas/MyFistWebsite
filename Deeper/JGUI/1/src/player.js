import { CONFIG, Logger } from './config.js';
import { useGameStore } from './managers.js';

class UIPlayerInput {
    // Delegate UI input events to centralized UI functions in components.js
    handleUIClick(event) {
        window.UI && window.UI.handleUIClick(event);
    }
    handleUIStart(event) {
        window.UI && window.UI.handleUIStart(event);
    }
    handleUIMove(event) {
        window.UI && window.UI.handleUIMove(event);
    }
    handleUIEnd(event) {
        window.UI && window.UI.handleUIEnd(event);
    }
    handleUIHover(event) {
        window.UI && window.UI.handleUIHover(event);
    }
}

// Replace the existing player-controls component with this simplified version
AFRAME.registerComponent('player-controls', {
    schema: {
        mouseSensitivity: { type: 'number', default: 5 },
        invertY: { type: 'boolean', default: false }
    },

    init: function() {
        // Core setup
        this.setupCoreControls();
        this.setupInputBindings();
        this.setupHotbarControls();
        this.setupItemPickup();
        
        // Initialize UI state
        const store = useGameStore.getState();
        this.uiState = {
            isUIActive: false,
            activeWindow: null
        };
    },

    setupCoreControls: function() {
        // Get camera reference
        this.camera = this.el.querySelector('[camera]');
        
        // Setup built-in controls
        if (this.camera) {
            // Configure look controls
            this.camera.setAttribute('look-controls', {
                pointerLockEnabled: true,
                touchEnabled: true,
                mouseEnabled: true
            });

            // Configure WASD controls
            this.camera.setAttribute('wasd-controls', {
                acceleration: 65
            });
        }

        // Add cursor for interaction
        const cursor = this.camera.querySelector('[raycaster]');
        if (cursor) {
            cursor.setAttribute('raycaster', {
                objects: '.interactive',
                far: 5
            });
        }
    },

    setupInputBindings: function() {
        // Hotkeys using A-Frame's input system
        this.el.addEventListener('keydown', (e) => {
            const store = useGameStore.getState();
            
            switch(e.code) {
                case 'Escape':
                    store.toggleMainMenu();
                    break;
                case 'KeyI':
                    store.toggleWindow('inventory-window');
                    break;
                case 'KeyE':
                    store.toggleWindow('settings-window');
                    break;
                case 'Tab':
                    e.preventDefault();
                    store.toggleWindow('devtools-window');
                    break;
            }
        });

        // Use A-Frame's click system for interaction
        this.el.sceneEl.addEventListener('click', (e) => {
            const clicked = e.detail.intersectedEl;
            if (!clicked) return;

            if (clicked.classList.contains('interactive')) {
                this.handleInteraction(clicked);
            }
        });

        // VR Controller inputs
        this.el.addEventListener('triggerdown', this.onTriggerDown.bind(this));
        this.el.addEventListener('triggerup', this.onTriggerUp.bind(this));
        this.el.addEventListener('thumbstickdown', this.onThumbstickDown.bind(this));
    },

    setupHotbarControls() {
        // Number keys 1-8 for hotbar selection
        document.addEventListener('keydown', (e) => {
            const num = parseInt(e.key);
            if (!isNaN(num) && num >= 1 && num <= 8) {
                this.selectHotbarSlot(num - 1);
            }
        });

        // Mouse wheel for hotbar scrolling
        document.addEventListener('wheel', (e) => {
            const delta = Math.sign(e.deltaY);
            const currentSlot = this.inventory.activeSlot;
            let newSlot = currentSlot + delta;
            
            // Wrap around
            if (newSlot < 0) newSlot = 7;
            if (newSlot > 7) newSlot = 0;
            
            this.selectHotbarSlot(newSlot);
        });
    },

    setupItemPickup() {
        // Pickup radius check interval
        setInterval(() => {
            if (this.el.sceneEl.is('vr-mode')) return; // Skip in VR mode

            const playerPos = this.el.object3D.position;
            const items = document.querySelectorAll('.pickup-item');

            items.forEach(item => {
                const itemPos = item.object3D.position;
                const distance = playerPos.distanceTo(itemPos);

                if (distance < 2) { // Pickup radius
                    this.pickupItem(item);
                }
            });
        }, 100);
    },

    pickupItem(item) {
        const itemType = item.getAttribute('item-pickup').type;
        
        // Add to inventory
        const added = this.inventory.addItem(itemType);
        if (added) {
            // Play pickup sound
            this.el.emit('pickupSound');
            
            // Remove item entity
            item.parentNode.removeChild(item);
            
            // Show pickup message
            this.showPickupMessage(itemType);
        }
    },

    selectHotbarSlot(index) {
        this.inventory.activeSlot = index;
        this.updateHotbarUI();
        
        // Update active block type for placement
        const activeSlot = this.inventory.hotbar[index];
        if (activeSlot) {
            document.querySelector('a-scene').setAttribute('block-interaction', {
                activeBlockType: activeSlot.type
            });
        }
    },

    handleInteraction: function(element) {
        // Handle interactive element clicks
        if (element.dataset.action) {
            switch(element.dataset.action) {
                case 'toggle-window':
                    useGameStore.getState().toggleWindow(element.dataset.window);
                    break;
                case 'menu-item':
                    this.handleMenuItem(element.dataset.menuItem);
                    break;
            }
        }
    },

    // VR-specific handlers
    onTriggerDown: function(evt) {
        const intersection = evt.target.components.raycaster?.getIntersection();
        if (intersection?.el.classList.contains('interactive')) {
            this.handleInteraction(intersection.el);
        }
    },

    onTriggerUp: function() {
        // Handle trigger release
    },

    onThumbstickDown: function(evt) {
        const store = useGameStore.getState();
        if (evt.detail.y < -0.5) {
            store.toggleMainMenu();
        }
    },

    pause: function() {
        if (this.camera) {
            this.camera.setAttribute('look-controls', 'enabled', false);
            this.camera.setAttribute('wasd-controls', 'enabled', false);
        }
    },

    play: function() {
        if (this.camera) {
            this.camera.setAttribute('look-controls', 'enabled', true);
            this.camera.setAttribute('wasd-controls', 'enabled', true);
        }
    }
});

export { UIPlayerInput };
