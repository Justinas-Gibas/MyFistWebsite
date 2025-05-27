import { CONFIG, Logger } from './config.js';

AFRAME.registerComponent('player-controls', {
    init: function() {
        this.loggingEnabled = true;
        if (this.loggingEnabled) console.log('Initializing player controls component');
        this.setupVRControls();
        this.setupKeyboardControls();

        // Wait for game initialization
        this.waitForGame().then(() => {
            // Get manager references from game instance
            this.chunkManager = window.game.chunkManager;
            this.uiManager = window.game.uiManager;
            
            // Update chunks around the player
            this.updateChunksAroundPlayer();
        }).catch(error => {
            console.error('Failed to initialize player controls:', error);
        });

        // Add position update interval
        this.lastPosition = new THREE.Vector3();
        this.positionUpdateInterval = setInterval(() => {
            this.updatePlayerPosition();
        }, CONFIG.LOGGING.updateFrequency);
    },

    waitForGame() {
        return new Promise((resolve, reject) => {
            const maxAttempts = 10;
            let attempts = 0;
            
            const checkGame = () => {
                if (window.game?.chunkManager) {
                    resolve();
                } else if (attempts >= maxAttempts) {
                    reject(new Error('Game initialization timeout'));
                } else {
                    attempts++;
                    setTimeout(checkGame, 500);
                }
            };
            
            checkGame();
        });
    },

    setupVRControls: function() {
        if (this.loggingEnabled) console.log('Setting up VR controls');

        const rightHand = document.querySelector('[oculus-touch-controls="hand: right"]');
        if (rightHand) {
            rightHand.addEventListener('triggerdown', () => {
                if (this.loggingEnabled) console.log('Right hand trigger pressed');
                this.attemptChunkInteraction();
            });
        }
    },

    setupKeyboardControls: function() {
        if (this.loggingEnabled) console.log('Setting up keyboard controls');

        document.addEventListener('keydown', (event) => {
            if (event.code === 'Space') {
                if (this.loggingEnabled) console.log('Space key pressed');
                this.attemptChunkInteraction();
            }
        });
    },

    attemptChunkInteraction: function() {
        if (this.loggingEnabled) console.log('Attempting chunk interaction');

        const cursor = document.querySelector('[raycaster]');
        if (cursor && cursor.components.raycaster.intersectedEls.length > 0) {
            const intersectedEl = cursor.components.raycaster.intersectedEls[0];
            if (this.loggingEnabled) console.log('Intersected element:', intersectedEl);
            intersectedEl.emit('click');
        }
    },

    updateChunksAroundPlayer: function() {
        if (!window.game) return;
        
        const playerRig = document.querySelector('#player-rig');
        if (playerRig) {
            const position = playerRig.getAttribute('position');
            window.game.updateChunksAroundPlayer();

            // Update debug info with current position
            if (window.uiManager) {
                window.uiManager.updateDebugInfo({
                    'player-position': `${position.x.toFixed(2)}, ${position.y.toFixed(2)}, ${position.z.toFixed(2)}`,
                    'player-chunk': `${Math.floor(position.x / CONFIG.WORLD.CHUNK_SIZE)}, ${Math.floor(position.z / CONFIG.WORLD.CHUNK_SIZE)}`
                });
            }
        }

        // Keep checking position periodically
        requestAnimationFrame(() => this.updateChunksAroundPlayer());
    },

    updatePlayerPosition: function() {
        // Get camera position instead of player rig
        const camera = document.querySelector('a-camera');
        if (!camera) return;

        const cameraObject3D = camera.object3D;
        const worldPosition = new THREE.Vector3();
        cameraObject3D.getWorldPosition(worldPosition);
        
        // Only update if position has changed
        if (!worldPosition.equals(this.lastPosition)) {
            if (CONFIG.FLAGS.LOG_PLAYER_POSITION) {
                Logger.info('Player', 'Camera Position:', {
                    x: worldPosition.x.toFixed(2),
                    y: worldPosition.y.toFixed(2),
                    z: worldPosition.z.toFixed(2)
                });
            }

            // Always update debug info regardless of logging flag
            if (window.game?.uiManager) {
                window.game.uiManager.updateDebugInfo({
                    'player-position': `${worldPosition.x.toFixed(2)}, ${worldPosition.y.toFixed(2)}, ${worldPosition.z.toFixed(2)}`,
                    'player-chunk': `${Math.floor(worldPosition.x / CONFIG.WORLD.CHUNK_SIZE)}, ${Math.floor(worldPosition.z / CONFIG.WORLD.CHUNK_SIZE)}`
                });
            }
            this.lastPosition.copy(worldPosition);
        }
    },

    remove: function() {
        // Clean up interval when component is removed
        if (this.positionUpdateInterval) {
            clearInterval(this.positionUpdateInterval);
        }
    }
});
