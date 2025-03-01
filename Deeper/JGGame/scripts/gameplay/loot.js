/**
 * Loot System
 * 
 * Handles item generation, loot tables, and loot distribution.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.loot = {};

(function() {
    // Loot tables by enemy type
    const lootTables = {
        undead: {
            common: [
                { type: 'weapon', subType: 'dagger', weight: 20 },
                { type: 'armor', subType: 'light', weight: 15 },
                { type: 'consumable', subType: 'potion_minor', weight: 40 },
                { type: 'material', subType: 'bone', weight: 60 }
            ],
            uncommon: [
                { type: 'weapon', subType: 'sword', weight: 20 },
                { type: 'armor', subType: 'medium', weight: 15 },
                { type: 'consumable', subType: 'potion_health', weight: 25 },
                { type: 'material', subType: 'cloth', weight: 15 }
            ],
            rare: [
                { type: 'weapon', subType: 'sword_magic', weight: 10 },
                { type: 'armor', subType: 'heavy', weight: 8 },
                { type: 'accessory', subType: 'ring', weight: 12 },
                { type: 'consumable', subType: 'scroll', weight: 5 }
            ]
        },
        demon: {
            common: [
                { type: 'weapon', subType: 'sword', weight: 20 },
                { type: 'armor', subType: 'medium', weight: 15 },
                { type: 'consumable', subType: 'potion_fire', weight: 30 },
                { type: 'material', subType: 'demonic_essence', weight: 50 }
            ],
            uncommon: [
                { type: 'weapon', subType: 'staff', weight: 15 },
                { type: 'armor', subType: 'robe', weight: 15 },
                { type: 'consumable', subType: 'potion_mana', weight: 30 },
                { type: 'material', subType: 'infernal_hide', weight: 20 }
            ],
            rare: [
                { type: 'weapon', subType: 'staff_magic', weight: 15 },
                { type: 'armor', subType: 'heavy_magic', weight: 10 },
                { type: 'accessory', subType: 'amulet', weight: 15 },
                { type: 'consumable', subType: 'scroll_fire', weight: 10 }
            ]
        },
        beast: {
            common: [
                { type: 'weapon', subType: 'axe', weight: 15 },
                { type: 'armor', subType: 'light', weight: 15 },
                { type: 'consumable', subType: 'potion_stamina', weight: 30 },
                { type: 'material', subType: 'hide', weight: 60 }
            ],
            uncommon: [
                { type: 'weapon', subType: 'bow', weight: 20 },
                { type: 'armor', subType: 'medium', weight: 15 },
                { type: 'consumable', subType: 'potion_poison', weight: 25 },
                { type: 'material', subType: 'tooth', weight: 30 }
            ],
            rare: [
                { type: 'weapon', subType: 'bow_magic', weight: 10 },
                { type: 'armor', subType: 'beast_hide', weight: 15 },
                { type: 'accessory', subType: 'talisman', weight: 15 },
                { type: 'material', subType: 'claw', weight: 10 }
            ]
        }
    };
    
    // Chest loot tables by tier
    const chestTables = {
        wood: {
            itemCount: { min: 1, max: 3 },
            commonChance: 0.8,
            uncommonChance: 0.2,
            rareChance: 0.0
        },
        iron: {
            itemCount: { min: 2, max: 4 },
            commonChance: 0.6,
            uncommonChance: 0.35,
            rareChance: 0.05
        },
        gold: {
            itemCount: { min: 3, max: 5 },
            commonChance: 0.4,
            uncommonChance: 0.4,
            rareChance: 0.2
        },
        ancient: {
            itemCount: { min: 4, max: 6 },
            commonChance: 0.2,
            uncommonChance: 0.5,
            rareChance: 0.3
        }
    };
    
    // Item quality definitions
    const itemQuality = [
        { name: "common", chance: 0.7, colorCode: "#aaaaaa" },
        { name: "uncommon", chance: 0.2, colorCode: "#00aa00" },
        { name: "rare", chance: 0.07, colorCode: "#0000aa" },
        { name: "epic", chance: 0.02, colorCode: "#aa00aa" },
        { name: "legendary", chance: 0.01, colorCode: "#aaaa00" }
    ];
    
    // Weapon definitions
    const weaponTypes = {
        dagger: { baseDamage: 5, attackSpeed: 2.0, range: 1 },
        sword: { baseDamage: 10, attackSpeed: 1.5, range: 2 },
        axe: { baseDamage: 15, attackSpeed: 1.0, range: 2 },
        mace: { baseDamage: 12, attackSpeed: 1.2, range: 2 },
        staff: { baseDamage: 8, attackSpeed: 1.0, range: 2 },
        bow: { baseDamage: 8, attackSpeed: 1.5, range: 20 },
        wand: { baseDamage: 6, attackSpeed: 2.0, range: 15 }
    };
    
    // Armor definitions
    const armorTypes = {
        light: { defense: 5, movementPenalty: 0.0, magicBonus: 0.1 },
        medium: { defense: 10, movementPenalty: 0.1, magicBonus: 0.0 },
        heavy: { defense: 15, movementPenalty: 0.2, magicBonus: -0.1 },
        robe: { defense: 3, movementPenalty: 0.0, magicBonus: 0.2 }
    };
    
    // Initialize loot system
    Game.gameplay.loot.init = function() {
        console.log('Initializing loot system');
        return Promise.resolve();
    };
    
    // Generate random item
    Game.gameplay.loot.generateRandomItem = function(level, enemyType = null) {
        // Select item quality based on level and random chance
        const quality = determineItemQuality(level);
        
        // Select item category (weapon, armor, accessory, consumable)
        const categories = ['weapon', 'armor', 'accessory', 'consumable'];
        const categoryIndex = Math.floor(Math.random() * categories.length);
        const category = categories[categoryIndex];
        
        // Generate item based on category
        let item;
        switch (category) {
            case 'weapon':
                item = generateWeapon(level, quality);
                break;
            case 'armor':
                item = generateArmor(level, quality);
                break;
            case 'accessory':
                item = generateAccessory(level, quality);
                break;
            case 'consumable':
                item = generateConsumable(level, quality);
                break;
            default:
                item = generateConsumable(level, quality);
        }
        
        return item;
    };
    
    // Generate chest loot
    Game.gameplay.loot.generateChestLoot = function(chestTier, level) {
        const tier = chestTables[chestTier] || chestTables.wood;
        const itemCount = Math.floor(Game.utils.math.randomInt(tier.itemCount.min, tier.itemCount.max));
        
        const loot = [];
        
        for (let i = 0; i < itemCount; i++) {
            // Determine quality tier
            const roll = Math.random();
            let quality;
            
            if (roll < tier.commonChance) {
                quality = 'common';
            } else if (roll < tier.commonChance + tier.uncommonChance) {
                quality = 'uncommon';
            } else {
                quality = 'rare';
            }
            
            // Generate random item at this quality
            const item = Game.gameplay.loot.generateRandomItem(level);
            item.quality = quality; // Override quality
            
            // Add quality-based modifiers
            applyQualityModifiers(item, quality);
            
            loot.push(item);
        }
        
        return loot;
    };
    
    // Drop enemy loot
    Game.gameplay.loot.dropEnemyLoot = function(position, enemyType, level) {
        console.log(`Generating loot for ${enemyType} at level ${level}`);
        
        // Select the appropriate loot table
        const table = lootTables[enemyType] || lootTables.undead;
        
        // Determine if enemy drops loot (80% chance)
        if (Math.random() > 0.8) {
            console.log('No loot dropped');
            return [];
        }
        
        // Determine how many items to drop (1-3 based on level)
        const itemCount = Math.floor(Math.random() * 3) + 1;
        
        const loot = [];
        
        for (let i = 0; i < itemCount; i++) {
            // Determine which quality tier to pull from
            const roll = Math.random();
            let tierTable;
            
            if (roll < 0.7) {
                tierTable = table.common;
            } else if (roll < 0.95) {
                tierTable = table.uncommon;
            } else {
                tierTable = table.rare;
            }
            
            // Calculate total weight for weighted selection
            const totalWeight = tierTable.reduce((sum, item) => sum + item.weight, 0);
            
            // Pick random item based on weight
            let randomWeight = Math.random() * totalWeight;
            let selectedItem = null;
            
            for (const item of tierTable) {
                randomWeight -= item.weight;
                if (randomWeight <= 0) {
                    selectedItem = item;
                    break;
                }
            }
            
            if (selectedItem) {
                // Generate the selected item
                const item = Game.gameplay.loot.generateItem(selectedItem.type, selectedItem.subType, level);
                
                // Spawn it in the world
                spawnLootInWorld(position, item);
                
                loot.push(item);
            }
        }
        
        return loot;
    };
    
    // Generate specific item
    Game.gameplay.loot.generateItem = function(itemType, subType, level) {
        let item;
        
        switch (itemType) {
            case 'weapon':
                item = generateWeapon(level, 'common', subType);
                break;
            case 'armor':
                item = generateArmor(level, 'common', subType);
                break;
            case 'accessory':
                item = generateAccessory(level, 'common', subType);
                break;
            case 'consumable':
                item = generateConsumable(level, 'common', subType);
                break;
            case 'material':
                item = generateMaterial(subType);
                break;
            default:
                item = generateConsumable(level, 'common');
        }
        
        return item;
    };
    
    // Spawn loot in the world
    function spawnLootInWorld(position, item) {
        // Create a-frame entity for the item
        const itemEntity = document.createElement('a-entity');
        itemEntity.classList.add('interactive', 'loot-item');
        itemEntity.setAttribute('data-item-id', item.id);
        
        // Position slightly above ground with random offset
        const posX = position.x + (Math.random() * 2 - 1) * 0.5;
        const posZ = position.z + (Math.random() * 2 - 1) * 0.5;
        
        itemEntity.setAttribute('position', {
            x: posX,
            y: position.y + 0.5,
            z: posZ
        });
        
        // Create visual representation
        createItemVisual(itemEntity, item);
        
        // Add hover and interact behavior
        itemEntity.setAttribute('animation', {
            property: 'position',
            dir: 'alternate',
            dur: 2000,
            easing: 'easeInOutSine',
            loop: true,
            to: `${posX} ${position.y + 0.8} ${posZ}`
        });
        
        // Set click handler to pick up item
        itemEntity.setAttribute('onclick', `Game.gameplay.inventory.pickupItem('${item.id}')`);
        
        // Add to scene
        document.getElementById('world-container').appendChild(itemEntity);
        
        // Map the entity to the item for later reference
        Game.gameplay.inventory.registerWorldItem(item.id, itemEntity);
        
        return itemEntity;
    }
    
    // Create visual representation of an item
    function createItemVisual(itemEntity, item) {
        // Choose icon/model based on item type
        const geom = document.createElement('a-entity');
        
        let color = '#ffffff';
        let primitive = 'box';
        let scale = '0.3 0.3 0.3';
        
        // Get quality color
        const qualityDef = itemQuality.find(q => q.name === item.quality);
        if (qualityDef) {
            color = qualityDef.colorCode;
        }
        
        // Set appearance based on item type
        switch (item.type) {
            case 'weapon':
                primitive = 'box';
                scale = '0.1 0.1 0.5';
                break;
            case 'armor':
                primitive = 'box';
                scale = '0.3 0.4 0.1';
                break;
            case 'accessory':
                primitive = 'ring';
                scale = '0.2 0.2 0.1';
                break;
            case 'consumable':
                primitive = 'cylinder';
                scale = '0.15 0.3 0.15';
                break;
            case 'material':
                primitive = 'dodecahedron';
                scale = '0.2 0.2 0.2';
                break;
        }
        
        geom.setAttribute('geometry', {
            primitive: primitive
        });
        
        geom.setAttribute('material', {
            color: color,
            metalness: 0.3,
            roughness: 0.7
        });
        
        geom.setAttribute('scale', scale);
        
        // Add glow effect based on quality
        if (item.quality !== 'common') {
            const glowIntensity = {
                'uncommon': 0.3,
                'rare': 0.5,
                'epic': 0.7,
                'legendary': 1.0
            }[item.quality] || 0.3;
            
            const light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                intensity: glowIntensity,
                distance