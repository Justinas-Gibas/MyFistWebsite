/**
 * Weather System
 * 
 * Manages weather patterns, day/night cycles, and environmental effects
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.weather = {};

(function() {
    // Weather types
    const weatherTypes = {
        clear: {
            name: "Clear",
            fog: 0.0,
            precipitation: 0.0,
            cloudCover: 0.1,
            windStrength: 0.1,
            thunderChance: 0.0,
            ambientLight: 1.0,
            soundEffect: 'ambient_day',
            particleEffect: null
        },
        cloudy: {
            name: "Cloudy",
            fog: 0.2,
            precipitation: 0.0,
            cloudCover: 0.7,
            windStrength: 0.3,
            thunderChance: 0.0,
            ambientLight: 0.8,
            soundEffect: 'ambient_wind',
            particleEffect: 'clouds'
        },
        rain: {
            name: "Rain",
            fog: 0.4,
            precipitation: 0.6,
            cloudCover: 0.9,
            windStrength: 0.5,
            thunderChance: 0.1,
            ambientLight: 0.6,
            soundEffect: 'ambient_rain',
            particleEffect: 'rain'
        },
        storm: {
            name: "Thunderstorm",
            fog: 0.7,
            precipitation: 1.0,
            cloudCover: 1.0,
            windStrength: 0.8,
            thunderChance: 0.8,
            ambientLight: 0.4,
            soundEffect: 'ambient_storm',
            particleEffect: 'heavyRain'
        },
        snow: {
            name: "Snow",
            fog: 0.6,
            precipitation: 0.7,
            cloudCover: 0.8,
            windStrength: 0.2,
            thunderChance: 0.0,
            ambientLight: 0.7,
            soundEffect: 'ambient_snow',
            particleEffect: 'snow'
        },
        fog: {
            name: "Fog",
            fog: 0.9,
            precipitation: 0.1,
            cloudCover: 0.5,
            windStrength: 0.1,
            thunderChance: 0.0,
            ambientLight: 0.5,
            soundEffect: 'ambient_fog',
            particleEffect: 'fog'
        }
    };
    
    // Current weather state
    let currentWeather = 'clear';
    let targetWeather = 'clear';
    let weatherTransition = 0; // 0-1, progress to target weather
    let transitionSpeed = 0.001; // Speed of transition per ms
    
    // Day/night state
    const DAY_LENGTH_MS = 20 * 60 * 1000; // 20 minutes per day
    let timeOfDay = 0; // 0-1, 0 = midnight, 0.25 = dawn, 0.5 = noon, 0.75 = dusk
    let dayCount = 1;
    
    // Weather effects
    let weatherParticles = null;
    let lightningTimer = null;
    
    // Initialize weather system
    Game.gameplay.weather.init = function() {
        console.log('Initializing weather system');
        
        // Set initial weather based on seed
        const state = Game.engine.getState();
        const worldSeed = state.world.seed || 0;
        
        // Use seed to determine starting weather
        const seedRandom = Game.utils.math.createRandom(worldSeed);
        const weatherKeys = Object.keys(weatherTypes);
        const initialWeatherId = weatherKeys[Math.floor(seedRandom() * weatherKeys.length)];
        
        setWeather(initialWeatherId, false); // Set initial weather instantly
        
        // Set up audio preloads
        for (const weatherType of Object.values(weatherTypes)) {
            if (weatherType.soundEffect) {
                Game.audio.loadAmbient(weatherType.soundEffect, `sounds/ambient/${weatherType.soundEffect}.mp3`);
            }
        }
        
        return Promise.resolve();
    };
    
    // Update weather (called each frame)
    Game.gameplay.weather.update = function(deltaTime) {
        // Update time of day
        updateTimeOfDay(deltaTime);
        
        // Update weather transition
        updateWeatherTransition(deltaTime);
        
        // Update weather effects
        updateWeatherEffects(deltaTime);
    };
    
    // Set the current weather
    Game.gameplay.weather.setWeather = function(weatherId, transition = true) {
        if (!weatherTypes[weatherId]) {
            console.error(`Invalid weather type: ${weatherId}`);
            return;
        }
        
        targetWeather = weatherId;
        
        if (!transition) {
            currentWeather = weatherId;
            weatherTransition = 1.0;
            updateWeatherEffects(0);
        }
    };
    
    // Get the current weather type
    Game.gameplay.weather.getCurrentWeather = function() {
        return currentWeather;
    };
    
    // Get time of day (0-1)
    Game.gameplay.weather.getTimeOfDay = function() {
        return timeOfDay;
    };
    
    // Get day count
    Game.gameplay.weather.getDayCount = function() {
        return dayCount;
    };
    
    // Update time of day
    function updateTimeOfDay(deltaTime) {
        // Update time of day (complete cycle every DAY_LENGTH_MS)
        const previousTime = timeOfDay;
        timeOfDay = (timeOfDay + (deltaTime / DAY_LENGTH_MS)) % 1.0;
        
        // Check if day changed
        if (timeOfDay < previousTime) {
            dayCount++;
            Game.engine.events.emit('weather:newDay', { day: dayCount });
        }
        
        // Check for time-specific events
        if (previousTime < 0.25 && timeOfDay >= 0.25) {
            // Dawn
            Game.engine.events.emit('weather:dawn', {});
        } else if (previousTime < 0.75 && timeOfDay >= 0.75) {
            // Dusk
            Game.engine.events.emit('weather:dusk', {});
        }
        
        // Update scene lighting based on time of day
        updateLighting();
    }
    
    // Update weather transition
    function updateWeatherTransition(deltaTime) {
        if (currentWeather === targetWeather) return;
        
        // Progress transition
        weatherTransition += transitionSpeed * deltaTime;
        
        // Check if transition complete
        if (weatherTransition >= 1.0) {
            weatherTransition = 1.0;
            currentWeather = targetWeather;
        }
    }
    
    // Update scene lighting based on time of day
    function updateLighting() {
        // Time-based light values
        let intensity, color, shadowIntensity;
        
        if (timeOfDay < 0.25) {
            // Night (0.0) to Dawn (0.25)
            const t = timeOfDay / 0.25;
            intensity = 0.2 + t * 0.4; // 0.2 -> 0.6
            color = lerpColor('#113366', '#FF9966', t);
            shadowIntensity = t * 0.5; // 0.0 -> 0.5
        } else if (timeOfDay < 0.5) {
            // Dawn (0.25) to Midday (0.5)
            const t = (timeOfDay - 0.25) / 0.25;
            intensity = 0.6 + t * 0.4; // 0.6 -> 1.0
            color = lerpColor('#FF9966', '#FFFFFF', t);
            shadowIntensity = 0.5 + t * 0.5; // 0.5 -> 1.0
        } else if (timeOfDay < 0.75) {
            // Midday (0.5) to Dusk (0.75)
            const t = (timeOfDay - 0.5) / 0.25;
            intensity = 1.0 - t * 0.4; // 1.0 -> 0.6
            color = lerpColor('#FFFFFF', '#FF9966', t);
            shadowIntensity = 1.0 - t * 0.5; // 1.0 -> 0.5
        } else {
            // Dusk (0.75) to Night (1.0)
            const t = (timeOfDay - 0.75) / 0.25;
            intensity = 0.6 - t * 0.4; // 0.6 -> 0.2
            color = lerpColor('#FF9966', '#113366', t);
            shadowIntensity = 0.5 - t * 0.5; // 0.5 -> 0.0
        }
        
        // Apply current weather modifiers
        const currentWeatherType = weatherTypes[currentWeather];
        
        if (currentWeatherType) {
            intensity *= currentWeatherType.ambientLight;
        }
        
        // Update lights
        const ambientLight = document.getElementById('ambient-light');
        if (ambientLight) {
            ambientLight.setAttribute('light', {
                intensity: intensity * 0.5,
                color: color
            });
        }
        
        const directionalLight = document.getElementById('directional-light');
        if (directionalLight) {
            directionalLight.setAttribute('light', {
                intensity: intensity * shadowIntensity,
                color: color
            });
            
            // Update sun position based on time of day
            const sunAngle = (timeOfDay - 0.25) * Math.PI * 2; // 0 degrees at dawn, 180 at dusk
            const sunHeight = Math.sin(sunAngle);
            const sunEastWest = Math.cos(sunAngle);
            
            directionalLight.setAttribute('position', {
                x: sunEastWest * 100,
                y: Math.max(0.1, sunHeight * 100), // Keep slight light from below horizon
                z: 0
            });
        }
        
        // Update atmosphere/fog
        const scene = document.querySelector('a-scene');
        if (scene) {
            let fogDensity = 0.02; // Base fog density
            
            // More fog at night and during weather events
            if (timeOfDay < 0.25 || timeOfDay > 0.75) {
                fogDensity *= 2.0;
            }
            
            // Weather-based fog
            if (currentWeatherType) {
                fogDensity *= (1.0 + currentWeatherType.fog * 5.0);
            }
            
            scene.setAttribute('fog', {
                type: 'exponential',
                color: color,
                density: fogDensity
            });
        }
    }
    
    // Update weather effects
    function updateWeatherEffects(deltaTime) {
        const currentWeatherType = weatherTypes[currentWeather];
        
        // Handle audio
        if (currentWeatherType && currentWeatherType.soundEffect) {
            Game.audio.playAmbient(currentWeatherType.soundEffect);
        }
        
        // Handle particles
        if (currentWeatherType && currentWeatherType.particleEffect) {
            updateParticleEffects(currentWeatherType.particleEffect);
        } else {
            clearParticleEffects();
        }
        
        // Handle special effects
        if (currentWeatherType && currentWeatherType.thunderChance > 0) {
            updateLightningEffects(deltaTime, currentWeatherType.thunderChance);
        } else if (lightningTimer) {
            clearTimeout(lightningTimer);
            lightningTimer = null;
        }
    }
    
    // Set weather particles
    function updateParticleEffects(effectType) {
        if (weatherParticles === null) {
            weatherParticles = document.createElement('a-entity');
            weatherParticles.id = 'weather-particles';
            
            // Add to camera to follow player (but not rotate with view)
            const camera = document.getElementById('camera');
            camera.appendChild(weatherParticles);
        }
        
        // Set particle properties based on effect type
        switch (effectType) {
            case 'rain':
                weatherParticles.setAttribute('particle-system', {
                    preset: 'rain',
                    particleCount: 1500,
                    size: 0.1,
                    color: '#CCCCFF',
                    opacity: 0.3,
                    velocityValue: '0 -15 0',
                    maxAge: 1.5
                });
                break;
                
            case 'heavyRain':
                weatherParticles.setAttribute('particle-system', {
                    preset: 'rain',
                    particleCount: 3000,
                    size: 0.15,
                    color: '#AAAAFF',
                    opacity: 0.4,
                    velocityValue: '0 -25 0',
                    maxAge: 1.0
                });
                break;
                
            case 'snow':
                weatherParticles.setAttribute('particle-system', {
                    preset: 'snow',
                    particleCount: 1000,
                    size: 0.2,
                    color: '#FFFFFF',
                    opacity: 0.7,
                    velocityValue: '0 -2 0',
                    maxAge: 4.0
                });
                break;
                
            case 'fog':
                weatherParticles.setAttribute('particle-system', {
                    preset: 'dust',
                    particleCount: 500,
                    size: 10,
                    color: '#CCCCCC',
                    opacity: 0.1,
                    velocityValue: '0.1 0.1 0.1',
                    velocitySpread: '0.2 0.1 0.2',
                    maxAge: 10.0
                });
                break;
                
            case 'clouds':
                weatherParticles.setAttribute('particle-system', {
                    preset: 'dust',
                    particleCount: 100,
                    size: 20,
                    color: '#DDDDDD',
                    opacity: 0.2,
                    velocityValue: '0.2 0 0',
                    velocitySpread: '0.1 0 0.1',
                    positionSpread: '100 10 100',
                    maxAge: 30.0
                });
                break;
        }
    }
    
    // Clear particle effects
    function clearParticleEffects() {
        if (weatherParticles) {
            weatherParticles.parentNode.removeChild(weatherParticles);
            weatherParticles = null;
        }
    }
    
    // Handle lightning effects
    function updateLightningEffects(