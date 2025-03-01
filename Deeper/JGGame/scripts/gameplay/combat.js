/**
 * Combat System
 * 
 * Handles combat mechanics including damage calculation, hit detection,
 * status effects, and enemy raids.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.combat = {};

(function() {
    // Combat state
    let inCombat = false;
    let lastAttackTime = 0;
    const attackCooldown = 500; // milliseconds
    let activeRaid = null;
    
    // Status effects on entities
    const statusEffects = new Map();
    
    // Weapon types
    const weaponTypes = {
        sword: {
            damage: { min: 5, max: 10 },
            range: 2,
            attackSpeed: 1.0,
            attackArc: 45,
            staminaCost: 10,
            effects: [],
            sound: 'attack_sword',
            particleEffect: 'slash'
        },
        axe: {
            damage: { min: 7, max: 12 },
            range: 1.8,
            attackSpeed: 0.8,
            attackArc: 35,
            staminaCost: 15,
            effects: [],
            sound: 'attack_axe',
            particleEffect: 'slash'
        },
        mace: {
            damage: { min: 8, max: 15 },
            range: 1.5,
            attackSpeed: 0.7,
            attackArc: 30,
            staminaCost: 18,
            effects: ['stun'],
            sound: 'attack_mace',
            particleEffect: 'impact'
        },
        dagger: {
            damage: { min: 3, max: 6 },
            range: 1.2,
            attackSpeed: 1.5,
            attackArc: 25,
            staminaCost: 5,
            effects: ['bleed'],
            sound: 'attack_dagger',
            particleEffect: 'slash'
        },
        bow: {
            damage: { min: 4, max: 9 },
            range: 30,
            attackSpeed: 0.8,
            attackArc: 5,
            staminaCost: 8,
            effects: [],
            sound: 'attack_bow',
            particleEffect: 'impact'
        },
        staff: {
            damage: { min: 3, max: 6 },
            range: 1.5,
            attackSpeed: 0.9,
            attackArc: 30,
            staminaCost: 5,
            magicDamage: { min: 5, max: 12 },
            manaCost: 10,
            effects: [],
            sound: 'attack_staff',
            particleEffect: 'magic'
        }
    };
    
    // Status effect definitions
    const statusEffectTypes = {
        bleed: {
            name: "Bleeding",
            icon: "bleed_icon",
            damagePerTick: 2,
            tickInterval: 1000, // 1 second
            duration: 5000, // 5 seconds
            stackable: true,
            maxStacks: 3,
            particleEffect: 'blood'
        },
        poison: {
            name: "Poisoned",
            icon: "poison_icon",
            damagePerTick: 1,
            tickInterval: 500, // 0.5 seconds
            duration: 8000, // 8 seconds
            stackable: true,
            maxStacks: 5,
            particleEffect: 'poison'
        },
        stun: {
            name: "Stunned",
            icon: "stun_icon",
            disablesMovement: true,
            disablesAttack: true,
            duration: 2000, // 2 seconds
            stackable: false,
            particleEffect: 'stun'
        },
        burn: {
            name: "Burning",
            icon: "burn_icon",
            damagePerTick: 3,
            tickInterval: 1000, // 1 second
            duration: 4000, // 4 seconds
            stackable: true,
            maxStacks: 3,
            particleEffect: 'fire'
        },
        slow: {
            name: "Slowed",
            icon: "slow_icon",
            movementPenalty: 0.5, // 50% slower
            attackSpeedPenalty: 0.3, // 30% slower
            duration: 3000, // 3 seconds
            stackable: false,
            particleEffect: 'slow'
        },
        frozen: {
            name: "Frozen",
            icon: "frozen_icon",
            disablesMovement: true,
            attackSpeedPenalty: 0.9, // 90% slower
            duration: 3000, // 3 seconds
            stackable: false,
            particleEffect: 'ice'
        }
    };
    
    // Enemy raid configurations
    const raidConfigurations = {
        small: {
            waves: 1,
            enemiesPerWave: { min: 3, max: 5 },
            types: ['skeleton', 'zombie'],
            spawnRadius: 20,
            timeBetweenWaves: 0,
            baseExperience: 50,
            baseGold: 20
        },
        medium: {
            waves: 2,
            enemiesPerWave: { min: 4, max: 7 },
            types: ['skeleton', 'zombie', 'spider'],
            spawnRadius: 25,
            timeBetweenWaves: 30000, // 30 seconds
            baseExperience: 100,
            baseGold: 50
        },
        large: {
            waves: 3,
            enemiesPerWave: { min: 5, max: 10 },
            types: ['skeleton', 'zombie', 'spider', 'wraith'],
            spawnRadius: 30,
            timeBetweenWaves: 45000, // 45 seconds
            baseExperience: 200,
            baseGold: 100,
            includesBoss: true
        },
        siege: {
            waves: 5,
            enemiesPerWave: { min: 8, max: 15 },
            types: ['skeleton', 'zombie', 'spider', 'wraith', 'golem'],
            spawnRadius: 40,
            timeBetweenWaves: 60000, // 60 seconds
            baseExperience: 500,
            baseGold: 250,
            includesBoss: true,
            targetBuildings: true
        }
    };
    
    // Initialize combat system
    Game.gameplay.combat.init = function() {
        console.log('Initializing combat system');
        
        setupCombatControls();
        setupRaidEvents();
        
        // Subscribe to relevant events
        Game.engine.events.subscribe('player:attack', handlePlayerAttack);
        Game.engine.events.subscribe('enemy:attack', handleEnemyAttack);
        
        return Promise.resolve();
    };
    
    // Update combat state (called each frame)
    Game.gameplay.combat.update = function(deltaTime) {
        updateStatusEffects(deltaTime);
        
        if (activeRaid) {
            updateActiveRaid(deltaTime);
        }
    };
    
    // Player attacks
    Game.gameplay.combat.playerAttack = function(targetPosition, weaponType) {
        const currentTime = Date.now();
        
        // Check cooldown
        if (currentTime - lastAttackTime < attackCooldown) {
            return false;
        }
        
        // Set last attack time
        lastAttackTime = currentTime;
        
        // Get player stats and position
        const player = Game.gameplay.player;
        const playerStats = player.getStats();
        const playerPos = player.getPosition();
        
        // Check if player has enough stamina/mana
        const weapon = weaponTypes[weaponType] || weaponTypes.sword;
        
        if (playerStats.stamina < weapon.staminaCost) {
            Game.engine.ui.showNotification("Not enough stamina!", "warning");
            return false;
        }
        
        if (weapon.manaCost && playerStats.mana < weapon.manaCost) {
            Game.engine.ui.showNotification("Not enough mana!", "warning");
            return false;
        }
        
        // Consume resources
        player.modifyStamina(-weapon.staminaCost);
        if (weapon.manaCost) {
            player.modifyMana(-weapon.manaCost);
        }
        
        // Create attack effect
        createAttackEffect(playerPos, targetPosition, weapon);
        
        // Find enemies in range/arc
        const hitEnemies = findEnemiesInAttackRange(playerPos, targetPosition, weapon);
        
        // Apply damage to enemies
        hitEnemies.forEach(enemy => {
            const damage = calculateDamage(playerStats, weapon, enemy);
            applyDamage(enemy, damage);
            
            // Apply weapon effects
            if (weapon.effects && weapon.effects.length > 0) {
                weapon.effects.forEach(effectName => {
                    if (statusEffectTypes[effectName]) {
                        applyStatusEffect(enemy.id, effectName);
                    }
                });
            }
        });
        
        // Emit attack event with hits
        Game.engine.events.emit('player:attack', {
            weapon: weaponType,
            position: playerPos,
            targetPosition: targetPosition,
            hits: hitEnemies.map(e => e.id)
        });
        
        // Enter combat state if enemies were hit
        if (hitEnemies.length > 0 && !inCombat) {
            enterCombat();
        }
        
        return true;
    };
    
    // Trigger an enemy raid
    Game.gameplay.combat.triggerEnemyRaid = function(raidType = 'small', targetPosition = null) {
        if (activeRaid) {
            console.log('Raid already in progress');
            return false;
        }
        
        // Get raid configuration
        const raidConfig = raidConfigurations[raidType];
        if (!raidConfig) {
            console.error(`Unknown raid type: ${raidType}`);
            return false;
        }
        
        // If no target position provided, use player base or player position
        if (!targetPosition) {
            const gameState = Game.engine.getState();
            if (gameState.base && gameState.base.buildings && gameState.base.buildings.length > 0) {
                // Target the base
                const centerBuilding = gameState.base.buildings[0];
                targetPosition = centerBuilding.position;
            } else {
                // Target the player
                targetPosition = Game.gameplay.player.getPosition();
            }
        }
        
        // Create raid object
        activeRaid = {
            type: raidType,
            config: raidConfig,
            targetPosition: { ...targetPosition },
            currentWave: 0,
            totalWaves: raidConfig.waves,
            enemiesRemaining: 0,
            waveStartTime: Date.now(),
            nextWaveTime: 0,
            spawnedEnemies: [],
            completed: false,
            success: false
        };
        
        // Start first wave
        startRaidWave();
        
        // Show notification
        Game.engine.ui.showNotification(`Enemy raid incoming! Prepare for ${raidConfig.waves} wave${raidConfig.waves > 1 ? 's' : ''}!`, 'combat');
        
        // Play raid start sound
        Game.audio.playSound('raid_horn');
        
        // Enter combat
        enterCombat();
        
        return true;
    };
    
    // Check if player is in combat
    Game.gameplay.combat.isInCombat = function() {
        return inCombat;
    };
    
    // Get active raid information
    Game.gameplay.combat.getActiveRaid = function() {
        return activeRaid ? { ...activeRaid } : null;
    };
    
    // Apply damage to an entity
    Game.gameplay.combat.applyDamage = function(entityId, amount, damageType = 'physical', source = null) {
        return applyDamage({ id: entityId }, amount, damageType, source);
    };
    
    // Apply a status effect to an entity
    Game.gameplay.combat.applyStatusEffect = function(entityId, effectName, source = null) {
        return applyStatusEffect(entityId, effectName, source);
    };
    
    // Remove a status effect from an entity
    Game.gameplay.combat.removeStatusEffect = function(entityId, effectName) {
        if (!statusEffects.has(entityId)) return false;
        
        const entityEffects = statusEffects.get(entityId);
        const index = entityEffects.findIndex(effect => effect.name === effectName);
        
        if (index >= 0) {
            const effect = entityEffects[index];
            
            // Clean up effect visuals
            if (effect.particleEffectId) {
                Game.engine.particles.stopEffect(effect.particleEffectId);
            }
            
            // Remove effect
            entityEffects.splice(index, 1);
            
            // If no more effects, remove from map
            if (entityEffects.length === 0) {
                statusEffects.delete(entityId);
            }
            
            return true;
        }
        
        return false;
    };
    
    // Calculate damage based on attacker stats and weapon
    function calculateDamage(attackerStats, weapon, target) {
        // Base damage calculation
        const baseDamage = Math.random() * (weapon.damage.max - weapon.damage.min) + weapon.damage.min;
        
        // Apply strength modifier
        let totalDamage = baseDamage * (1 + (attackerStats.strength || 0) / 20);
        
        // Apply critical hit chance
        const critChance = ((attackerStats.dexterity || 0) / 100) * 0.3; // Max 30% crit chance
        if (Math.random() < critChance) {
            totalDamage *= 1.5;
            
            // Show critical hit notification
            Game.engine.ui.showNotification("Critical hit!", "combat");
            
            // Play crit sound
            Game.audio.playSound('critical_hit');
        }
        
        // Apply magic damage if applicable
        if (weapon.magicDamage) {
            const magicDamage = Math.random() * (weapon.magicDamage.max - weapon.magicDamage.min) + weapon.magicDamage.min;
            totalDamage += magicDamage * (1 + (attackerStats.intelligence || 0) / 20);
        }
        
        // Round to integer
        return Math.round(totalDamage);
    }
    
    // Apply damage to an entity
    function applyDamage(entity, amount, damageType = 'physical', source = null) {
        // Special handling for player
        if (entity.id === 'player') {
            Game.gameplay.player.modifyHealth(-amount);
            
            // Show damage number
            showDamageNumber(Game.gameplay.player.getPosition(), amount);
            
            // Play hit sound
            Game.audio.playSound('player_damage');
            
            return true;
        }
        
        // Handle enemies
        const enemy = Game.gameplay.enemy ? Game.gameplay.enemy.getEnemy(entity.id) : null;
        if (enemy) {
            // Apply damage to enemy
            const isDead = Game.gameplay.enemy.damageEnemy(entity.id, amount);
            
            // Show damage number
            showDamageNumber(enemy.position || entity.position, amount);
            
            // Play hit sound
            Game.audio.playSound('enemy_damage', { position: enemy.position });
            
            // Create blood effect
            if (Game.engine.particles) {
                Game.engine.particles.createEffect('blood', enemy.position || entity.position);
            }
            
            // Handle enemy death
            if (isDead) {
                handleEnemyDeath(entity.id, source);
            }
            
            return true;
        }
        
        // Handle other entities like buildings
        // TODO: Implement building damage
        
        return false;
    }
    
    // Apply a status effect to an entity
    function applyStatusEffect(entityId, effectName, source = null) {
        const effectType = statusEffectTypes[effectName];
        if (!effectType) {
            console.error(`Unknown status effect: ${effectName}`);
            return false;
        }
        
        // Get entity position for visual effects
        let entityPosition;
        
        if (entityId === 'player') {
            entityPosition = Game.gameplay.player.getPosition();
        } else {
            const enemy = Game.gameplay.enemy ? Game.gameplay.enemy.getEnemy(entityId) : null;
            if (enemy) {
                entityPosition = enemy.position;
            } else {
                console.warn('Cannot find entity position for status effect');
                entityPosition = { x: 0, y: 0, z: 0 };
            }
        }
        
        // Check if entity already has this effect
        if (!statusEffects.has(entityId)) {
            statusEffects.set(entityId, []);
        }
        
        const entityEffects = statusEffects.get(entityId);
        const existingEffectIndex = entityEffects.findIndex(e => e.name === effectName);
        
        if (existingEffectIndex >= 0) {
            // Effect already exists
            const existingEffect = entityEffects[existingEffectIndex];
            
            if (effectType.stackable && existingEffect.stacks < effectType.maxStacks) {
                // Increment stacks
                existingEffect.stacks += 1;
                existingEffect.damagePerTick = (effectType.damagePerTick || 0) * existingEffect.stacks;
                
                // Reset duration
                existingEffect.startTime = Date.now();
                existingEffect.endTime = Date.now() + effectType.duration;
                
                // Refresh effect
                Game.engine.ui.showNotification(`${effectType.name} stacked (${existingEffect.stacks}x)`, 'effect');
                
                return true;
            } else if (!effectType.stackable) {
                // Just reset the duration for non-stackable effects
                existingEffect.startTime = Date.now();
                existingEffect.endTime = Date.now() + effectType.duration;
                
                // Refresh effect
                Game.engine.ui.showNotification(`${effectType.name} refreshed`, 'effect');
                
                return true;
            }
        }
        
        // Create new effect
        const effect = {
            name: effectName,
            type: effectType,
            stacks: 1,
            startTime: Date.now(),
            endTime: Date.now() + effectType.duration,
            lastTickTime: Date.now(),
            damagePerTick: effectType.damagePerTick || 0,
            source: source
        };
        
        // Create visual effect
        if (effectType.particleEffect && Game.engine.particles) {
            effect.particleEffectId = Game.engine.particles.createEffect(
                effectType.particleEffect, 
                entityPosition,
                { duration: effectType.duration }
            );
        }
        
        // Add effect to entity
        entityEffects.push(effect);
        
        // Show notification
        Game.engine.ui.showNotification(`${effectType.name} applied`, 'effect');
        
        // Play effect sound
        Game.audio.playSound(`effect_${effectName}`);
        
        return true;
    }
    
    // Update all status effects
    function updateStatusEffects(deltaTime) {
        const currentTime = Date.now();
        
        // Iterate through all entities with effects
        for (const [entityId, effects] of statusEffects.entries()) {
            // Check each effect
            for (let i = effects.length - 1; i >= 0; i--) {
                const effect = effects[i];
                
                // Check if effect has expired
                if (currentTime > effect.endTime) {
                    // Remove expired effect
                    if (effect.particleEffectId) {
                        Game.engine.particles.stopEffect(effect.particleEffectId);
                    }
                    
                    effects.splice(i, 1);
                    
                    // Notify effect expiration
                    Game.engine.ui.showNotification(`${effect.type.name} wore off`, 'effect');
                    continue;
                }
                
                // Process damage ticks
                if (effect.damagePerTick && effect.lastTickTime + effect.type.tickInterval <= currentTime) {
                    // Apply damage tick
                    applyDamage({ id: entityId }, effect.damagePerTick, 'effect', effect.source);
                    
                    // Update last tick time
                    effect.lastTickTime = currentTime;
                }
            }
            
            // Remove entity from map if it has no more effects
            if (effects.length === 0) {
                statusEffects.delete(entityId);
            }
        }
    }
    
    // Enter combat state
    function enterCombat() {
        if (inCombat) return;
        
        inCombat = true;
        
        // Notify UI
        Game.engine.ui.showNotification("Entered combat", "combat");
        
        // Play combat music
        if (Game.audio) {
            Game.audio.playMusic('combat');
        }
        
        // Emit event
        Game.engine.events.emit('combat:enter', {});
    }
    
    // Exit combat state
    function exitCombat() {
        if (!inCombat) return;
        
        inCombat = false;
        
        // Notify UI
        Game.engine.ui.showNotification("Combat ended", "combat");
        
        // Play peaceful music
        if (Game.audio) {
            Game.audio.playMusic('peaceful');
        }
        
        // Emit event
        Game.engine.events.emit('combat:exit', {});
    }
    
    // Handle enemy death
    function handleEnemyDeath(enemyId, source) {
        // Update raid status if this is part of a raid
        if (activeRaid && activeRaid.spawnedEnemies.includes(enemyId)) {
            // Remove from spawned enemies
            const index = activeRaid.spawnedEnemies.indexOf(enemyId);
            if (index >= 0) {
                activeRaid.spawnedEnemies.splice(index, 1);
            }
            
            // Decrement enemies remaining
            activeRaid.enemiesRemaining--;
            
            // Check if wave is complete
            if (activeRaid.enemiesRemaining <= 0) {
                // Wave complete
                if (activeRaid.currentWave >= activeRaid.totalWaves) {
                    // All waves complete
                    completeRaid(true);
                } else {
                    // Start next wave after delay
                    activeRaid.nextWaveTime = Date.now() + activeRaid.config.timeBetweenWaves;
                    
                    // Notify UI
                    Game.engine.ui.showNotification(`Wave ${activeRaid.currentWave} complete! Next wave in ${activeRaid.config.timeBetweenWaves / 1000} seconds.`, 'combat');
                }
            }
        }
        
        // Check if combat should end (no more enemies)
        if (Game.gameplay.enemy && Game.gameplay.enemy.getActiveEnemies().length === 0) {
            exitCombat();
        }
    }
    
    // Start a raid wave
    function startRaidWave() {
        if (!activeRaid) return;
        
        // Increment current wave
        activeRaid.currentWave++;
        
        // Determine number of enemies
        const config = activeRaid.config;
        let enemyCount = Math.floor(Math.random() * (config.enemiesPerWave.max - config.enemiesPerWave.min + 1)) + config.enemiesPerWave.min;
        
        // Scale based on player level and difficulty
        const gameState = Game.engine.getState();
        const playerLevel = gameState.player.level || 1;
        const difficulty = gameState.world.difficulty || 1;
        
        enemyCount = Math.ceil(enemyCount * (1 + (playerLevel - 1) * 0.1) * difficulty);
        
        // Include boss in final wave
        const isFinalWave = activeRaid.currentWave >= activeRaid.totalWaves;
        const includeBoss = isFinalWave && config.includesBoss;
        
        // Set enemies remaining count
        activeRaid.enemiesRemaining = enemyCount + (includeBoss ? 1 : 0);
        
        // Spawn normal enemies
        for (let i = 0; i < enemyCount; i++) {
            spawnRaidEnemy(config.types);
        }
        
        // Spawn boss enemy if needed
        if (includeBoss) {
            spawnRaidBoss();
        }
        
        // Update wave start time
        activeRaid.waveStartTime = Date.now();
        activeRaid.nextWaveTime = 0;
        
        // Notify wave start
        Game.engine.ui.showNotification(`Wave ${activeRaid.currentWave}/${activeRaid.totalWaves} started! ${activeRaid.enemiesRemaining} enemies approaching.`, 'combat');
        
        // Play wave start sound
        Game.audio.playSound('raid_wave_start');
    }
    
    // Complete raid
    function completeRaid(success) {
        if (!activeRaid) return;
        
        activeRaid.completed = true;
        activeRaid.success = success;
        
        // Award rewards if successful
        if (success) {
            const config = activeRaid.config;
            const baseXP = config.baseExperience || 50;
            const baseGold = config.baseGold || 20;
            
            // Scale rewards based on raid difficulty and player level
            const gameState = Game.engine.getState();
            const playerLevel = gameState.player.level || 1;
            const difficulty = gameState.world.difficulty || 1;
            
            const xpReward = Math.ceil(baseXP * Math.sqrt(playerLevel) * difficulty);
            const goldReward = Math.ceil(baseGold * Math.sqrt(playerLevel) * difficulty);
            
            // Add XP to player
            Game.gameplay.player.addExperience(xpReward);
            
            // Add gold to player
            // TODO: Implement currency/gold system
            
            // Notify success and rewards
            Game.engine.ui.showNotification(`Raid defeated! Earned ${xpReward} XP and ${goldReward} gold.`, 'success');
            
            // Play victory sound
            Game.audio.playSound('raid_victory');
        } else {
            // Notify failure
            Game.engine.ui.showNotification('Raid failed!', 'error');
            
            // Play defeat sound
            Game.audio.playSound('raid_defeat');
        }
        
        // Emit raid completion event
        Game.engine.events.emit('raid:complete', {
            type: activeRaid.type,
            waves: activeRaid.currentWave,
            success: success
        });
        
        // Clear active raid
        activeRaid = null;
    }
    
    // Spawn an enemy for a raid
    function spawnRaidEnemy(enemyTypes) {
        if (!activeRaid) return null;
        
        // Select random enemy type
        const type = enemyTypes[Math.floor(Math.random() * enemyTypes.length)];
        
        // Calculate spawn position (circle around target)
        const angle = Math.random() * Math.PI * 2; // 0 to 2π
        const distance = activeRaid.config.spawnRadius;
        
        const spawnPos = {
            x: activeRaid.targetPosition.x + Math.cos(angle) * distance,
            y: activeRaid.targetPosition.y,
            z: activeRaid.targetPosition.z + Math.sin(angle) * distance
        };
        
        // Spawn enemy
        const enemyId = Game.gameplay.enemy.spawnEnemy(type, spawnPos, {
            level: Game.gameplay.player.getStats().level,
            targetPosition: activeRaid.targetPosition,
            aggressive: true
        });
        
        if (enemyId) {
            // Add to raid enemies
            activeRaid.spawnedEnemies.push(enemyId);
        }
        
        return enemyId;
    }
    
    // Spawn a boss enemy for a raid
    function spawnRaidBoss() {
        if (!activeRaid) return null;
        
        // Calculate spawn position (behind normal enemies)
        const angle = Math.random() * Math.PI * 2; // 0 to 2π
        const distance = activeRaid.config.spawnRadius * 1.2; // Further back
        
        const spawnPos = {
            x: activeRaid.targetPosition.x + Math.cos(angle) * distance,
            y: activeRaid.targetPosition.y,
            z: activeRaid.targetPosition.z + Math.sin(angle) * distance
        };
        
        // Select boss type based on raid
        let bossType;
        
        switch (activeRaid.type) {
            case 'small':
                bossType = 'skeleton_captain';
                break;
            case 'medium':
                bossType = 'zombie_brute';
                break;
            case 'large':
                bossType = 'wraith_lord';
                break;
            case 'siege':
                bossType = 'golem_ancient';
                break;
            default:
                bossType = 'skeleton_captain';
        }
        
        // Spawn boss with higher level
        const enemyId = Game.gameplay.enemy.spawnEnemy(bossType, spawnPos, {
            level: Math.ceil(Game.gameplay.player.getStats().level * 1.5),
            targetPosition: activeRaid.targetPosition,
            aggressive: true,
            isBoss: true
        });
        
        if (enemyId) {
            // Add to raid enemies
            activeRaid.spawnedEnemies.push(enemyId);
            
            // Notify player
            Game.engine.ui.showNotification(`A powerful boss has appeared!`, 'warning');
            
            // Play boss sound
            Game.audio.playSound('boss_appear');
        }
        
        return enemyId;
    }
    
    // Update active raid
    function updateActiveRaid(deltaTime) {
        if (!activeRaid) return;
        
        // Check if next wave should start
        if (activeRaid.nextWaveTime > 0 && Date.now() >= activeRaid.nextWaveTime) {
            startRaidWave();
        }
        
        // Check if raid should fail (player died or buildings destroyed)
        // This will be checked in the respective event handlers
    }
    
    // Create attack effect based on weapon and position
    function createAttackEffect(startPos, targetPos, weapon) {
        // Play attack sound
        Game.audio.playSound(weapon.sound || 'attack_generic');
        
        // Create particle effect
        if (Game.engine.
