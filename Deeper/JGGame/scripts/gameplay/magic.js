/**
 * Magic System
 * 
 * Handles spell casting, magical effects, and spell management.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.magic = {};

(function() {
    // Spell definitions
    const spellDefinitions = {
        fireball: {
            name: "Fireball",
            description: "Launches a ball of fire that deals damage to enemies in a small area.",
            type: "offensive",
            element: "fire",
            manaCost: 15,
            baseDamage: 20,
            range: 15,
            areaOfEffect: 3,
            castTime: 0.5,
            cooldown: 2,
            projectileSpeed: 15,
            effects: [
                { type: "damage", element: "fire", amount: 20, areaOfEffect: 3 },
                { type: "dot", element: "fire", amount: 5, duration: 3, tickRate: 1 }
            ],
            visualEffect: {
                projectile: "fireball_projectile",
                impact: "fire_explosion",
                trail: "fire_trail"
            },
            soundEffects: {
                cast: "spell_fire_cast",
                projectile: "spell_fire_projectile",
                impact: "spell_fire_impact"
            },
            gesturePattern: "forward_thrust",
            icon: "fireball_icon"
        },
        iceSpike: {
            name: "Ice Spike",
            description: "Launches a shard of ice that pierces enemies and slows their movement.",
            type: "offensive",
            element: "ice",
            manaCost: 12,
            baseDamage: 15,
            range: 20,
            castTime: 0.3,
            cooldown: 1.5,
            projectileSpeed: 25,
            effects: [
                { type: "damage", element: "ice", amount: 15 },
                { type: "slow", amount: 0.5, duration: 4 }
            ],
            visualEffect: {
                projectile: "ice_spike_projectile",
                impact: "ice_impact",
                trail: "ice_trail"
            },
            soundEffects: {
                cast: "spell_ice_cast",
                projectile: "spell_ice_projectile",
                impact: "spell_ice_impact"
            },
            gesturePattern: "forward_point",
            icon: "icespike_icon"
        },
        healingLight: {
            name: "Healing Light",
            description: "Bathes the caster in healing light, restoring health over time.",
            type: "healing",
            element: "holy",
            manaCost: 25,
            healingAmount: 30,
            duration: 5,
            tickRate: 1,
            castTime: 1.0,
            cooldown: 20,
            effects: [
                { type: "heal", amount: 6, duration: 5, tickRate: 1 },
                { type: "buff", stat: "healthRegen", amount: 2, duration: 5 }
            ],
            visualEffect: {
                cast: "healing_light_cast",
                active: "healing_aura"
            },
            soundEffects: {
                cast: "spell_healing_cast",
                active: "spell_healing_loop"
            },
            gesturePattern: "self_circle",
            icon: "healing_icon"
        },
        lightningBolt: {
            name: "Lightning Bolt",
            description: "Summons a bolt of lightning to strike enemies and potentially stun them.",
            type: "offensive",
            element: "lightning",
            manaCost: 18,
            baseDamage: 25,
            range: 12,
            castTime: 0.7,
            cooldown: 3,
            effects: [
                { type: "damage", element: "lightning", amount: 25 },
                { type: "stun", chance: 0.3, duration: 1.5 }
            ],
            visualEffect: {
                cast: "lightning_cast",
                active: "lightning_bolt",
                impact: "lightning_impact"
            },
            soundEffects: {
                cast: "spell_lightning_cast",
                active: "spell_lightning_bolt",
                impact: "spell_lightning_impact"
            },
            gesturePattern: "raised_hand",
            icon: "lightning_icon"
        },
        earthShield: {
            name: "Earth Shield",
            description: "Creates a protective barrier of stone that absorbs damage.",
            type: "defensive",
            element: "earth",
            manaCost: 20,
            shieldAmount: 40,
            duration: 15,
            castTime: 0.5,
            cooldown: 25,
            effects: [
                { type: "shield", amount: 40, duration: 15 },
                { type: "buff", stat: "defense", amount: 15, duration: 15 }
            ],
            visualEffect: {
                cast: "earth_shield_cast",
                active: "earth_shield_aura"
            },
            soundEffects: {
                cast: "spell_earth_cast",
                active: "spell_earth_loop",
                end: "spell_earth_break"
            },
            gesturePattern: "arms_cross",
            icon: "earthshield_icon"
        }
    };
    
    // Player spells and state
    const playerSpells = new Map();
    let selectedSpell = null;
    let activeSpells = [];
    let isChanneling = false;
    
    // Initialize magic system
    Game.gameplay.magic.init = function() {
        console.log('Initializing magic system');
        setupMagicControls();
        loadPlayerSpells();
        return Promise.resolve();
    };
    
    // Update magic system (called each frame)
    Game.gameplay.magic.update = function(deltaTime) {
        updateActiveSpells(deltaTime);
        updateSpellProjectiles(deltaTime);
        updateChannelingSpells(deltaTime);
    };
    
    // Cast a spell
    Game.gameplay.magic.castSpell = function(spellId, targetPosition) {
        if (!playerSpells.has(spellId)) {
            console.error(`Player doesn't know spell: ${spellId}`);
            return false;
        }
        
        // Get spell data
        const spell = playerSpells.get(spellId);
        
        // Check if spell is on cooldown
        if (spell.onCooldown) {
            console.log(`${spell.name} is on cooldown.`);
            Game.engine.ui.showNotification(`${spell.name} is on cooldown!`, 'warning');
            return false;
        }
        
        // Get player stats
        const playerStats = Game.gameplay.player.getStats();
        
        // Check if player has enough mana
        if (playerStats.mana < spell.manaCost) {
            console.log(`Not enough mana to cast ${spell.name}.`);
            Game.engine.ui.showNotification('Not enough mana!', 'warning');
            return false;
        }
        
        // Use mana
        Game.gameplay.player.modifyMana(-spell.manaCost);
        
        console.log(`Casting ${spell.name}`);
        
        // Start cooldown
        startSpellCooldown(spell);
        
        // Get cast position (from player)
        const castPosition = Game.gameplay.player.getPosition();
        
        // Play cast animation
        playCastAnimation(spell);
        
        // Play cast sound
        playCastSound(spell);
        
        // Handle different spell types
        switch (spell.type) {
            case 'offensive':
                // Create projectile or instantaneous effect
                if (spell.projectileSpeed > 0) {
                    // Create projectile
                    createSpellProjectile(spell, castPosition, targetPosition);
                } else {
                    // Instant effect
                    applySpellEffects(spell, targetPosition);
                }
                break;
                
            case 'defensive':
                // Apply buff to player
                applyBuffSpell(spell);
                break;
                
            case 'healing':
                // Apply healing effects
                applyHealingSpell(spell);
                break;
                
            case 'utility':
                // Apply utility effects
                applyUtilitySpell(spell, targetPosition);
                break;
        }
        
        // Emit spell cast event
        Game.engine.events.emit('spell:cast', { 
            spellId: spellId,
            caster: 'player'
        });
        
        return true;
    };
    
    // Learn a new spell
    Game.gameplay.magic.learnSpell = function(spellId) {
        if (!spellDefinitions[spellId]) {
            console.error(`Spell not found: ${spellId}`);
            return false;
        }
        
        if (playerSpells.has(spellId)) {
            console.log(`Player already knows ${spellDefinitions[spellId].name}`);
            return false;
        }
        
        // Add spell to player spells
        const spell = { ...spellDefinitions[spellId], onCooldown: false, cooldownRemaining: 0 };
        playerSpells.set(spellId, spell);
        
        // Update game state
        savePlayerSpells();
        
        console.log(`Learned new spell: ${spell.name}`);
        Game.engine.ui.showNotification(`Learned new spell: ${spell.name}`, 'magic');
        
        return true;
    };
    
    // Upgrade spell
    Game.gameplay.magic.upgradeSpell = function(spellId, upgradeType) {
        if (!playerSpells.has(spellId)) {
            console.error(`Player doesn't know spell: ${spellId}`);
            return false;
        }
        
        const spell = playerSpells.get(spellId);
        
        // Apply upgrade based on type
        switch (upgradeType) {
            case 'damage':
                // Increase damage by 20%
                for (const effect of spell.effects) {
                    if (effect.type === 'damage') {
                        effect.amount = Math.floor(effect.amount * 1.2);
                    }
                }
                break;
                
            case 'mana':
                // Reduce mana cost by 15%
                spell.manaCost = Math.floor(spell.manaCost * 0.85);
                break;
                
            case 'cooldown':
                // Reduce cooldown by 15%
                spell.cooldown *= 0.85;
                break;
                
            case 'range':
                // Increase range by 20%
                if (spell.range) {
                    spell.range *= 1.2;
                }
                break;
                
            case 'area':
                // Increase area of effect by 25%
                if (spell.areaOfEffect) {
                    spell.areaOfEffect *= 1.25;
                }
                for (const effect of spell.effects) {
                    if (effect.areaOfEffect) {
                        effect.areaOfEffect *= 1.25;
                    }
                }
                break;
                
            default:
                console.error(`Unknown upgrade type: ${upgradeType}`);
                return false;
        }
        
        // Update spell in player spells
        playerSpells.set(spellId, spell);
        
        // Save spells
        savePlayerSpells();
        
        console.log(`Upgraded ${spell.name}: ${upgradeType}`);
        Game.engine.ui.showNotification(`${spell.name} upgraded: ${upgradeType}`, 'magic');
        
        return true;
    };
    
    // Calculate spell damage based on spell and player stats
    Game.gameplay.magic.calculateSpellDamage = function(spell, targetResistance = 0) {
        const playerStats = Game.gameplay.player.getStats();
        
        // Base damage from spell
        let damage = 0;
        
        for (const effect of spell.effects) {
            if (effect.type === 'damage') {
                damage += effect.amount;
            }
        }
        
        // Apply intelligence bonus (1% per point)
        if (playerStats.intelligence) {
            damage *= (1 + playerStats.intelligence * 0.01);
        }
        
        // Apply magic skill bonus
        if (Game.gameplay.skills) {
            const magicSkill = Game.gameplay.skills.getSkillLevel('magic', spell.element);
            if (magicSkill) {
                damage *= (1 + magicSkill * 0.02); // 2% per level
            }
        }
        
        // Apply resistance
        damage *= (1 - Math.min(0.75, targetResistance / 100)); // Cap at 75% reduction
        
        // Add random variation (±10%)
        damage *= 0.9 + Math.random() * 0.2;
        
        return Math.floor(damage);
    };
    
    // Get all player spells
    Game.gameplay.magic.get