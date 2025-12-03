export const CONFIG = {
    DEBUG: true,
    VERSIONS: {
        GAME: '0.0.1',
        CHUNK_MANAGER: '0.0.1',
        WORLD_MANAGER: '0.0.1',
        CHUNK_COMPONENT: '0.0.1',
        INTERACTION_COMPONENT: '0.0.1',
        UI_MANAGER: '0.0.1',
        THREE: '0.149.0',
        AFRAME: '1.4.0'
    },
    FLAGS: {
        SECTIONS: {
            RENDERING: {
                WIREFRAME_MODE: false,
                ENABLE_SHADOWS: false,
                ENABLE_AMBIENT_OCCLUSION: false,
                USE_HIGH_QUALITY_TEXTURES: false,
                ENABLE_FOG: false,
                ENABLE_BLOOM: false,
            },
            DEBUGGING: {
                SHOW_DEBUG_STATS: false,  // Start with debug stats off
                ENABLE_PHYSICS_DEBUG: false,
                LOG_PLAYER_POSITION: false,
                LOG_CHUNK_CREATION: false,
                LOG_PERFORMANCE: false,
                SHOW_CHUNK_BOUNDS: false,
                SHOW_COLLISION_BOUNDS: false,
            },
            WORLD_GENERATION: {
                ENABLE_BLOCK_GENERATION: true, // Keep this true for basic functionality
                ENABLE_CHUNK_GENERATION: true, // Keep this true for basic functionality
                ENABLE_CHUNK_UPDATES: true,    // Keep this true for basic functionality
            },
            LOGGING: {
                LOG_UI_STATE_CHANGES: false,
                LOG_WINDOW_EVENTS: false,
                LOG_INPUT_EVENTS: false,
                LOG_HOTBAR_EVENTS: false,
                LOG_INVENTORY_EVENTS: false,
                LOG_PERFORMANCE_METRICS: false,
                LOG_DEBUG_FLAGS: false,
                LOG_UI_INTERACTIONS: false,
                LOG_POINTER_EVENTS: false,
                LOG_DRAG_EVENTS: false
            }
        }
    },
    LOADING: {
        TIMEOUT: 10000,                    // 10 second timeout for loading
        MINIMUM_TIME: 1000,                // Minimum loading screen time
        FADE_DURATION: 500                 // Fade out duration in ms
    },
    DEBUG_OPTIONS: {
        LOG_CHUNK_CREATION: true,
        LOG_BLOCK_CREATION: false,  // Set to false by default
        LOG_PERFORMANCE: true,
        CHUNK_CREATION_DELAY: 0,          // Delay in ms between chunk creation
        MAX_CHUNKS: 50,                   // Maximum number of chunks to generate
        TEST_MODE: 'CENTER_WITH_BLOCKS',  // Set default test mode
        TEST_MODES: {                     // Added test mode definitions
            EMPTY_CENTER: { 
                description: 'Empty Center Chunk', 
                neighborChunks: false, 
                settings: { 
                    ENABLE_BLOCK_GENERATION: false, 
                    ENABLE_CHUNK_GENERATION: true, 
                    SHOW_CHUNK_BOUNDS: true 
                }
            },
            CENTER_WITH_BLOCKS: { 
                description: 'Center Chunk with Blocks', 
                neighborChunks: false, 
                settings: { 
                    ENABLE_BLOCK_GENERATION: true, 
                    ENABLE_CHUNK_GENERATION: true 
                }
            },
            DYNAMIC_CHUNKS: { 
                description: 'Dynamic Chunks', 
                neighborChunks: true, 
                settings: { 
                    ENABLE_BLOCK_GENERATION: false, 
                    ENABLE_CHUNK_GENERATION: true, 
                    SHOW_CHUNK_BOUNDS: true 
                }
            },
            DYNAMIC_WITH_BLOCKS: { 
                description: 'Dynamic with Blocks', 
                neighborChunks: true, 
                settings: { 
                    ENABLE_BLOCK_GENERATION: true, 
                    ENABLE_CHUNK_GENERATION: true 
                }
            },
            TEXTURED: { 
                description: 'Full with Textures', 
                neighborChunks: true, 
                settings: { 
                    ENABLE_BLOCK_GENERATION: true, 
                    ENABLE_CHUNK_GENERATION: true
                },
                useTextures: true 
            }
        },
        ACTIONS: {
            GENERATION: [
                {
                    id: 'generate-center',
                    label: 'Generate Center Chunk',
                    description: 'Generates a single chunk at the center position',
                    action: 'generateCenterChunk'
                },
                {
                    id: 'generate-plains',
                    label: 'Generate Plains Biome',
                    description: 'Generates a flat plains biome',
                    action: 'generatePlainsBiome'
                },
                {
                    id: 'generate-mountains',
                    label: 'Generate Mountains',
                    description: 'Generates mountainous terrain',
                    action: 'generateMountains'
                }
            ],
            TESTING: [
                {
                    id: 'spawn-test-cubes',
                    label: 'Spawn Test Cubes',
                    description: 'Spawns various test cubes',
                    action: 'spawnTestCubes'
                },
                {
                    id: 'test-chunk-update',
                    label: 'Test Chunk Updates',
                    description: 'Tests chunk update system',
                    action: 'testChunkUpdate'
                }
            ],
            UTILITY: [
                {
                    id: 'clear-all',
                    label: 'Clear All Chunks',
                    description: 'Removes all chunks from the world',
                    action: 'clearAllChunks'
                },
                {
                    id: 'reload-textures',
                    label: 'Reload Textures',
                    description: 'Reloads all textures',
                    action: 'reloadTextures'
                }
            ]
        }
    },
    TEXTURES: {
        ENABLED: false,
        RESOLUTION: 64,
        TYPES: {
            GRASS: { baseColor: '#567D46', variations: 5 },
            DIRT: { baseColor: '#8B4513', variations: 3 },
            STONE: { baseColor: '#808080', variations: 4 },
            METAL: { baseColor: '#B8B8B8', variations: 2 },
            CRYSTAL: { baseColor: '#00FFFF', variations: 3, isTransparent: true }
        }
    },
    LOGGING: {
        enabled: true,
        level: 'debug',  // Changed from 'debug' to 'info' to reduce noise
        component: true,
        manager: true,
        performance: true,
        updateFrequency: 500, // ms between debug updates
        components: {
            chunk: true,
            player: true,
            world: true
        },
        managers: {
            chunk: true,
            world: true,
            texture: true
        },
        details: {
            showValues: true,
            showTiming: true,
            showMemory: true
        },
        performance: {
            enabled: true,
            threshold: 16.67, // 60fps frame budget
            warnThreshold: 33.33, // 30fps frame budget
            logFrequency: 1000, // 1 second between logs
            positionUpdateThreshold: 0.1 // Minimum position change to log
        },
        memory: {
            trackHeap: true,
            warnThreshold: 0.8 // 80% of available heap
        },
        UI: {
            LOG_LEVEL: 'debug', // 'debug', 'info', 'warn', 'error'
            THROTTLE: 100, // ms between state change logs
            INCLUDE_TIMESTAMPS: true,
            INCLUDE_COMPONENT: true,
            INCLUDE_STATE_DIFFS: true,
            MAX_STATE_HISTORY: 50
        },
        STATE_CHANGES: {
            WINDOWS: true,
            INVENTORY: true,
            HOTBAR: true,
            FLAGS: true,
            SETTINGS: true
        }
    },
    SIZES: {
        CHUNK: 10,        // 10x10x10 units
        BLOCK: 1,         // 1x1x1 units
        VOXEL: 0.1,      // 0.1x0.1x0.1 units
        RENDER_DISTANCE: 2 // Number of chunks to render in each direction
    },
    ERROR_CODES: {
        CHUNK_GENERATION: 'ERR_CHUNK_GEN',
        TEXTURE_LOADING: 'ERR_TEX_LOAD',
        MESH_CREATION: 'ERR_MESH',
        WORLD_INIT: 'ERR_WORLD_INIT'
    },
    WORLD: {
        CHUNK_SIZE: 10,
        EXTENT: 5, // How far each chunk extends from center
        LOD: {
            FULL: {
                DISTANCE: 2,    // Chunks with full detail
                RESOLUTION: 1   // Full resolution
            },
            MEDIUM: {
                DISTANCE: 4,    // Medium detail chunks
                RESOLUTION: 2   // Half resolution
            },
            FAR: {
                DISTANCE: 8,    // Far chunks
                RESOLUTION: 4   // Quarter resolution
            }
        },
        UNLOAD_DISTANCE: 5    // Distance at which chunks unload
    },
    PERFORMANCE: {
        FRAME_BUDGET: 16.67, // 60fps target
        CHUNK_GENERATION_BUDGET: 100, // ms
        THROTTLE: {
            CHUNK_UPDATES: 100, // ms between chunk updates
            DEBUG_UPDATES: 500, // ms between debug updates
            POSITION_UPDATES: 100 // ms between position updates
        },
        RAF_WARNING_THRESHOLD: 16.67 // Show warning if RAF takes longer
    },
    UI: {
        WINDOWS: {
            DEVTOOLS: {
                id: 'devtools-window',
                title: 'Developer Tools',
                icon: 'code',
                tabs: [
                    {
                        id: 'debug',
                        label: 'Debug',
                        sections: [
                            {
                                title: 'Player Info',
                                metrics: [
                                    { id: 'player-position', label: 'Position', default: '0, 0, 0' },
                                    { id: 'player-chunk', label: 'Chunk', default: '0, 0' }
                                ]
                            },
                            {
                                title: 'World Info',
                                metrics: [
                                    { id: 'chunk-count', label: 'Active Chunks', default: '0' },
                                    { id: 'total-blocks', label: 'Total Blocks', default: '0' }
                                ]
                            }
                        ]
                    },
                    {
                        id: 'performance',
                        label: 'Performance',
                        sections: [
                            {
                                metrics: [
                                    { id: 'fps-counter', label: 'FPS', default: '60', showBar: true },
                                    { id: 'memory-usage', label: 'Memory', default: '0 MB', showBar: true },
                                    { id: 'draw-calls', label: 'Draw Calls', default: '0' }
                                ]
                            }
                        ]
                    }
                ]
            },
            SETTINGS: {
                id: 'settings-window',
                title: 'Settings',
                icon: 'cog',
                sections: [
                    {
                        title: 'Graphics',
                        settings: [
                            {
                                id: 'graphics-quality',
                                label: 'Quality',
                                type: 'select',
                                options: [
                                    { value: 'low', label: 'Low' },
                                    { value: 'medium', label: 'Medium', default: true },
                                    { value: 'high', label: 'High' }
                                ]
                            },
                            {
                                id: 'view-distance',
                                label: 'View Distance',
                                type: 'select',
                                options: [
                                    { value: '2', label: 'Near' },
                                    { value: '4', label: 'Medium', default: true },
                                    { value: '6', label: 'Far' }
                                ]
                            }
                        ]
                    },
                    {
                        title: 'Controls',
                        settings: [
                            {
                                id: 'mouse-sensitivity',
                                label: 'Mouse Sensitivity',
                                type: 'range',
                                min: 1,
                                max: 10,
                                default: 5
                            },
                            {
                                id: 'invert-y',
                                label: 'Invert Y-Axis',
                                type: 'checkbox',
                                default: false
                            }
                        ]
                    }
                ]
            }
        }
    }
};

export const getThree = () => {
    // Return A-Frame's THREE instance or null if A-Frame isn't loaded yet
    return typeof AFRAME !== 'undefined' ? AFRAME.THREE : null;
};

export const Logger = {
    debug: (component, message, data = null) => {
        // Only log debug messages if explicitly enabled for the component
        if (!CONFIG.LOGGING.enabled || 
            CONFIG.LOGGING.level !== 'debug' ||
            (component === 'ChunkComponent' && !CONFIG.DEBUG_OPTIONS.LOG_BLOCK_CREATION)) {
            return;
        }
        console.debug(`[${component}]`, message, data || '');
    },
    info: (component, message, data = null) => {
        if (!CONFIG.LOGGING.enabled) return;
        console.info(`[${component}]`, message, data || '');
    },
    warn: (component, message, data = null) => {
        if (!CONFIG.LOGGING.enabled) return;
        console.warn(`[${component}]`, message, data || '');
    },
    error: (component, message, error = null) => {
        if (!CONFIG.LOGGING.enabled) return;
        console.error(`[${component}]`, message, error || '');
    },
    logStep: (component, step, data = null) => {
        if (!CONFIG.LOGGING.enabled) return;
        
        const now = performance.now();
        const lastLog = Logger.lastLogs.get(`${component}-${step}`);
        
        if (lastLog && (now - lastLog) < CONFIG.LOGGING.performance.logFrequency) {
            return;
        }
        
        Logger.lastLogs.set(`${component}-${step}`, now);
        console.log(`[${component}] Step: ${step}`, data ? `Data: ${JSON.stringify(data)}` : '');
    },
    logPerformance: (component, operation, duration) => {
        if (!CONFIG.LOGGING.enabled || !CONFIG.LOGGING.performance) return;
        console.log(`[${component}] Performance - ${operation}: ${duration.toFixed(2)}ms`);
    },
    logMemory: (component, operation) => {
        if (!CONFIG.LOGGING.enabled || !CONFIG.LOGGING.details.showMemory) return;
        const memory = performance.memory;
        console.log(`[${component}] Memory after ${operation}:`, {
            usedHeap: `${(memory.usedJSHeapSize / 1048576).toFixed(2)}MB`,
            totalHeap: `${(memory.totalJSHeapSize / 1048576).toFixed(2)}MB`
        });
    },
    performance: (component, operation, startTime) => {
        const duration = performance.now() - startTime;
        if (duration > CONFIG.LOGGING.performance.warnThreshold) {
            console.warn(`[${component}] Performance warning: ${operation} took ${duration.toFixed(2)}ms`);
        } else if (CONFIG.LOGGING.performance.enabled) {
            console.debug(`[${component}] ${operation}: ${duration.toFixed(2)}ms`);
        }
    },

    memory: (component) => {
        if (!CONFIG.LOGGING.memory.trackHeap) return;
        const memory = performance.memory;
        const usage = memory.usedJSHeapSize / memory.jsHeapSizeLimit;
        if (usage > CONFIG.LOGGING.memory.warnThreshold) {
            console.warn(`[${component}] High memory usage: ${(usage * 100).toFixed(1)}%`);
        }
    },
    lastLogs: new Map()
};

export const ColorUtils = {
    isValidHex: (hex) => {
        return typeof hex === 'string' && /^#[0-9A-F]{6}$/i.test(hex);
    },
    
    sanitizeColor: (color, fallback = '#808080') => {
        if (ColorUtils.isValidHex(color)) {
            return color;
        }
        Logger.warn('ColorUtils', 'Invalid color, using fallback:', { given: color, fallback });
        return fallback;
    }
};
