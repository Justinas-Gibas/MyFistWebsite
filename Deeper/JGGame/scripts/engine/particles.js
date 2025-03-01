/**
 * Particle Effects System
 * 
 * Manages visual effects like explosions, magic, environmental effects, etc.
 */
window.Game = window.Game || {};
Game.engine = Game.engine || {};
Game.engine.particles = {};

(function() {
    // Active particle systems
    const activeEffects = new Map();
    let effectIdCounter = 0;
    
    // Particle effect templates
    const effectTemplates = {
        // Combat effects
        slash: {
            type: 'sprite',
            texture: 'effects/slash',
            duration: 300,
            scale: { start: [1.0, 1.0, 1.0], end: [1.5, 1.5, 1.5] },
            opacity: { start: 1.0, end: 0.0 },
            color: '#FFFFFF',
            count: 1,
            rotationAxis: 'z',
            rotation: { start: 0, end: 30 }
        },
        impact: {
            type: 'particle',
            texture: 'effects/impact',
            duration: 500,
            size: { start: 0.2, end: 0.05 },
            speed: 5,
            count: 15,
            spread: 1,
            opacity: { start: 1.0, end: 0.0 },
            gravity: -0.5,
            color: '#FFFFFF'
        },
        blood: {
            type: 'particle',
            texture: 'effects/blood',
            duration: 1000,
            size: { start: 0.1, end: 0.05 },
            speed: 3,
            count: 20,
            spread: 0.8,
            opacity: { start: 1.0, end: 0.0 },
            gravity: 2,
            color: '#AA0000'
        },
        
        // Magic effects
        fire: {
            type: 'particle',
            texture: 'effects/fire',
            duration: 1000,
            size: { start: 0.2, end: 0.1 },
            speed: 0.5,
            count: 30,
            emitRate: 10,
            spread: 0.5,
            opacity: { start: 1.0, end: 0.0 },
            gravity: -1,
            color: ['#FF4400', '#FFAA00', '#FF8800'],
            blendMode: 'additive',
            light: { color: '#FF6600', intensity: 2.0, decay: 1.0 }
        },
        ice: {
            type: 'particle',
            texture: 'effects/crystal',
            duration: 1500,
            size: { start: 0.15, end: 0.05 },
            speed: 2,
            count: 25,
            spread: 1.2,
            opacity: { start: 0.8, end: 0.0 },
            gravity: 1,
            color: ['#AAFFFF', '#FFFFFF', '#88DDFF'],
            blendMode: 'normal',
            light: { color: '#88CCFF', intensity: 1.0, decay: 0.5 }
        },
        lightning: {
            type: 'beam',
            texture: 'effects/lightning',
            duration: 200,
            segments: 5,
            width: { start: 0.2, end: 0.1 },
            jitter: 0.3,
            opacity: { start: 1.0, end: 0.0 },
            color: '#88CCFF',
            blendMode: 'additive',
            light: { color: '#AADDFF', intensity: 3.0, decay: 3.0 }
        },
        
        // Status effects
        heal: {
            type: 'particle',
            texture: 'effects/sparkle',
            duration: 1000,
            size: { start: 0.1, end: 0.02 },
            speed: 1,
            count: 20,
            spread: 0.8,
            opacity: { start: 1.0, end: 0.0 },
            gravity: -0.5,
            color: ['#88FF88', '#FFFFFF', '#AAFFAA'],
            blendMode: 'additive'
        },
        poison: {
            type: 'particle',
            texture: 'effects/bubble',
            duration: 2000,
            size: { start: 0.08, end: 0.02 },
            speed: 0.3,
            count: 15,
            emitRate: 5,
            spread: 0.5,
            opacity: { start: 0.7, end: 0.0 },
            gravity: -0.2,
            color: ['#88FF00', '#AAAA00', '#448800'],
            blendMode: 'normal'
        },
        
        // Environmental effects
        rain: {
            type: 'weather',
            texture: 'effects/raindrop',
            area: 30,
            height: 20,
            count: 500,
            speed: 15,
            size: { min: 0.05, max: 0.15 },
            opacity: { value: 0.6 },
            color: '#AAAAFF',
            direction: { x: 0.1, y: -1, z: 0 }
        },
        snow: {
            type: 'weather',
            texture: 'effects/snowflake',
            area: 30,
            height: 15,
            count: 300,
            speed: 2,
            size: { min: 0.05, max: 0.2 },
            opacity: { value: 0.8 },
            color: '#FFFFFF',
            direction: { x: 0.05, y: -0.5, z: 0.05 },
            rotation: true
        },
        dust: {
            type: 'particle',
            texture: 'effects/dust',
            duration: 3000,
            size: { start: 0.3, end: 0.6 },
            speed: 0.2,
            count: 10,
            spread: 1.5,
            opacity: { start: 0.3, end: 0.0 },
            gravity: -0.05,
            color: '#CCCCAA',
            blendMode: 'normal'
        },
        
        // Item and interaction effects
        sparkle: {
            type: 'particle',
            texture: 'effects/sparkle',
            duration: 1000,
            size: { start: 0.1, end: 0.01 },
            speed: 0.5,
            count: 10,
            spread: 0.5,
            opacity: { start: 1.0, end: 0.0 },
            gravity: -0.1,
            color: ['#FFFFFF', '#FFFF88', '#88FFFF'],
            blendMode: 'additive'
        },
        levelup: {
            type: 'particle',
            texture: 'effects/star',
            duration: 2000,
            size: { start: 0.15, end: 0.05 },
            speed: 2,
            count: 30,
            spread: 1,
            opacity: { start: 1.0, end: 0.0 },
            gravity: -1,
            color: ['#FFFF00', '#FFFFFF', '#88FF88'],
            blendMode: 'additive',
            light: { color: '#FFFF88', intensity: 1.0, decay: 0.5 }
        }
    };
    
    // Initialize particle system
    Game.engine.particles.init = function() {
        console.log('Initializing particle effects system');
        
        // Pregenerate effect textures
        prepareEffectTextures();
        
        // Set up global particle container
        setupParticleContainer();
        
        return Promise.resolve();
    };
    
    // Update particle systems (called each frame)
    Game.engine.particles.update = function(deltaTime) {
        // Update all active effects
        for (const [id, effect] of activeEffects) {
            if (updateEffect(effect, deltaTime)) {
                // Effect is complete, remove it
                removeEffect(id);
            }
        }
    };
    
    // Create a particle effect
    Game.engine.particles.createEffect = function(effectType, position, parameters = {}) {
        if (!effectTemplates[effectType]) {
            console.error(`Unknown effect type: ${effectType}`);
            return null;
        }
        
        // Get template and merge with custom parameters
        const template = { ...effectTemplates[effectType], ...parameters };
        
        // Generate unique ID for this effect
        const effectId = `effect_${effectIdCounter++}`;
        
        // Create effect based on type
        let effect;
        switch (template.type) {
            case 'particle':
                effect = createParticleEffect(effectId, position, template);
                break;
            case 'sprite':
                effect = createSpriteEffect(effectId, position, template);
                break;
            case 'beam':
                effect = createBeamEffect(effectId, position, parameters.target || position, template);
                break;
            case 'weather':
                effect = createWeatherEffect(effectId, position, template);
                break;
            default:
                console.error(`Unknown effect type: ${template.type}`);
                return null;
        }
        
        // Store active effect
        activeEffects.set(effectId, effect);
        
        // Return effect ID for later reference
        return effectId;
    };
    
    // Create a trail effect that follows an entity
    Game.engine.particles.createTrailEffect = function(entity, effectType, parameters = {}) {
        if (!entity) {
            console.error('Entity is required for trail effect');
            return null;
        }
        
        // Generate effect ID
        const effectId = `trail_${effectIdCounter++}`;
        
        // Create trail parameters
        const trailParams = {
            ...parameters,
            attached: true,
            attachedEntity: entity,
            duration: parameters.duration || Infinity, // Trails persist until manually stopped
            emitRate: parameters.emitRate || 10, // Particles per second
            lastEmitTime: 0
        };
        
        // Create initial effect
        const position = getEntityPosition(entity);
        const effect = Game.engine.particles.createEffect(effectType, position, trailParams);
        
        // Store in active effects
        activeEffects.set(effectId, {
            id: effectId,
            type: 'trail',
            entityId: entity.id || entity.getAttribute('id'),
            effectType: effectType,
            entity: entity,
            parameters: trailParams,
            childEffects: [effect],
            createTime: Date.now(),
            active: true
        });
        
        // Return effect ID
        return effectId;
    };
    
    // Stop an effect
    Game.engine.particles.stopEffect = function(effectId) {
        if (!activeEffects.has(effectId)) {
            return false;
        }
        
        // Get effect
        const effect = activeEffects.get(effectId);
        
        // If trail, stop creating new particles but let existing ones finish
        if (effect.type === 'trail') {
            effect.active = false;
            return true;
        }
        
        // Otherwise, remove the effect immediately
        removeEffect(effectId);
        return true;
    };
    
    // Clear all effects
    Game.engine.particles.clearEffects = function() {
        // Remove all effects
        for (const [id, _] of activeEffects) {
            removeEffect(id);
        }
        
        // Clear active effects map
        activeEffects.clear();
    };
    
    // Create an explosion effect
    Game.engine.particles.createExplosionEffect = function(position, parameters = {}) {
        const size = parameters.size || 1.0;
        const color = parameters.color || '#FF8800';
        const intensity = parameters.intensity || 1.0;
        
        // Create flash light
        const lightEffect = Game.engine.particles.createEffect('flash', position, {
            color: color,
            intensity: 3.0 * intensity,
            decay: 2.0,
            duration: 300
        });
        
        // Create particle explosion
        const explosionEffect = Game.engine.particles.createEffect('impact', position, {
            size: { start: 0.3 * size, end: 0.05 * size },
            count: Math.floor(20 * intensity),
            spread: size,
            speed: 8 * intensity,
            color: color
        });
        
        // Create shock wave
        const shockwaveEffect = Game.engine.particles.createEffect('shockwave', position, {
            size: { start: 0.5 * size, end: 3.0 * size },
            duration: 500,
            color: color,
            opacity: { start: 0.8, end: 0.0 }
        });
        
        // Return array of effect IDs
        return [lightEffect, explosionEffect, shockwaveEffect];
    };
    
    // Create elemental effect (fire, ice, lightning, etc.)
    Game.engine.particles.createElementalEffect = function(element, position, parameters = {}) {
        // Select appropriate effect based on element
        let effectType;
        switch (element) {
            case 'fire':
                effectType = 'fire';
                break;
            case 'ice':
                effectType = 'ice';
                break;
            case 'lightning':
                effectType = 'lightning';
                break;
            case 'poison':
                effectType = 'poison';
                break;
            case 'healing':
                effectType = 'heal';
                break;
            default:
                effectType = 'sparkle';
        }
        
        // Create the effect
        return Game.engine.particles.createEffect(effectType, position, parameters);
    };
    
    // Update an effect
    function updateEffect(effect, deltaTime) {
        // Check if effect has expired
        const elapsed = Date.now() - effect.createTime;
        
        if (effect.type === 'trail') {
            // If trail is inactive, check if all child effects have completed
            if (!effect.active) {
                // Remove completed child effects
                effect.childEffects = effect.childEffects.filter(childId => activeEffects.has(childId));
                
                // If no child effects remain, trail is complete
                return effect.childEffects.length === 0;
            }
            
            // Check if it's time to emit a new particle
            const timeSinceLastEmit = elapsed - effect.lastEmitTime;
            if (timeSinceLastEmit >= 1000 / effect.parameters.emitRate) {
                // Update entity position
                const position = getEntityPosition(effect.entity);
                
                // Create new particle effect
                const newEffect = Game.engine.particles.createEffect(
                    effect.effectType, 
                    position, 
                    effect.parameters
                );
                
                // Add to child effects
                effect.childEffects.push(newEffect);
                
                // Update last emit time
                effect.lastEmitTime = elapsed;
            }
            
            // Never expire trail effects unless stopEffect is called
            return false;
        }
        
        // For regular effects, check duration
        if (effect.duration && elapsed >= effect.duration) {
            // Effect has expired
            return true;
        }
        
        // Update effect based on type
        switch (effect.type) {
            case 'particle':
                updateParticleEffect(effect, elapsed, deltaTime);
                break;
                
            case 'sprite':
                updateSpriteEffect(effect, elapsed, deltaTime);
                break;
                
            case 'beam':
                updateBeamEffect(effect, elapsed, deltaTime);
                break;
                
            case 'weather':
                updateWeatherEffect(effect, elapsed, deltaTime);
                break;
        }
        
        return false;
    }
    
    // Remove an effect
    function removeEffect(effectId) {
        const effect = activeEffects.get(effectId);
        if (!effect) return;
        
        // Handle cleanup based on effect type
        switch (effect.type) {
            case 'particle':
                // Remove particles
                if (effect.entity && effect.entity.parentNode) {
                    effect.entity.parentNode.removeChild(effect.entity);
                }
                break;
                
            case 'sprite':
                // Remove sprite
                if (effect.entity && effect.entity.parentNode) {
                    effect.entity.parentNode.removeChild(effect.entity);
                }
                break;
                
            case 'beam':
                // Remove beam
                if (effect.entity && effect.entity.parentNode) {
                    effect.entity.parentNode.removeChild(effect.entity);
                }
                break;
                
            case 'weather':
                // Remove weather
                if (effect.entity && effect.entity.parentNode) {
                    effect.entity.removeAttribute('particle-system');
                    effect.entity.parentNode.removeChild(effect.entity);
                }
                break;
                
            case 'trail':
                // Stop all child effects
                effect.childEffects.forEach(childId => {
                    Game.engine.particles.stopEffect(childId);
                });
                break;
        }
        
        // Remove from active effects
        activeEffects.delete(effectId);
    }
    
    // Create a particle effect
    function createParticleEffect(effectId, position, template) {
        // Create container entity
        const entity = document.createElement('a-entity');
        entity.id = effectId;
        entity.setAttribute('position', positionToString(position));
        
        // Convert color array to comma-separated string if needed
        let colorAttribute = template.color;
        if (Array.isArray(colorAttribute)) {
            colorAttribute = colorAttribute.join(',');
        }
        
        // Configure particle system
        entity.setAttribute('particle-system', {
            preset: template.preset || 'default',
            texture: generateEffectTexture(template.texture, template.color),
            particleCount: template.count || 20,
            size: template.size.start || 0.1,
            blending: template.blendMode || 'normal',
            color: colorAttribute,
            opacity: template.opacity ? template.opacity.start : 1.0,
            velocity: `0 ${template.speed || 1} 0`,
            velocitySpread: `${template.spread || 1} ${template.spread || 1} ${template.spread || 1}`,
            accelerationValue: `0 ${template.gravity || 0} 0`,
            direction: template.direction || '1 1 1',
            maxAge: template.duration / 1000 || 1
        });
        
        // Add light if defined
        if (template.light) {
            const light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                color: template.light.color || '#FFFFFF',
                intensity: template.light.intensity || 1.0,
                decay: template.light.decay || 1.0,
                distance: template.light.distance || 10
            });
            entity.appendChild(light);
        }
        
        // Add to scene
        document.querySelector('#scene').appendChild(entity);
        
        // Create and return effect object
        return {
            id: effectId,
            type: 'particle',
            entity: entity,
            position: { ...position },
            template: template,
            duration: template.duration || 1000,
            createTime: Date.now()
        };
    }
    
    // Create a sprite effect (like a slash or impact animation)
    function createSpriteEffect(effectId, position, template) {
        // Create sprite entity
        const entity = document.createElement('a-entity');
        entity.id = effectId;
        entity.setAttribute('position', positionToString(position));
        
        // Create sprite plane
        const sprite = document.createElement('a-plane');
        sprite.setAttribute('material', {
            src: generateEffectTexture(template.texture, template.color),
            transparent: true,
            alphaTest: 0.1,
            shader: 'flat',
            color: template.color || '#FFFFFF',
            opacity: template.opacity ? template.opacity.start : 1.0
        });
        
        // Set initial scale
        if (template.scale && template.scale.start) {
            if (Array.isArray(template.scale.start)) {
                sprite.setAttribute('scale', template.scale.start.join(' '));
            } else {
                sprite.setAttribute('scale', `${template.scale.start} ${template.scale.start} ${template.scale.start}`);
            }
        } else {
            sprite.setAttribute('scale', '1 1 1');
        }
        
        // Add sprite to entity
        entity.appendChild(sprite);
        
        // Add light if defined
        if (template.light) {
            const light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                color: template.light.color || '#FFFFFF',
                intensity: template.light.intensity || 1.0,
                decay: template.light.decay || 1.0,
                distance: template.light.distance || 10
            });
            entity.appendChild(light);
        }
        
        // Make sprite face camera
        sprite.setAttribute('look-at', '[camera]');
        
        // Add to scene
        document.querySelector('#scene').appendChild(entity);
        
        // Create and return effect object
        return {
            id: effectId,
            type: 'sprite',
            entity: entity,
            sprite: sprite,
            position: { ...position },
            template: template,
            duration: template.duration || 1000,
            createTime: Date.now()
        };
    }
    
    // Create a beam effect (like lightning)
    function createBeamEffect(effectId, startPosition, endPosition, template) {
        // Create beam entity
        const entity = document.createElement('a-entity');
        entity.id = effectId;
        
        // Position at midpoint
        const midpoint = {
            x: (startPosition.x + endPosition.x) / 2,
            y: (startPosition.y + endPosition.y) / 2,
            z: (startPosition.z + endPosition.z) / 2
        };
        entity.setAttribute('position', positionToString(midpoint));
        
        // Calculate beam properties
        const length = calculateDistance(startPosition, endPosition);
        const direction = normalizeVector({
            x: endPosition.x - startPosition.x,
            y: endPosition.y - startPosition.y,
            z: endPosition.z - startPosition.z
        });
        
        // Create beam segments
        const segments = template.segments || 1;
        for (let i = 0; i < segments; i++) {
            const segment = document.createElement('a-entity');
            segment.setAttribute('geometry', {
                primitive: 'cylinder',
                radius: template.width.start / 2,
                height: length / segments
            });
            
            segment.setAttribute('material', {
                src: generateEffectTexture(template.texture, template.color),
                color: template.color || '#FFFFFF',
                transparent: true,
                opacity: template.opacity ? template.opacity.start : 1.0,
                shader: template.blendMode === 'additive' ? 'flat' : 'standard'
            });
            
            // Position and rotate segment
            const segmentOffset = (i - (segments - 1) / 2) / segments * length;
            segment.setAttribute('position', `0 ${segmentOffset} 0`);
            
            // Add jitter if specified
            if (template.jitter > 0) {
                // Random offset perpendicular to beam direction
                const perpX = direction.z;
                const perpZ = -direction.x;
                const jitterAmount = template.jitter * (Math.random() * 2 - 1);
                segment.setAttribute('position', 
                    `${perpX * jitterAmount} ${segmentOffset} ${perpZ * jitterAmount}`);
            }
            
            segment.setAttribute('rotation', '90 0 0');
            entity.appendChild(segment);
        }
        
        // Add light if defined
        if (template.light) {
            const light = document.createElement('a-entity');
            light.setAttribute('light', {
                type: 'point',
                color: template.light.color || '#FFFFFF',
                intensity: template.light.intensity || 1.0,
                decay: template.light.decay || 1.0,
                distance: template.light.distance || 10
            });
            entity.appendChild(light);
        }
        
        // Orient the beam to point from start to end
        entity.setAttribute('look-at', positionToString(endPosition));
        
        // Add to scene
        document.querySelector('#scene').appendChild(entity);
        
        // Create and return effect object
        return {
            id: effectId,
            type: 'beam',
            entity: entity,
            startPosition: { ...startPosition },
            endPosition: { ...endPosition },
            template: template,
            duration: template.duration || 1000,
            createTime: Date.now()
        };
    }
    
    // Create weather effect (rain, snow, etc)
    function createWeatherEffect(effectId, position, template) {
        // Create weather entity
        const entity = document.createElement('a-entity');
        entity.id = effectId;
        entity.setAttribute('position', positionToString(position));
        
        // Configure particle system for weather
        entity.setAttribute('particle-system', {
            preset: template.preset || 'default',
            texture: generateEffectTexture(template.texture, template.color),
            particleCount: template.count || 1000,
            size: template.size.min || 0.1,
            maxAge: template.height / template.speed,
            velocity: `${template.direction.x * template.speed} ${template.direction.y * template.speed} ${template.direction.z * template.speed}`,
            velocitySpread: '0.2 0 0.2',
            color: template.color,
            opacity: template.opacity ? template.opacity.value : 0.7,
            positionSpread: `${template.area} 0 ${template.area}`
        });
        
        // Add to scene
        document.querySelector('#scene').appendChild(entity);
        
        // Create and return effect object
        return {
            id: effectId,
            type: 'weather',
            entity: entity,
            position: { ...position },
            template: template,
            duration: template.duration || Infinity,
            createTime: Date.now()
        };
    }
    
    // Update particle effect
    function updateParticleEffect(effect, elapsed, deltaTime) {
        // Update opacity over time
        if (effect.template.opacity && effect.template.opacity.start !== effect.template.opacity.end) {
            const progress = Math.min(1.0, elapsed / effect.duration);
            const currentOpacity = effect.template.opacity.start + 
                (effect.template.opacity.end - effect.template.opacity.start) * progress;
            
            // No direct way to update particle opacity in A-Frame particle-system, 
            // we must regenerate with new opacity
            // This is a limitation of the current implementation
        }
    }
    
    // Update sprite effect
    function updateSpriteEffect(effect, elapsed, deltaTime) {
        // Calculate progress (0 to 1)
        const progress = Math.min(1.0, elapsed / effect.duration);
        const sprite = effect.sprite;
        
        // Update opacity
        if (effect.template.opacity && effect.template.opacity.start !== effect.template.opacity.end) {
            const currentOpacity = effect.template.opacity.start + 
                (effect.template.opacity.end - effect.template.opacity.start) * progress;
            
            sprite.setAttribute('material', 'opacity', currentOpacity);
        }
        
        // Update scale
        if (effect.template.scale && effect.template.scale.start && effect.template.scale.end) {
            let currentScale;
            
            if (Array.isArray(effect.template.scale.start) && Array.isArray(effect.template.scale.end)) {
                // Vector scale
                currentScale = [
                    effect.template.scale.start[0] + (effect.template.scale.end[0] - effect.template.scale.start[0]) * progress,
                    effect.template.scale.start[1] + (effect.template.scale.end[1] - effect.template.scale.start[1]) * progress,
                    effect.template.scale.start[2] + (effect.template.scale.end[2] - effect.template.scale.start[2]) * progress
                ].join(' ');
            } else {
                // Scalar scale
                const startScale = Array.isArray(effect.template.scale.start) ? effect.template.scale.start[0] : effect.template.scale.start;
                const endScale = Array.isArray(effect.template.scale.end) ? effect.template.scale.end[0] : effect.template.scale.end;
                const currentScaleValue = startScale + (endScale - startScale) * progress;
                currentScale = `${currentScaleValue} ${currentScaleValue} ${currentScaleValue}`;
            }
            
            sprite.setAttribute('scale', currentScale);
        }
        
        // Update rotation
        if (effect.template.rotation) {
            // Extract current rotation
            const currentRotation = sprite.getAttribute('rotation') || { x: 0, y: 0, z: 0 };
            
            // Apply rotation change
            if (effect.template.rotationAxis) {
                const axis = effect.template.rotationAxis;
                const startAngle = effect.template.rotation.start || 0;
                const endAngle = effect.template.rotation.end || 360;
                const currentAngle = startAngle + (endAngle - startAngle) * progress;
                
                currentRotation[axis] = currentAngle;
                sprite.setAttribute('rotation', `${currentRotation.x} ${currentRotation.y} ${currentRotation.z}`);
            }
        }
    }
    
    // Update beam effect
    function updateBeamEffect(effect, elapsed, deltaTime) {
        // Calculate progress (0 to 1)
        const progress = Math.min(1.0, elapsed / effect.duration);
        
        // Get all segments
        const segments = effect.entity.childNodes;
        
        // Update width/opacity for each segment
        for (let i = 0; i < segments.length; i++) {
            const segment = segments[i];
            if (segment.nodeType !== Node.ELEMENT_NODE) continue;
            
            // Skip light element
            if (segment.hasAttribute('light')) continue;
            
            // Update width
            if (effect.template.width && effect.template.width.start !== effect.template.width.end) {
                const currentWidth = effect.template.width.start + 
                    (effect.template.width.end - effect.template.width.start) * progress;
                
                segment.setAttribute('geometry', 'radius', currentWidth / 2);
            }
            
            // Update opacity
            if (effect.template.opacity && effect.template.opacity.start !== effect.template.opacity.end) {
                const currentOpacity = effect.template.opacity.start + 
                    (effect.template.opacity.end - effect.template.opacity.start) * progress;
                
                segment.setAttribute('material', 'opacity', currentOpacity);
            }
            
            // Update jitter if applicable
            if (effect.template.jitter > 0