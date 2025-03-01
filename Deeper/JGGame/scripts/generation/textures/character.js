/**
 * Character Texture Generation
 * 
 * Procedurally generates textures for NPCs, enemies, and other characters.
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.textures = Game.generation.textures || {};
Game.generation.textures.character = {};

(function() {
    // Canvas elements used for texture generation
    const characterCanvas = document.createElement('canvas');
    const characterCtx = characterCanvas.getContext('2d');
    const portraitCanvas = document.createElement('canvas');
    const portraitCtx = portraitCanvas.getContext('2d');
    
    // Character feature parts
    const characterParts = {
        humanoid: {
            body: ['slim', 'average', 'muscular', 'heavy'],
            head: ['round', 'oval', 'square', 'narrow'],
            hair: ['short', 'long', 'bald', 'curly', 'messy'],
            eyes: ['round', 'narrow', 'wide', 'hooded'],
            nose: ['small', 'large', 'pointed', 'flat'],
            mouth: ['thin', 'full', 'wide', 'small'],
            ears: ['small', 'pointed', 'large', 'round'],
            skinTones: ['#F6EEDC', '#F2CCB7', '#DBA88A', '#A97358', '#6A4434', '#422D19']
        },
        undead: {
            body: ['skeletal', 'decayed', 'mummified', 'fresh'],
            head: ['skull', 'rotted', 'partial', 'intact'],
            hair: ['none', 'sparse', 'hanging', 'moldy'],
            eyes: ['empty', 'glowing', 'rotted', 'single'],
            nose: ['none', 'partial', 'hole', 'flat'],
            mouth: ['gaping', 'skeletal', 'frozen', 'missing'],
            skinTones: ['#E0DBD1', '#C5C5B8', '#A9A692', '#737259', '#4D4D33']
        },
        demonic: {
            body: ['muscular', 'twisted', 'massive', 'spined'],
            head: ['horned', 'bestial', 'multiple', 'alien'],
            eyes: ['glowing', 'multiple', 'slit', 'dark'],
            skinTones: ['#8C1A1A', '#661A33', '#331A33', '#1A0D0D', '#4D1A1A']
        },
        beast: {
            body: ['furry', 'scaled', 'massive', 'lean'],
            head: ['animal', 'fanged', 'elongated', 'tusked'],
            fur: ['short', 'long', 'patchy', 'thick'],
            eyes: ['predator', 'rounded', 'small', 'glowing'],
            skinTones: ['#8C6E44', '#736541', '#594D33', '#403D26', '#262626']
        }
    };
    
    // Color palettes for different creature types
    const colorPalettes = {
        human: {
            skin: ['#F6EEDC', '#F2CCB7', '#DBA88A', '#A97358', '#6A4434', '#422D19'],
            hair: ['#1A1A1A', '#4D3319', '#8C7349', '#BFB39B', '#F2F2F2', '#8C5A3C'],
            eyes: ['#0D0D0D', '#1A3300', '#1A3366', '#4D1933', '#663300']
        },
        undead: {
            skin: ['#E0DBD1', '#C5C5B8', '#A9A692', '#737259', '#4D4D33'],
            detail: ['#668055', '#334D33', '#1A1A1A', '#4D4D33', '#8C8C73'],
            glow: ['#8CCCBF', '#1A8C73', '#33664D', '#3E1844', '#591044']
        },
        demonic: {
            skin: ['#8C1A1A', '#661A33', '#331A33', '#1A0D0D', '#4D1A1A'],
            detail: ['#BF1A1A', '#F2B366', '#F26666', '#590D0D', '#0D0D0D'],
            glow: ['#F29933', '#F24433', '#F2F2F2', '#BF944D', '#8C1A1A']
        },
        beast: {
            fur: ['#8C6E44', '#736541', '#594D33', '#403D26', '#262626'],
            detail: ['#404F33', '#594D33', '#736541', '#262626', '#0D0D0D'],
            eyes: ['#F2D12A', '#73260D', '#1A1A1A', '#8C8C73', '#BFBF8C']
        }
    };
    
    // Initialize character texture generation
    Game.generation.textures.character.init = function() {
        console.log('Initializing character texture generation');
        
        // Set canvas sizes
        characterCanvas.width = 256;
        characterCanvas.height = 512;
        portraitCanvas.width = 128;
        portraitCanvas.height = 128;
        
        return Promise.resolve();
    };
    
    // Generate an NPC texture
    Game.generation.textures.character.generateNPCTexture = function(type, seed) {
        if (!characterCanvas) {
            characterCanvas = document.createElement('canvas');
            characterCanvas.width = 256;
            characterCanvas.height = 512;
            characterCtx = characterCanvas.getContext('2d');
        }
        
        // Clear canvas
        characterCtx.clearRect(0, 0, characterCanvas.width, characterCanvas.height);
        
        // Create a seeded random generator
        const random = Game.utils.math.createRandom(seed);
        
        // Determine NPC race/type
        const npcType = type || getRandomNPCType(random);
        
        // Generate the character based on type
        switch (npcType) {
            case 'human':
            case 'villager':
            case 'merchant':
            case 'scholar':
                generateHumanoid(characterCtx, random, 'human');
                break;
                
            case 'undead':
            case 'zombie':
            case 'skeleton':
                generateHumanoid(characterCtx, random, 'undead');
                break;
                
            case 'demon':
            case 'imp':
            case 'fiend':
                generateDemonic(characterCtx, random);
                break;
                
            case 'beast':
            case 'wolf':
            case 'bear':
                generateBeast(characterCtx, random);
                break;
                
            default:
                generateHumanoid(characterCtx, random, 'human');
        }
        
        // Return the data URL of the generated texture
        return characterCanvas.toDataURL('image/png');
    };
    
    // Generate an NPC portrait
    Game.generation.textures.character.generateNPCPortrait = function(type, seed) {
        if (!portraitCanvas) {
            portraitCanvas = document.createElement('canvas');
            portraitCanvas.width = 128;
            portraitCanvas.height = 128;
            portraitCtx = portraitCanvas.getContext('2d');
        }
        
        // Clear canvas
        portraitCtx.clearRect(0, 0, portraitCanvas.width, portraitCanvas.height);
        
        // Create a seeded random generator
        const random = Game.utils.math.createRandom(seed);
        
        // Determine NPC race/type
        const npcType = type || getRandomNPCType(random);
        
        // Generate the portrait based on type
        switch (npcType) {
            case 'human':
            case 'villager':
            case 'merchant':
            case 'scholar':
                generateHumanoidPortrait(portraitCtx, random, 'human');
                break;
                
            case 'undead':
            case 'zombie':
            case 'skeleton':
                generateHumanoidPortrait(portraitCtx, random, 'undead');
                break;
                
            case 'demon':
            case 'imp':
            case 'fiend':
                generateDemonicPortrait(portraitCtx, random);
                break;
                
            case 'beast':
            case 'wolf':
            case 'bear':
                generateBeastPortrait(portraitCtx, random);
                break;
                
            default:
                generateHumanoidPortrait(portraitCtx, random, 'human');
        }
        
        // Add a portrait frame
        drawPortraitFrame(portraitCtx, npcType);
        
        // Return the data URL of the generated portrait
        return portraitCanvas.toDataURL('image/png');
    };
    
    // Generate an enemy texture
    Game.generation.textures.character.generateEnemyTexture = function(type, seed) {
        // Similar to NPC texture but with enemy-specific enhancements
        const texture = Game.generation.textures.character.generateNPCTexture(type, seed);
        
        // Create a temporary canvas to modify the texture
        const tempCanvas = document.createElement('canvas');
        tempCanvas.width = 256;
        tempCanvas.height = 512;
        const tempCtx = tempCanvas.getContext('2d');
        
        // Load the base texture
        const img = new Image();
        img.src = texture;
        
        // Return a promise that resolves when the image is loaded and processed
        return new Promise((resolve) => {
            img.onload = () => {
                tempCtx.drawImage(img, 0, 0);
                
                // Add enemy-specific effects (glowing eyes, aura, etc.)
                addEnemyEffects(tempCtx, type, seed);
                
                // Return the enhanced texture
                resolve(tempCanvas.toDataURL('image/png'));
            };
        });
    };
    
    // Private helper functions
    
    // Get a random NPC type
    function getRandomNPCType(random) {
        const types = ['human', 'undead', 'demon', 'beast'];
        return types[Math.floor(random() * types.length)];
    }
    
    // Generate a humanoid character
    function generateHumanoid(ctx, random, race = 'human') {
        // Get appropriate color palette
        const palette = colorPalettes[race] || colorPalettes.human;
        
        // Draw background/aura if needed (for magical/special characters)
        if (random() > 0.8) {
            drawAura(ctx, palette, random);
        }
        
        // Draw body
        drawBody(ctx, race, palette, random);
        
        // Draw head
        drawHead(ctx, race, palette, random);
        
        // Draw clothing/armor
        drawClothing(ctx, race, random);
        
        // Draw weapon if needed
        if (random() > 0.5) {
            drawWeapon(ctx, race, random);
        }
        
        // Add special effects based on character type
        addSpecialEffects(ctx, race, random);
    }
    
    // Generate a humanoid portrait
    function generateHumanoidPortrait(ctx, random, race = 'human') {
        // Get appropriate color palette
        const palette = colorPalettes[race] || colorPalettes.human;
        
        // Draw portrait background
        ctx.fillStyle = '#333333';
        ctx.fillRect(0, 0, portraitCanvas.width, portraitCanvas.height);
        
        // Draw face shape
        const faceColor = getRandomColor(palette.skin || palette.fur || palette.skin, random);
        ctx.fillStyle = faceColor;
        ctx.beginPath();
        ctx.ellipse(64, 68, 40, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        drawPortraitEyes(ctx, race, palette, random);
        
        // Draw mouth
        drawPortraitMouth(ctx, race, palette, random);
        
        // Draw hair/horns/features
        drawPortraitHair(ctx, race, palette, random);
        
        // Add race-specific details
        addPortraitDetails(ctx, race, palette, random);
    }
    
    // Generate a demonic character
    function generateDemonic(ctx, random) {
        const palette = colorPalettes.demonic;
        
        // Draw base body
        ctx.fillStyle = getRandomColor(palette.skin, random);
        ctx.fillRect(64, 100, 128, 350);
        
        // Draw horns
        drawHorns(ctx, palette, random);
        
        // Draw glowing eyes
        drawGlowingEyes(ctx, palette, random);
        
        // Add demonic features (wings, tail, etc.)
        addDemonicFeatures(ctx, palette, random);
    }
    
    // Generate a demonic portrait
    function generateDemonicPortrait(ctx, random) {
        const palette = colorPalettes.demonic;
        
        // Draw portrait background with glow
        const glowColor = getRandomColor(palette.glow, random);
        createRadialGradient(ctx, 64, 64, 70, '#000000', glowColor + '80');
        
        // Draw face
        ctx.fillStyle = getRandomColor(palette.skin, random);
        ctx.beginPath();
        ctx.ellipse(64, 68, 40, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw horns
        drawPortraitHorns(ctx, palette, random);
        
        // Draw glowing eyes
        drawPortraitGlowingEyes(ctx, palette, random);
        
        // Add demonic features
        addPortraitDemonicFeatures(ctx, palette, random);
    }
    
    // Generate a beast character
    function generateBeast(ctx, random) {
        const palette = colorPalettes.beast;
        
        // Draw base body
        ctx.fillStyle = getRandomColor(palette.fur, random);
        
        // Draw beast-like silhouette (varies based on type)
        drawBeastSilhouette(ctx, random);
        
        // Add fur texture
        addFurTexture(ctx, palette, random);
        
        // Draw face features (snout, eyes, etc.)
        drawBeastFace(ctx, palette, random);
        
        // Add beast-specific features (claws, tail, etc.)
        addBeastFeatures(ctx, palette, random);
    }
    
    // Generate a beast portrait
    function generateBeastPortrait(ctx, random) {
        const palette = colorPalettes.beast;
        
        // Draw portrait background
        ctx.fillStyle = '#1A1A1A';
        ctx.fillRect(0, 0, portraitCanvas.width, portraitCanvas.height);
        
        // Draw beast face
        ctx.fillStyle = getRandomColor(palette.fur, random);
        ctx.beginPath();
        ctx.ellipse(64, 68, 45, 55, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Add fur texture
        addPortraitFurTexture(ctx, palette, random);
        
        // Draw beast eyes
        drawPortraitBeastEyes(ctx, palette, random);
        
        // Add snout/muzzle
        drawPortraitSnout(ctx, palette, random);
        
        // Add beast-specific features (ears, horns, etc.)
        addPortraitBeastFeatures(ctx, palette, random);
    }
    
    // Draw a portrait frame
    function drawPortraitFrame(ctx, type) {
        // Draw a frame around the portrait based on character type
        ctx.lineWidth = 4;
        
        switch (type) {
            case 'human':
            case 'villager':
            case 'merchant':
            case 'scholar':
                ctx.strokeStyle = '#8C7349';
                break;
                
            case 'undead':
            case 'zombie':
            case 'skeleton':
                ctx.strokeStyle = '#4D4D33';
                break;
                
            case 'demon':
            case 'imp':
            case 'fiend':
                ctx.strokeStyle = '#8C1A1A';
                break;
                
            case 'beast':
            case 'wolf':
            case 'bear':
                ctx.strokeStyle = '#594D33';
                break;
                
            default:
                ctx.strokeStyle = '#8C7349';
        }
        
        // Draw frame rectangle
        ctx.strokeRect(2, 2, portraitCanvas.width - 4, portraitCanvas.height - 4);
        
        // Add corner embellishments
        drawFrameCorners(ctx, type);
    }
    
    // Add enemy-specific effects
    function addEnemyEffects(ctx, type, seed) {
        const random = Game.utils.math.createRandom(seed);
        
        // Add glowing eyes
        const glowColor = getEnemyGlowColor(type, random);
        addGlowEffect(ctx, 95, 140, 10, glowColor);
        addGlowEffect(ctx, 160, 140, 10, glowColor);
        
        // Add damage/wounds if undead
        if (type === 'undead' || type === 'zombie') {
            addDamageEffects(ctx, random);
        }
        
        // Add aura for demons
        if (type === 'demon' || type === 'fiend') {
            addAuraEffect(ctx, glowColor, random);
        }
    }
    
    // Get an enemy glow color based on type
    function getEnemyGlowColor(type, random) {
        switch (type) {
            case 'undead':
            case 'zombie':
            case 'skeleton':
                return '#8CCCBF';
                
            case 'demon':
            case 'imp':
            case 'fiend':
                return '#F29933';
                
            case 'beast':
            case 'wolf':
            case 'bear':
                return '#F2D12A';
                
            default:
                return '#FFFFFF';
        }
    }
    
    // Draw body
    function drawBody(ctx, race, palette, random) {
        // Implementation details would go here
        // For now we'll use a placeholder implementation
        ctx.fillStyle = getRandomColor(palette.skin || palette.fur, random);
        ctx.fillRect(64, 100, 128, 350);
    }
    
    // Draw head
    function drawHead(ctx, race, palette, random) {
        // Implementation details would go here
        // For now we'll use a placeholder implementation
        ctx.fillStyle = getRandomColor(palette.skin || palette.fur, random);
        ctx.beginPath();
        ctx.ellipse(128, 80, 40, 50, 0, 0, Math.PI * 2);
        ctx.fill();
        
        // Draw eyes
        ctx.fillStyle = getRandomColor(palette.eyes || ['#000000'], random);
        ctx.beginPath();
        ctx.ellipse(110, 70, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(145, 70, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw clothing
    function drawClothing(ctx, race, random) {
        // Implementation details would go here
    }
    
    // Draw weapon
    function drawWeapon(ctx, race, random) {
        // Implementation details would go here
    }
    
    // Add special effects
    function addSpecialEffects(ctx, race, random) {
        // Implementation details would go here
    }
    
    // Draw portrait eyes
    function drawPortraitEyes(ctx, race, palette, random) {
        // Implementation details would go here
        ctx.fillStyle = getRandomColor(palette.eyes || ['#000000'], random);
        ctx.beginPath();
        ctx.ellipse(50, 58, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.beginPath();
        ctx.ellipse(78, 58, 5, 5, 0, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Draw portrait mouth
    function drawPortraitMouth(ctx, race, palette, random) {
        // Implementation details would go here
        ctx.strokeStyle = '#000000';
        ctx.beginPath();
        ctx.moveTo(50, 85);
        ctx.bezierCurveTo(58, 95, 70, 95, 78, 85);
        ctx.stroke();
    }
    
    // Draw portrait hair
    function drawPortraitHair(ctx, race, palette, random) {
        // Implementation details would go here
    }
    
    // Add portrait details
    function addPortraitDetails(ctx, race, palette, random) {
        // Implementation details would go here
    }
    
    // Draw horns
    function drawHorns(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw glowing eyes
    function drawGlowingEyes(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Add demonic features
    function addDemonicFeatures(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw portrait horns
    function drawPortraitHorns(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw portrait glowing eyes
    function drawPortraitGlowingEyes(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Add portrait demonic features
    function addPortraitDemonicFeatures(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw beast silhouette
    function drawBeastSilhouette(ctx, random) {
        // Implementation details would go here
    }
    
    // Add fur texture
    function addFurTexture(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw beast face
    function drawBeastFace(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Add beast features
    function addBeastFeatures(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Add portrait fur texture
    function addPortraitFurTexture(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw portrait beast eyes
    function drawPortraitBeastEyes(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw portrait snout
    function drawPortraitSnout(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Add portrait beast features
    function addPortraitBeastFeatures(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Draw frame corners
    function drawFrameCorners(ctx, type) {
        // Implementation details would go here
    }
    
    // Add glow effect
    function addGlowEffect(ctx, x, y, radius, color) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius * 2);
        gradient.addColorStop(0, color);
        gradient.addColorStop(0.5, color + '80'); // 50% opacity
        gradient.addColorStop(1, color + '00'); // 0% opacity
        
        ctx.fillStyle = gradient;
        ctx.beginPath();
        ctx.arc(x, y, radius * 2, 0, Math.PI * 2);
        ctx.fill();
    }
    
    // Add damage effects
    function addDamageEffects(ctx, random) {
        // Implementation details would go here
    }
    
    // Add aura effect
    function addAuraEffect(ctx, color, random) {
        // Implementation details would go here
    }
    
    // Draw an aura
    function drawAura(ctx, palette, random) {
        // Implementation details would go here
    }
    
    // Create a radial gradient
    function createRadialGradient(ctx, x, y, radius, innerColor, outerColor) {
        const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
        gradient.addColorStop(0, innerColor);
        gradient.addColorStop(1, outerColor);
        
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, ctx.canvas.width, ctx.canvas.height);
    }
    
    // Get a random color from a palette
    function getRandomColor(palette, random) {
        if (!palette || !palette.length) return '#FFFFFF';
        return palette[Math.floor(random() * palette.length)];
    }
})();
