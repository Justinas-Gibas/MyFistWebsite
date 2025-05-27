import { TextureManager, TextureGenerator, blockTypeGenerator } from './generators.js';
import { CONFIG, Logger } from './config.js';

AFRAME.registerComponent('chunk', {
    schema: {
        position: { type: 'vec3' },
        size: { type: 'number', default: CONFIG.SIZES.CHUNK },
        chunkData: { type: 'array' }
    },

    init: function() {
        const startTime = performance.now();
        Logger.logStep('ChunkComponent', 'Initializing', {
            position: this.data.position,
            size: this.data.size
        });

        this.blocks = new Map();
        this.blockMeshes = new Map();
        this.generateChunk();

        Logger.logPerformance('ChunkComponent', 'initialization', 
            performance.now() - startTime);
    },

    generateChunk: function() {
        if (this.generatingChunk) return;
        this.generatingChunk = true;
        
        this.chunkGroup = new AFRAME.THREE.Group();
        
        // Only generate blocks if block generation is enabled
        if (CONFIG.FLAGS.ENABLE_BLOCK_GENERATION) {
            this.generateBlocks();
        } else {
            // Create empty chunk bounds for visualization
            this.createChunkBounds();
        }
        
        this.el.setObject3D('mesh', this.chunkGroup);
        this.generatingChunk = false;
    },

    createChunkBounds: function() {
        const size = this.data.size;
        const geometry = new AFRAME.THREE.BoxGeometry(size, size, size);
        const material = new AFRAME.THREE.MeshBasicMaterial({
            wireframe: true,
            color: '#00ff00',
            transparent: true,
            opacity: CONFIG.FLAGS.SHOW_CHUNK_BOUNDS ? 0.2 : 0
        });
        const boundingBox = new AFRAME.THREE.Mesh(geometry, material);
        boundingBox.position.set(size/2, size/2, size/2);
        this.chunkGroup.add(boundingBox);
        this.boundingBox = boundingBox;
    },

    generateBlocks: function() {
        const startTime = performance.now();
        const maxBlocksPerFrame = 100; // Limit blocks per frame
        let blocksCreated = 0;
        let x = 0, y = 0, z = 0;
        const size = this.data.size;
        const chunkData = this.data.chunkData;
        
        this.chunkGroup = new AFRAME.THREE.Group();

        const processNextBatch = () => {
            const batchStart = performance.now();
            
            while (x < size && performance.now() - batchStart < 16) { // 16ms frame budget
                for (; y < size; y++) {
                    for (; z < size; z++) {
                        const idx = x + y * size + z * size * size;
                        const value = chunkData[idx];
                        
                        if (value > 0.5) {
                            this.createBlock(x, y, z, {
                                texture: 'default',
                                color: this.getHeightBasedColor(y, value)
                            });
                            blocksCreated++;
                        }
                    }
                    z = 0;
                }
                y = 0;
                x++;
                
                if (blocksCreated >= maxBlocksPerFrame) {
                    requestAnimationFrame(processNextBatch);
                    return;
                }
            }

            if (x < size) {
                requestAnimationFrame(processNextBatch);
            } else {
                this.el.setObject3D('mesh', this.chunkGroup);
                this.generatingChunk = false;
                Logger.performance('ChunkComponent', 'generateChunk', performance.now() - startTime);
            }
        };

        processNextBatch();
    },

    createBlock(x, y, z, blockType) {
        // Only log if block logging is explicitly enabled
        if (CONFIG.DEBUG_OPTIONS.LOG_BLOCK_CREATION) {
            Logger.debug('ChunkComponent', 'Creating block at position:', { x, y, z });
        }

        try {
            const geometry = new AFRAME.THREE.BoxGeometry(1, 1, 1);
            
            // Invert the opacity logic - blocks are visible by default when generation is enabled
            const material = new AFRAME.THREE.MeshStandardMaterial({
                color: blockType.color || '#808080',
                roughness: 0.7,
                metalness: 0.2,
                wireframe: CONFIG.FLAGS.WIREFRAME_MODE,
                transparent: true,
                opacity: CONFIG.FLAGS.ENABLE_BLOCK_GENERATION ? 1 : 0  // Show blocks when generation is enabled
            });

            const mesh = new AFRAME.THREE.Mesh(geometry, material);
            mesh.position.set(x, y, z);
            const key = `${x},${y},${z}`;
            this.blockMeshes.set(key, mesh);
            this.blocks.set(key, blockType);
            this.chunkGroup.add(mesh);
        } catch (error) {
            Logger.error('ChunkComponent', 'Failed to create block:', error);
        }
    },

    update: function(oldData) {
        // Update chunk bounds visibility
        if (this.boundingBox) {
            this.boundingBox.material.opacity = CONFIG.FLAGS.SHOW_CHUNK_BOUNDS ? 0.2 : 0;
            this.boundingBox.material.needsUpdate = true;
        }

        // Update block materials
        if (this.blockMeshes) {
            this.blockMeshes.forEach(mesh => {
                mesh.material.wireframe = CONFIG.FLAGS.WIREFRAME_MODE;
                mesh.material.opacity = CONFIG.FLAGS.ENABLE_BLOCK_GENERATION ? 1 : 0;
                mesh.material.needsUpdate = true;
            });
        }
    },

    getRandomColor: function() {
        // Generate a 6-digit hex color
        return '#' + Math.floor(Math.random() * 16777215).toString(16).padStart(6, '0');
    },

    getHeightBasedColor: function(height, value) {
        try {
            const size = Number(this.data.size);
            // Calculate HSL values within valid ranges.
            const h = Math.floor((height / size) * 120); // 0-120 hue
            const s = Math.min(Math.max(Math.floor(value * 100), 0), 100); // saturation 0-100
            const l = Math.min(Math.max(Math.floor(50 + value * 20), 0), 100); // lightness 50-70
            // Simple HSL to RGB conversion:
            const c = (1 - Math.abs(2 * l / 100 - 1)) * (s / 100);
            const x = c * (1 - Math.abs((h / 60) % 2 - 1));
            const m = l / 100 - c / 2;
            let r, g, b;
            if (h < 60) { [r, g, b] = [c, x, 0]; }
            else if (h < 120) { [r, g, b] = [x, c, 0]; }
            else { [r, g, b] = [0, c, 0]; }
            const toHex = (n) => {
                const hex = Math.round((n + m) * 255).toString(16);
                return hex.padStart(2, '0');
            };
            return `#${toHex(r)}${toHex(g)}${toHex(b)}`;
        } catch (error) {
            Logger.error('ChunkComponent', 'Color generation failed', error);
            return '#808080';
        }
    },

    addPlaneToChunk: function() {
        // Log the start (remove any extraneous text)
        if (typeof loggingEnabled !== 'undefined' && loggingEnabled) console.log('Adding plane to chunk');
        
        const geometry = new AFRAME.THREE.PlaneGeometry(this.data.size, this.data.size);
        let material;
        const textureType = 'grass';
        const textureData = this.textureGenerator?.generateTexture(textureType);
        if (textureData) {
            const texture = new AFRAME.THREE.TextureLoader().load(textureData);
            material = new AFRAME.THREE.MeshStandardMaterial({ map: texture });
        } else {
            const color = this.getRandomColor();
            material = new AFRAME.THREE.MeshStandardMaterial({ color: color });
        }
        const plane = new AFRAME.THREE.Mesh(geometry, material);
        plane.rotation.x = -Math.PI/2;
        plane.position.set(this.data.size / 2, 0, this.data.size / 2);
        this.chunkGroup.add(plane);
        if (typeof loggingEnabled !== 'undefined' && loggingEnabled) console.log('Plane added to chunk');
    }
});

AFRAME.registerComponent('loading-screen', {
    schema: {
        loggingEnabled: { type: 'boolean', default: true }
    },

    init: function() {
        this.loadingScreen = document.querySelector('#loading-screen');
        this.loadingText = this.loadingScreen.querySelector('.loader');
        this.setupLoadingManager();
        
        Logger.info('LoadingScreen', 'Component initialized');
    },

    setupLoadingManager: function() {
        Logger.info('LoadingScreen', 'Setting up loading manager');
        AFRAME.THREE.DefaultLoadingManager.onProgress = (url, itemsLoaded, itemsTotal) => {
            const progress = (itemsLoaded / itemsTotal * 100).toFixed(0);
            this.loadingText.textContent = `Loading textures... ${progress}%`;
            Logger.info('LoadingScreen', `Loading progress: ${progress}%`);
        };

        AFRAME.THREE.DefaultLoadingManager.onLoad = () => {
            Logger.info('LoadingScreen', 'Loading complete');
            setTimeout(() => {
                this.loadingScreen.style.opacity = '0';
                setTimeout(() => {
                    this.loadingScreen.style.display = 'none';
                }, 500);
            }, 1000);
        };
    }
});

AFRAME.registerComponent('touch-controls', {
    init: function() {
        const options = window.PASSIVE_SUPPORTED ? { passive: true } : false;
        
        this.el.addEventListener('touchstart', this.onTouchStart.bind(this), options);
        this.el.addEventListener('touchmove', this.onTouchMove.bind(this), options);
        this.el.addEventListener('touchend', this.onTouchEnd.bind(this), options);
    },

    onTouchStart: function(event) {
        // Handle touch start
    },

    onTouchMove: function(event) {
        // Handle touch move
    },

    onTouchEnd: function(event) {
        // Handle touch end
    }
});

AFRAME.registerComponent('voxel', {
    schema: {
        size: { type: 'number', default: CONFIG.SIZES.VOXEL },
        typeId: { type: 'number', default: 1 }
    },
        
    init: function() {
        this.blockType = blockTypeGenerator.getBlockType(this.data.typeId);
        this.createVoxel();
    },

    createVoxel: function() {
        const geometry = new AFRAME.THREE.BoxGeometry(
            this.data.size,
            this.data.size,
            this.data.size
        );
        const material = new AFRAME.THREE.MeshStandardMaterial({
            color: this.getVoxelColor(),
            roughness: 0.7,
            metalness: 0.2
        });
        this.mesh = new AFRAME.THREE.Mesh(geometry, material);
        this.el.setObject3D('mesh', this.mesh);
    },

    getVoxelColor: function() {
        const blockType = blockTypeGenerator.getBlockType(this.data.typeId);
        return blockType.color || '#ffffff';
    },

    updateType: function(newTypeId) {
        this.data.typeId = newTypeId;
        this.blockType = blockTypeGenerator.getBlockType(newTypeId);
        this.mesh.material.color.set(this.getVoxelColor());
        this.mesh.material.transparent = this.blockType.transparent || false;
    }
});

AFRAME.registerComponent('ui-window', {
    schema: {
        title: { type: 'string', default: 'Window' },
        draggable: { type: 'boolean', default: true }
    },

    init: function() {
        this.dragState = {
            dragging: false,
            offset: { x: 0, y: 0 }
        };
        if (this.data.draggable) {
            this.setupDragging();
        }
    },

    setupDragging: function() {
        const header = this.el.querySelector('.window-header');
        if (!header) return;
        header.addEventListener('mousedown', this.onDragStart.bind(this));
        document.addEventListener('mousemove', this.onDrag.bind(this));
        document.addEventListener('mouseup', this.onDragEnd.bind(this));
    },

    onDragStart: function(e) {
        const bounds = this.el.getBoundingClientRect();
        this.dragState = {
            dragging: true,
            offset: {
                x: e.clientX - bounds.left,
                y: e.clientY - bounds.top
            }
        };
    },

    onDrag: function(e) {
        if (!this.dragState.dragging) return;
        
        const x = e.clientX - this.dragState.offset.x;
        const y = e.clientY - this.dragState.offset.y;
        this.el.style.left = `${x}px`;
        this.el.style.top = `${y}px`;
    },

    onDragEnd: function() {
        this.dragState.dragging = false;
    }
});

AFRAME.registerComponent('debug-info', {
    schema: {
        refreshRate: { type: 'number', default: CONFIG.LOGGING.updateFrequency }
    },

    init: function() {
        this.lastUpdate = 0;
        this.lastPosition = new THREE.Vector3();
        this.camera = document.querySelector('a-camera');
        this.updateDebounceTimer = null;
    },

    tick: function(time) {
        if (time - this.lastUpdate < this.data.refreshRate) return;
        
        if (this.camera) {
            const worldPosition = new THREE.Vector3();
            this.camera.object3D.getWorldPosition(worldPosition);
            
            // Only update if position has changed
            if (!worldPosition.equals(this.lastPosition)) {
                // Single point of update through game manager
                if (window.game) {
                    window.game.updatePlayerDebugInfo(worldPosition);
                }
                this.lastPosition.copy(worldPosition);
            }
        }
        
        this.lastUpdate = time;
    },

    remove: function() {
        clearTimeout(this.updateDebounceTimer);
    }
});
