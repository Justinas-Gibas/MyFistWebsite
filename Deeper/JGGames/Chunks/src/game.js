import { CONFIG, Logger } from './config.js';
import { ChunkManager, UIManager, VoxelManager } from './managers.js';

class GameInitializer {
    constructor() {
        this.initPromise = null;
        this.sceneElement = document.querySelector('a-scene');
        this.loadingScreen = document.querySelector('#loading-screen');
        this.initialized = false;
        
        // Game state
        this.state = {
            paused: false,
            debug: CONFIG.DEBUG,
            playerPosition: { x: 0, y: 0, z: 0 },
            activeChunks: new Set()
        };

        this.chunkManager = null;
        this.uiManager = null;
        this.voxelManager = null;
        this.lastChunkUpdate = 0;
        this.chunkUpdateThrottle = CONFIG.PERFORMANCE.THROTTLE.CHUNK_UPDATES; // 100ms
    }

    async initialize() {
        if (this.initPromise) return this.initPromise;

        this.initPromise = new Promise(async (resolve, reject) => {
            try {
                Logger.info('GameInitializer', 'Starting initialization');
                
                await this.waitForScene();
                await this.initializeManagers();
                await this.waitForPlayer();
                await this.initializeWorld();
                this.setupEventListeners();
                this.startGameLoop();
                this.fadeOutLoadingScreen();
                
                this.initialized = true;
                CONFIG.FLAGS.SCENE_READY = true;
                Logger.info('GameInitializer', 'Initialization complete');
                resolve();
            } catch (error) {
                Logger.error('GameInitializer', 'Initialization failed', error);
                reject(error);
            }
        });

        return this.initPromise;
    }

    async initializeManagers() {
        try {
            // Initialize managers in correct order
            this.chunkManager = new ChunkManager();
            this.voxelManager = new VoxelManager();
            this.uiManager = new UIManager();
            
            // Make managers available globally for debugging
            window.game = this;
            
            // Get initial player position
            const playerRig = document.querySelector('#player-rig');
            if (playerRig) {
                const position = playerRig.getAttribute('position');
                const chunkPos = this.calculateChunkPosition(position);
                // Generate initial chunks around player
                await this.loadChunksAroundPosition(chunkPos);
            }
            
            Logger.info('GameInitializer', 'Managers initialized successfully');
        } catch (error) {
            Logger.error('GameInitializer', 'Failed to initialize managers:', error);
            throw error;
        }
    }

    setupDebugUpdates() {
        setInterval(() => {
            if (!CONFIG.DEBUG) return;
            
            const debugInfo = {
                'fps': Math.round(1000 / (performance.now() - this.lastFrameTime)),
                'player-position': this.getFormattedPlayerPosition(),
                'chunk-count': this.chunkManager.chunks.size,
                'total-blocks': this.getTotalBlockCount(),
                'memory-usage': this.getMemoryUsage()
            };

            this.uiManager.updateDebugInfo(debugInfo);
            this.lastFrameTime = performance.now();
        }, CONFIG.LOGGING.updateFrequency);
    }

    getFormattedPlayerPosition() {
        const pos = this.state.playerPosition;
        return `${pos.x.toFixed(2)}, ${pos.y.toFixed(2)}, ${pos.z.toFixed(2)}`;
    }

    getTotalBlockCount() {
        let count = 0;
        this.chunkManager.chunks.forEach(chunk => {
            count += chunk.blocks?.size || 0;
        });
        return count;
    }

    getMemoryUsage() {
        if (!performance.memory) return '0 MB';
        return `${Math.round(performance.memory.usedJSHeapSize / 1048576)} MB`;
    }

    async initializeWorld() {
        try {
            if (!CONFIG.FLAGS.ENABLE_CHUNK_GENERATION) {
                Logger.info('Game', 'Chunk generation disabled by flag');
                return;
            }

            // Clear existing chunks
            if (this.chunkManager) {
                this.chunkManager.clear();
            }

            // Get player position or use default
            const playerRig = document.querySelector('#player-rig');
            const position = playerRig ? playerRig.getAttribute('position') : { x: 0, y: 0, z: 0 };
            const chunkPos = this.calculateChunkPosition(position);

            // Get current test mode or use default
            const testMode = CONFIG.DEBUG_OPTIONS.TEST_MODE;
            const testConfig = CONFIG.DEBUG_OPTIONS.TEST_MODES[testMode] || CONFIG.DEBUG_OPTIONS.TEST_MODES.CENTER_WITH_BLOCKS;

            // Generate chunks based on test mode
            if (testConfig && testConfig.neighborChunks) {
                await this.loadChunksAroundPosition(chunkPos);
            } else {
                // Generate just the center chunk as fallback
                await this.chunkManager.createChunk(chunkPos);
            }

            Logger.info('Game', 'World initialized successfully');
        } catch (error) {
            Logger.error('Game', 'World initialization failed', error);
            throw error;
        }
    }

    updateChunksAroundPlayer() {
        const playerRig = document.querySelector('#player-rig');
        if (!playerRig || !this.chunkManager) return;

        const position = playerRig.getAttribute('position');
        const chunkPos = this.calculateChunkPosition(position);

        // Only update if player moved to new chunk
        if (this.hasChunkPositionChanged(chunkPos)) {
            this.loadChunksAroundPosition(chunkPos);
            this.unloadDistantChunks(chunkPos);
            this.lastChunkPos = chunkPos;
        }
    }

    async loadChunksAroundPosition(centerPos) {
        // Check if enough time has passed since last update
        const now = performance.now();
        if (now - this.lastChunkUpdate < this.chunkUpdateThrottle) {
            return;
        }
        this.lastChunkUpdate = now;

        const renderDistance = CONFIG.SIZES.RENDER_DISTANCE;
        const promises = [];

        // Track which chunks we're trying to create to avoid duplicates
        const pendingChunks = new Set();

        for (let x = -renderDistance; x <= renderDistance; x++) {
            for (let z = -renderDistance; z <= renderDistance; z++) {
                const pos = {
                    x: centerPos.x + x,
                    y: centerPos.y,
                    z: centerPos.z + z
                };
                const key = `${pos.x},${pos.y},${pos.z}`;
                
                // Only create chunk if it doesn't exist and isn't pending
                if (!this.chunkManager.chunks.has(key) && !pendingChunks.has(key)) {
                    pendingChunks.add(key);
                    const chunk = this.chunkManager.createChunk(pos);
                    if (chunk) promises.push(chunk);
                }
            }
        }

        if (promises.length > 0) {
            await Promise.all(promises);
            Logger.info('GameInitializer', `Loaded ${promises.length} new chunks`);
        }
    }

    unloadDistantChunks(centerPos) {
        for (const [key, chunk] of this.chunkManager.chunks) {
            const [x, y, z] = key.split(',').map(Number);
            const distance = Math.max(
                Math.abs(x - centerPos.x),
                Math.abs(z - centerPos.z)
            );
            
            if (distance > CONFIG.WORLD.UNLOAD_DISTANCE) {
                this.chunkManager.removeChunk({ x, y, z });
            }
        }
    }

    waitForScene() {
        return new Promise((resolve, reject) => {
            if (!this.sceneElement) {
                reject(new Error('Scene element not found'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Scene loading timed out'));
            }, CONFIG.LOADING.TIMEOUT);
            if (this.sceneElement.hasLoaded) {
                clearTimeout(timeout);
                resolve();
            } else {
                this.sceneElement.addEventListener('loaded', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            }
        });
    }

    waitForPlayer() {
        return new Promise((resolve, reject) => {
            const playerRig = document.querySelector('#player-rig');
            if (!playerRig) {
                reject(new Error('Player rig not found'));
                return;
            }

            const timeout = setTimeout(() => {
                reject(new Error('Player loading timed out'));
            }, CONFIG.LOADING.TIMEOUT);

            if (playerRig.hasLoaded) {
                clearTimeout(timeout);
                resolve();
            } else {
                playerRig.addEventListener('loaded', () => {
                    clearTimeout(timeout);
                    resolve();
                }, { once: true });
            }
        });
    }

    setupEventListeners() {
        // Handle pause/resume
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape') {
                this.togglePause();
            }
        });

        // Handle visibility change
        document.addEventListener('visibilitychange', () => {
            if (document.hidden) {
                this.pause();
            } else {
                this.resume();
            }
        });

        // Handle window resize
        window.addEventListener('resize', () => {
            this.handleResize();
        });
    }

    startGameLoop() {
        let lastTime = performance.now();
        
        const gameLoop = (currentTime) => {
            if (!this.state.paused) {
                const deltaTime = (currentTime - lastTime) / 1000;
                this.update(deltaTime);
                this.updateDebugInfo(); // Added this line
            }
            lastTime = currentTime;
            requestAnimationFrame(gameLoop);
        };

        requestAnimationFrame(gameLoop);
    }

    update(deltaTime) {
        if (!this.initialized) return;

        const camera = document.querySelector('a-camera');
        if (camera) {
            const worldPosition = new THREE.Vector3();
            camera.object3D.getWorldPosition(worldPosition);
            this.state.playerPosition = {
                x: worldPosition.x,
                y: worldPosition.y,
                z: worldPosition.z
            };
            
            // Update chunks around camera position
            const chunkPos = this.calculateChunkPosition(this.state.playerPosition);
            if (this.hasChunkPositionChanged(chunkPos)) {
                this.updateChunksAroundPosition(chunkPos);
                this.lastChunkPos = chunkPos;
            }
        }
    }

    calculateChunkPosition(position) {
        return {
            x: Math.floor(position.x / CONFIG.WORLD.CHUNK_SIZE),
            y: Math.floor(position.y / CONFIG.WORLD.CHUNK_SIZE),
            z: Math.floor(position.z / CONFIG.WORLD.CHUNK_SIZE)
        };
    }

    hasChunkPositionChanged(newPos) {
        if (!this.lastChunkPos) return true;
        return this.lastChunkPos.x !== newPos.x ||
               this.lastChunkPos.y !== newPos.y ||
               this.lastChunkPos.z !== newPos.z;
    }

    updateChunksAroundPosition(centerPos) {
        if (!CONFIG.FLAGS.ENABLE_CHUNK_UPDATES || !this.chunkManager) return;

        const renderDistance = CONFIG.SIZES.RENDER_DISTANCE;
        const promises = [];

        for (let x = -renderDistance; x <= renderDistance; x++) {
            for (let z = -renderDistance; z <= renderDistance; z++) {
                const pos = {
                    x: centerPos.x + x,
                    y: centerPos.y,
                    z: centerPos.z + z
                };
                const chunk = this.chunkManager.getOrCreateChunk(pos);
                if (chunk instanceof Promise) {
                    promises.push(chunk);
                }
            }
        }

        return Promise.all(promises);
    }

    updateDebug() {
        if (!CONFIG.DEBUG) return;
        
        const debugInfo = {
            fps: Math.round(1000 / (performance.now() - this.lastDebugUpdate)),
            position: `${this.state.playerPosition.x.toFixed(2)}, ${this.state.playerPosition.y.toFixed(2)}, ${this.state.playerPosition.z.toFixed(2)}`,
            chunks: this.state.activeChunks.size
        };

        this.uiManager.updateDebugInfo(debugInfo);
        this.lastDebugUpdate = performance.now();
    }

    updateDebugInfo() {
        if (!this.initialized || !this.uiManager) return;

        // Use camera position instead of player rig
        const camera = document.querySelector('a-camera');
        if (camera) {
            const worldPosition = new THREE.Vector3();
            camera.object3D.getWorldPosition(worldPosition);
            const chunkPos = this.calculateChunkPosition(worldPosition);
            
            this.uiManager.updateDebugInfo({
                'player-position': `${worldPosition.x.toFixed(2)}, ${worldPosition.y.toFixed(2)}, ${worldPosition.z.toFixed(2)}`,
                'player-chunk': `${chunkPos.x}, ${chunkPos.z}`,
                'chunk-count': this.chunkManager?.chunks.size || 0,
                'total-blocks': this.getTotalBlockCount()
            });
        }
    }

    updatePlayerDebugInfo(worldPosition) {
        if (!this.initialized || !this.uiManager) return;

        const chunkPos = this.calculateChunkPosition(worldPosition);
        
        // Update state
        this.state.playerPosition = {
            x: worldPosition.x,
            y: worldPosition.y,
            z: worldPosition.z
        };

        // Update UI with raw position values
        this.uiManager.updateDebugInfo({
            'player-position': `${worldPosition.x}, ${worldPosition.y}, ${worldPosition.z}`,
            'player-chunk': `${chunkPos.x}, ${chunkPos.z}`,
            'chunk-count': this.chunkManager?.chunks.size || 0,
            'total-blocks': this.getTotalBlockCount()
        });

        // For logging, we can still format the numbers
        if (CONFIG.FLAGS.LOG_PLAYER_POSITION) {
            Logger.info('Player', 'Camera Position:', {
                x: worldPosition.x.toFixed(2),
                y: worldPosition.y.toFixed(2),
                z: worldPosition.z.toFixed(2)
            });
        }
    }

    fadeOutLoadingScreen() {
        if (this.loadingScreen) {
            this.loadingScreen.style.opacity = '0';
            setTimeout(() => {
                this.loadingScreen.style.display = 'none';
            }, CONFIG.LOADING.FADE_DURATION);
        }
    }

    pause() {
        this.state.paused = true;
        Logger.info('Game', 'Game paused');
    }

    resume() {
        this.state.paused = false;
        Logger.info('Game', 'Game resumed');
    }

    togglePause() {
        if (this.state.paused) {
            this.resume();
        } else {
            this.pause();
        }
    }

    handleResize() {
        if (this.uiManager) {
            this.uiManager.handleResize();
        }
    }
}

// Initialize game when DOM is ready
window.addEventListener('DOMContentLoaded', () => {
    const game = new GameInitializer();
    game.initialize().catch(error => {
        Logger.error('Game', 'Failed to initialize game', error);
        const loader = document.querySelector('.loader');
        if (loader) {
            loader.textContent = 'Failed to initialize game. Please refresh.';
        }
    });
});

// Add error handling
window.addEventListener('error', (event) => {
    Logger.error('Game', 'Runtime error:', {
        message: event.message,
        filename: event.filename,
        lineno: event.lineno
    });
});
