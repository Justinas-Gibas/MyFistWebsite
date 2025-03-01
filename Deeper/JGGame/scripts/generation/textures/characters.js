/**
 * Character Texture Generation
 * 
 * Generates textures for NPCs and enemies
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = Game.generation.textures || {};

(function() {
    // Generate NPC portrait
    Game.generation.textures.generateNPCPortrait = function(npcType, seed) {
        const cacheKey = `npc_${npcType}_${seed}`;
        
        // Check cache first
        const cached = Game.generation.textures.getFromCache(cacheKey);
        if (cached) return cached;
        
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
            case 'merchant': bgColor = `rgb(150, 120, 80)`; break;
            case 'warrior': bgColor = `rgb(120, 60, 40)`; break;
            case 'mage': bgColor = `rgb(80, 80, 160)`; break;
            case 'villager': bgColor = `rgb(140, 140, 100)`; break;
            default: bgColor = `rgb(100, 100, 100)`;
        }
        
        // Fill background
        ctx.fillStyle = bgColor;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Generate face
        drawFace(ctx, canvas.width, canvas.height, npcType, random);
        
        // Add a vignette effect for style
        Game.generation.textures.addVignette(ctx, canvas.width, canvas.height, 0.8);
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        Game.generation.textures.addToCache(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Generate enemy texture
    Game.generation.textures.generateEnemyTexture = function(enemyType, seed) {
        const cacheKey = `enemy_${enemyType}_${seed}`;
        
        // Check cache first
        const cached = Game.generation.textures.getFromCache(cacheKey);
        if (cached) return cached;
        
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
            case 'skeleton': drawSkeleton(ctx, canvas.width, canvas.height, random); break;
            case 'zombie': drawZombie(ctx, canvas.width, canvas.height, random); break;
            case 'demon': drawDemon(ctx, canvas.width, canvas.height, random); break;
            case 'spider': drawSpider(ctx, canvas.width, canvas.height, random); break;
            default: drawGenericEnemy(ctx, canvas.width, canvas.height, random);
        }
        
        // Convert canvas to data URL
        const dataURL = canvas.toDataURL('image/png');
        
        // Cache the result
        Game.generation.textures.addToCache(cacheKey, dataURL);
        
        return dataURL;
    };
    
    // Draw a face for NPC portraits
    function drawFace(ctx, width, height, npcType, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Face shape
        ctx.fillStyle = `rgb(${180 + random() * 60}, ${140 + random() * 60}, ${100 + random() * 60})`;
        ctx.beginPath();
        ctx.ellipse(centerX, centerY, width * 0.4, height * 0.45, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Eyes, nose, mouth implementation...
        drawFacialFeatures(ctx, centerX, centerY, width, height, npcType, random);
        
        // Hair
        drawHair(ctx, centerX, centerY, width, height, random);
        
        // NPC-specific details
        drawNPCSpecificDetails(ctx, centerX, centerY, width, height, npcType, random);
    }
    
    // Draw skeleton enemy
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
        
        // Arms and weapon
        drawSkeletonLimbs(ctx, centerX, centerY, width, height, random);
    }
    
    // Draw zombie enemy
    function drawZombie(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base colors
        const skinColor = `rgb(${100 + random() * 30}, ${130 + random() * 30}, ${90 + random() * 20})`;
        const darkSkinColor = `rgb(${70 + random() * 20}, ${100 + random() * 20}, ${60 + random() * 20})`;
        const clothingColor = `rgb(${50 + random() * 20}, ${40 + random() * 20}, ${30 + random() * 20})`;
        
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
        drawZombieEyes(ctx, centerX, centerY, width, height, random);
        
        // Body (torn clothes)
        ctx.fillStyle = clothingColor;
        ctx.beginPath();
        ctx.rect(centerX - width * 0.15, centerY - height * 0.1, width * 0.3, height * 0.35);
        ctx.fill();
        
        // Add tears and damage to clothes
        drawZombieTears(ctx, centerX, centerY, width, height, random, skinColor);
    }
    
    // Draw demon enemy
    function drawDemon(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base colors
        const skinColor = `rgb(${170 + random() * 30}, ${30 + random() * 20}, ${30 + random() * 20})`;
        const darkSkinColor = `rgb(${120 + random() * 20}, ${20 + random() * 10}, ${20 + random() * 10})`;
        const hornColor = `rgb(${50 + random() * 20}, ${30 + random() * 20}, ${20 + random() * 10})`;
        
        // Draw head
        ctx.fillStyle = skinColor;
        ctx.beginPath();
        ctx.arc(centerX, centerY - height * 0.25, width * 0.13, 0, Math.PI * 2);
        ctx.fill();
        
        // Horns
        ctx.fillStyle = hornColor;
        // Left horn
        ctx.beginPath();
        ctx.moveTo(centerX - width * 0.1, centerY - height * 0.35);
        ctx.quadraticCurveTo(
            centerX - width * 0.15, centerY - height * 0.45,
            centerX - width * 0.2, centerY - height * 0.42
        );
        ctx.lineTo(centerX - width * 0.18, centerY - height * 0.37);
        ctx.quadraticCurveTo(
            centerX - width * 0.13, centerY - height * 0.4,
            centerX - width * 0.1, centerY - height * 0.35
        );
        ctx.fill();
        
        // Right horn (mirrored)
        ctx.beginPath();
        ctx.moveTo(centerX + width * 0.1, centerY - height * 0.35);
        ctx.quadraticCurveTo(
            centerX + width * 0.15, centerY - height * 0.45,
            centerX + width * 0.2, centerY - height * 0.42
        );
        ctx.lineTo(centerX + width * 0.18, centerY - height * 0.37);
        ctx.quadraticCurveTo(
            centerX + width * 0.13, centerY - height * 0.4,
            centerX + width * 0.1, centerY - height * 0.35
        );
        ctx.fill();
        
        // Glowing eyes
        ctx.fillStyle = '#FFCC00';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.06, centerY - height * 0.26, width * 0.025, 0, Math.PI * 2);
        ctx.arc(centerX + width * 0.06, centerY - height * 0.26, width * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw rest of demon body
        drawDemonBody(ctx, centerX, centerY, width, height, random, skinColor, darkSkinColor);
    }
    
    // Draw spider enemy
    function drawSpider(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Base colors
        const bodyColor = '#222222';
        const legColor = '#111111';
        const eyeColor = '#FF3333';
        
        // Draw body (two segments)
        ctx.fillStyle = bodyColor;
        
        // Abdomen (larger back segment)
        ctx.beginPath();
        ctx.ellipse(
            centerX, centerY + height * 0.1,
            width * 0.18, height * 0.15,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Cephalothorax (head segment)
        ctx.beginPath();
        ctx.ellipse(
            centerX, centerY - height * 0.05,
            width * 0.12, height * 0.1,
            0, 0, Math.PI * 2
        );
        ctx.fill();
        
        // Eyes (multiple small red eyes)
        ctx.fillStyle = eyeColor;
        for (let i = 0; i < 4; i++) {
            const eyeX = centerX - width * 0.06 + (width * 0.04 * i);
            const eyeY = centerY - height * 0.1;
            const eyeSize = width * 0.015;
            
            ctx.beginPath();
            ctx.arc(eyeX, eyeY, eyeSize, 0, Math.PI * 2);
            ctx.fill();
        }
        
        // Draw legs
        drawSpiderLegs(ctx, centerX, centerY, width, height, legColor);
    }
    
    // Draw generic enemy
    function drawGenericEnemy(ctx, width, height, random) {
        const centerX = width / 2;
        const centerY = height / 2;
        
        // Random color
        const r = Math.floor(100 + random() * 155);
        const g = Math.floor(100 + random() * 155);
        const b = Math.floor(100 + random() * 155);
        const color = `rgb(${r}, ${g}, ${b})`;
        
        // Draw body
        ctx.fillStyle = color;
        ctx.beginPath();
        ctx.arc(centerX, centerY, width * 0.3, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.1, centerY - height * 0.1, width * 0.05, 0, Math.PI * 2);
        ctx.arc(centerX + width * 0.1, centerY - height * 0.1, width * 0.05, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(centerX - width * 0.1, centerY - height * 0.1, width * 0.025, 0, Math.PI * 2);
        ctx.arc(centerX + width * 0.1, centerY - height * 0.1, width * 0.025, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw mouth
        ctx.strokeStyle = 'black';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.arc(centerX, centerY + height * 0.05, width * 0.15, 0.1 * Math.PI, 0.9 * Math.PI);
        ctx.stroke();
    }
    
    // Helper functions for drawing character details
    function drawFacialFeatures(ctx, centerX, centerY, width, height, npcType, random) {
        // Eyes, eyebrows, etc. implementation...
    }
    
    function drawHair(ctx, centerX, centerY, width, height, random) {
        // Hair styling implementation...
    }
    
    function drawNPCSpecificDetails(ctx, centerX, centerY, width, height, npcType, random) {
        // Type-specific details implementation...
    }
    
    function drawSkeletonLimbs(ctx, centerX, centerY, width, height, random) {
        // Skeleton limbs implementation...
    }
    
    function drawZombieEyes(ctx, centerX, centerY, width, height, random) {
        // Zombie eyes implementation...
    }
    
    function drawZombieTears(ctx, centerX, centerY, width, height, random, skinColor) {
        // Zombie torn clothing implementation...
    }
    
    function drawDemonBody(ctx, centerX, centerY, width, height, random, skinColor, darkSkinColor) {
        // Demon body implementation...
    }
    
    function drawSpiderLegs(ctx, centerX, centerY, width, height, legColor) {
        // Spider legs implementation...
    }
})();
