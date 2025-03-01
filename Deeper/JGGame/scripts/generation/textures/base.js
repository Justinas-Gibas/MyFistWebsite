/**
 * Base Texture Generation System
 * 
 * Core functionality for texture generation and caching
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = {};

(function() {
    // Cache for generated textures
    const textureCache = new Map();
    
    // Initialize texture generator
    Game.generation.textures.init = function() {
        console.log('Initializing texture generation system');
        return Promise.resolve();
    };
    
    // Clear texture cache to free memory
    Game.generation.textures.clearCache = function() {
        textureCache.clear();
        console.log('Texture cache cleared');
    };
    
    // Get a cached texture or null if not found
    Game.generation.textures.getFromCache = function(cacheKey) {
        return textureCache.has(cacheKey) ? textureCache.get(cacheKey) : null;
    };
    
    // Add a texture to the cache
    Game.generation.textures.addToCache = function(cacheKey, dataUrl) {
        textureCache.set(cacheKey, dataUrl);
    };
    
    // Helper function to add noise layer to texture
    Game.generation.textures.addNoiseLayer = function(ctx, width, height, baseColor, intensity, seed) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const random = Game.math.createRandom(seed);
        
        for (let i = 0; i < data.length; i += 4) {
            const noise = (random() * 2 - 1) * intensity * 255;
            
            data[i] = Math.max(0, Math.min(255, data[i] + noise));
            data[i + 1] = Math.max(0, Math.min(255, data[i + 1] + noise));
            data[i + 2] = Math.max(0, Math.min(255, data[i + 2] + noise));
        }
        
        ctx.putImageData(imageData, 0, 0);
    };
    
    // Add grain texture for details
    Game.generation.textures.addGrainTexture = function(ctx, width, height, amount, seed) {
        const imageData = ctx.getImageData(0, 0, width, height);
        const data = imageData.data;
        const random = Game.math.createRandom(seed);
        
        for (let i = 0; i < data.length; i += 4) {
            if (random() < amount) {
                const value = random() * 255;
                data[i] = value;
                data[i + 1] = value;
                data[i + 2] = value;
            }
        }
        
        ctx.putImageData(imageData, 0, 0);
    };
    
    // Add vignette effect to images
    Game.generation.textures.addVignette = function(ctx, width, height, darkness = 0.5) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width * 0.7
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${darkness})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    };
    
    // Add glow effect to items
    Game.generation.textures.addGlow = function(ctx, width, height, color) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, width * 0.1,
            width / 2, height / 2, width * 0.7
        );
        
        gradient.addColorStop(0, color);
        gradient.addColorStop(1, 'rgba(0, 0, 0, 0)');
        
        ctx.globalCompositeOperation = 'overlay';
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
        ctx.globalCompositeOperation = 'source-over';
    };
})();
