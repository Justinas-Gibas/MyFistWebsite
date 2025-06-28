import { CONFIG, Logger } from './config.js';

function ensureThree() {
    if (typeof AFRAME === 'undefined' || !AFRAME.THREE) {
        throw new Error('THREE.js not found. Make sure A-Frame is loaded first.');
    }
    return AFRAME.THREE;
}

class NoiseGenerator {
    constructor(seed = Math.random()) {
        this.seed = seed;
        this.permutation = new Uint8Array(256);
        this.initPermutation();
    }

    initPermutation() {
        for(let i = 0; i < 256; i++) {
            this.permutation[i] = Math.floor(Math.random() * 256);
        }
    }

    noise3D(x, y, z) {
        try {
            const X = Math.floor(x) & 255;
            const Y = Math.floor(y) & 255;
            const Z = Math.floor(z) & 255;

            x -= Math.floor(x);
            y -= Math.floor(y);
            z -= Math.floor(z);

            const u = this.fade(x);
            const v = this.fade(y);
            const w = this.fade(z);

            const A = this.permutation[X] + Y;
            const AA = this.permutation[A] + Z;
            const AB = this.permutation[A + 1] + Z;
            const B = this.permutation[X + 1] + Y;
            const BA = this.permutation[B] + Z;
            const BB = this.permutation[B + 1] + Z;

            return this.lerp(w, this.lerp(v, this.lerp(u, this.grad(this.permutation[AA], x, y, z),
                this.grad(this.permutation[BA], x - 1, y, z)),
                this.lerp(u, this.grad(this.permutation[AB], x, y - 1, z),
                    this.grad(this.permutation[BB], x - 1, y - 1, z))),
                this.lerp(v, this.lerp(u, this.grad(this.permutation[AA + 1], x, y, z - 1),
                    this.grad(this.permutation[BA + 1], x - 1, y, z - 1)),
                    this.lerp(u, this.grad(this.permutation[AB + 1], x, y - 1, z - 1),
                        this.grad(this.permutation[BB + 1], x - 1, y - 1, z - 1))));
        } catch (error) {
            Logger.error('NoiseGenerator', 'Failed to generate noise', error);
            return 0;
        }
    }

    fade(t) { 
        return t * t * t * (t * (t * 6 - 15) + 10); 
    }

    lerp(t, a, b) { 
        return a + t * (b - a); 
    }

    grad(hash, x, y, z) {
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }
}

class BlockTypeGenerator {
    constructor() {
        const THREE = ensureThree(); // Get THREE reference safely
        this.noise = new NoiseGenerator();
        this.blockTypes = new Map();
        this.generateBaseBlockTypes();
    }

    generateBaseBlockTypes() {
        // Add base block types
        this.addBlockType('AIR', {
            id: 0,
            name: 'air',
            transparent: true,
            color: '#ffffff'
        });

        // Generate variations of basic materials
        this.generateTerrainTypes();
        this.generateMineralTypes();
        this.generateSpecialTypes();
    }

    generateTerrainTypes() {
        // Generate different types of terrain blocks with varying properties
        const dirtVariations = this.generateColorVariations('#8B4513', 5);
        const grassVariations = this.generateColorVariations('#567D46', 5);
        const stoneVariations = this.generateColorVariations('#808080', 5);

        dirtVariations.forEach((color, i) => {
            this.addBlockType(`DIRT_${i}`, {
                id: 1 + i,
                name: `dirt_${i}`,
                color: color,
                hardness: 0.5 + Math.random() * 0.5
            });
        });

        grassVariations.forEach((color, i) => {
            this.addBlockType(`GRASS_${i}`, {
                id: 10 + i,
                name: `grass_${i}`,
                color: color,
                hardness: 0.3 + Math.random() * 0.4
            });
        });

        stoneVariations.forEach((color, i) => {
            this.addBlockType(`STONE_${i}`, {
                id: 20 + i,
                name: `stone_${i}`,
                color: color,
                hardness: 1.0 + Math.random() * 0.5
            });
        });
    }

    generateMineralTypes() {
        const mineralColors = [
            '#FFD700', // Gold
            '#C0C0C0', // Silver
            '#B87333', // Copper
            '#4A0404', // Iron
            '#0000FF', // Sapphire
            '#FF0000', // Ruby
            '#50C878'  // Emerald
        ];

        mineralColors.forEach((baseColor, i) => {
            const variations = this.generateColorVariations(baseColor, 3);
            variations.forEach((color, j) => {
                this.addBlockType(`MINERAL_${i}_${j}`, {
                    id: 100 + (i * 10) + j,
                    name: `mineral_${i}_${j}`,
                    color: color,
                    hardness: 2.0 + Math.random(),
                    value: Math.random() * 100
                });
            });
        });
    }

    generateSpecialTypes() {
        // Generate special blocks with unique properties
        const specialBlocks = [
            { name: 'CRYSTAL', baseColor: '#00FFFF', transparent: true },
            { name: 'LAVA', baseColor: '#FF4500', emissive: true },
            { name: 'ICE', baseColor: '#ADD8E6', transparent: true },
            { name: 'ANCIENT', baseColor: '#DEB887', glowing: true }
        ];

        specialBlocks.forEach((block, i) => {
            this.addBlockType(block.name, {
                id: 200 + i,
                name: block.name.toLowerCase(),
                color: block.baseColor,
                transparent: block.transparent || false,
                emissive: block.emissive || false,
                glowing: block.glowing || false,
                special: true
            });
        });
    }

    generateColorVariations(baseColor, count) {
        const variations = [];
        for (let i = 0; i < count; i++) {
            variations.push(this.varyColor(baseColor, 20));
        }
        return variations;
    }

    varyColor(baseColor, range) {
        const color = new AFRAME.THREE.Color(baseColor);
        color.r += (Math.random() - 0.5) * (range / 255);
        color.g += (Math.random() - 0.5) * (range / 255);
        color.b += (Math.random() - 0.5) * (range / 255);
        return '#' + color.getHexString();
    }

    addBlockType(key, properties) {
        this.blockTypes.set(key, properties);
    }

    getBlockType(id) {
        for (const [_, type] of this.blockTypes) {
            if (type.id === id) return type;
        }
        return this.blockTypes.get('AIR');
    }

    getRandomBlockType(category) {
        const types = Array.from(this.blockTypes.values())
            .filter(type => type.name.startsWith(category.toLowerCase()));
        return types[Math.floor(Math.random() * types.length)];
    }
}

class TextureGenerator {
    constructor(resolution = 16) {
        const THREE = ensureThree(); // Get THREE reference safely
        this.resolution = resolution;
        this.canvas = document.createElement('canvas');
        this.canvas.width = resolution;
        this.canvas.height = resolution;
        this.ctx = this.canvas.getContext('2d');
    }

    generateTexture(type) {
        this.ctx.clearRect(0, 0, this.resolution, this.resolution);
        
        switch(type) {
            case 'grass':
                return this.generateGrassTexture();
            case 'stone':
                return this.generateStoneTexture();
            case 'metal':
                return this.generateMetalTexture();
            case 'glass':
                return this.generateGlassTexture();
            default:
                return this.generateDefaultTexture();
        }
    }

    generateGrassTexture() {
        const colors = ['#2d5a27', '#1e4d1a', '#387031', '#2d5a27'];
        this.drawNoise(colors, 0.7);
        return this.getTextureData();
    }

    generateStoneTexture() {
        const colors = ['#666666', '#777777', '#555555', '#707070'];
        this.drawNoise(colors, 0.3);
        return this.getTextureData();
    }

    generateMetalTexture() {
        const colors = ['#95a5a6', '#7f8c8d', '#bdc3c7'];
        this.drawNoise(colors, 0.1);
        return this.getTextureData();
    }

    generateGlassTexture() {
        const colors = ['#ecf0f1', '#bdc3c7'];
        this.drawNoise(colors, 0.05);
        return this.getTextureData();
    }

    drawNoise(colors, variance) {
        for (let x = 0; x < this.resolution; x++) {
            for (let y = 0; y < this.resolution; y++) {
                if (Math.random() < variance) {
                    this.ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)];
                } else {
                    this.ctx.fillStyle = colors[0];
                }
                this.ctx.fillRect(x, y, 1, 1);
            }
        }
    }

    getTextureData() {
        return this.canvas.toDataURL('image/png');
    }
}

class TextureManager {
    constructor() {
        const THREE = ensureThree(); // Get THREE reference safely
        this.textureGenerator = new TextureGenerator(64); // Higher res textures
        this.textureCache = new Map();
        this.loadingPromises = new Map();
    }

    async getTexture(type) {
        if (this.textureCache.has(type)) {
            return this.textureCache.get(type);
        }

        if (this.loadingPromises.has(type)) {
            return this.loadingPromises.get(type);
        }

        const loadingPromise = new Promise((resolve) => {
            const textureData = this.textureGenerator.generateTexture(type);
            const texture = new AFRAME.THREE.TextureLoader().load(textureData, (tex) => {
                tex.wrapS = AFRAME.THREE.RepeatWrapping;
                tex.wrapT = AFRAME.THREE.RepeatWrapping;
                tex.needsUpdate = true;
                this.textureCache.set(type, tex);
                resolve(tex);
            });
        });

        this.loadingPromises.set(type, loadingPromise);
        return loadingPromise;
    }
}

class ChunkGenerator {
    constructor() {
        this.noise = new NoiseGenerator();
        this.scale = 0.1;
        this.blockTypeGenerator = new BlockTypeGenerator();
        this.CHUNK_SIZE = CONFIG.SIZES.CHUNK;
        this.BLOCK_SIZE = CONFIG.SIZES.BLOCK;
    }

    generateChunkData(position) {
        const startTime = performance.now();
        Logger.info('ChunkGenerator', 'Starting chunk generation', { position });
        
        try {
            Logger.logStep('ChunkGenerator', 'Generating chunk data', { position });
            const size = this.CHUNK_SIZE;
            const data = new Array(size * size * size);
            
            for (let x = 0; x < size; x++) {
                for (let y = 0; y < size; y++) {
                    for (let z = 0; z < size; z++) {
                        const worldX = position.x * size + x;
                        const worldY = position.y * size + y;
                        const worldZ = position.z * size + z;
                        
                        const value = this.generateVoxel(worldX, worldY, worldZ);
                        let blockType;

                        if (worldY < 0) {
                            blockType = this.blockTypeGenerator.getRandomBlockType('STONE');
                        } else if (worldY === 0) {
                            blockType = this.blockTypeGenerator.getRandomBlockType('DIRT');
                        } else if (worldY > 0) {
                            blockType = this.blockTypeGenerator.getRandomBlockType('GRASS');
                        }

                        // Add random mineral veins
                        if (Math.random() < 0.05) {
                            blockType = this.blockTypeGenerator.getRandomBlockType('MINERAL');
                        }

                        // Add random special blocks
                        if (Math.random() < 0.01) {
                            const specialTypes = ['CRYSTAL', 'LAVA', 'ICE', 'ANCIENT'];
                            const randomSpecial = specialTypes[Math.floor(Math.random() * specialTypes.length)];
                            blockType = this.blockTypeGenerator.getBlockType(randomSpecial);
                        }

                        const index = x + y * size + z * size * size;
                        data[index] = blockType.id;
                    }
                }
            }

            Logger.performance('ChunkGenerator', 'chunk_generation', startTime);
            return data;
        } catch (error) {
            Logger.error('ChunkGenerator', CONFIG.ERROR_CODES.CHUNK_GENERATION, error);
            return new Array(this.CHUNK_SIZE ** 3).fill(0);
        }
    }

    generateVoxel(x, y, z) {
        const height = this.noise.noise3D(
            x * this.scale, 
            y * this.scale, 
            z * this.scale
        );
        return (height + 1) / 2; // Normalize to 0-1
    }
}

class BlockSystem {
    constructor() {
        this.breakingTextures = Array(10).fill(0).map((_, i) => 
            `/assets/breaking/break_${i}.png`
        );
    }

    updateBreakingTexture(block, progress) {
        const stage = Math.floor(progress * 9);
        const overlay = block.querySelector('.breaking-overlay') || this.createOverlay(block);
        overlay.className = `breaking-overlay breaking-stage-${stage}`;
    }

    createOverlay(block) {
        const overlay = document.createElement('div');
        overlay.className = 'breaking-overlay';
        block.appendChild(overlay);
        return overlay;
    }

    cancelBreaking(block) {
        const overlay = block.querySelector('.breaking-overlay');
        if (overlay) overlay.remove();
    }

    destroyBlock(block) {
        this.cancelBreaking(block);
        if (block.parentNode) {
            block.parentNode.removeChild(block);
        }
    }
}

export { NoiseGenerator, TextureGenerator, TextureManager, BlockTypeGenerator, ChunkGenerator, BlockSystem };
