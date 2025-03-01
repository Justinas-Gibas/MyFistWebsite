/**
 * Building System
 * 
 * Handles building placement, construction, upgrades, and functionality
 * including defensive structures and resource production buildings.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.building = {};

(function() {
    // Building state
    let inBuildMode = false;
    let currentBuildingType = null;
    let buildPreviewEntity = null;
    let validPlacement = false;
    let gridSize = 1; // 1 meter grid
    let rotationAngle = 0; // Current rotation for placement preview
    let lastGridPosition = { x: 0, y: 0, z: 0 };
    
    // Building templates
    const buildingTemplates = {
        // Defensive Structures
        wall: {
            name: "Wall",
            description: "A basic defensive wall to keep enemies out.",
            category: "defense",
            size: { x: 2, y: 3, z: 0.5 },
            hitpoints: 200,
            resources: { 
                wood: 10, 
                stone: 5 
            },
            model: "wall",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 20 // degrees
            },
            upgrades: [
                {
                    name: "Stone Wall",
                    hitpoints: 500,
                    resources: { stone: 20 }
                },
                {
                    name: "Reinforced Wall",
                    hitpoints: 1000,
                    resources: { stone: 20, iron_ingot: 5 }
                }
            ]
        },
        tower: {
            name: "Watch Tower",
            description: "A tall structure for spotting enemies at a distance.",
            category: "defense",
            size: { x: 3, y: 6, z: 3 },
            hitpoints: 300,
            resources: { 
                wood: 30, 
                stone: 10 
            },
            model: "tower",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 10 // degrees
            },
            upgrades: [
                {
                    name: "Guard Tower",
                    hitpoints: 500,
                    resources: { wood: 25, stone: 30 }
                },
                {
                    name: "Defense Tower",
                    hitpoints: 800,
                    resources: { stone: 50, iron_ingot: 10 }
                }
            ],
            detectionRange: 30,
            garrisonPositions: 2 // NPCs can occupy this tower
        },
        spike_trap: {
            name: "Spike Trap",
            description: "Damages enemies who walk over it.",
            category: "trap",
            size: { x: 2, y: 0.5, z: 2 },
            hitpoints: 100,
            resources: { 
                wood: 15, 
                iron_ingot: 3 
            },
            model: "spike_trap",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 15 // degrees
            },
            damage: 10,
            trapResetTime: 5000, // milliseconds
            upgrades: [
                {
                    name: "Iron Spike Trap",
                    damage: 25,
                    resources: { iron_ingot: 10 }
                }
            ]
        },
        
        // Crafting Stations
        workbench: {
            name: "Workbench",
            description: "A basic crafting station for creating tools and simple items.",
            category: "crafting",
            size: { x: 2, y: 1, z: 1 },
            hitpoints: 100,
            resources: {
                wood: 20
            },
            model: "workbench",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 5, // degrees
                indoors: false // can be placed outdoors
            },
            craftingStationType: "workbench",
            craftingSpeed: 1.0,
            upgradeLevel: 1,
            upgrades: [
                {
                    name: "Improved Workbench",
                    craftingSpeed: 1.2,
                    resources: { wood: 30, iron_ingot: 2 }
                },
                {
                    name: "Master Workbench",
                    craftingSpeed: 1.5,
                    resources: { wood: 40, iron_ingot: 5 }
                }
            ],
            interactionRange: 2 // meters
        },
        forge: {
            name: "Forge",
            description: "A metalworking station for creating weapons and armor.",
            category: "crafting",
            size: { x: 3, y: 2, z: 2 },
            hitpoints: 200,
            resources: {
                stone: 30,
                iron_ore: 10,
                wood: 15
            },
            model: "forge",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 5, // degrees
                indoors: false // should be placed outdoors for ventilation
            },
            craftingStationType: "forge",
            craftingSpeed: 1.0,
            upgradeLevel: 1,
            upgrades: [
                {
                    name: "Improved Forge",
                    craftingSpeed: 1.3,
                    resources: { stone: 40, iron_ingot: 15 }
                },
                {
                    name: "Master Forge",
                    craftingSpeed: 1.7,
                    resources: { stone: 60, iron_ingot: 30, gold_ore: 5 }
                }
            ],
            interactionRange: 2 // meters
        },
        
        // Resource Production
        wood_harvester: {
            name: "Wood Harvester",
            description: "Automatically harvests wood from nearby trees over time.",
            category: "production",
            size: { x: 3, y: 2, z: 3 },
            hitpoints: 150,
            resources: {
                wood: 25,
                iron_ingot: 2
            },
            model: "wood_harvester",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 15, // degrees
                requiresNearbyResource: "wood", // must be near trees
                resourceCheckRadius: 10 // meters to check for trees
            },
            productionRate: {
                resource: "wood",
                amountPerHour: 15,
                storage: 100
            },
            upgradeLevel: 1,
            upgrades: [
                {
                    name: "Efficient Wood Harvester",
                    productionRate: {
                        resource: "wood",
                        amountPerHour: 25,
                        storage: 150
                    },
                    resources: { wood: 30, iron_ingot: 5 }
                }
            ],
            interactionRange: 2 // meters
        },
        
        // Buildings
        storage: {
            name: "Storage Building",
            description: "Increases resource storage capacity for your base.",
            category: "building",
            size: { x: 4, y: 3, z: 4 },
            hitpoints: 200,
            resources: {
                wood: 30,
                stone: 10
            },
            model: "storage",
            placementRules: {
                requireGround: true,
                canOverlap: false,
                maxIncline: 10 // degrees
            },
            storageBonus: {
                wood: 200,
                stone: 200,
                iron_ore: 100,
                gold_ore: 50,
                herbs: 50,
                leather: 30
            },
            upgradeLevel: 1,
            upgrades: [
                {
                    name: "Large Storage",
                    storageBonus: {
                        wood: 400,
                        stone: 400,
                        iron_ore: 200,
                        gold_ore: 100,
                        herbs: 100,
                        leather: 60
                    },
                    resources: { wood: 50, stone: 30 }
                }
            ],
            interactionRange: 3 // meters
        }
    };
    
    // Player's built structures
    const playerBuildings = [];
    let buildingIdCounter = 0;
    
    // Additional building templates unlocked during gameplay
    const unlockedBuildingTemplates = {};
    
    // Initialize building system
    Game.gameplay.building.init = function() {
        console.log('Initializing building system');
        
        // Setup event listeners
        setupEventListeners();
        
        // Create preview entity (hidden initially)
        createBuildingPreview();
        
        return Promise.resolve();
    };
    
    // Update building system (called each frame)
    Game.gameplay.building.update = function(deltaTime) {
        if (inBuildMode) {
            updateBuildingPreview();
        }
        
        // Update resource production from buildings
        updateResourceProduction(deltaTime);
        
        // Update defensive structures
        updateDefensiveStructures(deltaTime);
    };
    
    // Enter building mode
    Game.gameplay.building.enterBuildMode = function(buildingType) {
        // Check if building type exists
        if (!buildingTemplates[buildingType] && !unlockedBuildingTemplates[buildingType]) {
            console.error(`Unknown building type: ${buildingType}`);
            return false;
        }
        
        // Set current building type
        currentBuildingType = buildingType;
        inBuildMode = true;
        
        // Show building preview
        showBuildingPreview(buildingType);
        
        // Update UI
        Game.engine.ui.showNotification(`Building mode: ${getBuildingTemplate(buildingType).name}`, 'building');
        Game.engine.ui.showBuildControls(true);
        
        // Emit event
        Game.engine.events.emit('building:enterMode', { buildingType });
        
        return true;
    };
    
    // Exit building mode
    Game.gameplay.building.exitBuildMode = function() {
        inBuildMode = false;
        currentBuildingType = null;
        
        // Hide building preview
        hideBuildingPreview();
        
        // Update UI
        Game.engine.ui.showBuildControls(false);
        
        // Emit event
        Game.engine.events.emit('building:exitMode', {});
        
        return true;
    };
    
    // Place building at current preview position
    Game.gameplay.building.placeBuilding = function() {
        if (!inBuildMode || !validPlacement) {
            return false;
        }
        
        // Get building template and position
        const template = getBuildingTemplate(currentBuildingType);
        const position = Object.assign({}, lastGridPosition);
        
        // Check resource requirements
        if (!checkResourceRequirements(template)) {
            Game.engine.ui.showNotification("Not enough resources to build this structure!", "error");
            return false;
        }
        
        // Consume resources
        consumeResources(template.resources);
        
        // Create the actual building
        const buildingId = createBuilding(currentBuildingType, position, rotationAngle);
        
        // Play building placement sound
        Game.audio.playSound('building_place');
        
        // Create placement effect
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('build_dust', position);
        }
        
        // Notify success
        Game.engine.ui.showNotification(`Built ${template.name}!`, 'success');
        
        // Update building preview position
        updateBuildingPreview();
        
        // Emit event
        Game.engine.events.emit('building:placed', {
            id: buildingId,
            type: currentBuildingType,
            position: position,
            rotation: rotationAngle
        });
        
        return true;
    };
    
    // Add a new building template (unlocked through crafting/quests)
    Game.gameplay.building.addBuildingTemplate = function(buildingType, templateData) {
        if (buildingTemplates[buildingType] || unlockedBuildingTemplates[buildingType]) {
            // Already exists, just update
            const existingTemplate = getBuildingTemplate(buildingType);
            Object.assign(existingTemplate, templateData);
            return false;
        }
        
        // Add new template
        unlockedBuildingTemplates[buildingType] = templateData;
        
        // Notify UI
        Game.engine.ui.showNotification(`New building unlocked: ${templateData.name}`, 'unlock');
        
        // Emit event
        Game.engine.events.emit('building:templateUnlocked', {
            type: buildingType,
            name: templateData.name
        });
        
        return true;
    };
    
    // Get all building templates available to player
    Game.gameplay.building.getAvailableBuildingTemplates = function() {
        // Combine default and unlocked templates
        return { ...buildingTemplates, ...unlockedBuildingTemplates };
    };
    
    // Get player buildings
    Game.gameplay.building.getPlayerBuildings = function() {
        return [...playerBuildings];
    };
    
    // Get a building by ID
    Game.gameplay.building.getBuilding = function(buildingId) {
        return playerBuildings.find(b => b.id === buildingId) || null;
    };
    
    // Rotate current building preview
    Game.gameplay.building.rotateBuilding = function(clockwise = true) {
        // Rotate 90 degrees
        rotationAngle += clockwise ? 90 : -90;
        
        // Normalize to 0-359
        rotationAngle = (rotationAngle + 360) % 360;
        
        // Update preview
        if (buildPreviewEntity) {
            buildPreviewEntity.setAttribute('rotation', `0 ${rotationAngle} 0`);
        }
        
        // Check placement validity again since rotation might affect it
        updatePlacementValidation();
        
        return rotationAngle;
    };
    
    // Upgrade a building
    Game.gameplay.building.upgradeBuilding = function(buildingId) {
        const building = Game.gameplay.building.getBuilding(buildingId);
        if (!building) return false;
        
        // Get the building template
        const template = getBuildingTemplate(building.type);
        
        // Check if there's an upgrade available
        if (!template.upgrades || 
            building.upgradeLevel >= template.upgrades.length) {
            Game.engine.ui.showNotification("No more upgrades available for this building", "info");
            return false;
        }
        
        // Get the next upgrade
        const upgrade = template.upgrades[building.upgradeLevel];
        
        // Check resource requirements
        if (!checkResourceRequirements({ resources: upgrade.resources })) {
            Game.engine.ui.showNotification("Not enough resources for this upgrade!", "error");
            return false;
        }
        
        // Consume resources
        consumeResources(upgrade.resources);
        
        // Upgrade the building
        building.upgradeLevel++;
        building.name = upgrade.name;
        
        // Apply upgrades
        Object.keys(upgrade).forEach(key => {
            if (key !== 'name' && key !== 'resources') {
                building[key] = upgrade[key];
            }
        });
        
        // Update visuals
        updateBuildingVisuals(building);
        
        // Play upgrade sound
        Game.audio.playSound('building_upgrade');
        
        // Create upgrade effect
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('upgrade_sparkle', building.position);
        }
        
        // Notify success
        Game.engine.ui.showNotification(`Upgraded to ${upgrade.name}!`, 'success');
        
        // Emit event
        Game.engine.events.emit('building:upgraded', {
            id: building.id,
            type: building.type,
            level: building.upgradeLevel
        });
        
        return true;
    };
    
    // Demolish a building
    Game.gameplay.building.demolishBuilding = function(buildingId) {
        const buildingIndex = playerBuildings.findIndex(b => b.id === buildingId);
        if (buildingIndex === -1) return false;
        
        const building = playerBuildings[buildingIndex];
        
        // Remove from scene
        if (building.entity && building.entity.parentNode) {
            building.entity.parentNode.removeChild(building.entity);
        }
        
        // Refund some resources (50%)
        const template = getBuildingTemplate(building.type);
        if (template && template.resources) {
            const refundedResources = {};
            Object.keys(template.resources).forEach(resource => {
                refundedResources[resource] = Math.floor(template.resources[resource] * 0.5);
                
                // Add resources to player
                addResource(resource, refundedResources[resource]);
            });
            
            // Notify of refund
            const resourceText = Object.entries(refundedResources)
                .map(([res, amt]) => `${amt} ${res}`)
                .join(', ');
            Game.engine.ui.showNotification(`Refunded: ${resourceText}`, 'resource');
        }
        
        // Play demolish sound
        Game.audio.playSound('building_demolish');
        
        // Create demolish effect
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('demolish_debris', building.position);
        }
        
        // Remove from player buildings
        playerBuildings.splice(buildingIndex, 1);
        
        // Emit event
        Game.engine.events.emit('building:demolished', {
            id: building.id,
            type: building.type,
            position: building.position
        });
        
        return true;
    };
    
    // Damage a building (from attacks)
    Game.gameplay.building.damageBuilding = function(buildingId, amount, damageSource) {
        const building = Game.gameplay.building.getBuilding(buildingId);
        if (!building) return false;
        
        // Apply damage
        building.hitpoints -= amount;
        
        // Check if building is destroyed
        if (building.hitpoints <= 0) {
            // Building destroyed!
            Game.engine.ui.showNotification(`${building.name} has been destroyed!`, 'warning');
            
            // Create destruction effect
            if (Game.engine.particles) {
                Game.engine.particles.createEffect('building_destruction', building.position, {
                    scale: Math.max(building.size.x, building.size.z) / 2
                });
            }
            
            // Play destruction sound
            Game.audio.playSound('building_destroyed');
            
            // Emit event
            Game.engine.events.emit('building:destroyed', {
                id: building.id,
                type: building.type,
                position: building.position,
                source: damageSource
            });
            
            // Remove the building
            Game.gameplay.building.demolishBuilding(buildingId);
            
            return true;
        } else {
            // Building damaged but not destroyed
            // Update visual damage state
            updateBuildingDamage(building);
            
            // Create damage effect
            if (Game.engine.particles) {
                Game.engine.particles.createEffect('building_damage', building.position);
            }
            
            // Play damage sound
            Game.audio.playSound('building_damage');
            
            // Emit event
            Game.engine.events.emit('building:damaged', {
                id: building.id,
                type: building.type,
                damage: amount,
                hitpoints: building.hitpoints,
                maxHitpoints: building.maxHitpoints,
                source: damageSource
            });
            
            return false; // Not destroyed
        }
    };
    
    // Repair a building
    Game.gameplay.building.repairBuilding = function(buildingId) {
        const building = Game.gameplay.building.getBuilding(buildingId);
        if (!building) return false;
        
        // If already at full health, nothing to repair
        if (building.hitpoints >= building.maxHitpoints) {
            Game.engine.ui.showNotification("Building doesn't need repairs", "info");
            return false;
        }
        
        // Calculate repair resources (25% of original cost)
        const template = getBuildingTemplate(building.type);
        const repairResources = {};
        Object.keys(template.resources).forEach(resource => {
            repairResources[resource] = Math.ceil(template.resources[resource] * 0.25);
        });
        
        // Check resource requirements
        if (!checkResourceRequirements({ resources: repairResources })) {
            Game.engine.ui.showNotification("Not enough resources for repairs!", "error");
            return false;
        }
        
        // Consume resources
        consumeResources(repairResources);
        
        // Repair the building
        building.hitpoints = building.maxHitpoints;
        
        // Update visuals
        updateBuildingVisuals(building);
        
        // Play repair sound
        Game.audio.playSound('building_repair');
        
        // Create repair effect
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('repair_sparkle', building.position);
        }
        
        // Notify success
        Game.engine.ui.showNotification(`Repaired ${building.name}!`, 'success');
        
        // Emit event
        Game.engine.events.emit('building:repaired', {
            id: building.id,
            type: building.type
        });
        
        return true;
    };
    
    // Interact with a building (e.g., use a crafting station)
    Game.gameplay.building.interactWithBuilding = function(buildingId) {
        const building = Game.gameplay.building.getBuilding(buildingId);
        if (!building) return false;
        
        // Handle based on building type
        switch (building.category) {
            case 'crafting':
                // Open crafting interface for this station type
                if (building.craftingStationType && Game.gameplay.crafting) {
                    Game.gameplay.crafting.setActiveCraftingStation(building.craftingStationType);
                    Game.engine.ui.openCraftingInterface();
                    return true;
                }
                break;
                
            case 'production':
                // Show production status or collect resources
                if (building.productionRate && building.currentStorage > 0) {
                    // Collect resources
                    const resourceType = building.productionRate.resource;
                    const amount = building.currentStorage;
                    
                    // Add to player inventory
                    addResource(resourceType, amount);
                    
                    // Reset storage
                    building.currentStorage = 0;
                    
                    // Notify
                    Game.engine.ui.showNotification(`Collected ${amount} ${resourceType}`, 'resource');
                    
                    // Play collect sound
                    Game.audio.playSound('resource_collect');
                    
                    return true;
                }
                break;
                
            case 'storage':
                // Open storage interface
                Game.engine.ui.openStorageInterface();
                return true;
                
            default:
                // General building info
                Game.engine.ui.showBuildingInfo(building);
                return true;
        }
        
        return false;
    };
    
    // Create building preview entity
    function createBuildingPreview() {
        // Create container entity
        buildPreviewEntity = document.createElement('a-entity');
        buildPreviewEntity.id = 'building-preview';
        buildPreviewEntity.setAttribute('visible', 'false');
        
        // Add to scene
        document.querySelector('a-scene').appendChild(buildPreviewEntity);
    }
    
    // Show building preview in world
    function showBuildingPreview(buildingType) {
        if (!buildPreviewEntity) {
            createBuildingPreview();
        }
        
        // Clear existing preview
        while (buildPreviewEntity.firstChild) {
            buildPreviewEntity.removeChild(buildPreviewEntity.firstChild);
        }
        
        // Get building template
        const template = getBuildingTemplate(buildingType);
        
        // Create visual representation
        const modelEntity = createBuildingModel(buildingType, template);
        modelEntity.setAttribute('material', {
            transparent: true,
            opacity: 0.7
        });
        
        // Add to preview container
        buildPreviewEntity.appendChild(modelEntity);
        
        // Create ground grid for placement
        const gridEntity = document.createElement('a-plane');
        gridEntity.classList.add('placement-grid');
        gridEntity.setAttribute('width', template.size.x);
        gridEntity.setAttribute('height', template.size.z);
        gridEntity.setAttribute('rotation', '-90 0 0');
        gridEntity.setAttribute('position', `0 0.01 0`);
        gridEntity.setAttribute('material', {
            src: '#grid-texture',
            transparent: true,
            opacity: 0.5
        });
        
        // Add to preview container
        buildPreviewEntity.appendChild(gridEntity);
        
        // Set initial rotation
        buildPreviewEntity.setAttribute('rotation', `0 ${rotationAngle} 0`);
        
        // Make preview visible
        buildPreviewEntity.setAttribute('visible', 'true');
    }
    
    // Hide building preview
    function hideBuildingPreview() {
        if (buildPreviewEntity) {
            buildPreviewEntity.setAttribute('visible', 'false');
        }
    }
    
    // Update building preview position based on camera raycasting
    function updateBuildingPreview() {
        if (!buildPreviewEntity || !inBuildMode || !currentBuildingType) return;
        
        // Get camera position and direction
        const camera = document.querySelector('#camera');
        const cameraPosition = camera.getAttribute('position');
        const cameraRotation = camera.getAttribute('rotation');
        
        // Cast ray to find ground position
        const hit = castGroundRay(cameraPosition, cameraRotation);
        
        if (hit) {
            // Calculate grid position (snap to grid)
            const gridPosition = snapToGrid(hit.point);
            
            // Update preview position
            buildPreviewEntity.setAttribute('position', gridPosition);
            
            // Keep track of position for placement
            lastGridPosition = gridPosition;
            
            // Validate placement
            updatePlacementValidation();
        }
    }
    
    // Check if placement is valid and update preview accordingly
    function updatePlacementValidation() {
        if (!buildPreviewEntity || !currentBuildingType) return;
        
        // Get building template
        const template = getBuildingTemplate(currentBuildingType);
        
        // Perform placement validation
        const validationResult = validatePlacement(lastGridPosition, template, rotationAngle);
        validPlacement = validationResult.valid;
        
        // Update preview appearance based on validity
        const modelEntity = buildPreviewEntity.querySelector('.building-model');
        if (modelEntity) {
            // Update material color based on validity
            const color = validPlacement ? '#88FF88' : '#FF8888';
            modelEntity.setAttribute('material', 'color', color);
        }
        
        // Show validation message if invalid
        if (!validPlacement && validationResult.reason) {
            Game.engine.ui.showBuildingValidationMessage(validationResult.reason);
        } else {
            Game.engine.ui.hideBuildingValidationMessage();
        }
    }
    
    // Create an actual building in the world
    function createBuilding(buildingType, position, rotation) {
        // Get building template
        const template = getBuildingTemplate(buildingType);
        
        // Generate unique ID
        const buildingId = `building_${buildingIdCounter++}`;
        
        // Create building entity
        const entity = document.createElement('a-entity');
        entity.id = buildingId;
        entity.classList.add('building', 'interactive');
        entity.setAttribute('position', position);
        entity.setAttribute('rotation', `0 ${rotation} 0`);
        entity.setAttribute('data-building-id', buildingId);
        entity.setAttribute('data-building-type', buildingType);
        entity.setAttribute('data-interact-type', 'building');
        
        // Create visual model
        const modelEntity = createBuildingModel(buildingType, template);
        
        // Add model to building entity
        entity.appendChild(modelEntity);
        
        // Add to scene
        document.querySelector('#base-container').appendChild(entity);
        
        // Calculate based on rotation
        let adjustedSize = getRotatedSize(template.size, rotation);
        
        // Create building object
        const building = {
            id: buildingId,
            type: buildingType,
            name: template.name,
            category: template.category,
            position: { ...position },
            rotation: rotation,
            size: template.size,
            adjustedSize: adjustedSize,
            hitpoints: template.hitpoints,
            maxHitpoints: template.hitpoints,
            upgradeLevel: 0,
            entity: entity,
            creationTime: Date.now()
        };
        
        // Add category-specific properties
        switch (template.category) {
            case 'production':
                if (template.productionRate) {
                    building.productionRate = { ...template.productionRate };
                    building.currentStorage = 0;
                    building.lastProduction = Date.now();
                }
                break;
                
            case 'crafting':
                if (template.craftingStationType) {
                    building.craftingStationType = template.craftingStationType;
                    building.craftingSpeed = template.craftingSpeed;
                }
                break;
                
            case 'defense':
                if (template.detectionRange) {
                    building.detectionRange = template.detectionRange;
                }
                if (template.damage) {
                    building.damage = template.damage;
                    building.lastAttackTime = 0;
                }
                break;
                
            case 'storage':
                if (template.storageBonus) {
                    building.storageBonus = { ...template.storageBonus };
                    
                    // Apply storage bonus immediately
                    const gameState = Game.engine.getState();
                    // TODO: Update storage limits in game state
                }
                break;
        }
        
        // Add to player buildings
        playerBuildings.push(building);
        
        return buildingId;
    }
    
    // Create the visual model for a building
    function createBuildingModel(buildingType, template) {
        // Create model container
        const modelEntity = document.createElement('a-entity');
        modelEntity.classList.add('building-model');
        
        // Adjust y-position to half height
        modelEntity.setAttribute('position', `0 ${template.size.y / 2} 0`);
        
        // Check if we have a procedural
