/**
 * NPC System
 * 
 * Handles NPC generation, behavior, interactions, and management for the player's settlement.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.npc = {};

(function() {
    // NPC types and roles
    const npcTypes = {
        villager: {
            name: "Villager",
            description: "A common resident of your settlement",
            baseStats: {
                health: 50,
                strength: 3,
                dexterity: 3,
                intelligence: 3,
                charisma: 3
            },
            possibleRoles: ["worker", "guard", "farmer", "trader"],
            baseCost: { food: 10 },
            upkeep: { food: 1 },
            dialogPatterns: ["greeting", "complaint", "weather", "settlement"]
        },
        merchant: {
            name: "Merchant",
            description: "Trades goods and rare items",
            baseStats: {
                health: 40,
                strength: 2,
                dexterity: 3,
                intelligence: 4,
                charisma: 5
            },
            possibleRoles: ["trader"],
            baseCost: { food: 15, gold: 50 },
            upkeep: { food: 2 },
            dialogPatterns: ["greeting", "trade", "goods", "business"]
        },
        warrior: {
            name: "Warrior",
            description: "Skilled fighter who can defend your settlement",
            baseStats: {
                health: 80,
                strength: 6,
                dexterity: 4,
                intelligence: 2,
                charisma: 2
            },
            possibleRoles: ["guard"],
            baseCost: { food: 20, gold: 25 },
            upkeep: { food: 2 },
            dialogPatterns: ["greeting", "battle", "training", "defense"]
        },
        scholar: {
            name: "Scholar",
            description: "Researches new technologies and magical abilities",
            baseStats: {
                health: 30,
                strength: 1,
                dexterity: 2,
                intelligence: 7,
                charisma: 3
            },
            possibleRoles: ["researcher"],
            baseCost: { food: 15, gold: 30 },
            upkeep: { food: 1 },
            dialogPatterns: ["greeting", "research", "magic", "history"]
        },
        craftsman: {
            name: "Craftsman",
            description: "Creates tools, weapons, and buildings",
            baseStats: {
                health: 60,
                strength: 4,
                dexterity: 6,
                intelligence: 4,
                charisma: 2
            },
            possibleRoles: ["builder", "crafter"],
            baseCost: { food: 15, wood: 20 },
            upkeep: { food: 1 },
            dialogPatterns: ["greeting", "craft", "materials", "projects"]
        }
    };
    
    // NPC role definitions
    const npcRoles = {
        worker: {
            title: "Worker",
            description: "Gathers basic resources",
            production: { wood: 2, stone: 1 },
            requirements: {},
            actions: ["gather", "build"]
        },
        guard: {
            title: "Guard",
            description: "Defends against enemy attacks",
            production: { defense: 5 },
            requirements: {},
            actions: ["patrol", "combat"]
        },
        farmer: {
            title: "Farmer",
            description: "Produces food for the settlement",
            production: { food: 3 },
            requirements: { building: "farm" },
            actions: ["farm", "harvest"]
        },
        trader: {
            title: "Trader",
            description: "Buys and sells goods",
            production: { gold: 2 },
            requirements: { building: "market" },
            actions: ["trade"]
        },
        builder: {
            title: "Builder",
            description: "Speeds up construction",
            production: { buildSpeed: 1.5 },
            requirements: {},
            actions: ["build", "repair"]
        },
        crafter: {
            title: "Crafter",
            description: "Creates items and equipment",
            production: { craftSpeed: 1.5 },
            requirements: { building: "workshop" },
            actions: ["craft"]
        },
        researcher: {
            title: "Researcher",
            description: "Discovers new technologies",
            production: { research: 3 },
            requirements: { building: "library" },
            actions: ["research", "study"]
        }
    };
    
    // NPC personality traits
    const personalityTraits = {
        friendly: { dialogModifiers: ["warm", "helpful"], textColor: "#88FF88" },
        grumpy: { dialogModifiers: ["curt", "irritable"], textColor: "#FF8888" },
        wise: { dialogModifiers: ["thoughtful", "knowledgeable"], textColor: "#88AAFF" },
        eccentric: { dialogModifiers: ["strange", "unpredictable"], textColor: "#FF88FF" },
        stoic: { dialogModifiers: ["reserved", "calm"], textColor: "#AAAAAA" },
        suspicious: { dialogModifiers: ["cautious", "mistrustful"], textColor: "#FFAA88" }
    };
    
    // Active NPCs
    let npcs = new Map();
    
    // NPC daily routines
    const defaultSchedule = [
        { time: 6, activity: "wakeUp", location: "home" },
        { time: 7, activity: "work", location: "workstation" },
        { time: 12, activity: "eat", location: "dining" },
        { time: 13, activity: "work", location: "workstation" },
        { time: 18, activity: "leisure", location: "village" },
        { time: 21, activity: "sleep", location: "home" }
    ];
    
    // Initialize NPC system
    Game.gameplay.npc.init = function() {
        console.log('Initializing NPC system');
        loadNPCs();
        setupNPCInteractions();
        return Promise.resolve();
    };
    
    // Update NPCs (called each frame)
    Game.gameplay.npc.update = function(deltaTime) {
        updateNPCBehaviors(deltaTime);
        updateNPCSchedules();
    };
    
    // Generate a new NPC
    Game.gameplay.npc.generateNPC = function(typeId, name = null, role = null) {
        if (!npcTypes[typeId]) {
            console.error(`Invalid NPC type: ${typeId}`);
            return null;
        }
        
        const type = npcTypes[typeId];
        
        // Generate unique ID
        const npcId = `npc_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
        
        // Generate random seed for visual appearance
        const seed = Math.floor(Math.random() * 1000000);
        
        // Select random name if not provided
        if (!name) {
            name = generateRandomName();
        }
        
        // Select random role from possible roles if not provided
        if (!role && type.possibleRoles && type.possibleRoles.length > 0) {
            const randomIndex = Math.floor(Math.random() * type.possibleRoles.length);
            role = type.possibleRoles[randomIndex];
        }
        
        // Select random personality trait
        const traitKeys = Object.keys(personalityTraits);
        const trait = traitKeys[Math.floor(Math.random() * traitKeys.length)];
        
        // Create NPC object
        const npc = {
            id: npcId,
            name: name,
            type: typeId,
            role: role,
            personality: trait,
            stats: { ...type.baseStats },
            level: 1,
            experience: 0,
            happiness: 70 + Math.floor(Math.random() * 30),  // 70-100%
            loyalty: 50 + Math.floor(Math.random() * 50),   // 50-100%
            schedule: [...defaultSchedule],
            currentActivity: "idle",
            currentLocation: "village",
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 },
            hiring: {
                hired: false,
                hireDate: null,
                lastPaid: null
            },
            inventory: [],
            seed: seed,
            entity: null,
            dialogTree: generateDialogTree(typeId, role, trait)
        };
        
        // Store the NPC
        npcs.set(npcId, npc);
        
        console.log(`Generated NPC: ${npc.name} (${type.name}, ${npcRoles[role]?.title || 'No Role'})`);
        
        return npc;
    };
    
    // Create physical NPC in the world
    Game.gameplay.npc.spawnNPC = function(npcId, position) {
        const npc = npcs.get(npcId);
        if (!npc) {
            console.error(`NPC not found: ${npcId}`);
            return null;
        }
        
        // Update position
        npc.position = { ...position };
        
        // Create visual entity
        npc.entity = createNPCEntity(npc);
        
        // Add to scene
        const npcContainer = document.getElementById('npcs-container');
        if (npcContainer) {
            npcContainer.appendChild(npc.entity);
        }
        
        console.log(`NPC ${npc.name} spawned at`, position);
        
        // Update game state
        const state = Game.engine.getState();
        if (state && state.base && state.base.npcs) {
            state.base.npcs.push({
                id: npc.id,
                name: npc.name,
                type: npc.type,
                role: npc.role,
                position: { ...npc.position }
            });
            Game.engine.setState(state);
        }
        
        return npc;
    };
    
    // Hire NPC
    Game.gameplay.npc.hireNPC = function(npcId) {
        const npc = npcs.get(npcId);
        if (!npc) {
            console.error(`NPC not found: ${npcId}`);
            return false;
        }
        
        const type = npcTypes[npc.type];
        if (!type) {
            console.error(`Invalid NPC type: ${npc.type}`);
            return false;
        }
        
        // Check if player has enough resources
        const state = Game.engine.getState();
        const baseResources = state.base.resources;
        
        for (const [resource, amount] of Object.entries(type.baseCost)) {
            if (!baseResources[resource] || baseResources[resource] < amount) {
                console.log(`Not enough ${resource} to hire NPC`);
                Game.engine.ui.showNotification(`Not enough ${resource} to hire ${npc.name}`, 'error');
                return false;
            }
        }
        
        // Deduct resources
        for (const [resource, amount] of Object.entries(type.baseCost)) {
            baseResources[resource] -= amount;
        }
        
        // Update NPC hiring status
        npc.hiring = {
            hired: true,
            hireDate: Date.now(),
            lastPaid: Date.now()
        };
        
        // Update game state
        state.base.npcs = state.base.npcs || [];
        const existingNpcIndex = state.base.npcs.findIndex(n => n.id === npc.id);
        if (existingNpcIndex >= 0) {
            state.base.npcs[existingNpcIndex].hired = true;
        } else {
            state.base.npcs.push({
                id: npc.id,
                name: npc.name,
                type: npc.type,
                role: npc.role,
                hired: true,
                position: { ...npc.position }
            });
        }
        Game.engine.setState(state);
        
        console.log(`Hired NPC: ${npc.name}`);
        Game.engine.ui.showNotification(`${npc.name} has joined your settlement!`, 'success');
        
        // Update NPC dialog tree to reflect hired status
        updateNPCDialogForHired(npc);
        
        return true;
    };
    
    // Fire NPC
    Game.gameplay.npc.fireNPC = function(npcId) {
        const npc = npcs.get(npcId);
        if (!npc) {
            console.error(`NPC not found: ${npcId}`);
            return false;
        }
        
        if (!npc.hiring.hired) {
            console.log(`NPC ${npc.name} is not hired`);
            return false;
        }
        
        // Update NPC hiring status
        npc.hiring = {
            hired: false,
            hireDate: null,
            lastPaid: null
        };
        
        // Update game state
        const state = Game.engine.getState();
        state.base.npcs = state.base.npcs || [];
        const existingNpcIndex = state.base.npcs.findIndex(n => n.id === npc.id);
        if (existingNpcIndex >= 0) {
            state.base.npcs[existingNpcIndex].hired = false;
        }
        Game.engine.setState(state);
        
        console.log(`Fired NPC: ${npc.name}`);
        Game.engine.ui.showNotification(`${npc.name} has left your settlement.`, 'info');
        
        // Update NPC dialog tree to reflect fired status
        updateNPCDialogForFired(npc);
        
        return true;
    };
    
    // Assign NPC to a role
    Game.gameplay.npc.assignRole = function(npcId, roleId) {
        const npc = npcs.get(npcId);
        if (!npc) {
            console.error(`NPC not found: ${npcId}`);
            return false;
        }
        
        const type = npcTypes[npc.type];
        if (!type) {
            console.error(`Invalid NPC type: ${npc.type}`);
            return false;
        }
        
        if (!type.possibleRoles.includes(roleId)) {
            console.log(`Role ${roleId} not available for ${npc.type}`);
            return false;
        }
        
        // Check if role has building requirements
        const role = npcRoles[roleId];
        if (role.requirements.building) {
            // Check if required building exists
            const state = Game.engine.getState();
            const hasBuilding = state.base.buildings.some(
                b => b.type === role.requirements.building && b.completed
            );
            
            if (!hasBuilding) {
                console.log(`Missing required building: ${role.requirements.building}`);
                Game.engine.ui.showNotification(`${role.title} requires a ${role.requirements.building}`, 'error');
                return false;
            }
        }
        
        // Assign the role
        npc.role = roleId;
        
        // Update game state
        const state = Game.engine.getState();
        state.base.npcs = state.base.npcs || [];
        const existingNpcIndex = state.base.npcs.findIndex(n => n.id === npc.id);
        if (existingNpcIndex >= 0) {
            state.base.npcs[existingNpcIndex].role = roleId;
        }
        Game.engine.setState(state);
        
        console.log(`Assigned role ${role.title} to NPC: ${npc.name}`);
        Game.engine.ui.showNotification(`${npc.name} is now a ${role.title}`, 'success');
        
        return true;
    };
    
    // Start dialog with an NPC
    Game.gameplay.npc.startDialog = function(npcId) {
        const npc = npcs.get(npcId);
        if (!npc) {
            console.error(`NPC not found: ${npcId}`);
            return;
        }
        
        // Make sure NPC faces player
        facePlayer(npc);
        
        // Use dialog system to handle conversation
        if (Game.gameplay.dialog) {
            Game.gameplay.dialog.startDialog(npcId, npc.dialogTree);
        } else {
            console.error('Dialog system not available');
        }
    };
    
    // Get NPC by ID
    Game.gameplay.npc.getNPC = function(npcId) {
        return npcs.get(npcId);
    };
    
    // Get all NPCs
    Game.gameplay.npc.getAllNPCs = function() {
        return Array.from(npcs.values());
    };
    
    // Get hired NPCs
    Game.gameplay.npc.getHiredNPCs = function() {
        return Array.from(npcs.values()).filter(npc => npc.hiring.hired);
    };
    
    // Calculate daily production for all NPCs
    Game.gameplay.npc.calculateProduction = function() {
        let production = {
            wood: 0,
            stone: 0,
            food: 0,
            gold: 0,
            defense: 0,
            research: 0,
            buildSpeed: 0,
            craftSpeed: 0
        };
        
        // Get hired NPCs
        const hiredNPCs = Game.gameplay.npc.getHiredNPCs();
        
        // Calculate production from each NPC
        for (const npc of hiredNPCs) {
            if (npc.role && npcRoles[npc.role]) {
                const roleProduction = npcRoles[npc.role].production;
                
                // Add each resource to total production
                for (const [resource, amount] of Object.entries(roleProduction)) {
                    if (production[resource] !== undefined) {
                        // Apply happiness modifier (50-150%)
                        const happinessModifier = npc.happiness / 100;
                        production[resource] += amount * happinessModifier;
                    }
                }
            }
        }
        
        return production;
    };
    
    // Apply daily production to resources
    Game.gameplay.npc.applyProduction = function() {
        const production = Game.gameplay.npc.calculateProduction();
        
        // Update game state with resource production
        const state = Game.engine.getState();
        const baseResources = state.base.resources;
        
        // Apply regular resource production
        for (const [resource, amount] of Object.entries(production)) {
            if (baseResources[resource] !== undefined && typeof amount === 'number') {
                baseResources[resource] += Math.floor(amount);
            }
        }
        
        // Apply NPC upkeep costs
        const hiredNPCs = Game.gameplay.npc.getHiredNPCs();
        for (const npc of hiredNPCs) {
            const type = npcTypes[npc.type];
            if (type && type.upkeep) {
                for (const [resource, amount] of Object.entries(type.upkeep)) {
                    if (baseResources[resource] !== undefined) {
                        baseResources[resource] = Math.max(0, baseResources[resource] - amount);
                    }
                }
            }
        }
        
        // Save state
        Game.engine.setState(state);
        
        return production;
    };
    
    // Update NPC happiness based on conditions
    Game.gameplay.npc.updateHappiness = function() {
        // Get state
        const state = Game.engine.getState();
        const baseResources = state.base.resources;
        
        // Check food supply
        const hiredNPCs = Game.gameplay.npc.getHiredNPCs();
        const totalFoodNeeded = hiredNPCs.reduce((total, npc) => {
            const type = npcTypes[npc.type];
            return total + (type?.upkeep?.food || 0);
        }, 0);
        
        const foodRatio = baseResources.food / Math.max(1, totalFoodNeeded);
        
        // Update each NPC's happiness
        for (const npc of hiredNPCs) {
            // Food affects happiness
            if (foodRatio < 1) {
                // Not enough food - decrease happiness
                npc.happiness = Math.max(10, npc.happiness - 5);
            } else {
                // Enough food - slow happiness recovery
                npc.happiness = Math.min(100, npc.happiness + 1);
            }
            
            // Check for housing (if implemented)
            // Check for safety (defense vs threat level)
            // Check for amenities (recreational buildings)
            
            // Update loyalty based on happiness
            if (npc.happiness < 30) {
                npc.loyalty = Math.max(0, npc.loyalty - 2);
            } else if (npc.happiness > 70) {
                npc.loyalty = Math.min(100, npc.loyalty + 1);
            }
            
            // If loyalty drops to zero, NPC might leave
            if (npc.loyalty <= 0) {
                npcLeavesSettlement(npc.id);
            }
        }
    };
    
    // Track daily NPC activities
    Game.gameplay.npc.updateDailyActivities = function() {
        // Get current time
        const state = Game.engine.getState();
        const hourOfDay = (state.world.time / 60) % 24;
        
        // Update each NPC's activity based on schedule
        for (const npc of npcs.values()) {
            // Find current schedule entry based on time
            let currentScheduleEntry = null;
            
            for (let i = npc.schedule.length - 1; i >= 0; i--) {
                if (hourOfDay >= npc.schedule[i].time) {
                    currentScheduleEntry = npc.schedule[i];
                    break;
                }
            }
            
            if (currentScheduleEntry) {
                // Update NPC activity if it's changed
                if (npc.currentActivity !== currentScheduleEntry.activity) {
                    npc.currentActivity = currentScheduleEntry.activity;
                    npc.currentLocation = currentScheduleEntry.location;
                    
                    // Move NPC to new location
                    moveNPCToLocation(npc);
                    
                    // Update NPC animation based on activity
                    updateNPCAnimation(npc);
                }
            }
        }
    };
    
    // Private functions
    
    // Load NPCs from game state
    function loadNPCs() {
        const state = Game.engine.getState();
        if (!state || !state.base || !state.base.npcs) {
            return;
        }
        
        // Create NPC objects from saved state
        for (const npcData of state.base.npcs) {
            const npc = Game.gameplay.npc.generateNPC(npcData.type, npcData.name, npcData.role);
            
            // Restore hiring status
            if (npcData.hired) {
                npc.hiring = {
                    hired: true,
                    hireDate: npcData.hireDate || Date.now(),
                    lastPaid: npcData.lastPaid || Date.now()
                };
            }
            
            // Spawn NPC at saved position
            if (npcData.position) {
                Game.gameplay.npc.spawnNPC(npc.id, npcData.position);
            }
        }
    }
    
    // Set up NPC interactions
    function setupNPCInteractions() {
        // Setup event listeners for NPC interaction
    }
    
    // Update NPC behaviors
    function updateNPCBehaviors(deltaTime) {
        // Update each NPC's behavior based on their current activity
        for (const npc of npcs.values()) {
            switch (npc.currentActivity) {
                case 'idle':
                    // Occasional random movements or animations
                    if (Math.random() < 0.01 * deltaTime / 1000) {
                        performIdleAction(npc);
                    }
                    break;
                    
                case 'work':
                    // Work animations
                    if (Math.random() < 0.05 * deltaTime / 1000) {
                        performWorkAction(npc);
                    }
                    break;
                    
                case 'patrol':
                    // Move along patrol path
                    updatePatrol(npc, deltaTime);
                    break;
                    
                case 'sleep':
                    // Nothing to do while sleeping
                    break;
                    
                case 'eat':
                    // Eating animations
                    if (Math.random() < 0.02 * deltaTime / 1000) {
                        performEatAction(npc);
                    }
                    break;
                    
                case 'leisure':
                    // Leisure animations
                    if (Math.random() < 0.03 * deltaTime / 1000) {
                        performLeisureAction(npc);
                    }
                    break;
            }
        }
    }
    
    // Update NPC schedules
    function updateNPCSchedules() {
        // Only need to check occasionally, not every frame
        Game.gameplay.npc.updateDailyActivities();
    }
    
    // Create the visual representation of an NPC
    function createNPCEntity(npc) {
        const container = document.createElement('a-entity');
        container.id = npc.id;
        container.classList.add('npc', 'interactive');
        container.setAttribute('position', npc.position);
        container.setAttribute('data-npc-id', npc.id);
        container.setAttribute('data-interact-type', 'npc');
        container.setAttribute('data-interact-id', npc.id);
        
        // NPC sprite
        const sprite = document.createElement('a-plane');
        sprite.setAttribute('width', 1);
        sprite.setAttribute('height', 2);
        sprite.setAttribute('material', {
            src: Game.generation.textures.generateNPCTexture(npc.type, npc.seed),
            transparent: true,
            alphaTest: 0.5
        });
        sprite.setAttribute('look-at', '[camera]');
        container.appendChild(sprite);
        
        // Name floating above head
        const nameTag = document.createElement('a-text');
        nameTag.setAttribute('value', npc.name);
        nameTag.setAttribute('align', 'center');
        nameTag.setAttribute('position', '0 2.2 0');
        nameTag.setAttribute('scale', '0.5 0.5 0.5');
        nameTag.setAttribute('color', personalityTraits[npc.personality]?.textColor || '#FFFFFF');
        nameTag.setAttribute('look-at', '[camera]');
        container.appendChild(nameTag);
        
        // Role tag if hired
        if (npc.hiring.hired && npc.role) {
            const roleTag = document.createElement('a-text');
            roleTag.setAttribute('value', npcRoles[npc.role]?.title || npc.role);
            roleTag.setAttribute('align', 'center');
            roleTag.setAttribute('position', '0 2.0 0');
            roleTag.setAttribute('scale', '0.4 0.4 0.4');
            roleTag.setAttribute('color', '#AAFFAA');
            roleTag.setAttribute('look-at', '[camera]');
            container.appendChild(roleTag);
        }
        
        // Interaction trigger
        container.setAttribute('onclick', `Game.gameplay.npc.startDialog('${npc.id}')`);
        
        return container;
    }
    
    // Make NPC face player
    function facePlayer(npc) {
        if (!npc.entity) return;
        
        const playerPos = Game.gameplay.player.getPosition();
        const npcPos = npc.position;
        
        // Calculate direction to face
        const dx = playerPos.x - npcPos.x;
        const dz = playerPos.z - npcPos.z;
        const angle = Math.atan2(dx, dz) * 180 / Math.PI;
        
        // Update NPC rotation
        npc.rotation.y = angle;
        npc.entity.setAttribute('rotation', `0 ${angle} 0`);
    }
    
    // Move NPC to a location based on their schedule
    function moveNPCToLocation(npc) {
        if (!npc.entity) return;
        
        // Get destination based on location type
        let destination = getLocationPosition(npc.currentLocation, npc);
        
        // Animate movement
        npc.entity.setAttribute('animation__move', {
            property: 'position',
            to: `${destination.x} ${destination.y} ${destination.z}`,
            dur: 2000,
            easing: 'easeInOutQuad'
        });
        
        // Update NPC position once animation is complete
        setTimeout(() => {
            npc.position = { ...destination };
        }, 2000);
    }
    
    // Get position for a named location
    function getLocationPosition(locationName, npc) {
        const state = Game.engine.getState();
        
        switch (locationName) {
            case 'home':
                // Find a house building or default to center of base
                const house = state.base.buildings.find(b => 
                    b.type === 'house' && b.assignedTo === npc.id
                );
                
                if (house) {
                    return { ...house.position, y: 0 };
                }
                return getBaseCenter();
                
            case 'workstation':
                // Find a building matching NPC's role
                const roleBuilding = getRoleBuildingType(npc.role);
                const workBuilding = state.base.buildings.find(b => b.type === roleBuilding);
                
                if (workBuilding) {
                    return { ...workBuilding.position, y: 0 };
                }
                return getBaseCenter();
                
            case 'dining':
                // Find tavern or town center
                const tavern = state.base.buildings.find(b => b.type === 'tavern');
                if (tavern) {
                    return { ...tavern.position, y: 0 };
                }
                return getBaseCenter();
                
            case 'village':
            default:
                // Default to center of base with some randomization
                const center = getBaseCenter();
                return {
                    x: center.x + (Math.random() * 10 - 5),
                    y: 0,
                    z: center.z + (Math.random() * 10 - 5)
                };
        }
    }
    
    // Get center of base
    function getBaseCenter() {
        const state = Game.engine.getState();
        
        if (state.base.buildings && state.base.buildings.length > 0) {
            // Calculate average position of all buildings
            let
