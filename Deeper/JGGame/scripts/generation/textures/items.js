/**
 * Item Texture Generation
 * 
 * Procedurally generates textures for weapons, armor, and other items.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = Game.generation.textures || {};

(function() {
    // Generate item texture
    Game.generation.textures.generateItemTexture = function(itemType, quality, seed) {
        const cacheKey = `item_${itemType}_${quality}_${seed}`;
        
        // Check cache first
        const cached = Game.generation.textures.getFromCache(cacheKey);
        if (cached) return cached;
        
        console.log(`Generating ${quality} ${itemType} texture with seed:`, seed);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 128;
        canvas.height = 128;
        const ctx = canvas.getContext('2d');
        
        // Use seed for random generation
        const random = Game.math.createRandom(seed);
        
        // Fill with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw based on item type
        switch(itemType) {
            case 'sword':
                drawSword(ctx, canvas.width, canvas.height, quality, random);
                break;
            case 'shield':
                drawShield(ctx, canvas.width, canvas.height, quality, random);
                break;
            case 'potion':
                drawPotion(ctx, canvas.width, canvas.height, quality, random);
                break;
            case 'armor':
                drawArmor(ctx, canvas.width, canvas.height, quality, random);
                break;
            default:
                drawGenericItem(ctx, canvas.width, canvas.height, quality, random);
        }
        
        // Add glow based on quality
        if (quality === 'rare' || quality === 'epic' || quality === 'legendary') {
            let glowColor;
            switch(quality) {
                case 'rare': glowColor = 'rgba(0, 100, 255, 0.3)'; break;
                case 'epic': glowColor = 'rgba(128, 0, 128, 0.35)'; break;
                case 'legendary': glowColor = 'rgba(255, 128, 0, 0.4)'; break;
            }
            Game.generation.textures.addGlow(ctx, canvas.width, canvas.height, glowColor);
        }
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        Game.generation.textures.addToCache(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Draw a sword item
    function drawSword(ctx, width, height, quality, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Determine colors based on quality
        let bladeColor, hiltColor, gemColor;
        
        switch(quality) {
            case 'common':
                bladeColor = '#cccccc';
                hiltColor = '#8b4513';
                gemColor = '#555555';
                break;
            case 'uncommon':
                bladeColor = '#dddddd';
                hiltColor = '#a05a2c';
                gemColor = '#228b22';
                break;
            case 'rare':
                bladeColor = '#eeeeee';
                hiltColor = '#daa520';
                gemColor = '#4169e1';
                break;
            case 'epic':
                bladeColor = '#ffffff';
                hiltColor = '#b8860b';
                gemColor = '#9932cc';
                break;
            case 'legendary':
                bladeColor = '#ffffcc';
                hiltColor = '#ffd700';
                gemColor = '#ff4500';
                break;
            default:
                bladeColor = '#cccccc';
                hiltColor = '#8b4513';
                gemColor = '#555555';
        }
        
        // Draw blade
        ctx.fillStyle = bladeColor;
        ctx.beginPath();
        ctx.moveTo(centerX, centerY - height * 0.4);  // Tip
        ctx.lineTo(centerX - width * 0.1, centerY);   // Left side middle
        ctx.lineTo(centerX - width * 0.05, centerY + height * 0.05);  // Left guard
        ctx.lineTo(centerX + width * 0.05, centerY + height * 0.05);  // Right guard
        ctx.lineTo(centerX + width * 0.1, centerY);   // Right side middle
        ctx.closePath();
        ctx.fill();
        
        // Add blade details
        if (quality !== 'common') {
            ctx.strokeStyle = '#999999';
            ctx.lineWidth = 1;
            ctx.beginPath();
            ctx.moveTo(centerX, centerY - height * 0.4);  // Start at tip
            ctx.lineTo(centerX, centerY + height * 0.05); // Down to hilt
            ctx.stroke();
        }
        
        // Draw hilt
        ctx.fillStyle = hiltColor;
        ctx.beginPath();
        ctx.rect(centerX - width * 0.05, centerY + height * 0.05, width * 0.1, height * 0.2);
        ctx.fill();
        
        // Draw guard
        ctx.fillStyle = hiltColor;
        ctx.beginPath();
        ctx.rect(centerX - width * 0.15, centerY + height * 0.05, width * 0.3, height * 0.03);
        ctx.fill();
        
        // Draw pommel
        ctx.fillStyle = hiltColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY + height * 0.28, width * 0.06, 0, Math.PI * 2);
        ctx.fill();
        
        // Add a gem based on quality
        if (quality !== 'common') {
            ctx.fillStyle = gemColor;
            ctx.beginPath();
            ctx.arc(centerX, centerY + height * 0.05, width * 0.04, 0, Math.PI * 2);
            ctx.fill();
            
            // Add shine to gem
            ctx.fillStyle = '#ffffff';
            ctx.globalAlpha = 0.7;
            ctx.beginPath();
            ctx.arc(centerX - width * 0.015, centerY + height * 0.04, width * 0.01, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1.0;
        }
    }
    
    // Draw a shield item - implementation would go here
    function drawShield(ctx, width, height, quality, random) {
        // Shield drawing implementation
    }
    
    // Draw a potion item - implementation would go here
    function drawPotion(ctx, width, height, quality, random) {
        // Potion drawing implementation
    }
    
    // Draw armor item - implementation would go here
    function drawArmor(ctx, width, height, quality, random) {
        // Armor drawing implementation
    }
    
    // Draw generic item for types not specifically handled
    function drawGenericItem(ctx, width, height, quality, random) {
        // Generic item implementation
    }
})();
