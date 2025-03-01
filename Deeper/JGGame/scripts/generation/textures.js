/**
 * Procedural Texture Generation
 * decided to seperate into seperate files
 * Generates textures for terrain, characters, items, and other elements.
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
    
    // Generate terrain texture based on seed
    Game.generation.textures.generateTerrainTexture = function(seed) {
        const cacheKey = `terrain_${seed}`;
        
        // Check cache first
        if (textureCache.has(cacheKey)) {
            return textureCache.get(cacheKey);
        }
        
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
        addNoiseLayer(ctx, canvas.width, canvas.height, baseColor, 0.1, seed);
        addGrainTexture(ctx, canvas.width, canvas.height, 0.05, seed + 1);
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        textureCache.set(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate NPC portrait
    Game.generation.textures.generateNPCPortrait = function(npcType, seed) {
        const cacheKey = `npc_${npcType}_${seed}`;
        
        // Check cache first
        if (textureCache.has(cacheKey)) {
            return textureCache.get(cacheKey);
        }
        
        console.log(`Generating ${npcType} portrait with seed:`, seed);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Use seed for random generation
        const random = Game.math.createRandom(seed);
        
        // Background color based on NPC type
        let bgColor;
        switch(npcType) {
            case 'merchant':
                bgColor = `rgb(150, 120, 80)`;
                break;
            case 'warrior':
                bgColor = `rgb(120, 60, 40)`;
                break;
            case 'mage':
                bgColor = `rgb(80, 80, 160)`;
                break;
            case 'villager':
                bgColor = `rgb(140, 140, 100)`;
                break;
            default:
                bgColor = `rgb(100, 100, 100)`;
        }
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate face
        drawFace(ctx, canvas.width, canvas.height, npcType, random);
        
        // Add a vignette effect for style
        addVignette(ctx, canvas.width, canvas.height, 0.8);
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        textureCache.set(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate item texture
    Game.generation.textures.generateItemTexture = function(itemType, quality, seed) {
        const cacheKey = `item_${itemType}_${quality}_${seed}`;
        
        // Check cache first
        if (textureCache.has(cacheKey)) {
            return textureCache.get(cacheKey);
        }
        
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
            addGlow(ctx, canvas.width, canvas.height, glowColor);
        }
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        textureCache.set(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate enemy sprite texture
    Game.generation.textures.generateEnemyTexture = function(enemyType, seed) {
        const cacheKey = `enemy_${enemyType}_${seed}`;
        
        // Check cache first
        if (textureCache.has(cacheKey)) {
            return textureCache.get(cacheKey);
        }
        
        console.log(`Generating ${enemyType} sprite with seed:`, seed);
        
        // Create canvas element
        const canvas = document.createElement('canvas');
        canvas.width = 256;
        canvas.height = 256;
        const ctx = canvas.getContext('2d');
        
        // Use seed for random generation
        const random = Game.math.createRandom(seed);
        
        // Fill with transparent background
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        
        // Draw based on enemy type
        switch(enemyType) {
            case 'skeleton':
                drawSkeleton(ctx, canvas.width, canvas.height, random);
                break;
            case 'zombie':
                drawZombie(ctx, canvas.width, canvas.height, random);
                break;
            case 'demon':
                drawDemon(ctx, canvas.width, canvas.height, random);
                break;
            case 'spider':
                drawSpider(ctx, canvas.width, canvas.height, random);
                break;
            default:
                drawGenericEnemy(ctx, canvas.width, canvas.height, random);
        }
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        textureCache.set(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Clear texture cache to free memory
    Game.generation.textures.clearCache = function() {
        textureCache.clear();
        console.log('Texture cache cleared');
    };
    
    // Helper function to add noise layer to texture
    function addNoiseLayer(ctx, width, height, baseColor, intensity, seed) {
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
    }
    
    // Add grain texture for details
    function addGrainTexture(ctx, width, height, amount, seed) {
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
    }
    
    // Add vignette effect to images
    function addVignette(ctx, width, height, darkness = 0.5) {
        const gradient = ctx.createRadialGradient(
            width / 2, height / 2, 0,
            width / 2, height / 2, width * 0.7
        );
        
        gradient.addColorStop(0, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(0.85, 'rgba(0, 0, 0, 0)');
        gradient.addColorStop(1, `rgba(0, 0, 0, ${darkness})`);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, width, height);
    }
    
    // Add glow effect to items
    function addGlow(ctx, width, height, color) {
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
    }
    
    // Draw a face for NPC portraits
    function drawFace(ctx, width, height, npcType, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Face shape
        ctx.fillStyle = `rgb(${180 + random() * 60}, ${140 + random() * 60}, ${100 + random() * 60})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width * 0.4, height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Determine eye color based on NPC type
        let eyeColor;
        switch(npcType) {
            case 'merchant': eyeColor = 'rgb(100, 80, 40)'; break;
            case 'warrior': eyeColor = 'rgb(40, 60, 100)'; break;
            case 'mage': eyeColor = 'rgb(180, 100, 200)'; break;
            default: eyeColor = 'rgb(60, 40, 20)';
        }
        
        // Eyes
        const eyeOffsetX = width * 0.12;
        const eyeY = centerY - height * 0.05;
        const eyeSize = width * 0.08;
        
        // Left eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(centerX - eyeOffsetX, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Left iris
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(centerX - eyeOffsetX, eyeY, eyeSize * 0.5, eyeSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Left pupil
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(centerX - eyeOffsetX, eyeY, eyeSize * 0.2, eyeSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.ellipse(centerX + eyeOffsetX, eyeY, eyeSize, eyeSize * 0.6, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right iris
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.ellipse(centerX + eyeOffsetX, eyeY, eyeSize * 0.5, eyeSize * 0.5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Right pupil
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(centerX + eyeOffsetX, eyeY, eyeSize * 0.2, eyeSize * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose
        const noseY = centerY + height * 0.05;
        ctx.fillStyle = `rgb(${160 + random() * 40}, ${120 + random() * 40}, ${80 + random() * 40})`;
        ctx.beginPath();
        ctx.moveTo(centerX, noseY - 10);
        ctx.lineTo(centerX - 7, noseY + 10);
        ctx.lineTo(centerX + 7, noseY + 10);
        ctx.fill();
        
        // Mouth
        const mouthY = centerY + height * 0.2;
        ctx.strokeStyle = `rgb(120, 40, 40)`;
        ctx.lineWidth = 2;
        ctx.beginPath();
        
        // Different mouth expressions based on NPC type
        switch(npcType) {
            case 'merchant':
                // Slight smile
                ctx.beginPath();
                ctx.arc(centerX, mouthY - 15, 30, 0.1 * Math.PI, 0.9 * Math.PI);
                ctx.stroke();
                break;
            case 'warrior':
                // Stern line
                ctx.beginPath();
                ctx.moveTo(centerX - 20, mouthY);
                ctx.lineTo(centerX + 20, mouthY);
                ctx.stroke();
                break;
            case 'mage':
                // Mysterious slight frown
                ctx.beginPath();
                ctx.arc(centerX, mouthY + 30, 30, 1.1 * Math.PI, 1.9 * Math.PI);
                ctx.stroke();
                break;
            default:
                // Neutral expression
                ctx.beginPath();
                ctx.moveTo(centerX - 15, mouthY);
                ctx.quadraticCurveTo(centerX, mouthY + (random() > 0.5 ? 5 : -5), centerX + 15, mouthY);
                ctx.stroke();
        }
        
        // Hair
        const hairColor = [
            `rgb(30, 30, 30)`,      // Black
            `rgb(95, 65, 45)`,      // Dark brown
            `rgb(150, 113, 60)`,    // Brown
            `rgb(180, 150, 100)`,   // Blonde
            `rgb(150, 70, 70)`,     // Reddish
            `rgb(160, 160, 160)`    // Gray
        ];
        
        const hairColorIndex = Math.floor(random() * hairColor.length);
        ctx.fillStyle = hairColor[hairColorIndex];
        
        // Different hairstyles based on randomization
        const hairstyle = Math.floor(random() * 4);
        
        switch(hairstyle) {
            case 0: // Short cropped
                ctx.beginPath();
                ctx.arc(centerX, centerY - height * 0.25, width * 0.4, 0, Math.PI, true);
                ctx.fill();
                break;
            case 1: // Medium length
                ctx.beginPath();
                ctx.ellipse(centerX, centerY - height * 0.22, width * 0.42, height * 0.25, 0, 0, Math.PI, true);
                ctx.fill();
                
                // Side locks
                ctx.beginPath();
                ctx.ellipse(centerX - width * 0.35, centerY, width * 0.1, height * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
                
                ctx.beginPath();
                ctx.ellipse(centerX + width * 0.35, centerY, width * 0.1, height * 0.25, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 2: // Long hair
                ctx.beginPath();
                ctx.arc(centerX, centerY - height * 0.25, width * 0.4, 0, Math.PI, true);
                ctx.rect(centerX - width * 0.4, centerY - height * 0.25, width * 0.8, height * 0.6);
                ctx.fill();
                break;
            case 3: // Bald or very short
                ctx.beginPath();
                ctx.arc(centerX, centerY - height * 0.15, width * 0.38, 0, Math.PI, true);
                ctx.fill();
                break;
        }
        
        // Facial features specific to NPC type
        switch(npcType) {
            case 'merchant':
                // Add hat or head accessory
                ctx.fillStyle = `rgb(120, 80, 40)`;
                ctx.beginPath();
                ctx.ellipse(centerX, centerY - height * 0.3, width * 0.35, height * 0.1, 0, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'warrior':
                // Add scars
                ctx.strokeStyle = `rgb(180, 130, 130)`;
                ctx.lineWidth = 2;
                ctx.beginPath();
                ctx.moveTo(centerX - width * 0.15, centerY - height * 0.15);
                ctx.lineTo(centerX - width * 0.05, centerY - height * 0.05);
                ctx.stroke();
                break;
            case 'mage':
                // Add a magical glow effect
                const gradient = ctx.createRadialGradient(
                    centerX, centerY, 0,
                    centerX, centerY, width * 0.6
                );
                gradient.addColorStop(0, 'rgba(150, 100, 200, 0.2)');
                gradient.addColorStop(1, 'rgba(150, 100, 200, 0)');
                
                ctx.fillStyle = gradient;
                ctx.fillRect(0, 0, width, height);
                break;
        }
    }
    
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
        
        // Add glow effect for higher quality items
        if (quality === 'epic' || quality === 'legendary') {
            const glow = ctx.createRadialGradient(
                centerX, centerY, 0,
                centerX, centerY, width * 0.4
            );
            
            let glowColor;
            if (quality === 'epic') glowColor = 'rgba(148, 0, 211, 0.3)';
            if (quality === 'legendary') glowColor = 'rgba(255, 69, 0, 0.3)';
            
            glow.addColorStop(0, glowColor);
            glow.addColorStop(1, 'rgba(0, 0, 0, 0)');
            
            ctx.fillStyle = glow;
            ctx.fillRect(0, 0, width, height);
        }
    }
    
    // Draw a shield item
    function drawShield(ctx, width, height, quality, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Determine colors based on quality
        let shieldColor, borderColor, emblemColor;
        
        switch(quality) {
            case 'common':
                shieldColor = '#8b8878';
                borderColor = '#696969';
                emblemColor = '#a52a2a';
                break;
            case 'uncommon':
                shieldColor = '#a0a0a0';
                borderColor = '#808080';
                emblemColor = '#228b22';
                break;
            case 'rare':
                shieldColor = '#c0c0c0';
                borderColor = '#4682b4';
                emblemColor = '#4169e1';
                break;
            case 'epic':
                shieldColor = '#dcdcdc';
                borderColor = '#9932cc';
                emblemColor = '#9370db';
                break;
            case 'legendary':
                shieldColor = '#fafad2';
                borderColor = '#daa520';
                emblemColor = '#cd5c5c';
                break;
            default:
                shieldColor = '#8b8878';
                borderColor = '#696969';
                emblemColor = '#a52a2a';
        }
        
        // Draw main shield shape
        ctx.fillStyle = shieldColor;
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.25, centerY - height * 0.3); // Top left
        ctx.lineTo(centerX + width * 0.25, centerY - height * 0.3); // Top right
        ctx.lineTo(centerX + width * 0.3, centerY); // Middle right
        ctx.lineTo(centerX, centerY + height * 0.35); // Bottom
        ctx.lineTo(centerX - width * 0.3, centerY); // Middle left
        ctx.closePath();
        ctx.fill();
        
        // Add border
        ctx.strokeStyle = borderColor;
        ctx.lineWidth = width * 0.03;
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.25, centerY - height * 0.3); // Top left
        ctx.lineTo(centerX + width * 0.25, centerY - height * 0.3); // Top right
        ctx.lineTo(centerX + width * 0.3, centerY); // Middle right
        ctx.lineTo(centerX, centerY + height * 0.35); // Bottom
        ctx.lineTo(centerX - width * 0.3, centerY); // Middle left
        ctx.closePath();
        ctx.stroke();
        
        // Add emblem based on quality
        ctx.fillStyle = emblemColor;
        
        switch(quality) {
            case 'common':
                // Simple circle emblem
                ctx.beginPath();
                ctx.arc(centerX, centerY, width * 0.12, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'uncommon':
                // Diagonal cross
                ctx.lineWidth = width * 0.04;
                ctx.strokeStyle = emblemColor;
                ctx.beginPath();
                ctx.moveTo(centerX - width * 0.15, centerY - height * 0.15);
                ctx.lineTo(centerX + width * 0.15, centerY + height * 0.15);
                ctx.stroke();
                ctx.beginPath();
                ctx.moveTo(centerX + width * 0.15, centerY - height * 0.15);
                ctx.lineTo(centerX - width * 0.15, centerY + height * 0.15);
                ctx.stroke();
                break;
            case 'rare':
                // Dragon emblem (simplified)
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - height * 0.15);
                ctx.lineTo(centerX - width * 0.15, centerY);
                ctx.lineTo(centerX, centerY + height * 0.15);
                ctx.lineTo(centerX + width * 0.15, centerY);
                ctx.closePath();
                ctx.fill();
                break;
            case 'epic':
                // Star emblem
                const starPoints = 5;
                const outerRadius = width * 0.15;
                const innerRadius = width * 0.07;
                
                ctx.beginPath();
                for (let i = 0; i < starPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI * i) / starPoints;
                    const x = centerX + radius * Math.sin(angle);
                    const y = centerY + radius * Math.cos(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
                
            case 'legendary':
                // Crown emblem
                ctx.beginPath();
                
                // Base of crown
                ctx.rect(centerX - width * 0.15, centerY + height * 0.05, width * 0.3, height * 0.05);
                
                // Crown points
                const pointCount = 3;
                const crownWidth = width * 0.3;
                const crownHeight = height * 0.15;
                const pointWidth = crownWidth / (pointCount * 2 - 1);
                
                ctx.moveTo(centerX - width * 0.15, centerY + height * 0.05);
                
                for (let i = 0; i < pointCount; i++) {
                    const pointX = centerX - width * 0.15 + i * 2 * pointWidth;
                    
                    // Up to point
                    ctx.lineTo(pointX, centerY - height * 0.1);
                    
                    // Down to valley (if not last point)
                    if (i < pointCount - 1) {
                        ctx.lineTo(pointX + pointWidth, centerY);
                    }
                }
                
                ctx.lineTo(centerX + width * 0.15, centerY + height * 0.05);
                
                ctx.fill();
                
                // Add gems to crown
                for (let i = 0; i < pointCount; i++) {
                    const gemX = centerX - width * 0.15 + i * 2 * pointWidth;
                    ctx.fillStyle = `hsl(${(i * 120) % 360}, 80%, 60%)`;
                    ctx.beginPath();
                    ctx.arc(gemX, centerY - height * 0.05, width * 0.03, 0, Math.PI * 2);
                    ctx.fill();
                }
                
                break;
        }
    }
    
    // Draw a potion item
    function drawPotion(ctx, width, height, quality, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Determine potion colors based on quality
        let liquidColor, bottleColor, glowColor;
        
        switch(quality) {
            case 'common':
                liquidColor = '#ff0000'; // Health potion (red)
                bottleColor = '#d7d7d7';
                glowColor = 'rgba(255, 0, 0, 0.1)';
                break;
            case 'uncommon':
                liquidColor = '#0000ff'; // Mana potion (blue)
                bottleColor = '#d7d7d7';
                glowColor = 'rgba(0, 0, 255, 0.15)';
                break;
            case 'rare':
                liquidColor = '#9400d3'; // Energy potion (purple)
                bottleColor = '#e0e0e0';
                glowColor = 'rgba(148, 0, 211, 0.2)';
                break;
            case 'epic':
                liquidColor = '#00ffff'; // Rejuvenation potion (cyan)
                bottleColor = '#f0f0f0';
                glowColor = 'rgba(0, 255, 255, 0.25)';
                break;
            case 'legendary':
                liquidColor = '#ffd700'; // Legendary potion (gold)
                bottleColor = '#f8f8f8';
                glowColor = 'rgba(255, 215, 0, 0.3)';
                break;
            default:
                liquidColor = '#ff0000';
                bottleColor = '#d7d7d7';
                glowColor = 'rgba(255, 0, 0, 0.1)';
        }
        
        // Draw bottle outline
        ctx.fillStyle = bottleColor;
        
        // Bottle bottom (round)
        const bottleWidth = width * 0.5;
        const bottleHeight = height * 0.6;
        const neckWidth = width * 0.2;
        const neckHeight = height * 0.2;
        const capHeight = height * 0.1;
        
        // Draw bottle body (rounded rectangle)
        ctx.beginPath();
        ctx.moveTo(centerX - bottleWidth/2, centerY);
        ctx.lineTo(centerX - bottleWidth/2, centerY + bottleHeight/2);
        ctx.quadraticCurveTo(centerX, centerY + bottleHeight/2 + height * 0.1, centerX + bottleWidth/2, centerY + bottleHeight/2);
        ctx.lineTo(centerX + bottleWidth/2, centerY);
        ctx.fill();
        
        // Draw bottle neck
        ctx.beginPath();
        ctx.rect(centerX - neckWidth/2, centerY - neckHeight, neckWidth, neckHeight);
        ctx.fill();
        
        // Draw bottle cap
        ctx.beginPath();
        ctx.rect(centerX - neckWidth*0.7, centerY - neckHeight - capHeight, neckWidth*1.4, capHeight);
        ctx.fill();
        
        // Draw liquid inside bottle
        ctx.fillStyle = liquidColor;
        
        // Fill level depends on quality (higher quality = more full)
        const fillLevel = 0.5 + (quality === 'common' ? 0 : 
                        quality === 'uncommon' ? 0.1 : 
                        quality === 'rare' ? 0.2 : 
                        quality === 'epic' ? 0.25 : 0.3);
        
        // Draw liquid (shaped to the bottom of the bottle)
        ctx.beginPath();
        ctx.moveTo(centerX - bottleWidth/2 + 2, centerY + bottleHeight/2 * fillLevel);
        ctx.lineTo(centerX - bottleWidth/2 + 2, centerY + bottleHeight/2 - 2);
        ctx.quadraticCurveTo(centerX, centerY + bottleHeight/2 + height * 0.1 - 2, centerX + bottleWidth/2 - 2, centerY + bottleHeight/2 - 2);
        ctx.lineTo(centerX + bottleWidth/2 - 2, centerY + bottleHeight/2 * fillLevel);
        ctx.quadraticCurveTo(centerX, centerY + bottleHeight/2 * fillLevel + 5, centerX - bottleWidth/2 + 2, centerY + bottleHeight/2 * fillLevel);
        ctx.fill();
        
        // Add highlights/reflections
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.ellipse(centerX - bottleWidth*0.15, centerY + bottleHeight*0.2, bottleWidth*0.1, bottleHeight*0.2, Math.PI/4, 0, Math.PI*2);
        ctx.fill();
        
        // Add glow effect for higher quality potions
        if (quality !== 'common') {
            ctx.fillStyle = glowColor;
            ctx.beginPath();
            ctx.rect(0, 0, width, height);
            ctx.fill();
        }
        
        // Add bubbles for animated feel (static in this case)
        if (quality !== 'common') {
            ctx.fillStyle = 'rgba(255, 255, 255, 0.6)';
            
            // Number of bubbles based on quality
            const bubbleCount = quality === 'uncommon' ? 2 : 
                               quality === 'rare' ? 3 : 
                               quality === 'epic' ? 4 : 5;
            
            for (let i = 0; i < bubbleCount; i++) {
                const bubbleSize = 2 + random() * 3;
                const bubbleX = centerX - bottleWidth/4 + random() * bottleWidth/2;
                const bubbleY = centerY + bottleHeight/4 + random() * bottleHeight/4;
                
                ctx.beginPath();
                ctx.arc(bubbleX, bubbleY, bubbleSize, 0, Math.PI * 2);
                ctx.fill();
            }
        }
    }
    
    // Draw armor item
    function drawArmor(ctx, width, height, quality, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Determine colors based on quality
        let mainColor, trimColor, detailColor;
        
        switch(quality) {
            case 'common':
                mainColor = '#8B8878'; // Leather brown
                trimColor = '#696969'; // Dark gray
                detailColor = '#A0522D'; // Brown
                break;
            case 'uncommon':
                mainColor = '#B8B8B8'; // Light metal
                trimColor = '#4F4F4F'; // Medium gray
                detailColor = '#228B22'; // Green
                break;
            case 'rare':
                mainColor = '#C0C0C0'; // Silver
                trimColor = '#4682B4'; // Steel blue
                detailColor = '#1E90FF'; // Blue
                break;
            case 'epic':
                mainColor = '#E6E6FA'; // Light purple
                trimColor = '#9932CC'; // Purple
                detailColor = '#800080'; // Deep purple
                break;
            case 'legendary':
                mainColor = '#FFD700'; // Gold
                trimColor = '#B8860B'; // Dark gold
                detailColor = '#FF4500'; // Orange-red
                break;
            default:
                mainColor = '#8B8878';
                trimColor = '#696969';
                detailColor = '#A0522D';
        }
        
        // Draw chest plate (main body)
        ctx.fillStyle = mainColor;
        
        // Chest
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.25, centerY + height * 0.25);
        ctx.lineTo(centerX - width * 0.25, centerY + height * 0.25);
        ctx.closePath();
        ctx.fill();
        
        // Shoulders
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX - width * 0.4, centerY - height * 0.17);
        ctx.lineTo(centerX - width * 0.35, centerY);
        ctx.lineTo(centerX - width * 0.25, centerY);
        ctx.closePath();
        ctx.fill();
        
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.4, centerY - height * 0.17);
        ctx.lineTo(centerX + width * 0.35, centerY);
        ctx.lineTo(centerX + width * 0.25, centerY);
        ctx.closePath();
        ctx.fill();
        
        // Add trim/border
        ctx.strokeStyle = trimColor;
        ctx.lineWidth = 2;
        
        // Chest trim
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.25, centerY + height * 0.25);
        ctx.lineTo(centerX - width * 0.25, centerY + height * 0.25);
        ctx.closePath();
        ctx.stroke();
        
        // Shoulder trim
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX - width * 0.4, centerY - height * 0.17);
        ctx.lineTo(centerX - width * 0.35, centerY);
        ctx.lineTo(centerX - width * 0.25, centerY);
        ctx.stroke();
        
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.3, centerY - height * 0.2);
        ctx.lineTo(centerX + width * 0.4, centerY - height * 0.17);
        ctx.lineTo(centerX + width * 0.35, centerY);
        ctx.lineTo(centerX + width * 0.25, centerY);
        ctx.stroke();
        
        // Add chest emblem/detail
        ctx.fillStyle = detailColor;
        
        // Basic design that varies with quality
        switch(quality) {
            case 'common':
                // Simple vertical line
                ctx.beginPath();
                ctx.rect(centerX - width * 0.01, centerY - height * 0.15, width * 0.02, height * 0.3);
                ctx.fill();
                break;
            case 'uncommon':
                // Plus symbol
                ctx.beginPath();
                ctx.rect(centerX - width * 0.01, centerY - height * 0.15, width * 0.02, height * 0.3);
                ctx.rect(centerX - width * 0.15, centerY - height * 0.01, width * 0.3, height * 0.02);
                ctx.fill();
                break;
            case 'rare':
                // Diamond shape
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - height * 0.15);
                ctx.lineTo(centerX + width * 0.15, centerY);
                ctx.lineTo(centerX, centerY + height * 0.15);
                ctx.lineTo(centerX - width * 0.15, centerY);
                ctx.closePath();
                ctx.fill();
                break;
            case 'epic':
                // Circle with rays
                ctx.beginPath();
                ctx.arc(centerX, centerY, width * 0.1, 0, Math.PI * 2);
                ctx.fill();
                
                // Add rays
                ctx.lineWidth = 3;
                for (let i = 0; i < 8; i++) {
                    const angle = i * Math.PI / 4;
                    ctx.beginPath();
                    ctx.moveTo(
                        centerX + Math.cos(angle) * width * 0.12,
                        centerY + Math.sin(angle) * width * 0.12
                    );
                    ctx.lineTo(
                        centerX + Math.cos(angle) * width * 0.18,
                        centerY + Math.sin(angle) * width * 0.18
                    );
                    ctx.stroke();
                }
                break;
            case 'legendary':
                // Complex emblem (simplified dragon or beast)
                ctx.beginPath();
                // Head
                ctx.moveTo(centerX, centerY - height * 0.15);
                // Body
                ctx.bezierCurveTo(
                    centerX + width * 0.1, centerY - height * 0.05,
                    centerX + width * 0.1, centerY + height * 0.05,
                    centerX, centerY + height * 0.15
                );
                // Other side of body
                ctx.bezierCurveTo(
                    centerX - width * 0.1, centerY + height * 0.05,
                    centerX - width * 0.1, centerY - height * 0.05,
                    centerX, centerY - height * 0.15
                );
                ctx.fill();
                
                // Add eyes
                ctx.fillStyle = '#FFFFFF';
                ctx.beginPath();
                ctx.arc(centerX - width * 0.03, centerY - height * 0.07, width * 0.02, 0, Math.PI * 2);
                ctx.arc(centerX + width * 0.03, centerY - height * 0.07, width * 0.02, 0, Math.PI * 2);
                ctx.fill();
                break;
        }
        
        // Add highlight for higher quality items
        if (quality !== 'common') {
            const highlight = ctx.createLinearGradient(
                centerX - width * 0.2, centerY - height * 0.2,
                centerX + width * 0.2, centerY + height * 0.2
            );
            
            highlight.addColorStop(0, 'rgba(255, 255, 255, 0.1)');
            highlight.addColorStop(0.5, 'rgba(255, 255, 255, 0.3)');
            highlight.addColorStop(1, 'rgba(255, 255, 255, 0.1)');
            
            ctx.fillStyle = highlight;
            
            // Overlay highlight on armor
            ctx.globalCompositeOperation = 'overlay';
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.3, centerY - height * 0.2);
            ctx.lineTo(centerX + width * 0.3, centerY - height * 0.2);
            ctx.lineTo(centerX + width * 0.25, centerY + height * 0.25);
            ctx.lineTo(centerX - width * 0.25, centerY + height * 0.25);
            ctx.closePath();
            ctx.fill();
            
            ctx.globalCompositeOperation = 'source-over';
        }
    }
    
    // Draw generic item for types not specifically handled
    function drawGenericItem(ctx, width, height, quality, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Determine colors based on quality
        let mainColor, accentColor;
        
        switch(quality) {
            case 'common':
                mainColor = '#A9A9A9'; // Dark gray
                accentColor = '#696969'; // Darker gray
                break;
            case 'uncommon':
                mainColor = '#90EE90'; // Light green
                accentColor = '#2E8B57'; // Sea green
                break;
            case 'rare':
                mainColor = '#ADD8E6'; // Light blue
                accentColor = '#4682B4'; // Steel blue
                break;
            case 'epic':
                mainColor = '#DDA0DD'; // Plum
                accentColor = '#9932CC'; // Dark orchid
                break;
            case 'legendary':
                mainColor = '#FFD700'; // Gold
                accentColor = '#B8860B'; // Dark golden rod
                break;
            default:
                mainColor = '#A9A9A9';
                accentColor = '#696969';
        }
        
        // Draw a generic object (circular with accent)
        ctx.fillStyle = mainColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Add accent
        ctx.fillStyle = accentColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.2, 0, Math.PI * 2);
        ctx.fill();
        
        // Add symbol in the middle based on quality
        ctx.fillStyle = '#FFFFFF';
        
        switch(quality) {
            case 'common':
                // Dot
                ctx.beginPath();
                ctx.arc(centerX, centerY, width * 0.05, 0, Math.PI * 2);
                ctx.fill();
                break;
            case 'uncommon':
                // Plus
                ctx.beginPath();
                ctx.rect(centerX - width * 0.15, centerY - width * 0.025, width * 0.3, width * 0.05);
                ctx.rect(centerX - width * 0.025, centerY - width * 0.15, width * 0.05, width * 0.3);
                ctx.fill();
                break;
            case 'rare':
                // Triangle
                ctx.beginPath();
                ctx.moveTo(centerX, centerY - width * 0.12);
                ctx.lineTo(centerX - width * 0.1, centerY + width * 0.12);
                ctx.lineTo(centerX + width * 0.1, centerY + width * 0.12);
                ctx.closePath();
                ctx.fill();
                break;
            case 'epic':
                // Square with rotation
                ctx.save();
                ctx.translate(centerX, centerY);
                ctx.rotate(Math.PI / 4);
                ctx.fillRect(-width * 0.07, -width * 0.07, width * 0.14, width * 0.14);
                ctx.restore();
                break;
            case 'legendary':
                // Star
                const starPoints = 5;
                const outerRadius = width * 0.1;
                const innerRadius = width * 0.05;
                
                ctx.beginPath();
                for (let i = 0; i < starPoints * 2; i++) {
                    const radius = i % 2 === 0 ? outerRadius : innerRadius;
                    const angle = (Math.PI / 2) + (Math.PI * i) / starPoints;
                    const x = centerX + radius * Math.sin(angle);
                    const y = centerY + radius * Math.cos(angle);
                    
                    if (i === 0) {
                        ctx.moveTo(x, y);
                    } else {
                        ctx.lineTo(x, y);
                    }
                }
                ctx.closePath();
                ctx.fill();
                break;
        }
    }
    
    // Draw a skeleton enemy
    function drawSkeleton(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base colors
        const boneColor = '#E0E0E0';
        const shadowColor = '#AAAAAA';
        const eyeColor = '#53A653'; // Glowing green
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw skull
        ctx.fillStyle = boneColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.25, width * 0.15, 0, Math.PI * 2);
        ctx.fill();
        
        // Jaw
        ctx.beginPath();
        ctx.ellipse(centerX, centerY - height * 0.15, width * 0.12, height * 0.05, 0, 0, Math.PI);
        ctx.fill();
        
        // Eyes
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.ellipse(centerX - width * 0.06, centerY - height * 0.26, width * 0.03, height * 0.04, 0, 0, Math.PI * 2);
        ctx.ellipse(centerX + width * 0.06, centerY - height * 0.26, width * 0.03, height * 0.04, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Glowing eye effect
        ctx.fillStyle = eyeColor;
        ctx.beginPath();
        ctx.arc(centerX - width * 0.06, centerY - height * 0.26, width * 0.015, 0, Math.PI * 2);
        ctx.arc(centerX + width * 0.06, centerY - height * 0.26, width * 0.015, 0, Math.PI * 2);
        ctx.fill();
        
        // Nose hole
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.21, width * 0.02, 0, Math.PI * 2);
        ctx.fill();
        
        // Torso (ribcage)
        ctx.fillStyle = boneColor;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY + height * 0.05, width * 0.16, height * 0.2, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Ribs
        ctx.strokeStyle = shadowColor;
        ctx.lineWidth = 2;
        for (let i = -3; i <= 3; i++) {
            const y = centerY + height * 0.05 + (i * height * 0.05);
            ctx.beginPath();
            ctx.moveTo(centerX - width * 0.15, y);
            ctx.lineTo(centerX + width * 0.15, y);
            ctx.stroke();
        }
        
        // Arms
        ctx.fillStyle = boneColor;
        
        // Left arm
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.16, centerY - height * 0.05);
        ctx.lineTo(centerX - width * 0.25, centerY + height * 0.2);
        ctx.lineTo(centerX - width * 0.28, centerY + height * 0.18);
        ctx.lineTo(centerX - width * 0.19, centerY - height * 0.07);
        ctx.closePath();
        ctx.fill();
        
        // Right arm
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.16, centerY - height * 0.05);
        ctx.lineTo(centerX + width * 0.25, centerY + height * 0.2);
        ctx.lineTo(centerX + width * 0.28, centerY + height * 0.18);
        ctx.lineTo(centerX + width * 0.19, centerY - height * 0.07);
        ctx.closePath();
        ctx.fill();
        
        // Add weapon (sword)
        ctx.fillStyle = '#AAA';
        ctx.beginPath();
        ctx.rect(centerX + width * 0.25, centerY + height * 0.15, width * 0.03, height * 0.25);
        ctx.fill();
        
        ctx.fillStyle = '#CCC';
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.24, centerY + height * 0.15);
        ctx.lineTo(centerX + width * 0.29, centerY + height * 0.15);
        ctx.lineTo(centerX + width * 0.265, centerY);
        ctx.closePath();
        ctx.fill();
    }
    
    // Draw a zombie enemy
    function drawZombie(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base colors
        const skinColor = `rgb(${100 + random() * 30}, ${130 + random() * 30}, ${90 + random() * 20})`;
        const darkSkinColor = `rgb(${70 + random() * 20}, ${100 + random() * 20}, ${60 + random() * 20})`;
        const clothingColor = `rgb(${50 + random() * 20}, ${40 + random() * 20}, ${30 + random() * 20})`;
        
        // Clear canvas
        ctx.clearRect(0, 0, width, height);
        
        // Draw head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.25, width * 0.13, 0, Math.PI * 2);
        ctx.fill();
        
        // Hair (patchy)
        ctx.fillStyle = '#333333';
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.3, width * 0.13, 0, Math.PI, true);
        ctx.fill();
        
        // Random bald spots in hair
        ctx.fillStyle = skinColor;
        for (let i = 0; i < 3; i++) {
            const spotX = centerX - width * 0.1 + random() * width * 0.2;
            const spotY = centerY - height * 0.35 + random() * height * 0.1;
            const spotSize = width * (0.03 + random() * 0.03);
            
            ctx.beginPath();
            ctx.arc(spotX, spotY, spotSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.06, centerY - height * 0.26, width * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        // One eye missing or damaged
        ctx.fillStyle = darkSkinColor;
        ctx.beginPath();
        ctx.arc(centerX + width * 0.06, centerY - height * 0.26, width * 0.03, 0, Math.PI * 2);
        ctx.fill();
        
        // Pupil in remaining eye
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.06, centerY - height * 0.26, width * 0.015, 0, Math.PI * 2);
        ctx.fill();
        
        // Mouth (crooked)
        ctx.strokeStyle = darkSkinColor;
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.08, centerY - height * 0.17);
        ctx.quadraticCurveTo(centerX, centerY - height * 0.12, centerX + width * 0.08, centerY - height * 0.19);
        ctx.stroke();
        
        // Body (torn clothes)
        ctx.fillStyle = clothingColor;
        ctx.beginPath();
        ctx.rect(centerX - width * 0.15, centerY - height * 0.1, width * 0.3, height *