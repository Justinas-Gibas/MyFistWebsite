/**
 * Core Game Engine
 * 
 * Manages core game loop, state, and system coordination
 */
window.Game = window.Game || {};
Game.engine = Game.engine || {};

(function() {
    // Private variables
    let isRunning = false;
    let lastTimestamp = 0;
    let gameState = {
        player: {
            health: 100,
            mana: 100,
            stamina: 100,
            level: 1,
            experience: 0,
            inventory: [],
            equipment: {},
            position: { x: 0, y: 0, z: 0 },
            rotation: { x: 0, y: 0, z: 0 }
        },
        world: {
            seed: Math.floor(Math.random() * 1000000),
            difficulty: 1,
            time: 0, // in-game time
            day: 1
        },
        base: {
            buildings: [],
            npcs: [],
            resources: {
                wood: 100,
                stone: 50,
                metal: 20,
                food: 100
            },
            defenses: []
        },
        quests: {
            active: [],
            completed: []
        },
        enemies: {
            spawned: [],
            defeated: 0
        },
        settings: {
            graphics: 'medium',
            sound: true,
            music: true,
            vrEnabled: false
        }
    };
    
    // System references
    const systems = [];
    
    // Core engine methods
    Game.engine.init = function() {
        console.log('Initializing game engine with seed:', gameState.world.seed);
        
        // Register core systems that need to be updated each frame
        systems.push(Game.engine.vr);
        
        // Set up event listeners
        setupEventListeners();
        
        return Promise.resolve();
    };
    
    Game.engine.start = function() {
        if (!isRunning) {
            isRunning = true;
            lastTimestamp = performance.now();
            requestAnimationFrame(gameLoop);
            console.log('Game engine started');
        }
    };
    
    Game.engine.stop = function() {
        isRunning = false;
        console.log('Game engine stopped');
    };
    
    Game.engine.getState = function() {
        return gameState;
    };
    
    Game.engine.setState = function(newState) {
        gameState = { ...gameState, ...newState };
    };
    
    Game.engine.saveGame = function() {
        try {
            const saveData = JSON.stringify(gameState);
            localStorage.setItem('darkFantasyRPG_saveGame', saveData);
            console.log('Game saved successfully');
            return true;
        } catch (error) {
            console.error('Failed to save game:', error);
            return false;
        }
    };
    
    Game.engine.loadGame = function() {
        try {
            const saveData = localStorage.getItem('darkFantasyRPG_saveGame');
            if (saveData) {
                gameState = JSON.parse(saveData);
                console.log('Game loaded successfully');
                return true;
            }
            return false;
        } catch (error) {
            console.error('Failed to load game:', error);
            return false;
        }
    };
    
    // Private methods
    function gameLoop(timestamp) {
        if (!isRunning) return;
        
        // Calculate delta time
        const deltaTime = timestamp - lastTimestamp;
        lastTimestamp = timestamp;
        
        // Update game state
        updateGameState(deltaTime);
        
        // Update all registered systems
        for (const system of systems) {
            if (system && typeof system.update === 'function') {
                system.update(deltaTime, gameState);
            }
        }
        
        // Update player systems
        if (Game.gameplay && Game.gameplay.player) {
            Game.gameplay.player.update(deltaTime, gameState);
        }
        
        // Update combat systems
        if (Game.gameplay && Game.gameplay.combat) {
            Game.gameplay.combat.update(deltaTime, gameState);
        }
        
        // Update NPC systems
        if (Game.gameplay && Game.gameplay.npc) {
            Game.gameplay.npc.update(deltaTime, gameState);
        }
        
        // Continue the loop
        requestAnimationFrame(gameLoop);
    }
    
    function updateGameState(deltaTime) {
        // Update in-game time (1 real second = 1 minute in game)
        gameState.world.time += deltaTime / 1000 * 60;
        
        // Day/night cycle (24 hours)
        if (gameState.world.time >= 24 * 60) {
            gameState.world.time = 0;
            gameState.world.day++;
            
            // Daily resource generation from base
            if (gameState.base.buildings.length > 0) {
                updateBaseResources();
            }
        }
        
        // Update ambient lighting based on time of day
        updateAmbientLighting();
        
        // Check for scheduled events
        checkScheduledEvents();
    }
    
    function updateAmbientLighting() {
        // Time of day in hours (0-24)
        const hourOfDay = gameState.world.time / 60;
        
        // Night time (8 PM to 5 AM)
        let lightIntensity;
        let lightColor;
        
        if (hourOfDay > 20 || hourOfDay < 5) {
            // Night
            lightIntensity = 0.2;
            lightColor = '#113366';
        } else if (hourOfDay < 7 || hourOfDay > 18) {
            // Dawn/Dusk
            lightIntensity = 0.5;
            lightColor = '#FF9966';
        } else {
            // Day
            lightIntensity = 0.8;
            lightColor = '#FFFFFF';
        }
        
        // Update lights in the scene
        const ambientLight = document.getElementById('ambient-light');
        if (ambientLight) {
            ambientLight.setAttribute('light', {
                intensity: lightIntensity * 0.6,
                color: lightColor
            });
        }
        
        const directionalLight = document.getElementById('directional-light');
        if (directionalLight) {
            directionalLight.setAttribute('light', {
                intensity: lightIntensity,
                color: lightColor
            });
        }
    }
    
    function updateBaseResources() {
        // Calculate resource production based on buildings
        let woodProduction = 0;
        let stoneProduction = 0;
        let metalProduction = 0;
        let foodProduction = 0;
        
        // Loop through buildings to calculate production
        for (const building of gameState.base.buildings) {
            switch (building.type) {
                case 'lumbermill':
                    woodProduction += 10 * building.level;
                    break;
                case 'quarry':
                    stoneProduction += 8 * building.level;
                    break;
                case 'mine':
                    metalProduction += 5 * building.level;
                    break;
                case 'farm':
                    foodProduction += 15 * building.level;
                    break;
            }
        }
        
        // Apply production to resources
        gameState.base.resources.wood += woodProduction;
        gameState.base.resources.stone += stoneProduction;
        gameState.base.resources.metal += metalProduction;
        gameState.base.resources.food += foodProduction;
        
        console.log(`Daily resource production: +${woodProduction} wood, +${stoneProduction} stone, +${metalProduction} metal, +${foodProduction} food`);
    }
    
    function checkScheduledEvents() {
        // Check for enemy attacks based on difficulty and progression
        const hourOfDay = gameState.world.time / 60;
        
        // Enemy raids happen at night (between 22:00 and 04:00)
        if ((hourOfDay > 22 || hourOfDay < 4) && Math.random() < 0.001 * gameState.world.difficulty) {
            console.log('Triggering enemy raid event');
            if (Game.gameplay && Game.gameplay.combat) {
                Game.gameplay.combat.triggerEnemyRaid();
            }
        }
    }
    
    function setupEventListeners() {
        // Listen for keyboard input
        document.addEventListener('keydown', (e) => {
            // ESC key opens menu
            if (e.key === 'Escape') {
                togglePauseMenu();
            }
            
            // Tab key toggles inventory
            if (e.key === 'Tab') {
                const gameUI = document.getElementById('game-ui');
                gameUI.classList.toggle('hidden');
                e.preventDefault();
            }
            
            // Number keys for quick slots
            if (e.key >= '1' && e.key <= '9') {
                const slotIndex = parseInt(e.key) - 1;
                if (Game.gameplay && Game.gameplay.player) {
                    Game.gameplay.player.useQuickSlot(slotIndex);
                }
            }
            
            // E key for interaction
            if (e.key === 'e' || e.key === 'E') {
                if (Game.gameplay && Game.gameplay.player) {
                    Game.gameplay.player.interact();
                }
            }
        });
    }
    
    function togglePauseMenu() {
        // Implementation to show/hide pause menu
        console.log('Toggle pause menu');
    }
})();
