/**
 * Audio Management System
 * 
 * Handles all sound effects, music, and ambient audio
 */
window.Game = window.Game || {};
Game.audio = {};

(function() {
    // Audio caches
    const soundEffects = new Map();
    const musicTracks = new Map();
    const ambientSounds = new Map();
    
    // Currently playing sounds
    const activeSounds = new Set();
    
    // Current music and ambient tracks
    let currentMusic = null;
    let currentAmbient = null;
    
    // Master volume settings
    const volume = {
        master: 1.0,
        music: 0.8,
        ambient: 0.5,
        effects: 1.0
    };
    
    // Audio fade settings
    const fadeTime = 2000; // 2 seconds
    
    // Initialize audio system
    Game.audio.init = function() {
        console.log('Initializing audio system');
        preloadCommonSounds();
        return Promise.resolve();
    };
    
    // Preload essential sound effects
    function preloadCommonSounds() {
        // Load common sounds like UI clicks, footsteps, etc.
        const commonSounds = [
            'ui_click',
            'ui_hover',
            'footstep_stone',
            'footstep_grass',
            'footstep_wood',
            'attack_sword',
            'attack_magic',
            'player_damage',
            'player_death',
            'enemy_damage',
            'enemy_death'
        ];
        
        commonSounds.forEach(soundId => {
            Game.audio.loadSound(soundId, `sounds/effects/${soundId}.mp3`);
        });
    }
    
    // Load a sound effect
    Game.audio.loadSound = function(id, url) {
        if (soundEffects.has(id)) return;
        
        const sound = new Howl({
            src: [url],
            volume: volume.effects * volume.master
        });
        
        soundEffects.set(id, sound);
        return sound;
    };
    
    // Play a sound effect
    Game.audio.playSound = function(id, options = {}) {
        if (!soundEffects.has(id)) {
            console.warn(`Sound effect not found: ${id}`);
            return null;
        }
        
        const sound = soundEffects.get(id);
        const soundOptions = {
            volume: (options.volume !== undefined ? options.volume : 1.0) * volume.effects * volume.master,
            loop: options.loop || false,
            rate: options.rate || 1.0,
            position: options.position || null
        };
        
        // Set 3D position if provided
        if (soundOptions.position) {
            sound.pos(
                soundOptions.position.x,
                soundOptions.position.y,
                soundOptions.position.z
            );
        }
        
        const soundId = sound.play();
        sound.volume(soundOptions.volume, soundId);
        sound.rate(soundOptions.rate, soundId);
        sound.loop(soundOptions.loop, soundId);
        
        if (soundOptions.loop) {
            activeSounds.add(soundId);
            
            // Return object with methods to control the sound
            return {
                stop: () => {
                    sound.stop(soundId);
                    activeSounds.delete(soundId);
                },
                setVolume: (newVolume) => {
                    sound.volume(newVolume * volume.effects * volume.master, soundId);
                },
                setPosition: (position) => {
                    sound.pos(position.x, position.y, position.z, soundId);
                }
            };
        }
        
        return soundId;
    };
    
    // Load a music track
    Game.audio.loadMusic = function(id, url) {
        if (musicTracks.has(id)) return;
        
        const music = new Howl({
            src: [url],
            volume: 0,
            loop: true,
            preload: true
        });
        
        musicTracks.set(id, music);
        return music;
    };
    
    // Play a music track with crossfade
    Game.audio.playMusic = function(id, fadeIn = true) {
        if (!musicTracks.has(id)) {
            console.warn(`Music track not found: ${id}`);
            return;
        }
        
        const targetVolume = volume.music * volume.master;
        
        // Fade out current music if playing
        if (currentMusic) {
            const oldMusic = currentMusic;
            oldMusic.fade(oldMusic.volume(), 0, fadeTime);
            setTimeout(() => {
                oldMusic.stop();
            }, fadeTime);
        }
        
        // Start new music
        const music = musicTracks.get(id);
        music.volume(fadeIn ? 0 : targetVolume);
        music.play();
        
        if (fadeIn) {
            music.fade(0, targetVolume, fadeTime);
        }
        
        currentMusic = music;
    };
    
    // Load ambient sound
    Game.audio.loadAmbient = function(id, url) {
        if (ambientSounds.has(id)) return;
        
        const ambient = new Howl({
            src: [url],
            volume: 0,
            loop: true,
            preload: true
        });
        
        ambientSounds.set(id, ambient);
        return ambient;
    };
    
    // Play ambient sound with crossfade
    Game.audio.playAmbient = function(id, fadeIn = true) {
        if (!ambientSounds.has(id)) {
            console.warn(`Ambient sound not found: ${id}`);
            return;
        }
        
        const targetVolume = volume.ambient * volume.master;
        
        // Fade out current ambient if playing
        if (currentAmbient) {
            const oldAmbient = currentAmbient;
            oldAmbient.fade(oldAmbient.volume(), 0, fadeTime);
            setTimeout(() => {
                oldAmbient.stop();
            }, fadeTime);
        }
        
        // Start new ambient
        const ambient = ambientSounds.get(id);
        ambient.volume(fadeIn ? 0 : targetVolume);
        ambient.play();
        
        if (fadeIn) {
            ambient.fade(0, targetVolume, fadeTime);
        }
        
        currentAmbient = ambient;
    };
    
    // Set volume for audio category
    Game.audio.setVolume = function(category, level) {
        if (volume.hasOwnProperty(category)) {
            volume[category] = Math.max(0, Math.min(1, level));
            updateAllVolumes();
        }
    };
    
    // Update volumes for all active sounds
    function updateAllVolumes() {
        // Update sound effects
        soundEffects.forEach(sound => {
            sound.volume(volume.effects * volume.master);
        });
        
        // Update current music
        if (currentMusic) {
            currentMusic.volume(volume.music * volume.master);
        }
        
        // Update current ambient
        if (currentAmbient) {
            currentAmbient.volume(volume.ambient * volume.master);
        }
    }
    
    // Clean up and stop all sounds
    Game.audio.stopAll = function() {
        // Stop all sound effects
        soundEffects.forEach(sound => {
            sound.stop();
        });
        
        // Stop music
        if (currentMusic) {
            currentMusic.stop();
            currentMusic = null;
        }
        
        // Stop ambient
        if (currentAmbient) {
            currentAmbient.stop();
            currentAmbient = null;
        }
        
        // Clear active sounds
        activeSounds.clear();
    };
})();
