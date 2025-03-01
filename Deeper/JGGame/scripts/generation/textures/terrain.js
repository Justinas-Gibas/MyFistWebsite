/**
 * Terrain Texture Generation
 * 
 * Generates textures for terrain and environmental elements
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = Game.generation.textures || {};

(function() {
    // Generate terrain texture based on seed
    Game.generation.textures.generateTerrainTexture = function(seed) {
        const cacheKey = `terrain_${seed}`;
        
        // Check cache first
        const cached = Game.generation.textures.getFromCache(cacheKey);
        if (cached) return cached;
        
        console.log('Generating terrain texture with seed:', seed);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 512;
        canvas.height = 512;
        const ctx = canvas.getContext('2d');
        
        // Use seed to generate terrain texture
        const random = Game.math.createRandom(seed);
        
        // Generate base terrain color
        const baseColor = {
            r: 80 + Math.floor(random() * 40),
            g: 100 + Math.floor(random() * 40),
            b: 40 + Math.floor(random() * 40)
        };
        
        // Fill base color
        ctx.fillStyle = `rgb(${baseColor.r}, ${baseColor.g}, ${baseColor.b})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add noise layers
        Game.generation.textures.addNoiseLayer(ctx, canvas.width, canvas.height, baseColor, 0.1, seed);
        Game.generation.textures.addGrainTexture(ctx, canvas.width, canvas.height, 0.05, seed + 1);
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        Game.generation.textures.addToCache(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate rock texture
    Game.generation.textures.generateRockTexture = function(seed) {
        const cacheKey = `rock_${seed}`;
        
        // Check cache first
        const cached = Game.generation.textures.getFromCache(cacheKey);
        if (cached) return cached;
        
        // Create canvas
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Use seed for random generation
        const random = Game.math.createRandom(seed);
        
        // Base rock color
        const grayValue = 100 + Math.floor(random() * 50);
        ctx.fillStyle = `rgb(${grayValue}, ${grayValue}, ${grayValue})`;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Add noise for rock texture
        Game.generation.textures.addNoiseLayer(ctx, canvas.width, canvas.height, {
            r: grayValue,
            g: grayValue,
            b: grayValue
        }, 0.2, seed);
        
        // Add cracks
        drawCracks(ctx, canvas.width, canvas.height, random);
        
        // Convert to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        Game.generation.textures.addToCache(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate grass texture
    Game.generation.textures.generateGrassTexture = function(seed) {
        // Implementation for grass texture
    };
    
    // Generate water texture
    Game.generation.textures.generateWaterTexture = function(seed) {
        // Implementation for water texture
    };
    
    // Draw crack patterns for rocks
    function drawCracks(ctx, width, height, random) {
        ctx.strokeStyle = 'rgba(0, 0, 0, 0.3)';
        ctx.lineWidth = 1;
        
        // Number of cracks
        const crackCount = 3 + Math.floor(random() * 5);
        
        for (let i = 0; i < crackCount; i++) {
            // Start point
            const startX = random() * width;
            const startY = random() * height;
            
            // Draw a crack with branches
            ctx.beginPath();
            ctx.moveTo(startX, startY);
            
            let x = startX;
            let y = startY;
            
            // Main crack
            const segmentCount = 5 + Math.floor(random() * 7);
            for (let j = 0; j < segmentCount; j++) {
                // Random direction and length
                const angle = random() * Math.PI * 2;
                const length = 5 + random() * 15;
                
                x += Math.cos(angle) * length;
                y += Math.sin(angle) * length;
                
                ctx.lineTo(x, y);
                
                // Add branches with chance
                if (random() < 0.3) {
                    const branchAngle = angle + (random() - 0.5) * Math.PI;
                    const branchLength = 3 + random() * 8;
                    
                    const branchX = x + Math.cos(branchAngle) * branchLength;
                    const branchY = y + Math.sin(branchAngle) * branchLength;
                    
                    ctx.moveTo(x, y);
                    ctx.lineTo(branchX, branchY);
                    ctx.moveTo(x, y);
                }
            }
            
            ctx.stroke();
        }
    }
})();
