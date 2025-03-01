/**
 * Texture Generation System
 * 
 * Main entry point for the texture generation system.
 * Imports and coordinates the various texture generators.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = {};

(function() {
    // Initialize texture system
    Game.generation.textures.init = function() {
        console.log('Initializing texture generation system');
        
        // Initialize subsystems
        Game.generation.textures.character.init();
        Game.generation.textures.environment.init();
        Game.generation.textures.item.init();
        Game.generation.textures.effect.init();
        
        return Promise.resolve();
    };
    
    // Re-export generation functions from subsystems
    
    // Character texture generation
    Game.generation.textures.generateNPCTexture = function(type, seed) {
        return Game.generation.textures.character.generateNPCTexture(type, seed);
    };
    
    Game.generation.textures.generateNPCPortrait = function(type, seed) {
        return Game.generation.textures.character.generateNPCPortrait(type, seed);
    };
    
    Game.generation.textures.generateEnemyTexture = function(type, seed) {
        return Game.generation.textures.character.generateEnemyTexture(type, seed);
    };
    
    // Environment texture generation
    Game.generation.textures.generateTerrainTexture = function(seed) {
        return Game.generation.textures.environment.generateTerrainTexture(seed);
    };
    
    Game.generation.textures.generateBuildingTexture = function(type, seed) {
        return Game.generation.textures.environment.generateBuildingTexture(type, seed);
    };
    
    // Item texture generation
    Game.generation.textures.generateItemTexture = function(type, quality, seed) {
        return Game.generation.textures.item.generateItemTexture(type, quality, seed);
    };
    
    Game.generation.textures.generateWeaponTexture = function(type, quality, seed) {
        return Game.generation.textures.item.generateWeaponTexture(type, quality, seed);
    };
    
    // Effect texture generation
    Game.generation.textures.generateEffectTexture = function(type, seed) {
        return Game.generation.textures.effect.generateEffectTexture(type, seed);
    };
})();
