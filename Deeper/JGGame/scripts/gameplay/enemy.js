/**
 * Enemy System
 * 
 * Manages enemy entities, AI behavior, combat, spawning and lifecycle.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.enemy = {};

(function() {
    // Active enemies in the world
    const activeEnemies = new Map();
    let enemyIdCounter = 0;
    
    // Enemy type definitions
    const enemyTypes = {
        skeleton: {
            name: "Skeleton",
            description: "A reanimated skeleton warrior with basic combat abilities.",
            type: "undead",
            size: 1.0,
            baseHealth: 30,
            baseDamage: { min: 3, max: 6 },
            attackSpeed: 1.2,  // Attacks per second
            movementSpeed: 1.5, // meters per second
            aggroRange: 10,    // meters
            sightRange: 15,    // meters
            attackRange: 1.5,  // meters
            experience: 10,
            level: 1,
            abilities: ['melee'],
            drops: [
                { type: 'bone', chance: 0.7, amount: { min: 1, max: 3 } },
                { type: 'rusty_sword', chance: 0.2, amount: { min: 1, max: 1 } },
                { type: 'gold', chance: 0.4, amount: { min: 1, max: 5 } }
            ],
            soundEffects: {
                spawn: 'skeleton_spawn',
                death: 'skeleton_death',
                attack: 'skeleton_attack',
                idle: 'skeleton_idle',
                hit: 'skeleton_hit'
            },
            deathParticles: 'bone_scatter',
            damageMultipliers: {
                holy: 1.5,
                blunt: 1.2,
                fire: 0.8
            }
        },
        zombie: {
            name: "Zombie",
            description: "A slow but resilient undead creature that hungers for flesh.",
            type: "undead",
            size: 1.0,
            baseHealth: 50,
            baseDamage: { min: 5, max: 8 },
            attackSpeed: 0.8,
            movementSpeed: 1.0,
            aggroRange: 8,
            sightRange: 12,
            attackRange: 1.5,
            experience: 15,
            level: 2,
            abilities: ['melee', 'infection'],
            drops: [
                { type: 'rotten_flesh', chance: 0.8, amount: { min: 1, max: 3 } },
                { type: 'cloth_scrap', chance: 0.5, amount: { min: 1, max: 2 } },
                { type: 'gold', chance: 0.4, amount: { min: 2, max: 6 } }
            ],
            soundEffects: {
                spawn: 'zombie_spawn',
                death: 'zombie_death',
                attack: 'zombie_attack',
                idle: 'zombie_idle',
                hit: 'zombie_hit'
            },
            deathParticles: 'rot_burst',
            damageMultipliers: {
                holy: 1.5,
                fire: 1.3,
                poison: 0.2
            }
        },
        spider: {
            name: "Giant Spider",
            description: "A large, venomous spider that can inflict poison damage.",
            type: "beast",
            size: 0.8,
            baseHealth: 25,
            baseDamage: { min: 3, max: 5 },
            attackSpeed: 1.5,
            movementSpeed: 2.0,
            aggroRange: 7,
            sightRange: 14,
            attackRange: 1.2,
            experience: 12,
            level: 1,
            abilities: ['melee', 'poison'],
            drops: [
                { type: 'spider_silk', chance: 0.6, amount: { min: 1, max: 3 } },
                { type: 'poison_sac', chance: 0.4, amount: { min: 1, max: 1 } },
                { type: 'gold', chance: 0.3, amount: { min: 1, max: 4 } }
            ],
            soundEffects: {
                spawn: 'spider_spawn',
                death: 'spider_death',
                attack: 'spider_attack',
                idle: 'spider_chittering',
                hit: 'spider_hit'
            },
            deathParticles: 'web_burst',
            damageMultipliers: {
                fire: 1.5,
                ice: 0.8
            }
        },
        wraith: {
            name: "Wraith",
            description: "A spectral entity that can float through obstacles and drain life essence.",
            type: "spirit",
            size: 1.1,
            baseHealth: 35,
            baseDamage: { min: 6, max: 9 },
            attackSpeed: 1.0,
            movementSpeed: 1.3,
            aggroRange: 12,
            sightRange: 18,
            attackRange: 1.8,
            experience: 20,
            level: 3,
            abilities: ['melee', 'life_drain', 'phase_shift'],
            drops: [
                { type: 'ectoplasm', chance: 0.7, amount: { min: 1, max: 2 } },
                { type: 'soul_essence', chance: 0.3, amount: { min: 1, max: 1 } },
                { type: 'gold', chance: 0.5, amount: { min: 3, max: 8 } }
            ],
            soundEffects: {
                spawn: 'wraith_spawn',
                death: 'wraith_death',
                attack: 'wraith_attack',
                idle: 'wraith_moan',
                hit: 'wraith_hit'
            },
            deathParticles: 'spirit_dissipate',
            damageMultipliers: {
                holy: 2.0,
                physical: 0.5,
                magic: 1.0
            }
        },
        skeleton_captain: {
            name: "Skeleton Captain",
            description: "A formidable skeleton commander with enhanced combat abilities.",
            type: "undead",
            size: 1.2,
            baseHealth: 80,
            baseDamage: { min: 8, max: 12 },
            attackSpeed: 1.3,
            movementSpeed: 1.6,
            aggroRange: 15,
            sightRange: 20,
            attackRange: 2.0,
            experience: 50,
            level: 5,
            abilities: ['melee', 'command_undead', 'shield_bash'],
            drops: [
                { type: 'bone', chance: 0.9, amount: { min: 3, max: 6 } },
                { type: 'ancient_sword', chance: 0.6, amount: { min: 1, max: 1 } },
                { type: 'gold', chance: 1.0, amount: { min: 10, max: 20 } },
                { type: 'captain_helmet', chance: 0.3, amount: { min: 1, max: 1 } }
            ],
            soundEffects: {
                spawn: 'skeleton_captain_spawn',
                death: 'skeleton_captain_death',
                attack: 'skeleton_captain_attack',
                idle: 'skeleton_captain_idle',
                hit: 'skeleton_captain_hit'
            },
            deathParticles: 'captain_defeat',
            damageMultipliers: {
                holy: 1.5,
                blunt: 1.2,
                fire: 0.8
            },
            isBoss: true
        },
        zombie_brute: {
            name: "Zombie Brute",
            description: "A massive, bloated zombie with incredible strength and resilience.",
            type: "undead",
            size: 1.5,
            baseHealth: 120,
            baseDamage: { min: 10, max: 15 },
            attackSpeed: 0.7,
            movementSpeed: 0.8,
            aggroRange: 10,
            sightRange: 12,
            attackRange: 2.0,
            experience: 60,
            level: 6,
            abilities: ['melee', 'ground_slam', 'frenzy'],
            drops: [
                { type: 'rotten_flesh', chance: 1.0, amount: { min: 5, max: 8 } },
                { type: 'brute_heart', chance: 0.5, amount: { min: 1, max: 1 } },
                { type: 'gold', chance: 1.0, amount: { min: 15, max: 25 } },
                { type: 'steel_gauntlet', chance: 0.4, amount: { min: 1, max: 1 } }
            ],
            soundEffects: {
                spawn: 'zombie_brute_spawn',
                death: 'zombie_brute_death',
                attack: 'zombie_brute_attack',
                idle: 'zombie_brute_idle',
                hit: 'zombie_brute_hit'
            },
            deathParticles: 'brute_explosion',
            damageMultipliers: {
                holy: 1.5,
                fire: 1.3,
                poison: 0.2
            },
            isBoss: true
        }
    };
    
    // Enemy behavior states
    const behaviorStates = {
        IDLE: 'idle',
        PATROL: 'patrol',
        CHASE: 'chase',
        ATTACK: 'attack',
        FLEE: 'flee',
        STUNNED: 'stunned',
        DEAD: 'dead'
    };
    
    // Enemy ability definitions
    const enemyAbilities = {
        melee: {
            name: "Melee Attack",
            description: "Basic melee attack that deals physical damage.",
            cooldown: 0,  // Cooldown in milliseconds (0 means uses attackSpeed instead)
            range: 2.0,   // meters
            damageType: 'physical',
            damageMultiplier: 1.0,
            energyCost: 0,
            animation: 'attack',
            particleEffect: 'slash',
            soundEffect: 'melee_attack',
            execute: function(enemy, target) {
                // Basic melee attack logic
                const damage = calculateDamage(enemy);
                if (Game.gameplay.combat) {
                    Game.gameplay.combat.applyDamage(target.id, damage, 'physical', enemy.id);
                }
                return damage;
            }
        },
        poison: {
            name: "Poison Attack",
            description: "Attack that deals poison damage over time.",
            cooldown: 10000, // 10 seconds
            range: 1.5,
            damageType: 'poison',
            damageMultiplier: 0.8,
            energyCost: 20,
            animation: 'poison_attack',
            particleEffect: 'poison_splash',
            soundEffect: 'poison_attack',
            execute: function(enemy, target) {
                // Do initial damage
                const damage = calculateDamage(enemy) * 0.6;
                if (Game.gameplay.combat) {
                    Game.gameplay.combat.applyDamage(target.id, damage, 'poison', enemy.id);
                    Game.gameplay.combat.applyStatusEffect(target.id, 'poison', enemy.id);
                }
                return damage;
            }
        },
        life_drain: {
            name: "Life Drain",
            description: "Drain life from the target to heal self.",
            cooldown: 15000, // 15 seconds
            range: 3.0,
            damageType: 'magical',
            damageMultiplier: 0.7,
            energyCost: 30,
            animation: 'life_drain',
            particleEffect: 'life_drain_beam',
            soundEffect: 'life_drain',
            execute: function(enemy, target) {
                const damage = calculateDamage(enemy) * 0.7;
                if (Game.gameplay.combat) {
                    // Apply damage
                    Game.gameplay.combat.applyDamage(target.id, damage, 'magical', enemy.id);
                    
                    // Heal self for 50% of damage
                    const healing = Math.ceil(damage * 0.5);
                    enemy.health = Math.min(enemy.health + healing, enemy.maxHealth);
                    
                    // Show healing effect
                    if (Game.engine.particles) {
                        Game.engine.particles.createEffect('heal', enemy.position);
                    }
                }
                return damage;
            }
        },
        ground_slam: {
            name: "Ground Slam",
            description: "Powerful area-of-effect attack that damages and stuns nearby targets.",
            cooldown: 20000, // 20 seconds
            range: 4.0,      // AoE radius
            damageType: 'physical',
            damageMultiplier: 0.9,
            energyCost: 50,
            animation: 'ground_slam',
            particleEffect: 'ground_slam',
            soundEffect: 'ground_slam',
            execute: function(enemy, target) {
                const damage = calculateDamage(enemy) * 0.9;
                
                // Find all targets within range (including player)
                const targets = findTargetsInRange(enemy.position, this.range);
                
                if (Game.gameplay.combat) {
                    // Apply damage and stun to all targets
                    targets.forEach(targetId => {
                        Game.gameplay.combat.applyDamage(targetId, damage, 'physical', enemy.id);
                        Game.gameplay.combat.applyStatusEffect(targetId, 'stun', enemy.id);
                    });
                }
                
                // Create ground slam effect
                if (Game.engine.particles) {
                    Game.engine.particles.createEffect('ground_slam', enemy.position, {
                        scale: this.range,
                        duration: 2000
                    });
                }
                
                return damage * targets.length;  // Total damage dealt
            }
        }
    };
    
    // Initialize enemy system
    Game.gameplay.enemy.init = function() {
        console.log('Initializing enemy system');
        setupEventListeners();
        return Promise.resolve();
    };
    
    // Update enemies (called each frame)
    Game.gameplay.enemy.update = function(deltaTime) {
        // Update all active enemies
        for (const [id, enemy] of activeEnemies) {
            updateEnemy(enemy, deltaTime);
        }
    };
    
    // Spawn an enemy in the world
    Game.gameplay.enemy.spawnEnemy = function(type, position, options = {}) {
        const enemyType = enemyTypes[type];
        if (!enemyType) {
            console.error(`Unknown enemy type: ${type}`);
            return null;
        }
        
        // Generate unique ID
        const enemyId = `enemy_${enemyIdCounter++}`;
        
        // Calculate level based on options or default
        const level = options.level || enemyType.level || 1;
        
        // Scale health and damage based on level
        const healthScaling = 1 + (level - 1) * 0.2;  // 20% more health per level
        const damageScaling = 1 + (level - 1) * 0.15; // 15% more damage per level
        const maxHealth = Math.round(enemyType.baseHealth * healthScaling);
        
        // Create enemy object
        const enemy = {
            id: enemyId,
            type: type,
            name: enemyType.name,
            level: level,
            health: maxHealth,
            maxHealth: maxHealth,
            damage: {
                min: Math.round(enemyType.baseDamage.min * damageScaling),
                max: Math.round(enemyType.baseDamage.max * damageScaling)
            },
            attackSpeed: enemyType.attackSpeed,
            movementSpeed: enemyType.movementSpeed,
            aggroRange: enemyType.aggroRange,
            sightRange: enemyType.sightRange,
            attackRange: enemyType.attackRange,
            abilities: enemyType.abilities || ['melee'],
            lastAttackTime: 0,
            abilityCooldowns: {},
            state: behaviorStates.IDLE,
            position: { ...position },
            rotation: { x: 0, y: 0, z: 0 },
            targetPosition: options.targetPosition || null,
            targetId: options.targetId || null,
            path: [],
            patrolPoints: options.patrolPoints || generatePatrolPoints(position, 5),
            currentPatrolIndex: 0,
            stateTime: 0,
            aggressive: options.aggressive || false,
            isBoss: options.isBoss || enemyType.isBoss || false,
            statusEffects: [],
            entity: null,
            energy: 100,  // For special abilities
            maxEnergy: 100
        };
        
        // Create visual representation
        enemy.entity = createEnemyEntity(enemy);
        
        // Add to active enemies
        activeEnemies.set(enemyId, enemy);
        
        // Set initial state
        if (enemy.aggressive) {
            transitionToState(enemy, behaviorStates.CHASE);
        }
        
        // Play spawn sound
        if (enemyType.soundEffects && enemyType.soundEffects.spawn) {
            Game.audio.playSound(enemyType.soundEffects.spawn, { 
                position: enemy.position,
                volume: enemy.isBoss ? 1.0 : 0.7
            });
        }
        
        // Create spawn particles
        if (Game.engine.particles) {
            Game.engine.particles.createEffect('spawn', enemy.position, {
                color: enemy.isBoss ? '#FF5500' : '#885500',
                scale: enemy.isBoss ? 2.0 : 1.0
            });
        }
        
        console.log(`Spawned enemy ${enemy.name} (Level ${enemy.level}) at position:`, position);
        
        // Emit spawn event
        Game.engine.events.emit('enemy:spawned', {
            id: enemyId,
            type: type,
            position: { ...position },
            level: level,
            isBoss: enemy.isBoss
        });
        
        return enemyId;
    };
    
    // Get an enemy by ID
    Game.gameplay.enemy.getEnemy = function(enemyId) {
        return activeEnemies.get(enemyId);
    };
    
    // Get all active enemies
    Game.gameplay.enemy.getActiveEnemies = function() {
        return Array.from(activeEnemies.values());
    };
    
    // Apply damage to an enemy
    Game.gameplay.enemy.damageEnemy = function(enemyId, amount, damageType = 'physical', source = null) {
        const enemy = activeEnemies.get(enemyId);
        if (!enemy) {
            return false;
        }
        
        // Apply damage multipliers based on enemy type
        let finalDamage = amount;
        const enemyType = enemyTypes[enemy.type];
        if (enemyType && enemyType.damageMultipliers && enemyType.damageMultipliers[damageType]) {
            finalDamage *= enemyType.damageMultipliers[damageType];
        }
        
        // Apply damage
        enemy.health -= Math.round(finalDamage);
        
        // Play hit sound
        if (enemyType && enemyType.soundEffects && enemyType.soundEffects.hit) {
            Game.audio.playSound(enemyType.soundEffects.hit, { position: enemy.position });
        }
        
        // Check if killed
        if (enemy.health <= 0) {
            killEnemy(enemy, source);
            return true;
        }
        
        // If not already chasing, change state to chase attacker
        if (enemy.state !== behaviorStates.CHASE && enemy.state !== behaviorStates.ATTACK) {
            if (source === 'player') {
                enemy.targetId = 'player';
                transitionToState(enemy, behaviorStates.CHASE);
            }
        }
        
        // Emit damage event
        Game.engine.events.emit('enemy:damaged', {
            id: enemyId,
            damage: finalDamage,
            health: enemy.health,
            maxHealth: enemy.maxHealth,
            damageType: damageType,
            source: source
        });
        
        return false; // Not killed
    };
    
    // Kill an enemy (called internally)
    function killEnemy(enemy, source = null) {
        console.log(`Enemy killed: ${enemy.name} (${enemy.id})`);
        
        // Play death sound
        const enemyType = enemyTypes[enemy.type];
        if (enemyType && enemyType.soundEffects && enemyType.soundEffects.death) {
            Game.audio.playSound(enemyType.soundEffects.death, { position: enemy.position });
        }
        
        // Create death particles
        if (Game.engine.particles && enemyType && enemyType.deathParticles) {
            Game.engine.particles.createEffect(enemyType.deathParticles, enemy.position, {
                scale: enemy.isBoss ? 2.0 : 1.0
            });
        }
        
        // Transition to dead state
        transitionToState(enemy, behaviorStates.DEAD);
        
        // Drop loot
        dropLoot(enemy);
        
        // Award experience to player if killed by player
        if (source === 'player' && Game.gameplay.player) {
            const xpReward = calculateXPReward(enemy);
            Game.gameplay.player.addExperience(xpReward);
            
            // Show XP notification
            Game.engine.ui.showNotification(`+${xpReward} XP`, 'experience');
        }
        
        // Remove entity after death animation (after a delay)
        setTimeout(() => {
            // Remove from scene
            if (enemy.entity && enemy.entity.parentNode) {
                enemy.entity.parentNode.removeChild(enemy.entity);
            }
            
            // Remove from active enemies
            activeEnemies.delete(enemy.id);
            
            // Emit death event
            Game.engine.events.emit('enemy:died', {
                id: enemy.id,
                type: enemy.type,
                position: enemy.position,
                isBoss: enemy.isBoss,
                source: source
            });
        }, 2000); // 2 second delay for death animation
    }
    
    // Update an enemy's state and behavior
    function updateEnemy(enemy, deltaTime) {
        // Skip if dead
        if (enemy.state === behaviorStates.DEAD) {
            return;
        }
        
        // Update state time
        enemy.stateTime += deltaTime;
        
        // Update energy regeneration
        enemy.energy = Math.min(enemy.energy + (deltaTime / 1000) * 5, enemy.maxEnergy);
        
        // Update based on current state
        switch (enemy.state) {
            case behaviorStates.IDLE:
                updateIdleState(enemy, deltaTime);
                break;
                
            case behaviorStates.PATROL:
                updatePatrolState(enemy, deltaTime);
                break;
                
            case behaviorStates.CHASE:
                updateChaseState(enemy, deltaTime);
                break;
                
            case behaviorStates.ATTACK:
                updateAttackState(enemy, deltaTime);
                break;
                
            case behaviorStates.FLEE:
                updateFleeState(enemy, deltaTime);
                break;
                
            case behaviorStates.STUNNED:
                updateStunnedState(enemy, deltaTime);
                break;
        }
        
        // Check for player visibility from any state except stunned or dead
        if (enemy.state !== behaviorStates.STUNNED && enemy.state !== behaviorStates.DEAD) {
            checkPlayerVisibility(enemy);
        }
        
        // Update enemy entity position/rotation
        updateEnemyEntity(enemy);
    }
    
    // Update idle behavior
    function updateIdleState(enemy, deltaTime) {
        // Periodically transition to patrol
        if (enemy.stateTime > 5000 + Math.random() * 5000) { // 5-10 seconds idle
            transitionToState(enemy, behaviorStates.PATROL);
        }
    }
    
    // Update patrol behavior
    function updatePatrolState(enemy, deltaTime) {
        // If no patrol points, generate some
        if (!enemy.patrolPoints || enemy.patrolPoints.length === 0) {
            enemy.patrolPoints = generatePatrolPoints(enemy.position, 5);
            enemy.currentPatrolIndex = 0;
        }
        
        // Get current patrol target
        const target = enemy.patrolPoints[enemy.currentPatrolIndex];
        
        // Move towards patrol point
        const distance = moveTowards(enemy, target, deltaTime);
        
        // Check if reached destination
        if (distance < 1.0) {
            // Move to next patrol point
            enemy.currentPatrolIndex = (enemy.currentPatrolIndex + 1) % enemy.patrolPoints.length;
            
            // Occasionally go idle
            if (Math.random() < 0.2) {
                transitionToState(enemy, behaviorStates.IDLE);
            }
        }
    }
    
    // Update chase behavior
    function updateChaseState(enemy, deltaTime) {
        // Get target position (player or other target)
        let targetPosition;
        if (enemy.targetId === 'player' && Game.gameplay.player) {
            targetPosition = Game.gameplay.player.getPosition();
        } else if (enemy.targetPosition) {
            targetPosition = enemy.targetPosition;
        } else {
            // No valid target, go back to patrol
            transitionToState(enemy, behaviorStates.PATROL);
            return;
        }
        
        // Calculate distance to target
        const distanceToTarget = calculateDistance(enemy.position, targetPosition);
        
        // If within attack range, switch to attack
        if (distanceToTarget <= enemy.attackRange) {
            transitionToState(enemy, behaviorStates.ATTACK);
            return;
        }
        
        // If too far, go back to patrol
        if (distanceToTarget > enemy.sightRange * 1.5) {
            enemy.targetId = null;
            transitionToState(enemy, behaviorStates.PATROL);
            return;
        }
        
        // Move towards target
        moveTowards(enemy, targetPosition, deltaTime);
    }
    
    // Update attack behavior
    function updateAttackState(enemy, deltaTime) {
        // Get target position
        let targetPosition, targetEntity;
        if (enemy.targetId === 'player' && Game.gameplay.player) {
            targetPosition = Game.gameplay.player.getPosition();
            targetEntity = { id: 'player' };
        } else if (enemy.targetPosition) {
            targetPosition = enemy.targetPosition;
            targetEntity = { id: 'target', position: targetPosition };
        } else {
            // No valid target, go back to patrol
            transitionToState(enemy, behaviorStates.PATROL);
            return;
        }
        
        // Calculate distance to target
        const distanceToTarget = calculateDistance(enemy.position, targetPosition);
        
        // If too far to attack, chase
        if (distanceToTarget > enemy.attackRange * 1.2) {
            transitionToState(enemy, behaviorStates.CHASE);
            return;
        }
        
        // Face target
        faceTarget(enemy, targetPosition);
        
        // Check attack cooldown
        const currentTime = Date.now();
        if (currentTime - enemy.lastAttackTime >= (1000 / enemy.attackSpeed)) {
            // Perform attack
            performAttack(enemy, targetEntity);
            enemy.lastAttackTime = currentTime;
        }
        
        // Check if should use special ability
        checkSpecialAbilities(enemy, targetEntity);
    }
    
    // Update flee behavior
    function updateFleeState(enemy, deltaTime) {
        // Get target to flee from
        let fleeFromPosition;
        if (enemy.targetId === 'player' && Game.gameplay.player) {
            fleeFromPosition = Game.gameplay.player.getPosition();
        } else if (enemy.targetPosition) {
            fleeFromPosition = enemy.targetPosition;
        } else {
            // No valid target to flee from, go back to patrol
            transitionToState(enemy, behaviorStates.PATROL);
            return;
        }
        
        // Calculate direction away from target
        const direction = {
            x: enemy.position.x - fleeFromPosition.x,
            y: 0,
            z: enemy.position.z - fleeFromPosition.z
        };
        
        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        // Calculate flee target position
        const fleeTarget = {
            x: enemy.position.x + direction.x * 10,
            y: enemy.position.y,
            z: enemy.position.z + direction.z * 10
        };
        
        // Move towards flee target
        moveTowards(enemy, fleeTarget, deltaTime);
        
        // Check flee duration
        if (enemy.stateTime > 5000) { // Flee for 5 seconds
            transitionToState(enemy, behaviorStates.PATROL);
        }
    }
    
    // Update stunned behavior
    function updateStunnedState(enemy, deltaTime) {
        // Do nothing while stunned, just wait
        if (enemy.stateTime > enemy.stunDuration) {
            // Return to previous state or patrol
            transitionToState(enemy, enemy.previousState || behaviorStates.PATROL);
        }
    }
    
    // Check if player is visible to enemy
    function checkPlayerVisibility(enemy) {
        if (!Game.gameplay.player) return false;
        
        const playerPos = Game.gameplay.player.getPosition();
        
        // Check distance
        const distanceToPlayer = calculateDistance(enemy.position, playerPos);
        
        if (distanceToPlayer <= enemy.sightRange) {
            // Calculate direction to player
            const directionToPlayer = {
                x: playerPos.x - enemy.position.x,
                z: playerPos.z - enemy.position.z
            };
            
            // Normalize
            const length = Math.sqrt(directionToPlayer.x * directionToPlayer.x + directionToPlayer.z * directionToPlayer.z);
            if (length > 0) {
                directionToPlayer.x /= length;
                directionToPlayer.z /= length;
            }
            
            // Check if player is within field of view
            const angleToPlayer = Math.atan2(directionToPlayer.z, directionToPlayer.x);
            const angleDifference = Math.abs(angleToPlayer - enemy.rotation.y);
            
            if (angleDifference < Math.PI / 4) { // 45 degree field of view
                // Player is visible, switch to chase state
                enemy.targetId = 'player';
                transitionToState(enemy, behaviorStates.CHASE);
                return true;
            }
        }
        
        return false;
    }
    
    // Move enemy towards a target position
    function moveTowards(enemy, target, deltaTime) {
        const direction = {
            x: target.x - enemy.position.x,
            z: target.z - enemy.position.z
        };
        
        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        // Calculate movement distance
        const moveDistance = enemy.movementSpeed * (deltaTime / 1000);
        
        // Update position
        enemy.position.x += direction.x * moveDistance;
        enemy.position.z += direction.z * moveDistance;
        
        // Update rotation to face target
        enemy.rotation.y = Math.atan2(direction.z, direction.x);
        
        return length; // Return distance to target
    }
    
    // Face enemy towards a target position
    function faceTarget(enemy, target) {
        const direction = {
            x: target.x - enemy.position.x,
            z: target.z - enemy.position.z
        };
        
        // Normalize direction
        const length = Math.sqrt(direction.x * direction.x + direction.z * direction.z);
        if (length > 0) {
            direction.x /= length;
            direction.z /= length;
        }
        
        // Update rotation to face target
        enemy.rotation.y = Math.atan2(direction.z, direction.x);
    }
    
    // Perform an attack
    function performAttack(enemy, target) {
        // Get ability to use (default to melee)
        const abilityName = enemy.abilities[0];
        const ability = enemyAbilities[abilityName];
        
        if (ability) {
            // Execute ability
            const damage = ability.execute(enemy, target);
            
            // Play attack animation
            if (enemy.entity) {
                enemy.entity.setAttribute('animation', {
                    property: 'rotation',
                    to: { x: 0, y: enemy.rotation.y * (180 / Math.PI), z: 0 },
                    dur: 200
                });
            }
            
            // Play attack sound
            if (ability.soundEffect) {
                Game.audio.playSound(ability.soundEffect, { position: enemy.position });
            }
            
            // Create attack particles
            if (Game.engine.particles && ability.particleEffect) {
                Game.engine.particles.createEffect(ability.particleEffect, target.position);
            }
            
            console.log(`${enemy.name} used ${ability.name} on ${target.id} for ${damage} damage!`);
        }
    }
    
    // Check if enemy should use special abilities
    function checkSpecialAbilities(enemy, target) {
        for (const abilityName of enemy.abilities) {
            const ability = enemyAbilities[abilityName];
            
            if (ability && ability.cooldown > 0) {
                // Check if ability is off cooldown
                const lastUsed = enemy.abilityCooldowns[abilityName] || 0;
                const currentTime = Date.now();
                
                if (currentTime - lastUsed >= ability.cooldown) {
                    // Check if enemy has enough energy
                    if (enemy.energy >= ability.energyCost) {
                        // Use ability
                        ability.execute(enemy, target);
                        
                        // Update cooldown and energy
                        enemy.abilityCooldowns[abilityName] = currentTime;
                        enemy.energy -= ability.energyCost;
                        
                        console.log(`${enemy.name} used ${ability.name} on ${target.id}`);
                    }
                }
            }
        }
    }
    
    // Transition enemy to a new state
    function transitionToState(enemy, newState) {
        enemy.state = newState;
        enemy.stateTime = 0;
        
        console.log(`${enemy.name} transitioned to ${newState} state`);
    }
    
    // Update enemy entity position and rotation
    function updateEnemyEntity(enemy) {
        if (enemy.entity) {
            enemy.entity.setAttribute('position', enemy.position);
            enemy.entity.setAttribute('rotation', enemy.rotation);
        }
    }
    
    // Generate patrol points around a position
    function generatePatrolPoints(position, count) {
        const points = [];
        
        for (let i = 0; i < count; i++) {
            const angle = Math.random() * Math.PI * 2;
            const distance = 5 + Math.random() * 10;
            
            points.push({
                x: position.x + Math.cos(angle) * distance,
                y: position.y,
                z: position.z + Math.sin(angle) * distance
            });
        }
        
        return points;
    }
    
    // Calculate damage dealt by an enemy
    function calculateDamage(enemy) {
        const minDamage = enemy.damage.min;
        const maxDamage = enemy.damage.max;
        
        return Math.floor(minDamage + Math.random() * (maxDamage - minDamage + 1));
    }
    
    // Find targets within a range
    function findTargetsInRange(position, range) {
        const targets = [];
        
        // Check player
        if (Game.gameplay.player) {
            const playerPos = Game.gameplay.player.getPosition();
            const distanceToPlayer = calculateDistance(position, playerPos);
            
            if (distanceToPlayer <= range) {
                targets.push('player');
            }
        }
        
        // Check other enemies
        for (const [id, enemy] of activeEnemies) {
            if (enemy.state !== behaviorStates.DEAD) {
                const distanceToEnemy = calculateDistance(position, enemy.position);
                
                if (distanceToEnemy <= range) {
                    targets.push(id);
                }
            }
        }
        
        return targets;
    }
    
    // Calculate distance between two positions
    function calculateDistance(pos1, pos2) {
        const dx = pos2.x - pos1.x;
        const dz = pos2.z - pos1.z;
        
        return Math.sqrt(dx * dx + dz * dz);
    }
    
    // Drop loot from an enemy
    function dropLoot(enemy) {
        const enemyType = enemyTypes[enemy.type];
        
        if (enemyType && enemyType.drops) {
            for (const drop of enemyType.drops) {
                if (Math.random() < drop.chance) {
                    const amount = Math.floor(drop.amount.min + Math.random() * (drop.amount.max - drop.amount.min + 1));
                    
                    for (let i = 0; i < amount; i++) {
                        Game.gameplay.loot.spawnLoot(drop.type, enemy.position);
                    }
                }
            }
        }
    }
    
    // Calculate experience reward for killing an enemy
    function calculateXPReward(enemy) {
        return enemy.experience;
    }
    
    // Setup event listeners
    function setupEventListeners() {
        // Listen for player attacks
        Game.engine.events.on('player:attack', (data) => {
            const { targetId, damage, damageType } = data;
            
            if (activeEnemies.has(targetId)) {
                Game.gameplay.enemy.damageEnemy(targetId, damage, damageType, 'player');
            }
        });
    }
    
    // Create the visual and physical representation of an enemy
    function createEnemyEntity(enemy) {
        const container = document.getElementById('enemies-container');
        
        // Create entity
        const entity = document.createElement('a-entity');
        entity.id = enemy.id;
        entity.classList.add('enemy', 'interactive');
        entity.setAttribute('position', enemy.position);
        entity.setAttribute('data-enemy-id', enemy.id);
        entity.setAttribute('data-enemy-type', enemy.type);
        entity.setAttribute('data-interact-type', 'enemy');
        
        // Add enemy texture plane (billboard sprite)
        const plane = document.createElement('a-plane');
        plane.setAttribute('width', 2);
        plane.setAttribute('height', 2);
        plane.setAttribute('material', {
            src: Game.generation.textures.generateEnemyTexture(enemy.type, enemy.seed),
            transparent: true,
            alphaTest: 0.5
        });
        plane.setAttribute('look-at', '[camera]'); // Billboard effect
        entity.appendChild(plane);
        
        // Health bar
        const healthBar = document.createElement('a-entity');
        healthBar.classList.add('health-bar');
        healthBar.setAttribute('position', { x: 0, y: 1.2, z: 0 });
        
        // Health bar background
        const healthBg = document.createElement('a-plane');
        healthBg.setAttribute('width', 1);
        healthBg.setAttribute('height', 0.1);
        healthBg.setAttribute('material', { color: '#222222' });
        healthBar.appendChild(healthBg);
        
        // Health bar fill
        const healthFill = document.createElement('a-plane');
        healthFill.classList.add('health-fill');
        healthFill.setAttribute('width', 1);
        healthFill.setAttribute('height', 0.1);
        healthFill.setAttribute('material', { color: '#ff0000' });
        healthFill.setAttribute('position', { x: 0, y: 0, z: 0.001 });
        healthBar.appendChild(healthFill);
        
        // Make health bar face camera
        healthBar.setAttribute('look-at', '[camera]');
        entity.appendChild(healthBar);
        
        // Add collision body
        entity.setAttribute('geometry', {
            primitive: 'cylinder',
            radius: 0.5,
            height: 1.8
        });
        
        // Make invisible for collision only
        entity.setAttribute('material', { 
            opacity: 0
        });
        
        // Add physics body
        entity.setAttribute('physics-body', {
            type: 'kinematic',
            mass: 70
        });
        
        // Add to scene
        container.appendChild(entity);
        
        return entity;
    }
})();