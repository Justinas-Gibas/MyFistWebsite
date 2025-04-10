import { CONFIG, Logger } from './config.js';
import { useGameStore } from './managers.js';
import { TextureManager, BlockTypeGenerator } from './generators.js';

// Centralize common component utilities
const ComponentUtils = {
    ensureThree() {
        if (!AFRAME.THREE) {
            throw new Error('THREE.js not found. Make sure A-Frame is loaded first.');
        }
        return AFRAME.THREE;
    },
    
    logComponentError(component, error, context = {}) {
        Logger.error('Component', `${component} error:`, {
            error: error.message,
            context,
            stack: error.stack
        });
    },

    measurePerformance(callback, component, operation) {
        const start = performance.now();
        try {
            return callback();
        } finally {
            Logger.performance(component, operation, start);
        }
    }
};

// World Components
AFRAME.registerComponent('chunk', {
    schema: {
        position: { type: 'vec3' },
        size: { type: 'number', default: CONFIG.SIZES.CHUNK },
        chunkData: { type: 'array' }
    },

    init() {
        ComponentUtils.measurePerformance(() => {
            Logger.logStep('ChunkComponent', 'Initializing', {
                position: this.data.position,
                size: this.data.size
            });

            this.blocks = new Map();
            this.blockMeshes = new Map();
            this.generateChunk();
        }, 'ChunkComponent', 'initialization');
    },

    generateChunk() {
        if (this.generatingChunk) return;

        ComponentUtils.measurePerformance(() => {
            this.generatingChunk = true;
            const THREE = ComponentUtils.ensureThree();
            
            this.chunkGroup = new THREE.Group();
            
            if (CONFIG.FLAGS.SECTIONS.WORLD_GENERATION.ENABLE_BLOCK_GENERATION) {
                this.generateBlocks();
            } else {
                this.createChunkBounds();
            }
            
            this.el.setObject3D('mesh', this.chunkGroup);
            this.generatingChunk = false;
        }, 'ChunkComponent', 'generateChunk');
    },

    generateBlocks() {
        const store = useGameStore.getState();
        const size = this.data.size;
        const chunkData = this.data.chunkData;
        const blockGenerator = new BlockTypeGenerator();

        // Process blocks in batches for better performance
        const processBatch = (startIndex, batchSize) => {
            const endIndex = Math.min(startIndex + batchSize, size * size * size);
            
            for (let i = startIndex; i < endIndex; i++) {
                const x = i % size;
                const y = Math.floor(i / size) % size;
                const z = Math.floor(i / (size * size));
                
                if (chunkData[i] > 0.5) {
                    const blockType = blockGenerator.getBlockType(
                        this.determineBlockType(x, y, z)
                    );
                    this.createBlock(x, y, z, blockType);
                }
            }

            if (endIndex < size * size * size) {
                requestAnimationFrame(() => processBatch(endIndex, batchSize));
            } else {
                this.generatingChunk = false;
            }
        };

        // Start processing in batches
        processBatch(0, CONFIG.PERFORMANCE.CHUNK_GENERATION_BUDGET);
    },

    createBlock(x, y, z, blockType) {
        try {
            const THREE = ComponentUtils.ensureThree();
            const geometry = new THREE.BoxGeometry(1, 1, 1);
            const material = new THREE.MeshStandardMaterial({
                color: blockType.color || '#808080',
                roughness: 0.7,
                metalness: 0.2,
                transparent: blockType.transparent || false,
                opacity: CONFIG.FLAGS.SECTIONS.WORLD_GENERATION.ENABLE_BLOCK_GENERATION ? 1 : 0
            });

            const mesh = new THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            
            const key = `${x},${y},${z}`;
            this.blockMeshes.set(key, mesh);
            this.blocks.set(key, blockType);
            this.chunkGroup.add(mesh);

            if (CONFIG.FLAGS.SECTIONS.DEBUGGING.LOG_BLOCK_CREATION) {
                Logger.debug('ChunkComponent', 'Block created', { position: { x, y, z }, type: blockType.name });
            }
        } catch (error) {
            ComponentUtils.logComponentError('ChunkComponent', error, { x, y, z, blockType });
        }
    },

    determineBlockType(x, y, z) {
        const worldY = this.data.position.y * this.data.size + y;
        
        if (worldY < 0) return 'STONE_0';
        if (worldY === 0) return 'DIRT_0';
        if (worldY > 0) return 'GRASS_0';
        
        return 'STONE_0'; // Default fallback
    },

    update(oldData) {
        if (!this.blockMeshes) return;

        this.blockMeshes.forEach(mesh => {
            mesh.material.wireframe = CONFIG.FLAGS.SECTIONS.RENDERING.WIREFRAME_MODE;
            mesh.material.opacity = CONFIG.FLAGS.SECTIONS.WORLD_GENERATION.ENABLE_BLOCK_GENERATION ? 1 : 0;
            mesh.material.needsUpdate = true;
        });
    },

    remove() {
        if (this.chunkGroup) {
            this.el.removeObject3D('mesh');
        }
    }
});

// UI Components
AFRAME.registerComponent('ui-window', {
    schema: {
        title: { type: 'string', default: 'Window' },
        width: { type: 'number', default: 400 },
        height: { type: 'number', default: 300 }
    },

    init() {
        this.createWindow();
        this.setupEventListeners();
    },

    createWindow() {
        const window = document.createElement('div');
        window.className = 'ui-window';
        window.innerHTML = `
            <div class="window-header">
                <span class="window-title">${this.data.title}</span>
                <div class="window-controls">
                    <button class="close-button">×</button>
                </div>
            </div>
            <div class="window-content">
                <slot></slot>
            </div>
        `;
        this.el.appendChild(window);
    },

    setupEventListeners() {
        const closeBtn = this.el.querySelector('.close-button');
        if (closeBtn) {
            closeBtn.addEventListener('click', () => {
                useGameStore.getState().toggleWindow(this.el.id);
            });
        }
    }
});

// Debug Components
AFRAME.registerComponent('debug-monitor', {
    schema: {
        refreshRate: { type: 'number', default: CONFIG.LOGGING.updateFrequency }
    },

    init() {
        this.lastUpdate = 0;
        this.setupMetrics();
    },

    tick(time) {
        if (time - this.lastUpdate < this.data.refreshRate) return;
        
        ComponentUtils.measurePerformance(() => {
            this.updateMetrics();
            this.lastUpdate = time;
        }, 'DebugMonitor', 'updateMetrics');
    },

    setupMetrics() {
        if (!CONFIG.FLAGS.SECTIONS.DEBUGGING.SHOW_DEBUG_STATS) return;
        
        this.metrics = {
            fps: 0,
            memory: 0,
            drawCalls: 0
        };
    },

    updateMetrics() {
        if (!CONFIG.FLAGS.SECTIONS.DEBUGGING.SHOW_DEBUG_STATS) return;

        const scene = this.el.sceneEl;
        if (!scene || !scene.renderer) return;

        this.metrics = {
            fps: Math.round(1000 / (performance.now() - this.lastUpdate)),
            memory: performance.memory?.usedJSHeapSize || 0,
            drawCalls: scene.renderer.info.render.calls
        };

        // Update store with new metrics
        useGameStore.getState().updateMetrics(this.metrics);
    }
});

export { ComponentUtils };
