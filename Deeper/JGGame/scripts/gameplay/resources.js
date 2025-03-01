/**
 * Resource System
 * 
 * Manages resource nodes, harvesting mechanics, resource inventory, and world interactivity.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.resources = {};

(function() {
    // Resource nodes in the world
    const resourceNodes = new Map();
    let nodeIdCounter = 0;
    
    // Resource types
    const resourceTypes = {
        wood: {
            name: "Wood",
            description: "A common building material harvested from trees.",
            category: "basic",
            rarity: "common",
            model: "tree",
            harvestTool: "axe",
            baseHarvestTime: 2000, // ms
            baseYield: { min: 1, max: 3 },
            respawnTime: 120000, // 2 minutes
            exhaustedModel: "stump",
            harvestSound: "chop_wood",
            harvestEffect: "wood_chips",
            texture: "resources/wood",
            variations: 3,
            maxStackSize: 100
        },
        stone: {
            name: "Stone",
            description: "Hard rock useful for crafting and building foundations.",
            category: "basic",
            rarity: "common",
            model: "rock",
            harvestTool: "pickaxe",
            baseHarvestTime: 2500,
            baseYield: { min: 1, max: 3 },
            respawnTime: 180000, // 3 minutes
            exhaustedModel: "small_rock",
            harvestSound: "hit_rock",
            harvestEffect: "rock_dust",
            texture: "resources/stone",
            variations: 2,
            maxStackSize: 100
        },
        iron_ore: {
            name: "Iron Ore",
            description: "Raw iron that can be smelted into ingots.",
            category: "ore",
            rarity: "uncommon",
            model: "ore_vein",
            harvestTool: "pickaxe",
            baseHarvestTime: 3500,
            baseYield: { min: 1, max: 2 },
            respawnTime: 300000, // 5 minutes
            exhaustedModel: "depleted_vein",
            harvestSound: "mining_ore",
            harvestEffect: "ore_sparks",
            texture: "resources/iron_ore",
            variations: 1,
            maxStackSize: 50
        },
        gold_ore: {
            name: "Gold Ore",
            description: "Precious metal with many valuable uses.",
            category: "ore",
            rarity: "rare",
            model: "gold_vein",
            harvestTool: "pickaxe",
            baseHarvestTime: 5000,
            baseYield: { min: 1, max: 1 },
            respawnTime: 600000, // 10 minutes
            exhaustedModel: "depleted_vein",
            harvestSound: "mining_ore",
            harvestEffect: "gold_sparkle",
            texture: "resources/gold_ore",
            variations: 1,
            maxStackSize: 25
        },
        berries: {
            name: "Berries",
            description: "Edible fruits that restore a small amount of health.",
            category: "food",
            rarity: "common",
            model: "berry_bush",
            harvestTool: "hand",
            baseHarvestTime: 1000,
            baseYield: { min: 2, max: 5 },
            respawnTime: 240000, // 4 minutes
            exhaustedModel: "empty_bush",
            harvestSound: "pick_berries",
            harvestEffect: "leaf_rustle",
            texture: "resources/berries",
            variations: 2,
            maxStackSize: 50,
            consumable: true,
            healthRestored: 5
        },
        herbs: {
            name: "Herbs",
            description: "Plants with alchemical and medicinal properties.",
            category: "alchemy",
            rarity: "uncommon",
            model: "herbs",
            harvestTool: "hand",
            baseHarvestTime: 1500,
            baseYield: { min: 1, max: 3 },
            respawnTime: 300000, // 5 minutes
            exhaustedModel: "harvested_herbs",
            harvestSound: "pick_herbs",
            harvestEffect: "herb_sparkle",
            texture: "resources/herbs",
            variations: 4,
            maxStackSize: 30
        },
        leather: {
            name: "Leather",
            description: "Tanned animal hide used for crafting armor and tools.",
            category: "crafting",
            rarity: "uncommon",
            texture: "resources/leather",
            variations: 1,
            maxStackSize: 30,
            // Not directly harvestable, obtained from animals
            obtainedFrom: "animals"
        },
        cloth: {
            name: "Cloth",
            description: "Woven fibers used for crafting clothing and furnishings.",
            category: "crafting",
            rarity: "uncommon",
            texture: "resources/cloth",
            variations: 3,
            maxStackSize: 30,
            // Not directly harvestable, crafted from other resources
            craftedFrom: ["fibers"]
        }
    };
    
    // Initialize resource system
    Game.gameplay.resources.init = function() {
        console.log('Initializing resource system');
        
        // Set up event listeners
        setupEventListeners();
        
        return Promise.resolve();
    };
    
    // Update resource system (called each frame)
    Game.gameplay.resources.update = function(deltaTime) {
        // Check for resource respawns
        checkResourceRespawns();
        
        // Check for nearby resources
        checkNearbyResources();
    };
    
    // Generate resource nodes for a biome
    Game.gameplay.resources.generateResourceNodes = function(biome, position, radius, count) {
        const nodes = [];
        
        // Get appropriate resource types for this biome
        const biomeResources = getBiomeResources(biome);
        
        for (let i = 0; i < count; i++) {
            // Choose a random resource type based on rarity
            const resourceType = chooseResourceForBiome(biomeResources, biome);
            
            if (!resourceType) continue;
            
            // Choose a random position within the radius
            const nodePos = randomPositionInCircle(position, radius);
            
            // Create and add the resource node
            const nodeId = createResourceNode(resourceType, nodePos);
            if (nodeId) {
                nodes.push(nodeId);
            }
        }
        
        return nodes;
    };
    
    // Create a single resource node
    Game.gameplay.resources.createResourceNode = function(resourceType, position) {
        return createResourceNode(resourceType, position);
    };
    
    // Harvest a resource node
    Game.gameplay.resources.harvestResource = function(nodeId) {
        const resourceNode = resourceNodes.get(nodeId);
        if (!resourceNode || resourceNode.exhausted) {
            return {
                success: false,
                reason: resourceNode ? 'exhausted' : 'nonexistent'
            };
        }
        
        const resourceType = resourceTypes[resourceNode.type];
        if (!resourceType) {
            return { success: false, reason: 'unknown_type' };
        }
        
        // Check if player has the correct tool
        const requiredTool = resourceType.harvestTool;
        const hasCorrectTool = checkPlayerHasTool(requiredTool);
        
        // Calculate harvest time based on tool
        const harvestTime = calculateHarvestTime(resourceType, hasCorrectTool);
        
        // Start the harvesting process
        startHarvesting(resourceNode, harvestTime);
        
        return { 
            success: true, 
            harvestTime: harvestTime,
            requiredTool: requiredTool,
            hasCorrectTool: hasCorrectTool
        };
    };
    
    // Cancel harvesting
    Game.gameplay.resources.cancelHarvesting = function() {
        if (activeHarvestNode) {
            clearTimeout(harvestTimer);
            harvestTimer = null;
            activeHarvestNode = null;
            
            // Update UI
            Game.engine.ui.hideProgressBar();
            
            return true;
        }
        
        return false;
    };
    
    // Get all resource nodes
    Game.gameplay.resources.getAllResourceNodes = function() {
        return Array.from(resourceNodes.values());
    };
    
    // Get a resource node by ID
    Game.gameplay.resources.getResourceNode = function(nodeId) {
        return resourceNodes.get(nodeId);
    };
    
    // Get resource info by type
    Game.gameplay.resources.getResourceInfo = function(resourceType) {
        return resourceTypes[resourceType];
    };
    
    // Get all resource types
    Game.gameplay.resources.getAllResourceTypes = function() {
        return { ...resourceTypes };
    };
    
    // Track active harvesting state
    let activeHarvestNode = null;
    let harvestTimer = null;
    
    // Create a resource node
    function createResourceNode(resourceType, position) {
        const resourceData = resourceTypes[resourceType];
        if (!resourceData) {
            console.error(`Unknown resource type: ${resourceType}`);
            return null;
        }
        
        // Generate unique ID
        const nodeId = `resource_${nodeIdCounter++}`;
        
        // Choose a random variation
        const variation = Math.floor(Math.random() * (resourceData.variations || 1));
        
        // Create node object
        const resourceNode = {
            id: nodeId,
            type: resourceType,
            name: resourceData.name,
            position: { ...position },
            variation: variation,
            exhausted: false,
            harvestStartTime: 0,
            respawnTime: 0,
            entity: null
        };
        
        // Create visual entity
        resourceNode.entity = createResourceEntity(resourceNode);
        
        // Add to resource nodes
        resourceNodes.set(nodeId, resourceNode);
        
        console.log(`Created resource node: ${resourceNode.name} at position:`, position);
        
        return nodeId;
    }
    
    // Start harvesting process
    function startHarvesting(resourceNode, harvestTime) {
        // Set active harvest node
        activeHarvestNode = resourceNode;
        
        // Show progress bar
        Game.engine.ui.showProgressBar('Harvesting...', harvestTime);
        
        // Play harvesting sound
        const resourceType = resourceTypes[resourceNode.type];
        Game.audio.playSound(resourceType.harvestSound, {
            position: resourceNode.position,
            loop: true
        });
        
        // Play harvesting animation
        playHarvestingAnimation(resourceNode);
        
        // Set harvest timer
        harvestTimer = setTimeout(() => {
            // Harvest complete!
            completeHarvesting(resourceNode);
            
            // Clear active harvest
            activeHarvestNode = null;
            harvestTimer = null;
        }, harvestTime);
        
        return true;
    }
    
    // Complete harvesting process
    function completeHarvesting(resourceNode) {
        // Stop harvesting sound
        const resourceType = resourceTypes[resourceNode.type];
        Game.audio.stopSound(resourceType.harvestSound);
        
        // Play completion sound
        Game.audio.playSound('harvest_complete');
        
        // Generate resource yield
        const yield = calculateResourceYield(resourceNode);
        
        // Add to player inventory
        for (let i = 0; i < yield; i++) {
            Game.gameplay.inventory.addResource(resourceNode.type, 1);
        }
        
        // Create harvest particle effect
        if (Game.engine.particles && resourceType.harvestEffect) {
            Game.engine.particles.createEffect(resourceType.harvestEffect, resourceNode.position);
        }
        
        // Mark resource as exhausted
        exhaustResource(resourceNode);
        
        // Hide progress bar
        Game.engine.ui.hideProgressBar();
        
        // Show notification
        Game.engine.ui.showNotification(`Harvested ${yield} ${resourceNode.name}`, 'resource');
        
        // Emit event
        Game.engine.events.emit('resource:harvested', {
            type: resourceNode.type,
            amount: yield,
            position: resourceNode.position
        });
    }
    
    // Mark resource as exhausted
    function exhaustResource(resourceNode) {
        resourceNode.exhausted = true;
        resourceNode.respawnTime = Date.now() + resourceTypes[resourceNode.type].respawnTime;
        
        // Update visual appearance
        updateNodeAppearance(resourceNode);
        
        // Disable interaction
        if (resourceNode.entity) {
            resourceNode.entity.classList.remove('interactive');
        }
    }
    
    // Respawn a resource
    function respawnResource(resourceNode) {
        resourceNode.exhausted = false;
        resourceNode.respawnTime = 0;
        
        // Update visual appearance
        updateNodeAppearance(resourceNode);
        
        // Enable interaction
        if (resourceNode.entity) {
            resourceNode.entity.classList.add('interactive');
        }
        
        // Create respawn effect
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('resource_respawn', resourceNode.position, {
                color: getResourceColor(resourceNode.type)
            });
        }
        
        // Emit event
        Game.engine.events.emit('resource:respawned', {
            id: resourceNode.id,
            type: resourceNode.type,
            position: resourceNode.position
        });
    }
    
    // Check for resource respawns
    function checkResourceRespawns() {
        const currentTime = Date.now();
        
        // Check all exhausted nodes
        for (const [id, node] of resourceNodes) {
            if (node.exhausted && node.respawnTime > 0 && currentTime >= node.respawnTime) {
                respawnResource(node);
            }
        }
    }
    
    // Check which resources are near the player
    function checkNearbyResources() {
        if (!Game.gameplay.player) return;
        
        const playerPos = Game.gameplay.player.getPosition();
        const interactionRadius = 5; // 5 meters
        
        // Find nearby resources
        const nearbyResources = [];
        
        for (const [id, node] of resourceNodes) {
            if (node.exhausted) continue;
            
            const distance = calculateDistance(playerPos, node.position);
            if (distance <= interactionRadius) {
                nearbyResources.push({
                    id: id,
                    type: node.type,
                    name: node.name,
                    distance: distance
                });
            }
        }
        
        // Sort by distance
        nearbyResources.sort((a, b) => a.distance - b.distance);
        
        // Update UI with closest resource
        if (nearbyResources.length > 0) {
            const closest = nearbyResources[0];
            Game.engine.ui.showInteractionPrompt(`Press E to harvest ${closest.name}`);
        } else {
            Game.engine.ui.hideInteractionPrompt();
        }
    }
    
    // Calculate resource yield based on node type and player skills
    function calculateResourceYield(resourceNode) {
        const resourceType = resourceTypes[resourceNode.type];
        if (!resourceType) return 0;
        
        // Base yield
        let minYield = resourceType.baseYield.min;
        let maxYield = resourceType.baseYield.max;
        
        // Apply skill bonuses if applicable
        if (Game.gameplay.player && Game.gameplay.skills) {
            const gatheringSkill = Game.gameplay.skills.getSkillLevel('gathering');
            if (gatheringSkill > 0) {
                // 5% increase per level
                const bonus = 1 + (gatheringSkill * 0.05);
                minYield = Math.ceil(minYield * bonus);
                maxYield = Math.ceil(maxYield * bonus);
            }
            
            // Check for resource-specific skills
            const resourceSkill = Game.gameplay.skills.getSkillLevel(resourceType.category);
            if (resourceSkill > 0) {
                // Additional 3% per level for specific resource types
                const specificBonus = 1 + (resourceSkill * 0.03);
                minYield = Math.ceil(minYield * specificBonus);
                maxYield = Math.ceil(maxYield * specificBonus);
            }
        }
        
        // Random yield within range
        return Math.floor(Math.random() * (maxYield - minYield + 1)) + minYield;
    }
    
    // Calculate harvest time based on tool and skills
    function calculateHarvestTime(resourceType, hasCorrectTool) {
        let harvestTime = resourceType.baseHarvestTime;
        
        // Apply tool efficiency
        if (!hasCorrectTool) {
            // Harvesting without proper tool takes twice as long
            harvestTime *= 2;
        } else if (Game.gameplay.player && Game.gameplay.inventory) {
            // Check tool quality/level
            const currentTool = Game.gameplay.inventory.getEquippedTool();
            if (currentTool && currentTool.efficiency) {
                harvestTime /= currentTool.efficiency;
            }
        }
        
        // Apply skill bonuses if applicable
        if (Game.gameplay.player && Game.gameplay.skills) {
            const gatheringSkill = Game.gameplay.skills.getSkillLevel('gathering');
            if (gatheringSkill > 0) {
                // 4% faster per level
                harvestTime *= (1 - (gatheringSkill * 0.04));
            }
            
            // Check for resource-specific skills
            const resourceSkill = Game.gameplay.skills.getSkillLevel(resourceType.category);
            if (resourceSkill > 0) {
                // Additional 2% faster per level for specific resource types
                harvestTime *= (1 - (resourceSkill * 0.02));
            }
        }
        
        // Ensure minimum harvest time of 500ms
        return Math.max(500, harvestTime);
    }
    
    // Check if player has the correct harvesting tool equipped
    function checkPlayerHasTool(requiredTool) {
        if (requiredTool === 'hand') return true; // No tool needed
        
        if (Game.gameplay.player && Game.gameplay.inventory) {
            const equippedTool = Game.gameplay.inventory.getEquippedTool();
            return equippedTool && equippedTool.type === requiredTool;
        }
        
        return false;
    }
    
    // Play harvesting animation
    function playHarvestingAnimation(resourceNode) {
        const resourceType = resourceTypes[resourceNode.type];
        
        // Player animation
        if (Game.gameplay.player) {
            Game.gameplay.player.playAnimation('harvesting', {
                loop: true,
                duration: resourceType.baseHarvestTime
            });
        }
        
        // Resource node animation
        if (resourceNode.entity) {
            // Slight shaking effect
            const originalPosition = { ...resourceNode.position };
            
            const shake = () => {
                if (!resourceNode.entity) return;
                
                const offsetX = (Math.random() - 0.5) * 0.05;
                const offsetZ = (Math.random() - 0.5) * 0.05;
                
                resourceNode.entity.setAttribute('position', {
                    x: originalPosition.x + offsetX,
                    y: originalPosition.y,
                    z: originalPosition.z + offsetZ
                });
                
                if (activeHarvestNode === resourceNode) {
                    requestAnimationFrame(shake);
                } else {
                    // Reset position when done
                    resourceNode.entity.setAttribute('position', originalPosition);
                }
            };
            
            shake();
        }
        
        // Create ongoing particle effect
        if (Game.engine.particles && resourceType.harvestEffect) {
            Game.engine.particles.createEffect(resourceType.harvestEffect + '_ongoing', resourceNode.position, {
                duration: resourceType.baseHarvestTime,
                scale: 0.5
            });
        }
    }
    
    // Update visual appearance of resource node
    function updateNodeAppearance(resourceNode) {
        if (!resourceNode.entity) return;
        
        const resourceType = resourceTypes[resourceNode.type];
        const model = resourceNode.exhausted ? resourceType.exhaustedModel : resourceType.model;
        
        // Update model
        const modelEntity = resourceNode.entity.querySelector('.resource-model');
        if (modelEntity) {
            // Set appropriate model based on exhausted state
            if (resourceNode.exhausted) {
                modelEntity.setAttribute('geometry', 'primitive', resourceType.exhaustedModel || 'box');
                modelEntity.setAttribute('scale', '0.7 0.7 0.7'); // Smaller when exhausted
                
                // Adjust color to look depleted
                modelEntity.setAttribute('material', 'color', '#888888');
            } else {
                modelEntity.setAttribute('geometry', 'primitive', resourceType.model || 'box');
                modelEntity.setAttribute('scale', '1 1 1');
                
                // Reset to original color
                modelEntity.setAttribute('material', 'color', getResourceColor(resourceNode.type));
            }
        }
    }
    
    // Create a resource entity in the 3D world
    function createResourceEntity(resourceNode) {
        const resourcesContainer = document.getElementById('resources-container') || document.querySelector('a-scene');
        
        // Create entity
        const entity = document.createElement('a-entity');
        entity.id = resourceNode.id;
        entity.classList.add('resource', 'interactive');
        entity.setAttribute('position', resourceNode.position);
        entity.setAttribute('data-resource-id', resourceNode.id);
        entity.setAttribute('data-resource-type', resourceNode.type);
        entity.setAttribute('data-interact-type', 'resource');
        
        // Create model based on resource type
        const resourceType = resourceTypes[resourceNode.type];
        const modelEntity = document.createElement('a-entity');
        modelEntity.classList.add('resource-model');
        
        // Set geometry based on resource type
        const model = resourceType.model || 'box';
        
        switch (model) {
            case 'tree':
                modelEntity.setAttribute('geometry', { primitive: 'cylinder', radius: 0.3, height: 4 });
                modelEntity.setAttribute('position', { x: 0, y: 2, z: 0 });
                
                // Add foliage
                const foliage = document.createElement('a-entity');
                foliage.setAttribute('geometry', { primitive: 'sphere', radius: 1.5 });
                foliage.setAttribute('position', { x: 0, y: 3, z: 0 });
                foliage.setAttribute('material', { color: '#2D6E12' });
                modelEntity.appendChild(foliage);
                
                break;
                
            case 'rock':
                modelEntity.setAttribute('geometry', { 
                    primitive: 'sphere',
                    radius: 0.8 + (Math.random() * 0.4)
                });
                modelEntity.setAttribute('position', { x: 0, y: 0.4, z: 0 });
                break;
                
            case 'ore_vein':
                modelEntity.setAttribute('geometry', { primitive: 'box', width: 1.2, height: 1, depth: 1.2 });
                modelEntity.setAttribute('position', { x: 0, y: 0.5, z: 0 });
                
                // Add ore sparkles
                if (Game.engine.particles) {
                    Game.engine.particles.createEffect('ore_glint', {
                        x: resourceNode.position.x,
                        y: resourceNode.position.y + 0.5,
                        z: resourceNode.position.z
                    }, {
                        duration: Infinity,
                        scale: 0.5,
                        color: getResourceColor(resourceNode.type)
                    });
                }
                break;
                
            case 'berry_bush':
                modelEntity.setAttribute('geometry', { primitive: 'sphere', radius: 0.7 });
                modelEntity.setAttribute('position', { x: 0, y: 0.35, z: 0 });
                break;
                
            case 'herbs':
                modelEntity.setAttribute('geometry', { primitive: 'plane', width: 0.8, height: 0.4 });
                modelEntity.setAttribute('position', { x: 0, y: 0.2, z: 0 });
                modelEntity.setAttribute('rotation', { x: -90, y: 0, z: 0 });
                break;
                
            default:
                modelEntity.setAttribute('geometry', { primitive: 'box', width: 0.5, height: 0.5, depth: 0.5 });
                modelEntity.setAttribute('position', { x: 0, y: 0.25, z: 0 });
        }
        
        // Set material
        modelEntity.setAttribute('material', {
            color: getResourceColor(resourceNode.type),
            src: generateResourceTexture(resourceNode.type, resourceNode.variation),
            roughness: 0.8
        });
        
        entity.appendChild(modelEntity);
        
        // Add to scene
        resourcesContainer.appendChild(entity);
        
        return entity;
    }
    
    // Choose resource types for a biome
    function getBiomeResources(biome) {
        // Default resources that appear in all biomes
        const defaultResources = ['wood', 'stone', 'herbs'];
        
        // Biome-specific resources
        const biomeResourceMap = {
            forest: ['wood', 'stone', 'berries', 'herbs'],
            plains: ['stone', 'herbs', 'berries'],
            mountain: ['stone', 'iron_ore', 'gold_ore'],
            swamp: ['wood', 'herbs', 'poison_mushroom'],
            desert: ['stone', 'cactus_fruit', 'sand'],
            tundra: ['stone', 'ice', 'frost_herbs'],
            volcanic: ['stone', 'obsidian', 'fire_crystal']
        };
        
        return biomeResourceMap[biome] || defaultResources;
    }
    
    // Choose a random resource type for a biome, weighted by rarity
    function chooseResourceForBiome(biomeResources, biome) {
        // If no biome resources specified, use default list
        if (!biomeResources || biomeResources.length === 0) {
            biomeResources = ['wood', 'stone', 'herbs'];
        }
        
        // Filter to ensure we only use valid resource types
        const validResources = biomeResources.filter(type => resourceTypes[type]);
        
        if (validResources.length === 0) return null;
        
        // Assign weights based on rarity
        const weightedResources = validResources.map(type => {
            const resourceData = resourceTypes[type];
            let weight;
            
            // Assign weight based on rarity
            switch (resourceData.rarity) {
                case 'common':
                    weight = 10;
                    break;
                case 'uncommon':
                    weight = 5;
                    break;
                case 'rare':
                    weight = 2;
                    break;
                case 'epic':
                    weight = 1;
                    break;
                default:
                    weight = 10;
            }
            
            return { type, weight };
        });
        
        // Calculate total weight
        const totalWeight = weightedResources.reduce((sum, resource) => sum + resource.weight, 0);
        
        // Choose random weighted resource
        let randomValue = Math.random() * totalWeight;
        for (const resource of weightedResources) {
            randomValue -= resource.weight;
            if (randomValue <= 0) {
                return resource.type;
            }
        }
        
        // Fallback
        return validResources[0];
    }
    
    // Generate a random position within a circle
    function randomPositionInCircle(center, radius) {
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.sqrt(Math.random()) * radius; // sqrt for uniform distribution
        
        return {
            x: center.x + Math.cos(angle) * distance,
            y: center.y,
            z: center.z + Math.sin(angle) * distance
        };
    }
    
    // Calculate distance between two positions
    function calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dy = pos2.y - pos1.y;
        const dz = pos2.z - pos1.z;
        
        return Math.sqrt(dx * dx + dy * dy + dz * dz);
    }
    
    // Get a color based on resource type
    function getResourceColor(resourceType) {
        switch (resourceType) {
            case 'wood':
                return '#8C5A3C';
            case 'stone':
                return '#A0A0A0';
            case 'iron_ore':
                return '#B37A5C';
            case 'gold_ore':
                return '#DDA943';
            case 'berries':
                return '#CC3333';
            case 'herbs':
                return '#44AA44';
            default:
                return '#AAAAAA';
        }
    }
    
    // Generate a texture for a resource
    function generateResourceTexture(resourceType, variation) {
        // Call texture generation system if available
        if (Game.generation && Game.generation.textures) {
            return Game.generation.textures.generateResourceTexture(resourceType, variation);
        }
        
        // Fallback: return a basic texture URL
        return `#${resourceType}_texture_${variation || 0}`;
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Listen for player interaction with resources
        Game.engine.events.subscribe('player:interact', data => {
            if (data.type === 'resource' && data.id) {
                Game.gameplay.resources.harvestResource(data.id);
            }
        });
        
        // Listen for player movement to cancel harvesting if moved too far
        Game.engine.events.subscribe('player:move', data => {
            if (activeHarvestNode) {
                const distance = calculateDistance(data.position, activeHarvestNode.position);
                if (distance > 3) {  // 3 meter range
                    Game.gameplay.resources.cancelHarvesting();
                    Game.engine.ui.showNotification('Harvesting canceled - moved too far away', 'warning');
                }
            }
        });
        
        // Listen for biome generation to add resources
        Game.engine.events.subscribe('world:biomeGenerated', data => {
            // Add appropriate resources to the biome
            const resourceCount = Math.floor(data.size / 100); // 1 resource per 100 sq meters
            Game.gameplay.resources.generateResourceNodes(
                data.biome, 
                data.position, 
                data.size / 2,  // Use half of biome size as radius
                resource