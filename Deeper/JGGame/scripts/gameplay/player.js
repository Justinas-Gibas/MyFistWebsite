/**
 * Player System
 * 
 * Handles player stats, movement, interaction, and progression
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.player = {};

(function() {
    // Player state
    const stats = {
        level: 1,
        experience: 0,
        experienceToNextLevel: 100,
        strength: 5,
        dexterity: 5,
        intelligence: 5,
        constitution: 5,
        health: 100,
        maxHealth: 100,
        mana: 50,
        maxMana: 50,
        stamina: 100,
        maxStamina: 100
    };
    
    // Player position and orientation
    let position = { x: 0, y: 1.6, z: 0 };
    let rotation = { x: 0, y: 0, z: 0 };
    
    // Interaction state
    let interactableObjects = [];
    let nearestInteractable = null;
    const interactDistance = 3.0;
    
    // Player equipment
    const equipment = {
        head: null,
        chest: null,
        legs: null,
        feet: null,
        hands: null,
        mainHand: null,
        offHand: null,
        necklace: null,
        ring1: null,
        ring2: null
    };
    
    // Initialize player system
    Game.gameplay.player.init = function() {
        console.log('Initializing player system');
        setupPlayerEntity();
        setupInteractionSystem();
        updateStatsDisplay();
        return Promise.resolve();
    };
    
    // Update player (called each frame)
    Game.gameplay.player.update = function(deltaTime) {
        updatePlayerPosition();
        updateNearestInteractable();
        updateStatsRegeneration(deltaTime);
        updatePlayerEffects(deltaTime);
    };
    
    // Get player position
    Game.gameplay.player.getPosition = function() {
        return { ...position };
    };
    
    // Get player rotation
    Game.gameplay.player.getRotation = function() {
        return { ...rotation };
    };
    
    // Get player stats
    Game.gameplay.player.getStats = function() {
        return { ...stats };
    };
    
    // Modify player health
    Game.gameplay.player.modifyHealth = function(amount) {
        stats.health = Math.min(stats.maxHealth, Math.max(0, stats.health + amount));
        updateStatsDisplay();
        
        if (amount < 0) {
            // Play damage effects
            playCameraShake(-amount / 10);
            Game.audio.playSound('player_damage', { volume: Math.min(1.0, -amount / 20) });
            
            // Show damage overlay
            showDamageOverlay(-amount / stats.maxHealth);
            
            // Check for death
            if (stats.health <= 0) {
                handlePlayerDeath();
            }
        } else if (amount > 0) {
            // Play healing effect
            Game.audio.playSound('player_heal');
        }
    };
    
    // Add experience points
    Game.gameplay.player.addExperience = function(amount) {
        stats.experience += amount;
        
        // Show XP gain message
        Game.engine.ui.showNotification(`+${amount} XP`, 'experience');
        
        // Check for level up
        if (stats.experience >= stats.experienceToNextLevel) {
            // Level up
            levelUp();
        }
        
        updateStatsDisplay();
    };
    
    // Equip an item
    Game.gameplay.player.equipItem = function(item, slot) {
        // Implementation to equip items to specific slots
    };
    
    // Handle player interaction with world
    Game.gameplay.player.interact = function() {
        if (nearestInteractable) {
            const interactType = nearestInteractable.getAttribute('data-interact-type');
            const interactId = nearestInteractable.getAttribute('data-interact-id');
            
            console.log(`Interacting with ${interactType} (ID: ${interactId})`);
            
            switch (interactType) {
                case 'npc':
                    Game.gameplay.npc.startDialog(interactId);
                    break;
                    
                case 'item':
                    Game.gameplay.inventory.pickupItem(interactId);
                    break;
                    
                case 'resource':
                    harvestResource(nearestInteractable);
                    break;
                    
                case 'chest':
                    openChest(nearestInteractable);
                    break;
                    
                case 'door':
                    toggleDoor(nearestInteractable);
                    break;
                    
                case 'building':
                    Game.gameplay.building.interactWithBuilding(interactId);
                    break;
            }
            
            // Play interaction sound
            Game.audio.playSound('interact');
        }
    };
    
    // Handle resource collection
    Game.gameplay.player.collectResource = function(resourceType) {
        // Implementation for resource collection
    };
    
    // Use quick slot item
    Game.gameplay.player.useQuickSlot = function(slotIndex) {
        // Implementation for using quickslot items
    };
    
    // Enter a dungeon
    Game.gameplay.player.enterDungeon = function() {
        Game.engine.ui.showNotification('Entering dungeon...', 'info');
        // Trigger dungeon generation and teleport player
    };
    
    // Enter a village
    Game.gameplay.player.enterVillage = function() {
        Game.engine.ui.showNotification('Entering village...', 'info');
        // Handle village interaction
    };
    
    // Investigate ruins
    Game.gameplay.player.investigateRuins = function() {
        Game.engine.ui.showNotification('Investigating ancient ruins...', 'info');
        // Trigger ruins exploration
    };
    
    // Setup player entity
    function setupPlayerEntity() {
        // Configure player rig and camera
        const rig = document.getElementById('rig');
        const camera = document.getElementById('camera');
        
        // Set initial position from game state
        const state = Game.engine.getState();
        if (state && state.player && state.player.position) {
            position = { ...state.player.position };
            rig.setAttribute('position', position);
        }
        
        // Add physics to player
        rig.setAttribute('physics-body', {
            type: 'dynamic',
            mass: 75,
            shape: 'capsule',
            height: 1.6,
            radius: 0.3
        });
    }
    
    // Setup interaction system
    function setupInteractionSystem() {
        // Create raycaster for interaction
        const camera = document.getElementById('camera');
        const interactionRaycaster = document.createElement('a-entity');
        
        interactionRaycaster.setAttribute('raycaster', {
            objects: '.interactive',
            far: interactDistance,
            interval: 100
        });
        
        camera.appendChild(interactionRaycaster);
        
        // Add event listeners for interaction
        document.addEventListener('keydown', (e) => {
            if (e.key === 'e' || e.key === 'E') {
                Game.gameplay.player.interact();
            }
        });
    }
    
    // Update player position
    function updatePlayerPosition() {
        // Get position from A-Frame rig
        const rig = document.getElementById('rig');
        if (rig) {
            const rigPosition = rig.getAttribute('position');
            position = { ...rigPosition };
            
            const camera = document.getElementById('camera');
            if (camera) {
                const cameraRotation = camera.getAttribute('rotation');
                rotation = { ...cameraRotation };
            }
            
            // Update game state with new position
            const state = Game.engine.getState();
            if (state && state.player) {
                state.player.position = { ...position };
                state.player.rotation = { ...rotation };
                Game.engine.setState(state);
            }
        }
    }
    
    // Update nearest interactable object
    function updateNearestInteractable() {
        // Find all interactive objects within range
        const camera = document.getElementById('camera');
        
        if (!camera) return;
        
        const cameraPosition = camera.getAttribute('position');
        const cameraWorldPosition = {
            x: position.x + cameraPosition.x,
            y: position.y + cameraPosition.y,
            z: position.z + cameraPosition.z
        };
        
        const interactives = document.querySelectorAll('.interactive');
        let closest = null;
        let closestDistance = interactDistance;
        
        interactives.forEach(interactive => {
            const objPosition = interactive.getAttribute('position');
            
            // Calculate distance
            const dx = objPosition.x - cameraWorldPosition.x;
            const dy = objPosition.y - cameraWorldPosition.y;
            const dz = objPosition.z - cameraWorldPosition.z;
            const distance = Math.sqrt(dx * dx + dy * dy + dz * dz);
            
            if (distance < closestDistance) {
                closest = interactive;
                closestDistance = distance;
            }
        });
        
        // Update nearest interactable
        if (nearestInteractable !== closest) {
            nearestInteractable = closest;
            
            // Update interaction prompt
            const prompt = document.getElementById('interaction-prompt');
            
            if (prompt) {
                if (nearestInteractable) {
                    const interactType = nearestInteractable.getAttribute('data-interact-type');
                    let promptText = 'Press E to interact';
                    
                    // Customize prompt based on interaction type
                    switch (interactType) {
                        case 'npc': promptText = 'Press E to talk'; break;
                        case 'item': promptText = 'Press E to pick up'; break;
                        case 'resource': promptText = 'Press E to harvest'; break;
                        case 'chest': promptText = 'Press E to open'; break;
                        case 'door': promptText = 'Press E to open/close'; break;
                    }
                    
                    prompt.querySelector('p').textContent = promptText;
                    prompt.classList.remove('hidden');
                } else {
                    prompt.classList.add('hidden');
                }
            }
        }
    }
    
    // Update health/mana/stamina regeneration
    function updateStatsRegeneration(deltaTime) {
        // Health regeneration (0.5% per second)
        const healthRegenRate = stats.maxHealth * 0.005 * (deltaTime / 1000);
        if (stats.health < stats.maxHealth) {
            stats.health = Math.min(stats.maxHealth, stats.health + healthRegenRate);
        }
        
        // Mana regeneration (1% per second)
        const manaRegenRate = stats.maxMana * 0.01 * (deltaTime / 1000);
        if (stats.mana < stats.maxMana) {
            stats.mana = Math.min(stats.maxMana, stats.mana + manaRegenRate);
        }
        
        // Stamina regeneration (5% per second when not sprinting)
        const staminaRegenRate = stats.maxStamina * 0.05 * (deltaTime / 1000);
        if (stats.stamina < stats.maxStamina) {
            stats.stamina = Math.min(stats.maxStamina, stats.stamina + staminaRegenRate);
        }
        
        // Update UI less frequently to avoid overhead
        if (Math.random() < 0.05) {
            updateStatsDisplay();
        }
    }
    
    // Update player effects (buffs, debuffs, etc.)
    function updatePlayerEffects(deltaTime) {
        // Placeholder for player effects system
    }
    
    // Update stats display in the UI
    function updateStatsDisplay() {
        // Update health bar
        const healthBar = document.getElementById('health-bar');
        if (healthBar) {
            const healthFill = healthBar.querySelector('.health-fill');
            if (healthFill) {
                const healthPercent = (stats.health / stats.maxHealth) * 100;
                healthFill.style.width = `${healthPercent}%`;
            }
        }
        
        // Update mana bar
        const manaBar = document.getElementById('mana-bar');
        if (manaBar) {
            const manaFill = manaBar.querySelector('.mana-fill');
            if (manaFill) {
                const manaPercent = (stats.mana / stats.maxMana) * 100;
                manaFill.style.width = `${manaPercent}%`;
            }
        }
        
        // Update stamina bar
        const staminaBar = document.getElementById('stamina-bar');
        if (staminaBar) {
            const staminaFill = staminaBar.querySelector('.stamina-fill');
            if (staminaFill) {
                const staminaPercent = (stats.stamina / stats.maxStamina) * 100;
                staminaFill.style.width = `${staminaPercent}%`;
            }
        }
        
        // Update level display
        const levelDisplay = document.getElementById('level-display');
        if (levelDisplay) {
            levelDisplay.textContent = `Level ${stats.level}`;
        }
        
        // Update XP bar
        const xpBar = document.getElementById('xp-bar');
        if (xpBar) {
            const xpFill = xpBar.querySelector('.xp-fill');
            if (xpFill) {
                const xpPercent = (stats.experience / stats.experienceToNextLevel) * 100;
                xpFill.style.width = `${xpPercent}%`;
            }
        }
    }
    
    // Show damage overlay
    function showDamageOverlay(intensity) {
        const overlay = document.getElementById('damage-overlay');
        if (overlay) {
            overlay.style.opacity = Math.min(0.8, intensity);
            overlay.classList.add('active');
            
            // Fade out
            setTimeout(() => {
                overlay.classList.remove('active');
            }, 500);
        }
    }
    
    // Play camera shake effect
    function playCameraShake(intensity) {
        const camera = document.getElementById('camera');
        if (camera) {
            // Add shake animation
            const maxShake = Math.min(0.1, intensity * 0.01);
            
            // Use A-Frame animation component for shake effect
            camera.setAttribute('animation__shake', {
                property: 'position',
                dir: 'alternate',
                dur: 100,
                easing: 'easeInOutSine',
                loop: 3,
                from: `0 1.6 0`,
                to: `${(Math.random() - 0.5) * maxShake} ${1.6 + (Math.random() - 0.5) * maxShake} ${(Math.random() - 0.5) * maxShake}`
            });
        }
    }
    
    // Handle player death
    function handlePlayerDeath() {
        console.log('Player died');
        
        // Play death sound
        Game.audio.playSound('player_death');
        
        // Show death screen
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.classList.remove('hidden');
        }
        
        // Disable player movement
        const rig = document.getElementById('rig');
        if (rig) {
            rig.setAttribute('movement-controls', 'enabled', false);
        }
        
        // Add camera fall animation
        const camera = document.getElementById('camera');
        if (camera) {
            camera.setAttribute('animation__death', {
                property: 'position',
                to: '0 0.5 0',
                dur: 1000,
                easing: 'easeInQuad'
            });
            
            camera.setAttribute('animation__deathRotate', {
                property: 'rotation.z',
                to: 90,
                dur: 1000,
                easing: 'easeInQuad'
            });
        }
        
        // Trigger death event
        Game.engine.events.emit('player:death', {});
        
        // Set timeout to show respawn options
        setTimeout(showRespawnOptions, 3000);
    }
    
    // Show respawn options after death
    function showRespawnOptions() {
        // Show respawn button
        const respawnBtn = document.getElementById('respawn-button');
        if (respawnBtn) {
            respawnBtn.classList.remove('hidden');
            
            // Add event listener
            respawnBtn.addEventListener('click', () => {
                respawnPlayer();
            });
        }
    }
    
    // Respawn the player
    function respawnPlayer() {
        // Reset health
        stats.health = stats.maxHealth * 0.5; // 50% health on respawn
        stats.mana = stats.maxMana * 0.5;
        stats.stamina = stats.maxStamina;
        
        // Hide death screen
        const deathScreen = document.getElementById('death-screen');
        if (deathScreen) {
            deathScreen.classList.add('hidden');
        }
        
        // Reset camera position
        const camera = document.getElementById('camera');
        if (camera) {
            camera.setAttribute('position', '0 1.6 0');
            camera.setAttribute('rotation', '0 0 0');
            camera.removeAttribute('animation__death');
            camera.removeAttribute('animation__deathRotate');
        }
        
        // Re-enable player movement
        const rig = document.getElementById('rig');
        if (rig) {
            rig.setAttribute('movement-controls', 'enabled', true);
            
            // Move to respawn point (nearest base or spawn point)
            const respawnPoint = getClosestRespawnPoint();
            rig.setAttribute('position', respawnPoint);
        }
        
        // Update UI
        updateStatsDisplay();
        
        // Play respawn sound
        Game.audio.playSound('player_respawn');
        
        // Show notification
        Game.engine.ui.showNotification('You have been revived', 'info');
        
        // Trigger respawn event
        Game.engine.events.emit('player:respawn', {});
    }
    
    // Get the closest respawn point
    function getClosestRespawnPoint() {
        const state = Game.engine.getState();
        
        // Check if player has a base
        if (state.base && state.base.buildings && state.base.buildings.length > 0) {
            // Find central position of base
            let baseX = 0, baseZ = 0;
            for (const building of state.base.buildings) {
                baseX += building.position.x;
                baseZ += building.position.z;
            }
            
            baseX /= state.base.buildings.length;
            baseZ /= state.base.buildings.length;
            
            return { x: baseX, y: 1.6, z: baseZ };
        }
        
        // Default to world spawn point
        return { x: 0, y: 1.6, z: 0 };
    }
    
    // Level up the player
    function levelUp() {
        stats.level++;
        
        // Calculate XP for next level (exponential growth)
        stats.experienceToNextLevel = Math.floor(100 * Math.pow(1.5, stats.level - 1));
        
        // Reset current XP to overflow
        stats.experience = Math.max(0, stats.experience - stats.experienceToNextLevel);
        
        // Increase stats
        stats.strength += 1;
        stats.dexterity += 1;
        stats.intelligence += 1;
        stats.constitution += 1;
        
        // Update derived stats
        stats.maxHealth = 100 + (stats.constitution * 10);
        stats.health = stats.maxHealth;
        stats.maxMana = 50 + (stats.intelligence * 5);
        stats.mana = stats.maxMana;
        stats.maxStamina = 100 + (stats.dexterity * 5);
        stats.stamina = stats.maxStamina;
        
        // Show level up notification
        Game.engine.ui.showNotification(`Level Up! You are now level ${stats.level}`, 'levelup');
        
        // Play level up sound and effect
        Game.audio.playSound('player_levelup');
        
        // Create level up particles
        createLevelUpEffect();
        
        // Trigger level up event
        Game.engine.events.emit('player:levelUp', { level: stats.level });
    }
    
    // Create particle effect for level up
    function createLevelUpEffect() {
        const rig = document.getElementById('rig');
        
        if (rig) {
            // Create level up particles
            const particles = document.createElement('a-entity');
            particles.setAttribute('particle-system', {
                preset: 'dust',
                particleCount: 100,
                color: '#FFFF00, #FFFFFF',
                size: 0.5,
                velocityValue: '0 1 0',
                velocitySpread: '2 2 2',
                accelerationValue: '0 -1 0',
                maxAge: 2,
                blending: 'additive'
            });
            
            particles.setAttribute('position', '0 1 0');
            rig.appendChild(particles);
            
            // Remove after animation completes
            setTimeout(() => {
                if (particles.parentNode) {
                    particles.parentNode.removeChild(particles);
                }
            }, 2000);
        }
    }
    
    // Handle resource harvesting
    function harvestResource(resourceNode) {
        const resourceType = resourceNode.getAttribute('data-resource-type');
        
        // Play harvest animation
        resourceNode.setAttribute('animation', {
            property: 'scale',
            from: '1 1 1',
            to: '0.5 0.5 0.5',
            dur: 500,
            easing: 'easeInQuad'
        });
        
        // Add resource to inventory based on type
        let amount = Math.floor(1 + Math.random() * 3); // 1-3 resources
        
        // Display resource collection message
        Game.engine.ui.showNotification(`Collected ${amount} ${resourceType}`, 'resource');
        
        // Update resource count in game state
        const state = Game.engine.getState();
        if (state && state.base && state.base.resources) {
            state.base.resources[resourceType] = (state.base.resources[resourceType] || 0) + amount;
            Game.engine.setState(state);
            Game.engine.ui.updateResourceDisplay();
        }
        
        // Play sound effect based on resource type
        let soundId;
        switch (resourceType) {
            case 'wood': soundId = 'collect_wood'; break;
            case 'stone': soundId = 'collect_stone'; break;
            case 'metal': soundId = 'collect_metal'; break;
            default: soundId = 'collect_resource';
        }
        
        Game.audio.playSound(soundId, { position: resourceNode.getAttribute('position') });
        
        // Remove resource node after collection
        setTimeout(() => {
            if (resourceNode.parentNode) {
                resourceNode.parentNode.removeChild(resourceNode);
            }
        }, 500);
    }
    
    // Open a chest
    function openChest(chest) {
        const chestId = chest.getAttribute('data-interact-id');
        const chestTier = chest.getAttribute('data-chest-tier') || 'wood';
        
        console.log(`Opening ${chestTier} chest (ID: ${chestId})`);
        
        // Generate loot based on chest tier
        const playerLevel = stats.level;
        const loot = Game.gameplay.loot.generateChestLoot(chestTier, playerLevel);
        
        // Play chest open animation
        chest.setAttribute('animation', {
            property: 'rotation.x',
            to: -90,
            dur: 1000,
            easing: 'easeOutElastic'
        });
        
        // Play chest open sound
        Game.audio.playSound('chest_open', { position: chest.getAttribute('position') });
        
        // Show loot UI
        Game.engine.ui.showLootScreen(loot, 'You found:');
        
        // Add items to player inventory (automatically when closing loot screen)
        
        // Mark chest as opened in game state
        const state = Game.engine.getState();
        if (state && state.world && state.world.openedChests) {
            state.world.openedChests.push(chestId);
            Game.engine.setState(state);
        }
    }
    
    // Toggle a door open/closed
    function toggleDoor(door) {
        const isOpen = door.getAttribute('data-is-open') === 'true';
        
        if (isOpen) {
            // Close door
            door.setAttribute('animation', {
                property: 'rotation.y',
                to: 0,
                dur: 1000,
                easing: 'easeOutQuad'
            });
            door.setAttribute('data-is-open', 'false');
            Game.audio.playSound('door_close', { position: door.getAttribute('position') });
        } else {
            // Open door
            door.setAttribute('animation', {
                property: 'rotation.y',
                to: 90,
                dur: 1000,
                easing: 'easeOutQuad'
            });
            door.setAttribute('data-is-open', 'true');
            Game.audio.playSound('door_open', { position: door.getAttribute('position') });
        }
    }
})();