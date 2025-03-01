/**
 * World Generation System
 * 
 * Handles procedural generation of the game world, including terrain, 
 * dungeons, structures, and resource placement.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.world = {};

(function() {
    // World generation parameters
    const biomeTypes = {
        forest: { color: '#4b6b2d', heightModifier: 1.0, resourceMultiplier: 1.2 },
        mountains: { color: '#6b6b6b', heightModifier: 2.5, resourceMultiplier: 0.7 },
        plains: { color: '#8d9b47', heightModifier: 0.5, resourceMultiplier: 1.0 },
        desert: { color: '#d9c27e', heightModifier: 0.3, resourceMultiplier: 0.5 },
        swamp: { color: '#566142', heightModifier: 0.2, resourceMultiplier: 0.8 }
    };
    
    // Initialize world generation system
    Game.generation.world.init = function() {
        console.log('Initializing world generation system');
        return Promise.resolve();
    };
    
    // Generate terrain for an area
    Game.generation.world.generateTerrain = function(centerX, centerZ, size, seed) {
        // Use noise to create height and biome maps
    };
    
    // Generate a dungeon
    Game.generation.world.generateDungeon = function(size, difficulty, seed) {
        // Create a procedural dungeon layout
    };
    
    // Place resources in the world
    Game.generation.world.placeResources = function(terrain, biomeMap, seed) {
        // Place resource nodes based on biomes
    };
    
    // Generate a building or structure
    Game.generation.world.generateStructure = function(type, position, seed) {
        // Generate a complete building structure
    };
    
    // Generate a settlement layout
    Game.generation.world.generateSettlement = function(size, biome, seed) {
        // Create a settlement with buildings and paths
    };
    
    // Helper functions for world generation
    function createHeightMap(width, height, seed) {
        // Generate a height map using noise
    }
    
    function createBiomeMap(width, height, heightMap, seed) {
        // Generate biome distribution based on height and moisture
    }
    
    // World generation settings and configuration
    const config = {
        worldSize: 500, // Size of the world (500x500 units)
        chunkSize: 50,  // Size of each world chunk
        baseHeight: 0,  // Base terrain height
        heightScale: 30, // Maximum height variation
        biomes: [
            { 
                name: 'forest', 
                color: '#2d4c1e', 
                treeDensity: 0.03,
                rockDensity: 0.01, 
                resourceDensity: 0.005 
            },
            { 
                name: 'mountains', 
                color: '#6b6b6b', 
                treeDensity: 0.01, 
                rockDensity: 0.04,
                resourceDensity: 0.02 
            },
            { 
                name: 'plains', 
                color: '#687f45', 
                treeDensity: 0.005, 
                rockDensity: 0.003, 
                resourceDensity: 0.008 
            },
            { 
                name: 'swamp', 
                color: '#4a533a', 
                treeDensity: 0.02, 
                rockDensity: 0.005, 
                resourceDensity: 0.01 
            },
            { 
                name: 'desert', 
                color: '#c2b280', 
                treeDensity: 0.001, 
                rockDensity: 0.02, 
                resourceDensity: 0.003 
            }
        ],
        landmarks: [
            { 
                type: 'dungeon', 
                frequency: 0.01, 
                minDistance: 100 
            },
            { 
                type: 'village', 
                frequency: 0.02, 
                minDistance: 150 
            },
            { 
                type: 'ruin', 
                frequency: 0.03, 
                minDistance: 80 
            }
        ]
    };
    
    // Track created world chunks
    const chunks = new Map();
    
    // Local variables
    let worldSeed = 0;
    let worldContainer = null;
    let activeChunks = [];
    
    // Initialize the world generation system
    Game.generation.world.init = function() {
        console.log('Initializing world generation system');
        return Promise.resolve();
    };
    
    // Create the world based on the game seed
    Game.generation.world.createWorld = async function() {
        const state = Game.engine.getState();
        worldSeed = state.world.seed;
        
        console.log('Creating procedural world with seed:', worldSeed);
        
        // Get world container from DOM
        worldContainer = document.getElementById('world-container');
        if (!worldContainer) {
            console.error('Could not find world container element');
            return Promise.reject('World container not found');
        }
        
        // Reset world if it already exists
        while (worldContainer.firstChild) {
            worldContainer.removeChild(worldContainer.firstChild);
        }
        
        // Initialize noise generators with the world seed
        Game.generation.noise.init(worldSeed);
        
        // Create the ground plane
        createBaseTerrain();
        
        // Create starting area
        await createStartingArea();
        
        // Generate first visible chunks
        await loadInitialChunks();
        
        return Promise.resolve();
    };
    
    // Update chunks as player moves
    Game.generation.world.updateChunks = function(playerPosition) {
        const chunkX = Math.floor(playerPosition.x / config.chunkSize);
        const chunkZ = Math.floor(playerPosition.z / config.chunkSize);
        
        // Distance for loading/unloading chunks (view distance)
        const loadDistance = 2;
        const unloadDistance = loadDistance + 1;
        
        // Check what chunks should be loaded or unloaded
        for (let x = chunkX - loadDistance; x <= chunkX + loadDistance; x++) {
            for (let z = chunkZ - loadDistance; z <= chunkZ + loadDistance; z++) {
                const chunkId = `${x}_${z}`;
                
                // If chunk doesn't exist, create it
                if (!chunks.has(chunkId)) {
                    createChunk(x, z);
                }
            }
        }
        
        // Unload distant chunks to save memory
        for (const [chunkId, chunkData] of chunks.entries()) {
            const [x, z] = chunkId.split('_').map(Number);
            
            if (Math.abs(x - chunkX) > unloadDistance || Math.abs(z - chunkZ) > unloadDistance) {
                unloadChunk(chunkId);
            }
        }
    };
    
    // Create a single world chunk
    function createChunk(chunkX, chunkZ) {
        const chunkId = `${chunkX}_${chunkZ}`;
        
        // Skip if chunk already exists
        if (chunks.has(chunkId)) {
            return;
        }
        
        console.log(`Creating chunk: ${chunkId}`);
        
        // Create chunk container
        const chunk = document.createElement('a-entity');
        chunk.setAttribute('id', `chunk_${chunkId}`);
        chunk.setAttribute('position', {
            x: chunkX * config.chunkSize,
            y: 0,
            z: chunkZ * config.chunkSize
        });
        
        // Generate the terrain for this chunk
        generateChunkTerrain(chunk, chunkX, chunkZ);
        
        // Add vegetation and details
        addChunkDetails(chunk, chunkX, chunkZ);
        
        // Add resources
        addChunkResources(chunk, chunkX, chunkZ);
        
        // Possibly place landmarks
        addChunkLandmarks(chunk, chunkX, chunkZ);
        
        // Add chunk to the world
        worldContainer.appendChild(chunk);
        
        // Store the chunk data
        chunks.set(chunkId, {
            element: chunk,
            x: chunkX,
            z: chunkZ,
            entitiesCount: chunk.childElementCount
        });
        
        return chunk;
    }
    
    // Unload a chunk to save resources
    function unloadChunk(chunkId) {
        if (chunks.has(chunkId)) {
            const chunk = chunks.get(chunkId);
            worldContainer.removeChild(chunk.element);
            chunks.delete(chunkId);
            console.log(`Unloaded chunk: ${chunkId}`);
        }
    }
    
    // Create the base terrain for the entire world
    function createBaseTerrain() {
        // Create main ground plane
        const ground = document.createElement('a-entity');
        ground.setAttribute('id', 'ground');
        ground.setAttribute('geometry', {
            primitive: 'plane',
            width: config.worldSize,
            height: config.worldSize
        });
        ground.setAttribute('rotation', '-90 0 0');
        ground.setAttribute('position', '0 -0.1 0');
        ground.setAttribute('material', {
            shader: 'flat',
            src: Game.generation.textures.generateTerrainTexture(worldSeed),
            repeat: `${config.worldSize/20} ${config.worldSize/20}`,
            roughness: 1
        });
        ground.setAttribute('physics-body', 'static');
        
        worldContainer.appendChild(ground);
    }
    
    // Generate detailed terrain for a specific chunk
    function generateChunkTerrain(chunk, chunkX, chunkZ) {
        const heightMap = generateHeightMap(chunkX, chunkZ);
        
        // Create heightfield terrain
        for (let x = 0; x < config.chunkSize; x += 5) {
            for (let z = 0; x < config.chunkSize; z += 5) {
                const worldX = chunkX * config.chunkSize + x;
                const worldZ = chunkZ * config.chunkSize + z;
                
                const height = getHeight(worldX, worldZ, heightMap);
                const biome = getBiome(worldX, worldZ);
                
                // Only add terrain blocks above certain height
                if (height > 0.5) {
                    const terrainBlock = document.createElement('a-box');
                    terrainBlock.setAttribute('width', 5);
                    terrainBlock.setAttribute('depth', 5);
                    terrainBlock.setAttribute('height', height * 2);
                    terrainBlock.setAttribute('position', {
                        x: x + 2.5, 
                        y: height, 
                        z: z + 2.5
                    });
                    terrainBlock.setAttribute('material', {
                        color: biome.color,
                        roughness: 1
                    });
                    terrainBlock.setAttribute('physics-body', 'static');
                    
                    chunk.appendChild(terrainBlock);
                }
            }
        }
    }
    
    // Generate a height map for a chunk
    function generateHeightMap(chunkX, chunkZ) {
        const heightMap = [];
        
        for (let x = 0; x < config.chunkSize; x++) {
            heightMap[x] = [];
            for (let z = 0; x < config.chunkSize; z++) {
                const worldX = chunkX * config.chunkSize + x;
                const worldZ = chunkZ * config.chunkSize + z;
                
                // Use multiple noise layers for more interesting terrain
                const baseNoise = Game.generation.noise.perlin2D(worldX * 0.01, worldZ * 0.01);
                const detailNoise = Game.generation.noise.perlin2D(worldX * 0.05, worldZ * 0.05) * 0.2;
                
                // Combine noise layers
                let height = baseNoise + detailNoise;
                
                // Normalize to 0-1 range
                height = (height + 1) * 0.5;
                
                // Apply height curve
                height = Math.pow(height, 1.5);
                
                heightMap[x][z] = height;
            }
        }
        
        return heightMap;
    }
    
    // Get interpolated height at a specific world position
    function getHeight(x, z, heightMap = null) {
        if (!heightMap) {
            const baseNoise = Game.generation.noise.perlin2D(x * 0.01, z * 0.01);
            const detailNoise = Game.generation.noise.perlin2D(x * 0.05, z * 0.05) * 0.2;
            
            let height = baseNoise + detailNoise;
            height = (height + 1) * 0.5;
            height = Math.pow(height, 1.5);
            
            return height * config.heightScale + config.baseHeight;
        }
        
        // Handle out of bounds using modulo wrapping
        const lx = Math.floor(x) % config.chunkSize;
        const lz = Math.floor(z) % config.chunkSize;
        
        // Use positive modulo
        const px = (lx + config.chunkSize) % config.chunkSize;
        const pz = (lz + config.chunkSize) % config.chunkSize;
        
        return heightMap[px][pz] * config.heightScale + config.baseHeight;
    }
    
    // Determine biome at a specific world position
    function getBiome(x, z) {
        // Use a separate noise function for biome determination
        const biomeValue = Game.generation.noise.simplex2D(x * 0.005, z * 0.005);
        
        // Map noise to biome index
        const biomeIndex = Math.min(
            config.biomes.length - 1,
            Math.floor((biomeValue + 1) / 2 * config.biomes.length)
        );
        
        return config.biomes[biomeIndex];
    }
    
    // Add vegetation and details to a chunk
    function addChunkDetails(chunk, chunkX, chunkZ) {
        for (let x = 0; x < config.chunkSize; x += 2) {
            for (let z = 0; x < config.chunkSize; z += 2) {
                const worldX = chunkX * config.chunkSize + x;
                const worldZ = chunkZ * config.chunkSize + z;
                
                const height = getHeight(worldX, worldZ);
                const biome = getBiome(worldX, worldZ);
                
                // Add trees
                if (Game.math.random(worldX, worldZ, 'tree') < biome.treeDensity && height > 2) {
                    addTree(chunk, x, height, z);
                }
                
                // Add rocks
                if (Game.math.random(worldX, worldZ, 'rock') < biome.rockDensity) {
                    addRock(chunk, x, height, z);
                }
            }
        }
    }
    
    // Add resources to a chunk
    function addChunkResources(chunk, chunkX, chunkZ) {
        for (let x = 0; x < config.chunkSize; x += 5) {
            for (let z = 0; x < config.chunkSize; z += 5) {
                const worldX = chunkX * config.chunkSize + x;
                const worldZ = chunkZ * config.chunkSize + z;
                
                const height = getHeight(worldX, worldZ);
                const biome = getBiome(worldX, worldZ);
                
                // Add resource nodes based on biome
                if (Game.math.random(worldX, worldZ, 'resource') < biome.resourceDensity) {
                    const resourceTypes = ['wood', 'stone', 'metal', 'herb'];
                    const resourceIndex = Math.floor(Game.math.random(worldX, worldZ, 'resourceType') * resourceTypes.length);
                    addResourceNode(chunk, x, height, z, resourceTypes[resourceIndex]);
                }
            }
        }
    }
    
    // Add landmarks to a chunk (dungeons, villages, ruins)
    function addChunkLandmarks(chunk, chunkX, chunkZ) {
        // Check each landmark type
        for (const landmark of config.landmarks) {
            const worldCenterX = chunkX * config.chunkSize + config.chunkSize / 2;
            const worldCenterZ = chunkZ * config.chunkSize + config.chunkSize / 2;
            
            // Use deterministic random based on position and seed
            const chance = Game.math.random(worldCenterX, worldCenterZ, `landmark_${landmark.type}`);
            
            // Check if we should place a landmark here
            if (chance < landmark.frequency) {
                // Check distance from other landmarks and player spawn
                let canPlace = true;
                
                // TODO: Implement check for minimum distance from other landmarks
                
                if (canPlace) {
                    const height = getHeight(worldCenterX, worldCenterZ);
                    
                    // Place landmark at center of chunk with slight random offset
                    const offsetX = (Game.math.random(worldCenterX, worldCenterZ, 'landmarkOffsetX') - 0.5) * 20;
                    const offsetZ = (Game.math.random(worldCenterX, worldCenterZ, 'landmarkOffsetZ') - 0.5) * 20;
                    
                    addLandmark(chunk, config.chunkSize/2 + offsetX, height, config.chunkSize/2 + offsetZ, landmark.type);
                }
            }
        }
    }
    
    // Add a tree to the world
    function addTree(chunk, x, y, z) {
        // Create tree trunk
        const trunk = document.createElement('a-entity');
        trunk.setAttribute('geometry', {
            primitive: 'cylinder',
            height: 4,
            radius: 0.5
        });
        trunk.setAttribute('material', {
            color: '#8B4513',
            roughness: 1
        });
        trunk.setAttribute('position', {
            x: x,
            y: y + 2,
            z: z
        });
        trunk.setAttribute('physics-body', 'static');
        
        // Create tree canopy
        const canopy = document.createElement('a-entity');
        canopy.setAttribute('geometry', {
            primitive: 'cone',
            height: 6,
            radiusBottom: 3,
            radiusTop: 0.1
        });
        canopy.setAttribute('material', {
            color: '#2E8B57',
            roughness: 0.8
        });
        canopy.setAttribute('position', {
            x: 0,
            y: 5,
            z: 0
        });
        canopy.setAttribute('physics-body', 'static');
        
        trunk.appendChild(canopy);
        chunk.appendChild(trunk);
    }
    
    // Add a rock to the world
    function addRock(chunk, x, y, z) {
        const rock = document.createElement('a-entity');
        
        // Random rock size
        const size = 0.5 + Math.random() * 1.5;
        
        rock.setAttribute('geometry', {
            primitive: 'dodecahedron',
            radius: size
        });
        rock.setAttribute('material', {
            color: '#808080',
            roughness: 1
        });
        rock.setAttribute('position', {
            x: x,
            y: y + size/2,
            z: z
        });
        rock.setAttribute('rotation', {
            x: Math.random() * 360,
            y: Math.random() * 360,
            z: Math.random() * 360
        });
        rock.setAttribute('physics-body', 'static');
        
        chunk.appendChild(rock);
    }
    
    // Add a resource node to the world
    function addResourceNode(chunk, x, y, z, type) {
        const node = document.createElement('a-entity');
        node.classList.add('interactive', 'resource');
        node.setAttribute('data-resource-type', type);
        
        let color, shape;
        
        switch(type) {
            case 'wood':
                color = '#8B4513';
                shape = 'box';
                break;
            case 'stone':
                color = '#A9A9A9';
                shape = 'dodecahedron';
                break;
            case 'metal':
                color = '#4682B4';
                shape = 'tetrahedron';
                break;
            case 'herb':
                color = '#ADFF2F';
                shape = 'sphere';
                break;
            default:
                color = '#FFF';
                shape = 'box';
        }
        
        node.setAttribute('geometry', {
            primitive: shape,
            width: 1,
            height: 1,
            depth: 1,
            radius: 0.5
        });
        
        node.setAttribute('material', {
            color: color,
            metalness: type === 'metal' ? 0.7 : 0,
            roughness: 0.8
        });
        
        node.setAttribute('position', {
            x: x,
            y: y + 0.5,
            z: z
        });
        
        // Add pulsing animation
        node.setAttribute('animation', {
            property: 'position',
            dir: 'alternate',
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            to: `${x} ${y + 0.8} ${z}`
        });
        
        // Add glow effect
        const light = document.createElement('a-light');
        light.setAttribute('type', 'point');
        light.setAttribute('color', color);
        light.setAttribute('intensity', '0.3');
        light.setAttribute('distance', '3');
        node.appendChild(light);
        
        // Add interactivity to collect resource
        node.setAttribute('onclick', `Game.gameplay.player.collectResource('${type}')`);
        
        chunk.appendChild(node);
    }
    
    // Add a landmark to the world
    function addLandmark(chunk, x, y, z, type) {
        const landmark = document.createElement('a-entity');
        landmark.classList.add('landmark', type, 'interactive');
        landmark.setAttribute('data-landmark-type', type);
        
        switch(type) {
            case 'dungeon':
                createDungeon(landmark, x, y, z);
                break;
            case 'village':
                createVillage(landmark, x, y, z);
                break;
            case 'ruin':
                createRuin(landmark, x, y, z);
                break;
        }
        
        // Add landmark label
        const text = document.createElement('a-text');
        text.setAttribute('value', type.charAt(0).toUpperCase() + type.slice(1));
        text.setAttribute('align', 'center');
        text.setAttribute('width', 10);
        text.setAttribute('position', {
            x: 0,
            y: 8,
            z: 0
        });
        text.setAttribute('side', 'double');
        text.setAttribute('color', '#FFFFFF');
        text.setAttribute('look-at', '[camera]');
        
        landmark.appendChild(text);
        chunk.appendChild(landmark);
        
        console.log(`Added landmark: ${type} at ${x}, ${y}, ${z}`);
    }
    
    // Create a dungeon landmark
    function createDungeon(parent, x, y, z) {
        // Main structure
        const dungeon = document.createElement('a-entity');
        dungeon.setAttribute('geometry', {
            primitive: 'box',
            width: 15,
            height: 8,
            depth: 15
        });
        dungeon.setAttribute('material', {
            color: '#444444',
            roughness: 1
        });
        dungeon.setAttribute('position', {
            x: x,
            y: y + 4,
            z: z
        });
        
        // Add towers at corners
        for (let dx of [-6, 6]) {
            for (let dz of [-6, 6]) {
                const tower = document.createElement('a-entity');
                tower.setAttribute('geometry', {
                    primitive: 'cylinder',
                    height: 12,
                    radius: 2
                });
                tower.setAttribute('material', {
                    color: '#333333',
                    roughness: 1
                });
                tower.setAttribute('position', {
                    x: dx,
                    y: 2,
                    z: dz
                });
                
                const roof = document.createElement('a-entity');
                roof.setAttribute('geometry', {
                    primitive: 'cone',
                    height: 3,
                    radiusBottom: 2.5,
                    radiusTop: 0.1
                });
                roof.setAttribute('material', {
                    color: '#660000',
                    roughness: 0.9
                });
                roof.setAttribute('position', {
                    x: 0,
                    y: 7,
                    z: 0
                });
                
                tower.appendChild(roof);
                dungeon.appendChild(tower);
            }
        }
        
        // Add entrance
        const entrance = document.createElement('a-entity');
        entrance.setAttribute('geometry', {
            primitive: 'box',
            width: 4,
            height: 6,
            depth: 2
        });
        entrance.setAttribute('material', {
            color: '#222222',
            roughness: 1
        });
        entrance.setAttribute('position', {
            x: 0,
            y: -1,
            z: 7.5
        });
        
        // Portal light
        const portalLight = document.createElement('a-entity');
        portalLight.setAttribute('light', {
            type: 'point',
            color: '#ff0000',
            intensity: 1,
            distance: 10
        });
        portalLight.setAttribute('position', {
            x: 0,
            y: 0,
            z: 0
        });
        
        entrance.appendChild(portalLight);
        dungeon.appendChild(entrance);
        
        // Make dungeon interactive
        dungeon.setAttribute('onclick', 'Game.gameplay.player.enterDungeon()');
        
        parent.appendChild(dungeon);
    }
    
    // Create a village landmark
    function createVillage(parent, x, y, z) {
        const village = document.createElement('a-entity');
        
        const numHouses = 6;
        const radius = 10;
        
        for (let i = 0; i < numHouses; i++) {
            const angle = (i / numHouses) * Math.PI * 2;
            const hx = Math.cos(angle) * radius;
            const hz = Math.sin(angle) * radius;
            
            createHouse(village, hx, 0, hz);
        }
        
        // Add central fire pit
        const firePit = document.createElement('a-entity');
        firePit.setAttribute('geometry', {
            primitive: 'cylinder',
            height: 0.5,
            radius: 2
        });
        firePit.setAttribute('material', {
            color: '#333333',
            roughness: 1
        });
        
        const fire = document.createElement('a-entity');
        fire.setAttribute('particle-system', {
            preset: 'dust',
            particleCount: 100,
            color: '#ff4400',
            size: 1,
            maxAge: 1
        });
        fire.setAttribute('position', {
            x: 0,
            y: 0.5,
            z: 0
        });
        
        const fireLight = document.createElement('a-entity');
        fireLight.setAttribute('light', {
            type: 'point',
            color: '#ff7700',
            intensity: 1.5,
            distance: 15
        });
        
        firePit.appendChild(fire);
        firePit.appendChild(fireLight);
        village.appendChild(firePit);
        
        // Position the entire village
        village.setAttribute('position', {
            x: x,
            y: y,
            z: z
        });
        
        // Make village interactive
        village.setAttribute('onclick', 'Game.gameplay.player.enterVillage()');
        
        parent.appendChild(village);
    }
    
    // Create a house for a village
    function createHouse(parent, x, y, z) {
        const house = document.createElement('a-entity');
        house.setAttribute('position', {
            x: x,
            y: y,
            z: z
        });
        
        // Random rotation
        house.setAttribute('rotation', {
            x: 0,
            y: Math.random() * 360,
            z: 0
        });
        
        // House base
        const base = document.createElement('a-box');
        base.setAttribute('width', 5);
        base.setAttribute('height', 3);
        base.setAttribute('depth', 5);
        base.setAttribute('position', {
            x: 0,
            y: 1.5,
            z: 0
        });
        base.setAttribute('material', {
            color: '#A0522D',
            roughness: 0.9
        });
        
        // House roof
        const roof = document.createElement('a-entity');
        roof.setAttribute('geometry', {
            primitive: 'cone',
            height: 3,
            radiusBottom: 3.5,
            radiusTop: 0.1,
            segmentsRadial: 4
        });
        roof.setAttribute('material', {
            color: '#8B4513',
            roughness: 0.8
        });
        roof.setAttribute('position', {
            x: 0,
            y: 3 + 1.5,
            z: 0
        });
        roof.setAttribute('rotation', {
            x: 0,
            y: 45,
            z: 0
        });
        
        // Door
        const door = document.createElement('a-plane');
        door.setAttribute('width', 1.5);
        door.setAttribute('height', 2);
        door.setAttribute('position', {
            x: 0,
            y: 1,
            z: 2.51
        });
        door.setAttribute('material', {
            color: '#4d2600',
            roughness: 1
        });
        
        // Window
        const window = document.createElement('a-plane');
        window.setAttribute('width', 1);
        window.setAttribute('height', 1);
        window.setAttribute('position', {
            x: 1.5,
            y: 1.5,
            z: 2.51
        });
        window.setAttribute('material', {
            color: '#add8e6',
            opacity: 0.7
        });
        
        house.appendChild(base);
        house.appendChild(roof);
        house.appendChild(door);
        house.appendChild(window);
        parent.appendChild(house);
    }
    
    // Create ruins landmark
    function createRuin(parent, x, y, z) {
        const ruin = document.createElement('a-entity');
        ruin.setAttribute('position', {
            x: x,
            y: y,
            z: z
        });
        
        // Create broken pillars
        for (let i = 0; i < 6; i++) {
            const angle = (i / 6) * Math.PI * 2;
            const distance = 8;
            
            const px = Math.cos(angle) * distance;
            const pz = Math.sin(angle) * distance;
            
            // Random height for broken appearance
            const height = 2 + Math.random() * 5;
            
            const pillar = document.createElement('a-entity');
            pillar.setAttribute('geometry', {
                primitive: 'cylinder',
                height: height,
                radius: 1.2,
                segmentsRadial: 6
            });
            pillar.setAttribute('material', {
                color: '#8a8a8a',
                roughness: 0.9
            });
            pillar.setAttribute('position', {
                x: px,
                y: height/2,
                z: pz
            });
            
            // Random rotation and tilt for destroyed look
            const tiltX = (Math.random() - 0.5) * 15;
            const tiltZ = (Math.random() - 0.5) * 15;
            pillar.setAttribute('rotation', {
                x: tiltX,
                y: Math.random() * 360,
                z: tiltZ
            });
            
            // Add cracks and details
            addCracksToColumn(pillar);
            
            ruin.appendChild(pillar);
        }
        
        // Add central altar/structure
        const altar = document.createElement('a-entity');
        altar.setAttribute('geometry', {
            primitive: 'box',
            width: 5,
            height: 1,
            depth: 5
        });
        altar.setAttribute('material', {
            color: '#606060',
            roughness: 1
        });
        altar.setAttribute('position', {
            x: 0,
            y: 0.5,
            z: 0
        });
        
        // Add mysterious glow to altar
        const altarLight = document.createElement('a-entity');
        altarLight.setAttribute('light', {
            type: 'point',
            color: '#5e24bd',
            intensity: 0.8,
            distance: 10
        });
        altarLight.setAttribute('position', {
            x: 0,
            y: 1.5,
            z: 0
        });
        
        // Add floating crystal/artifact above altar
        const artifact = document.createElement('a-entity');
        artifact.setAttribute('geometry', {
            primitive: 'dodecahedron',
            radius: 0.5
        });
        artifact.setAttribute('material', {
            color: '#9370db',
            emissive: '#9370db',
            emissiveIntensity: 0.5,
            metalness: 0.7,
            roughness: 0.3
        });
        artifact.setAttribute('position', {
            x: 0,
            y: 2,
            z: 0
        });
        artifact.setAttribute('animation', {
            property: 'rotation',
            dur: 10000,
            to: '0 360 0',
            loop: true,
            easing: 'linear'
        });
        artifact.setAttribute('animation__hover', {
            property: 'position',
            dur: 3000,
            dir: 'alternate',
            to: '0 2.5 0',
            loop: true,
            easing: 'easeInOutSine'
        });
        
        altar.appendChild(altarLight);
        altar.appendChild(artifact);
        ruin.appendChild(altar);
        
        // Add some debris and fallen stones around the ruins
        for (let i = 0; i < 15; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 3 + Math.random() * 10;
            
            const dx = Math.cos(angle) * distance;
            const dz = Math.sin(angle) * distance;
            
            const debris = document.createElement('a-entity');
            
            // Random shape for debris
            const shapeType = Math.random();
            if (shapeType < 0.4) {
                // Stone block
                debris.setAttribute('geometry', {
                    primitive: 'box',
                    width: 0.5 + Math.random() * 1.5,
                    height: 0.5 + Math.random() * 1.0,
                    depth: 0.5 + Math.random() * 1.5
                });
            } else if (shapeType < 0.7) {
                // Stone cylinder segment
                debris.setAttribute('geometry', {
                    primitive: 'cylinder',
                    height: 0.5 + Math.random(),
                    radius: 0.7 + Math.random() * 0.5,
                    segmentsRadial: 6
                });
            } else {
                // Irregular stone
                debris.setAttribute('geometry', {
                    primitive: 'dodecahedron',
                    radius: 0.5 + Math.random()
                });
            }
            
            debris.setAttribute('material', {
                color: '#' + (Math.floor(128 + Math.random() * 70)).toString(16).repeat(3),
                roughness: 0.9
            });
            
            debris.setAttribute('position', {
                x: dx,
                y: Math.random() * 0.5,
                z: dz
            });
            
            debris.setAttribute('rotation', {
                x: Math.random() * 360,
                y: Math.random() * 360,
                z: Math.random() * 360
            });
            
            ruin.appendChild(debris);
        }
        
        // Make ruins interactive
        ruin.setAttribute('onclick', 'Game.gameplay.player.investigateRuins()');
        
        parent.appendChild(ruin);
    }
    
    // Add cracks and details to a column for more realism
    function addCracksToColumn(column) {
        // Add crack details with overlaid geometries
        const crackDetail = document.createElement('a-entity');
        
        // We'll use a torus as a "crack" by positioning it partially inside the column
        crackDetail.setAttribute('geometry', {
            primitive: 'torus',
            radius: 1.25,
            radiusTubular: 0.05,
            segmentsTubular: 8
        });
        
        crackDetail.setAttribute('material', {
            color: '#333333',
            roughness: 1
        });
        
        // Position the crack somewhere on the column
        const crackY = Math.random() * 0.8 - 0.4; // Somewhere in the middle section
        crackDetail.setAttribute('position', {
            x: 0,
            y: crackY,
            z: 0
        });
        
        // Random rotation for the crack
        crackDetail.setAttribute('rotation', {
            x: 90, // Align with column
            y: 0,
            z: Math.random() * 360
        });
        
        column.appendChild(crackDetail);
        
        // Add moss or weathering effect to the top
        const moss = document.createElement('a-entity');
        moss.setAttribute('geometry', {
            primitive: 'cylinder',
            height: 0.1,
            radius: 1.3,
            segmentsRadial: 6
        });
        
        moss.setAttribute('material', {
            color: '#2e4233',
            roughness: 1
        });
        
        // Position on top of column
        const columnHeight = column.getAttribute('geometry').height;
        moss.setAttribute('position', {
            x: 0,
            y: columnHeight / 2 - 0.05, // Slightly embedded in top
            z: 0
        });
        
        column.appendChild(moss);
    }
    
    // Create starting area with special features
    async function createStartingArea() {
        console.log('Creating starting area');
        
        // Create a small clearing or special area for the player start
        const startX = 0;
        const startZ = 0;
        
        // Flatten terrain around starting point
        const flattenRadius = 20;
        
        // Create a small shelter or camp
        const camp = document.createElement('a-entity');
        camp.setAttribute('position', { x: startX, y: 0, z: startZ });
        
        // Add campfire
        const campfire = document.createElement('a-entity');
        campfire.setAttribute('position', { x: 0, y: 0.25, z: 0 });
        
        // Fire pit stones
        const stonePit = document.createElement('a-entity');
        stonePit.setAttribute('geometry', {
            primitive: 'cylinder',
            height: 0.5,
            radius: 1.2
        });
        stonePit.setAttribute('material', {
            color: '#666',
            roughness: 1
        });
        campfire.appendChild(stonePit);
        
        // Actual fire
        const fire = document.createElement('a-entity');
        fire.setAttribute('particle-system', {
            preset: 'dust',
            particleCount: 100,
            color: '#ff4400, #ffaa00',
            size: 1,
            maxAge: 1
        });
        fire.setAttribute('position', { x: 0, y: 0.5, z: 0 });
        
        // Fire light
        const fireLight = document.createElement('a-entity');
        fireLight.setAttribute('light', {
            type: 'point',
            color: '#ff7700',
            intensity: 1.5,
            distance: 15
        });
        fire.appendChild(fireLight);
        campfire.appendChild(fire);
        
        // Add logs around campfire
        for (let i = 0; i < 5; i++) {
            const angle = (i / 5) * Math.PI * 2;
            const logX = Math.cos(angle) * 2;
            const logZ = Math.sin(angle) * 2;
            
            const log = document.createElement('a-entity');
            log.setAttribute('geometry', {
                primitive: 'cylinder',
                height: 0.5,
                radius: 0.25
            });
            log.setAttribute('material', {
                color: '#8B4513',
                roughness: 1
            });
            log.setAttribute('position', {
                x: logX,
                y: 0.25,
                z: logZ
            });
            log.setAttribute('rotation', {
                x: 90,
                y: angle * (180/Math.PI) + 90,
                z: 0
            });
            
            campfire.appendChild(log);
        }
        
        // Add simple tent
        const tent = document.createElement('a-entity');
        tent.setAttribute('position', { x: 4, y: 0, z: -2 });
        
        // Tent base
        const tentBase = document.createElement('a-entity');
        tentBase.setAttribute('geometry', {
            primitive: 'box',
            width: 4,
            height: 0.1,
            depth: 6
        });
        tentBase.setAttribute('material', {
            color: '#5d4037',
            roughness: 1
        });
        tentBase.setAttribute('position', { x: 0, y: 0.05, z: 0 });
        tent.appendChild(tentBase);
        
        // Tent structure
        const tentTop = document.createElement('a-entity');
        tentTop.setAttribute('geometry', {
            primitive: 'cone',
            radiusBottom: 3,
            radiusTop: 0.1,
            height: 2.5,
            segmentsRadial: 4
        });
        tentTop.setAttribute('material', {
            color: '#78909c',
            roughness: 0.8
        });
        tentTop.setAttribute('position', { x: 0, y: 1.25, z: 0 });
        tentTop.setAttribute('rotation', { x: 0, y: 45, z: 0 });
        tent.appendChild(tentTop);
        
        // Add basic supplies/chest
        const chest = document.createElement('a-entity');
        chest.setAttribute('geometry', {
            primitive: 'box',
            width: 1,
            height: 0.6,
            depth: 0.8
        });
        chest.setAttribute('material', {
            color: '#5d4037',
            roughness: 0.9
        });
        chest.setAttribute('position', { x: 1.5, y: 0.3, z: 1 });
        chest.setAttribute('rotation', { x: 0, y: 15, z: 0 });
        
        // Make chest interactive
        chest.classList.add('interactive');
        chest.setAttribute('onclick', 'Game.gameplay.player.openStarterChest()');
        
        tent.appendChild(chest);
        
        // Add all to camp
        camp.appendChild(campfire);
        camp.appendChild(tent);
        worldContainer.appendChild(camp);
        
        // Add some starter resources nearby
        for (let i = 0; i < 5; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 10 + Math.random() * 10;
            const resourceX = Math.cos(angle) * distance;
            const resourceZ = Math.sin(angle) * distance;
            
            addResourceNode(worldContainer, startX + resourceX, 0, startZ + resourceZ, 
                           ['wood', 'stone', 'herb'][Math.floor(Math.random() * 3)]);
        }
        
        // Set player start position
        const state = Game.engine.getState();
        state.player.position = { x: startX, y: 1.6, z: startZ + 3 };
        Game.engine.setState(state);
        
        return Promise.resolve();
    }
    
    // Load initial chunks around player starting position
    async function loadInitialChunks() {
        const state = Game.engine.getState();
        const playerPos = state.player.position;
        
        // Calculate chunk coordinates
        const chunkX = Math.floor(playerPos.x / config.chunkSize);
        const chunkZ = Math.floor(playerPos.z / config.chunkSize);
        
        console.log('Loading initial chunks around player position:', playerPos);
        
        // Load chunks in 3x3 grid around player
        const loadDistance = 1;
        const promises = [];
        
        for (let x = chunkX - loadDistance; x <= chunkX + loadDistance; x++) {
            for (let z = chunkZ - loadDistance; z <= chunkZ + loadDistance; z++) {
                // Create chunk async
                promises.push(new Promise(resolve => {
                    const chunk = createChunk(x, z);
                    resolve(chunk);
                }));
            }
        }
        
        await Promise.all(promises);
        
        // Position the player rig at the start position
        const rig = document.getElementById('rig');
        if (rig) {
            rig.setAttribute('position', playerPos);
        }
        
        console.log('Initial chunks loaded');
        return Promise.resolve();
    }
})();