/**
 * Environment Texture Generation
 * 
 * Procedurally generates textures for terrain, buildings, and world objects.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = Game.generation.textures || {};
Game.generation.textures.environment = {};

(function() {
    // Canvas elements used for texture generation
    const envCanvas = document.createElement('canvas');
    const envCtx = envCanvas.getContext('2d');
    
    // Default texture sizes
    const textureSizes = {
        terrain: 256,
        building: 512,
        prop: 128
    };
    
    // Material definitions
    const materials = {
        stone: {
            baseColor: ['#808080', '#707070', '#606060', '#505050'],
            noiseScale: 0.1,
            roughness: 0.8,
            variation: 0.2,
            patterns: ['cracks', 'smooth', 'blocks']
        },
        wood: {
            baseColor: ['#8C5A3C', '#6E4730', '#5A3C23', '#734D26'],
            noiseScale: 0.05,
            roughness: 0.6,
            variation: 0.3,
            patterns: ['planks', 'bark', 'grain']
        },
        brick: {
            baseColor: ['#A65A39', '#8C4D33', '#734029', '#592D1A'],
            noiseScale: 0.05,
            roughness: 0.7,
            variation: 0.1,
            patterns: ['running', 'stacked', 'herringbone']
        },
        metal: {
            baseColor: ['#A0A0A0', '#909090', '#808080', '#707070'],
            noiseScale: 0.02,
            roughness: 0.4,
            variation: 0.1,
            patterns: ['smooth', 'scratched', 'rusted']
        },
        fabric: {
            baseColor: ['#8C7349', '#736041', '#594D33', '#403D26'],
            noiseScale: 0.2,
            roughness: 0.5,
            variation: 0.2,
            patterns: ['woven', 'canvas', 'stitched']
        },
        grass: {
            baseColor: ['#4D8C26', '#3F7A1A', '#336619', '#264D13'],
            noiseScale: 0.1,
            roughness: 0.9,
            variation: 0.3,
            patterns: ['patchy', 'tall', 'mossy']
        },
        dirt: {
            baseColor: ['#8C6E44', '#7A6039', '#664D33', '#4D3D26'],
            noiseScale: 0.15,
            roughness: 0.8,
            variation: 0.25,
            patterns: ['rough', 'packed', 'mixed']
        },
        sand: {
            baseColor: ['#D9C496', '#CCB384', '#BFA373', '#8C7A59'],
            noiseScale: 0.05,
            roughness: 0.7,
            variation: 0.1,
            patterns: ['fine', 'dunes', 'packed']
        }
    };
    
    // Building style definitions
    const buildingStyles = {
        medieval: {
            materials: ['stone', 'wood', 'brick'],
            roofStyles: ['peaked', 'flat', 'curved'],
            windowStyles: ['arch', 'square', 'round'],
            accentMaterials: ['wood', 'metal']
        },
        gothic: {
            materials: ['stone', 'brick'],
            roofStyles: ['peaked', 'spire', 'dome'],
            windowStyles: ['arched', 'rose', 'pointed'],
            accentMaterials: ['metal', 'stone']
        },
        ruins: {
            materials: ['stone', 'brick'],
            roofStyles: ['collapsed', 'partial', 'none'],
            windowStyles: ['broken', 'open', 'overgrown'],
            accentMaterials: ['stone', 'metal']
        },
        hut: {
            materials: ['wood', 'fabric', 'dirt'],
            roofStyles: ['thatched', 'flat', 'tiered'],
            windowStyles: ['square', 'round', 'none'],
            accentMaterials: ['wood', 'fabric']
        }
    };
    
    // Terrain type definitions
    const terrainTypes = {
        grass: {
            baseColors: ['#4D8C26', '#3F7A1A', '#336619', '#264D13'],
            patternScale: 0.1,
            roughness: 0.7,
            details: ['flowers', 'rocks', 'patches']
        },
        forest: {
            baseColors: ['#336619', '#264D13', '#1A3300', '#0D1A00'],
            patternScale: 0.15,
            roughness: 0.8,
            details: ['leaves', 'roots', 'moss']
        },
        mountain: {
            baseColors: ['#8C8C8C', '#737373', '#595959', '#404040'],
            patternScale: 0.05,