/**
 * Biome Generation System
 * 
 * Handles the creation and management of different biomes in the procedural world.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.biomes = {};

(function() {
    // Biome definitions with their properties
    const biomeTypes = {
        forest: {
            name: "Forest",
            description: "Dense woodlands with tall trees and undergrowth.",
            color: "#2a5e23",
            heightInfluence: 0.2,  // How much this biome affects heightmap
            heightOffset: 0.1,     // Base height offset
            noiseScale: 0.1,       // Scale of noise for this biome
            treeDensity: 0.8,      // 0-1, higher means more trees
            resources: [
                { type: "wood", commonality: 0.8, minAmount: 2, maxAmount: 5 },
                { type: "berries", commonality: 0.3, minAmount: 1, maxAmount: 3 },
                { type: "mushroom", commonality: 0.2, minAmount: 1, maxAmount: 2 },
                { type: "stone", commonality: 0.1, minAmount: 1, maxAmount: 2 }
            ],
            enemies: [
                { type: "wolf", weight: 0.5, minLevel: 1, maxLevel: 3 },
                { type: "spider", weight: 0.3, minLevel: 1, maxLevel: 4 },
                { type: "skeleton", weight: 0.2, minLevel: 2, maxLevel: 4 }
            ],
            landmarks: [
                { type: "ruins", chance: 0.05 },
                { type: "cottage", chance: 0.08 },
                { type: "shrine", chance: 0.03 }
            ],
            sounds: ["forest_ambient", "birds_chirping", "leaves_rustling"],
            music: "forest_theme",
            weatherChance: {
                rain: 0.3,
                fog: 0.2,
                clear: 0.5
            }
        },
        plains: {
            name: "Plains",
            description: "Open grasslands with few trees and wide horizons.",
            color: "#8a9a5b",
            heightInfluence: 0.1,
            heightOffset: 0.0,
            noiseScale: 0.05,
            treeDensity: 0.1,
            resources: [
                { type: "grass", commonality: 0.9, minAmount: 2, maxAmount: 5 },