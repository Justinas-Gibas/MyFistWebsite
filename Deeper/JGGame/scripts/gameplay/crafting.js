/**
 * Crafting System
 * 
 * Handles crafting mechanics including recipes, resources, crafting stations,
 * and item creation.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.crafting = {};

(function() {
    // Crafting state
    let activeCraftingStation = null;
    let currentCategory = 'all';
    let craftingLevel = 1;
    let discoveredRecipes = new Set();
    let activeRecipe = null;
    
    // Crafting categories
    const categories = {
        weapon: "Weapons",
        armor: "Armor",
        tool: "Tools",
        potion: "Potions",
        building: "Buildings",
        furniture: "Furniture",
        ammo: "Ammunition"
    };
    
    // Crafting recipes
    const recipes = {
        // Weapons
        wooden_sword: {
            name: "Wooden Sword",
            type: "weapon",
            category: "weapon",
            description: "A simple wooden sword for basic combat.",
            craftingTime: 3000, // milliseconds
            requiredLevel: 1,
            ingredients: [
                { type: "wood", amount: 10 }
            ],
            result: { type: "wooden_sword", amount: 1 },
            stationTypes: ["workbench"],
            baseStats: {
                damage: { min: 3, max: 5 },
                durability: 50
            }
        },
        stone_axe: {
            name: "Stone Axe",
            type: "weapon",
            category: "weapon",
            description: "A primitive axe made of stone and wood.",
            craftingTime: 4000,
            requiredLevel: 2,
            ingredients: [
                { type: "wood", amount: 5 },
                { type: "stone", amount: 8 }
            ],
            result: { type: "stone_axe", amount: 1 },
            stationTypes: ["workbench"],
            baseStats: {
                damage: { min: 4, max: 7 },
                durability: 80
            }
        },
        iron_sword: {
            name: "Iron Sword",
            type: "weapon",
            category: "weapon",
            description: "A sturdy sword made of iron.",
            craftingTime: 8000,
            requiredLevel: 5,
            ingredients: [
                { type: "wood", amount: 5 },
                { type: "iron_ingot", amount: 15 }
            ],
            result: { type: "iron_sword", amount: 1 },
            stationTypes: ["forge"],
            baseStats: {
                damage: { min: 7, max: 12 },
                durability: 200
            }
        },
        
        // Armor
        leather_helmet: {
            name: "Leather Helmet",
            type: "armor",
            category: "armor",
            slot: "head",
            description: "A basic leather helmet providing minimal protection.",
            craftingTime: 5000,
            requiredLevel: 2,
            ingredients: [
                { type: "leather", amount: 5 }
            ],
            result: { type: "leather_helmet", amount: 1 },
            stationTypes: ["workbench", "tannery"],
            baseStats: {
                armor: 2,
                durability: 45
            }
        },
        leather_chest: {
            name: "Leather Chestpiece",
            type: "armor",
            category: "armor",
            slot: "chest",
            description: "A leather chestpiece for basic protection.",
            craftingTime: 8000,
            requiredLevel: 2,
            ingredients: [
                { type: "leather", amount: 10 }
            ],
            result: { type: "leather_chest", amount: 1 },
            stationTypes: ["workbench", "tannery"],
            baseStats: {
                armor: 5,
                durability: 60
            }
        },
        iron_helmet: {
            name: "Iron Helmet",
            type: "armor",
            category: "armor",
            slot: "head",
            description: "A sturdy iron helmet.",
            craftingTime: 10000,
            requiredLevel: 6,
            ingredients: [
                { type: "iron_ingot", amount: 8 }
            ],
            result: { type: "iron_helmet", amount: 1 },
            stationTypes: ["forge"],
            baseStats: {
                armor: 6,
                durability: 150
            }
        },
        
        // Tools
        pickaxe: {
            name: "Pickaxe",
            type: "tool",
            category: "tool",
            description: "A tool for mining stone and minerals.",
            craftingTime: 4000,
            requiredLevel: 1,
            ingredients: [
                { type: "wood", amount: 5 },
                { type: "stone", amount: 10 }
            ],
            result: { type: "pickaxe", amount: 1 },
            stationTypes: ["workbench"],
            baseStats: {
                efficiency: 1.0,
                durability: 100
            }
        },
        axe: {
            name: "Axe",
            type: "tool",
            category: "tool",
            description: "A tool for cutting trees and harvesting wood.",
            craftingTime: 3500,
            requiredLevel: 1,
            ingredients: [
                { type: "wood", amount: 5 },
                { type: "stone", amount: 8 }
            ],
            result: { type: "axe", amount: 1 },
            stationTypes: ["workbench"],
            baseStats: {
                efficiency: 1.0,
                durability: 90
            }
        },
        
        // Potions
        health_potion: {
            name: "Health Potion",
            type: "consumable",
            category: "potion",
            description: "Restores 25 health when consumed.",
            craftingTime: 5000,
            requiredLevel: 3,
            ingredients: [
                { type: "red_herb", amount: 3 },
                { type: "water", amount: 1 }
            ],
            result: { type: "health_potion", amount: 1 },
            stationTypes: ["alchemy_table"],
            baseStats: {
                healing: 25,
                duration: 0
            }
        },
        mana_potion: {
            name: "Mana Potion",
            type: "consumable",
            category: "potion",
            description: "Restores 20 mana when consumed.",
            craftingTime: 5000,
            requiredLevel: 4,
            ingredients: [
                { type: "blue_herb", amount: 3 },
                { type: "water", amount: 1 }
            ],
            result: { type: "mana_potion", amount: 1 },
            stationTypes: ["alchemy_table"],
            baseStats: {
                manaCost: 20,
                duration: 0
            }
        },
        
        // Buildings
        workbench: {
            name: "Workbench",
            type: "building",
            category: "building",
            description: "A basic crafting station for creating simple items.",
            craftingTime: 10000,
            requiredLevel: 1,
            ingredients: [
                { type: "wood", amount: 20 }
            ],
            result: { type: "workbench", amount: 1 },
            baseStats: {
                durability: 500,
                craftingSpeed: 1.0
            }
        },
        forge: {
            name: "Forge",
            type: "building",
            category: "building",
            description: "A forge for smelting metals and crafting metal items.",
            craftingTime: 15000,
            requiredLevel: 5,
            ingredients: [
                { type: "stone", amount: 30 },
                { type: "iron_ore", amount: 10 }
            ],
            result: { type: "forge", amount: 1 },
            baseStats: {
                durability: 800,
                craftingSpeed: 1.2
            }
        },
        alchemy_table: {
            name: "Alchemy Table",
            type: "building",
            category: "building",
            description: "A specialized table for creating potions and alchemical items.",
            craftingTime: 12000,
            requiredLevel: 3,
            ingredients: [
                { type: "wood", amount: 15 },
                { type: "glass", amount: 5 }
            ],
            result: { type: "alchemy_table", amount: 1 },
            baseStats: {
                durability: 400,
                craftingSpeed: 1.0
            }
        }
    };
    
    // Crafting station definitions
    const craftingStations = {
        workbench: {
            name: "Workbench",
            description: "A basic crafting station for creating simple items.",
            categories: ["weapon", "armor", "tool"],
            craftingSpeedBonus: 0.0,
            qualityBonus: 0.0
        },
        forge: {
            name: "Forge",
            description: "A forge for smelting metals and crafting metal items.",
            categories: ["weapon", "armor", "tool"],
            craftingSpeedBonus: 0.2,
            qualityBonus: 0.1,
            specialBonus: {
                type: "metal",
                value: 0.15  // 15% bonus to metal items
            }
        },
        alchemy_table: {
            name: "Alchemy Table",
            description: "A specialized table for creating potions and alchemical items.",
            categories: ["potion"],
            craftingSpeedBonus: 0.1,
            qualityBonus: 0.05,
            specialBonus: {
                type: "potion",
                value: 0.2   // 20% potency bonus for potions
            }
        },
        tannery: {
            name: "Tannery",
            description: "A specialized station for treating hides and creating leather items.",
            categories: ["armor"],
            craftingSpeedBonus: 0.15,
            qualityBonus: 0.05,
            specialBonus: {
                type: "leather",
                value: 0.25  // 25% bonus to leather items
            }
        },
        enchanting_table: {
            name: "Enchanting Table",
            description: "A magical table for enchanting items with special properties.",
            categories: ["enchantment"],
            craftingSpeedBonus: 0.0,
            qualityBonus: 0.2,
            specialBonus: {
                type: "magic",
                value: 0.3   // 30% bonus to magical effects
            }
        }
    };
    
    // In-progress crafting
    const craftingQueue = [];
    let currentlyCrafting = false;
    
    // Initialize crafting system
    Game.gameplay.crafting.init = function() {
        console.log('Initializing crafting system');
        loadDiscoveredRecipes();
        setupEventListeners();
        return Promise.resolve();
    };
    
    // Update crafting (called each frame)
    Game.gameplay.crafting.update = function(deltaTime) {
        updateCraftingQueue(deltaTime);
    };
    
    // Get all available recipes
    Game.gameplay.crafting.getAvailableRecipes = function(stationType = null, category = null) {
        const availableRecipes = [];
        const playerLevel = Game.gameplay.player ? Game.gameplay.player.getStats().level : 1;
        
        for (const [recipeId, recipe] of Object.entries(recipes)) {
            // Check level requirement
            if (recipe.requiredLevel > playerLevel) {
                continue;
            }
            
            // Check station compatibility
            if (stationType && recipe.stationTypes && !recipe.stationTypes.includes(stationType)) {
                continue;
            }
            
            // Check category filter
            if (category && category !== 'all' && recipe.category !== category) {
                continue;
            }
            
            // Add to available recipes
            availableRecipes.push({
                id: recipeId,
                ...recipe,
                canCraft: checkCanCraftRecipe(recipe)
            });
        }
        
        return availableRecipes;
    };
    
    // Check if a recipe can be crafted
    Game.gameplay.crafting.checkCanCraftRecipe = function(recipeId) {
        const recipe = recipes[recipeId];
        if (!recipe) return false;
        
        return checkCanCraftRecipe(recipe);
    };
    
    // Craft an item
    Game.gameplay.crafting.craftItem = function(recipeId, quantity = 1) {
        const recipe = recipes[recipeId];
        if (!recipe) {
            console.error('Recipe not found:', recipeId);
            return false;
        }
        
        // Check if recipe can be crafted
        if (!checkCanCraftRecipe(recipe)) {
            Game.engine.ui.showNotification('Cannot craft this item - missing ingredients or required station', 'error');
            return false;
        }
        
        // Check crafting level
        const playerStats = Game.gameplay.player.getStats();
        if (recipe.requiredLevel > playerStats.level) {
            Game.engine.ui.showNotification(`Required crafting level: ${recipe.requiredLevel}`, 'error');
            return false;
        }
        
        // Add recipe to discovered
        if (!discoveredRecipes.has(recipeId)) {
            discoverRecipe(recipeId);
        }
        
        // Consume resources
        consumeIngredients(recipe, quantity);
        
        // Calculate crafting time based on recipe, station, and player skills
        let craftingTimeTotal = recipe.craftingTime * quantity;
        
        // Apply station bonuses
        if (activeCraftingStation) {
            const station = craftingStations[activeCraftingStation];
            if (station) {
                craftingTimeTotal *= (1 - station.craftingSpeedBonus);
            }
        }
        
        // Apply player skill bonuses
        // TODO: Apply crafting skill bonuses
        
        // Add to crafting queue
        const craftingJob = {
            recipeId: recipeId,
            recipe: recipe,
            quantity: quantity,
            timeRemaining: craftingTimeTotal,
            totalTime: craftingTimeTotal,
            startTime: Date.now(),
            completed: false
        };
        
        craftingQueue.push(craftingJob);
        
        // Start crafting process if not already in progress
        if (!currentlyCrafting) {
            startCrafting();
        }
        
        // Notify UI
        Game.engine.ui.showNotification(`Crafting ${recipe.name} x${quantity}`, 'crafting');
        Game.engine.ui.updateCraftingQueue(craftingQueue);
        
        return true;
    };
    
    // Set active crafting station
    Game.gameplay.crafting.setActiveCraftingStation = function(stationType) {
        activeCraftingStation = stationType;
        
        // Update UI
        Game.engine.ui.showNotification(`Using ${craftingStations[stationType]?.name || stationType}`, 'info');
        Game.engine.ui.updateCraftingInterface(stationType);
        
        // Emit event
        Game.engine.events.emit('crafting:stationChanged', { stationType });
        
        return true;
    };
    
    // Get crafting queue
    Game.gameplay.crafting.getCraftingQueue = function() {
        return [...craftingQueue];
    };
    
    // Cancel a crafting job
    Game.gameplay.crafting.cancelCrafting = function(index) {
        if (index >= 0 && index < craftingQueue.length) {
            const job = craftingQueue[index];
            
            // Refund ingredients if the job hasn't started processing yet
            if (index > 0 || (index === 0 && !currentlyCrafting)) {
                refundIngredients(job.recipe, job.quantity);
            }
            
            // Remove from queue
            craftingQueue.splice(index, 1);
            
            // Update UI
            Game.engine.ui.updateCraftingQueue(craftingQueue);
            
            // Emit event
            Game.engine.events.emit('crafting:canceled', { recipeId: job.recipeId });
            
            return true;
        }
        
        return false;
    };
    
    // Check if player can craft a recipe
    function checkCanCraftRecipe(recipe) {
        // Check if player has required station
        if (recipe.stationTypes && recipe.stationTypes.length > 0) {
            if (!activeCraftingStation || !recipe.stationTypes.includes(activeCraftingStation)) {
                return false;
            }
        }
        
        // Check if player has all ingredients
        const gameState = Game.engine.getState();
        const resources = gameState.base.resources;
        
        for (const ingredient of recipe.ingredients) {
            if (!resources[ingredient.type] || resources[ingredient.type] < ingredient.amount) {
                return false;
            }
        }
        
        return true;
    }
    
    // Consume ingredients from inventory
    function consumeIngredients(recipe, quantity = 1) {
        const gameState = Game.engine.getState();
        
        // Consume resources
        for (const ingredient of recipe.ingredients) {
            const totalAmount = ingredient.amount * quantity;
            gameState.base.resources[ingredient.type] -= totalAmount;
        }
        
        // Update game state
        Game.engine.setState(gameState);
        
        // Update UI
        Game.engine.ui.updateResourceDisplay();
    }
    
    // Refund ingredients to inventory
    function refundIngredients(recipe, quantity = 1) {
        const gameState = Game.engine.getState();
        
        // Refund resources
        for (const ingredient of recipe.ingredients) {
            const totalAmount = ingredient.amount * quantity;
            gameState.base.resources[ingredient.type] += totalAmount;
        }
        
        // Update game state
        Game.engine.setState(gameState);
        
        // Update UI
        Game.engine.ui.updateResourceDisplay();
    }
    
    // Start the crafting process
    function startCrafting() {
        if (craftingQueue.length === 0 || currentlyCrafting) {
            return;
        }
        
        currentlyCrafting = true;
        const job = craftingQueue[0];
        
        // Play crafting sound based on station type
        if (activeCraftingStation) {
            Game.audio.playSound(`crafting_${activeCraftingStation}`, { loop: true });
        } else {
            Game.audio.playSound('crafting_generic', { loop: true });
        }
        
        // Create crafting effect
        if (Game.engine.particles) {
            // Get crafting position (from station or player)
            let position;
            const craftingStationEntity = document.querySelector(`[data-station-type="${activeCraftingStation}"]`);
            
            if (craftingStationEntity) {
                position = craftingStationEntity.getAttribute('position');
            } else {
                position = Game.gameplay.player.getPosition();
            }
            
            // Create appropriate particle effect
            let effectType;
            switch (activeCraftingStation) {
                case 'forge':
                    effectType = 'fire';
                    break;
                case 'alchemy_table':
                    effectType = 'magic';
                    break;
                case 'enchanting_table':
                    effectType = 'sparkle';
                    break;
                default:
                    effectType = 'dust';
            }
            
            Game.engine.particles.createEffect(effectType, position, {
                duration: job.timeRemaining,
                scale: 0.5
            });
        }
    }
    
    // Complete a crafting job
    function completeCrafting(job) {
        // Stop crafting sounds
        Game.audio.stopSound(`crafting_${activeCraftingStation}`);
        Game.audio.stopSound('crafting_generic');
        
        // Create the resulting item
        const result = job.recipe.result;
        
        // Add to inventory or resources
        if (result.type.startsWith("building_")) {
            // It's a building piece or blueprint
            if (Game.gameplay.building) {
                // Add building template to available buildings
                Game.gameplay.building.addBuildingTemplate(result.type, job.recipe.baseStats);
            }
        } else if (job.recipe.type === 'building') {
            // It's a full building (crafting station, etc.)
            if (Game.gameplay.building) {
                // Add building to player's available buildings
                Game.gameplay.building.addBuildingTemplate(result.type, job.recipe.baseStats);
            }
        } else {
            // Regular item - add to inventory
            for (let i = 0; i < result.amount * job.quantity; i++) {
                // Generate item with stats based on recipe and quality
                const quality = calculateItemQuality(job.recipe);
                const item = generateCraftedItem(job.recipe, quality);
                
                // Add to inventory
                if (Game.gameplay.inventory) {
                    Game.gameplay.inventory.addItem(item);
                }
            }
        }
        
        // Add crafting XP - placeholder for future skill system
        // if (Game.gameplay.skills) {
        //     Game.gameplay.skills.addSkillXP('crafting', job.recipe.requiredLevel * 10);
        // }
        
        // Show notification
        Game.engine.ui.showNotification(`Crafted ${job.recipe.name} x${job.quantity}`, 'success');
        
        // Play completion sound
        Game.audio.playSound('crafting_complete');
        
        // Emit event
        Game.engine.events.emit('crafting:complete', { 
            recipeId: job.recipeId, 
            quantity: job.quantity 
        });
        
        // Remove from queue
        craftingQueue.shift();
        
        // Update UI
        Game.engine.ui.updateCraftingQueue(craftingQueue);
        
        // Process next item if queue not empty
        if (craftingQueue.length > 0) {
            startCrafting();
        } else {
            currentlyCrafting = false;
        }
    }
    
    // Update crafting queue
    function updateCraftingQueue(deltaTime) {
        if (craftingQueue.length === 0 || !currentlyCrafting) {
            return;
        }
        
        // Get current job
        const job = craftingQueue[0];
        
        // Update time remaining
        job.timeRemaining -= deltaTime;
        
        // Check if crafting is complete
        if (job.timeRemaining <= 0) {
            job.completed = true;
            completeCrafting(job);
        }
        
        // Update UI occasionally (not every frame)
        if (Math.random() < 0.05) {  // roughly every 20 frames
            Game.engine.ui.updateCraftingProgress(1 - (job.timeRemaining / job.totalTime));
        }
    }
    
    // Calculate item quality based on recipe, station, and player skills
    function calculateItemQuality(recipe) {
        // Base quality is random between 0.8 and 1.0
        let quality = 0.8 + Math.random() * 0.2;
        
        // Apply station quality bonus
        if (activeCraftingStation) {
            const station = craftingStations[activeCraftingStation];
            if (station) {
                quality += station.qualityBonus;
                
                // Apply special bonuses
                if (station.specialBonus) {
                    if (recipe.type === station.specialBonus.type || 
                        recipe.category === station.specialBonus.type) {
                        quality += station.specialBonus.value;
                    }
                }
            }
        }
        
        // Apply player skill bonuses
        // TODO: Implement skill system
        
        // Cap quality between 0.5 and 2.0
        return Math.max(0.5, Math.min(2.0, quality));
    }
    
    // Generate an item based on recipe and quality
    function generateCraftedItem(recipe, quality) {
        // Create base item
        const item = {
            id: `${recipe.result.type}_${Date.now()}`,
            name: recipe.name,
            type: recipe.type,
            category: recipe.category,
            description: recipe.description,
            quality: quality,
            stats: {},
            crafted: true,
            crafterName: Game.gameplay.player.getState().name || "Player"
        };
        
        // Add appropriate stats based on item type
        if (recipe.baseStats) {
            for (const [statName, baseValue] of Object.entries(recipe.baseStats)) {
                if (typeof baseValue === 'object' && baseValue.min !== undefined && baseValue.max !== undefined) {
                    // Range-based stat (like damage)
                    item.stats[statName] = {
                        min: Math.round(baseValue.min * quality * 10) / 10,
                        max: Math.round(baseValue.max * quality * 10) / 10
                    };
                } else {
                    // Fixed stat with quality modifier
                    item.stats[statName] = Math.round(baseValue * quality * 10) / 10;
                }
            }
        }
        
        // Set quality text
        if (quality < 0.8) {
            item.qualityText = "Poor";
        } else if (quality < 1.0) {
            item.qualityText = "Common";
        } else if (quality < 1.3) {
            item.qualityText = "Good";
        } else if (quality < 1.7) {
            item.qualityText = "Excellent";
        } else {
            item.qualityText = "Masterwork";
        }
        
        return item;
    }
    
    // Discover a new recipe
    function discoverRecipe(recipeId) {
        if (discoveredRecipes.has(recipeId)) {
            return false;
        }
        
        discoveredRecipes.add(recipeId);
        
        // Update game state
        const gameState = Game.engine.getState();
        if (!gameState.player.discoveredRecipes) {
            gameState.player.discoveredRecipes = [];
        }
        gameState.player.discoveredRecipes.push(recipeId);
        Game.engine.setState(gameState);
        
        // Show notification
        Game.engine.ui.showNotification(`Recipe discovered: ${recipes[recipeId].name}`, 'discover');
        
        // Play discovery sound
        Game.audio.playSound('recipe_discover');
        
        // Emit event
        Game.engine.events.emit('recipe:discovered', { recipeId });
        
        return true;
    }
    
    // Load discovered recipes from game state
    function loadDiscoveredRecipes() {
        const gameState = Game.engine.getState();
        
        if (gameState.player && gameState.player.discoveredRecipes) {
            for (const recipeId of gameState.player.discoveredRecipes) {
                discoveredRecipes.add(recipeId);
            }
        }
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Listen for station interaction events
        Game.engine.events.subscribe('station:interact', (data) => {
            Game.gameplay.crafting.setActiveCraftingStation(data.stationType);
        });
        
        // Listen for building placement events
        Game.engine.events.subscribe('building:placed', (data) => {
            if (craftingStations[data.buildingType]) {
                // A crafting station was placed, automatically set it as active when near
                const playerPos = Game.gameplay.player.getPosition();
                const buildingPos = data.position;
                
                const distance = Math.sqrt(
                    Math.pow(playerPos.x - buildingPos.x, 2) +
                    Math.pow(playerPos.z - buildingPos.z, 2)
                );
                
                if (distance < 5) {  // Within 5 units
                    Game.gameplay.crafting.setActiveCraftingStation(data.buildingType);
                }
            }
        });
    }
})();
