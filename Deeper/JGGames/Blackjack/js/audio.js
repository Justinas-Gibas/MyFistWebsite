/**
 * Audio controller for Blackjack game
 * Handles playing sounds and generating sound effects
 */
class AudioController {
    constructor() {
        this.backgroundMusic = document.getElementById('background-music');
        this.cardFlipSound = document.getElementById('card-flip-sound');
        this.winSound = document.getElementById('win-sound');
        this.loseSound = document.getElementById('lose-sound');
        this.tieSound = document.getElementById('tie-sound');
        this.betSound = document.getElementById('bet-sound');
        
        // Set volumes
        this.backgroundMusic.volume = 0.3;
        this.cardFlipSound.volume = 0.5;
        this.winSound.volume = 0.6;
        this.loseSound.volume = 0.6;
        this.tieSound.volume = 0.6;
        this.betSound.volume = 0.5;
        
        // Setup error handling for audio elements
        this.setupErrorHandling();
        
        // Flag to track if audio context has been initialized
        this.audioInitialized = false;
        
        // Add a global click listener to initialize audio on first user interaction
        document.addEventListener('click', this.initializeAudioContext.bind(this), { once: true });
    }
    
    setupErrorHandling() {
        // Add error event listeners to all audio elements
        const audioElements = [
            this.backgroundMusic,
            this.cardFlipSound,
            this.winSound,
            this.loseSound,
            this.tieSound,
            this.betSound
        ];
        
        audioElements.forEach(element => {
            element.addEventListener('error', (e) => {
                console.log(`Error loading audio for ${element.id}:`, e);
                // Will trigger sound generation
            });
        });
    }
    
    // Initialize audio context on user interaction to comply with browser policies
    initializeAudioContext() {
        if (this.audioInitialized) return;
        
        try {
            // Create a temporary AudioContext to unlock audio
            const tempContext = new (window.AudioContext || window.webkitAudioContext)();
            tempContext.resume().then(() => {
                console.log("AudioContext successfully initialized");
                this.audioInitialized = true;
                
                // Generate sounds immediately after initialization
                this.generateSoundsImmediately();
            });
            
            // Play a silent sound to fully unlock audio on iOS
            const silentBuffer = tempContext.createBuffer(1, 1, 22050);
            const source = tempContext.createBufferSource();
            source.buffer = silentBuffer;
            source.connect(tempContext.destination);
            source.start(0);
        } catch (e) {
            console.error("Error initializing AudioContext:", e);
        }
    }
    
    playBackgroundMusic() {
        // Some browsers require user interaction before playing audio
        try {
            const playPromise = this.backgroundMusic.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log("Auto-play prevented by browser:", error);
                    // Store that music should play when user interacts
                    window.musicEnabled = true;
                });
            }
        } catch (e) {
            console.log("Error playing background music:", e);
        }
    }
    
    pauseBackgroundMusic() {
        this.backgroundMusic.pause();
    }
    
    playCardFlip() {
        this.safePlaySound(this.cardFlipSound);
    }
    
    playWin() {
        this.safePlaySound(this.winSound);
    }
    
    playLose() {
        this.safePlaySound(this.loseSound);
    }
    
    playTie() {
        this.safePlaySound(this.tieSound);
    }
    
    playBet() {
        this.safePlaySound(this.betSound);
    }
    
    // Safely play a sound with error handling
    safePlaySound(audioElement) {
        try {
            audioElement.currentTime = 0;
            const playPromise = audioElement.play();
            
            if (playPromise !== undefined) {
                playPromise.catch(error => {
                    console.log(`Error playing ${audioElement.id}:`, error);
                    // If the sound fails to play, make sure it's generated
                    this.regenerateSpecificSound(audioElement);
                });
            }
        } catch (e) {
            console.log(`Error playing ${audioElement.id}:`, e);
        }
    }
    
    /**
     * Generate sound files using Web Audio API if they don't exist
     * This is a fallback if the sound files aren't available
     */
    generateSounds() {
        const audioElements = [
            { element: this.backgroundMusic, generator: this.generateBackgroundMusic.bind(this) },
            { element: this.cardFlipSound, generator: this.generateCardFlipSound.bind(this) },
            { element: this.winSound, generator: this.generateWinSound.bind(this) },
            { element: this.loseSound, generator: this.generateLoseSound.bind(this) },
            { element: this.tieSound, generator: this.generateTieSound.bind(this) },
            { element: this.betSound, generator: this.generateBetSound.bind(this) }
        ];
        
        audioElements.forEach(({ element, generator }) => {
            this.checkAndGenerateSound(element, generator);
        });
    }
    
    generateSoundsImmediately() {
        if (!this.audioInitialized) {
            console.log("Audio not yet initialized. Waiting for user interaction.");
            return;
        }
        
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Generate all sounds immediately
            this.backgroundMusic.src = URL.createObjectURL(this.generateBackgroundMusic(audioContext));
            this.cardFlipSound.src = URL.createObjectURL(this.generateCardFlipSound(audioContext));
            this.winSound.src = URL.createObjectURL(this.generateWinSound(audioContext));
            this.loseSound.src = URL.createObjectURL(this.generateLoseSound(audioContext));
            this.tieSound.src = URL.createObjectURL(this.generateTieSound(audioContext));
            this.betSound.src = URL.createObjectURL(this.generateBetSound(audioContext));
            
            console.log("All game sounds generated successfully");
        } catch (e) {
            console.error("Error generating sounds:", e);
        }
    }
    
    // Regenerate a specific sound
    regenerateSpecificSound(audioElement) {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            let soundBlob;
            
            switch(audioElement.id) {
                case 'background-music':
                    soundBlob = this.generateBackgroundMusic(audioContext);
                    break;
                case 'card-flip-sound':
                    soundBlob = this.generateCardFlipSound(audioContext);
                    break;
                case 'win-sound':
                    soundBlob = this.generateWinSound(audioContext);
                    break;
                case 'lose-sound':
                    soundBlob = this.generateLoseSound(audioContext);
                    break;
                case 'tie-sound':
                    soundBlob = this.generateTieSound(audioContext);
                    break;
                case 'bet-sound':
                    soundBlob = this.generateBetSound(audioContext);
                    break;
            }
            
            if (soundBlob) {
                audioElement.src = URL.createObjectURL(soundBlob);
                console.log(`Regenerated sound for ${audioElement.id}`);
            }
        } catch (e) {
            console.error(`Error regenerating sound for ${audioElement.id}:`, e);
        }
    }
    
    checkAndGenerateSound(audioElement, generatorFunction) {
        audioElement.addEventListener('error', () => {
            console.log(`Generating sound for ${audioElement.id} as file wasn't found`);
            try {
                const audioContext = new (window.AudioContext || window.webkitAudioContext)();
                const soundBlob = generatorFunction(audioContext);
                if (soundBlob) {
                    const objectURL = URL.createObjectURL(soundBlob);
                    audioElement.src = objectURL;
                }
            } catch (e) {
                console.error(`Error generating sound for ${audioElement.id}:`, e);
            }
        });
    }
    
    generateBackgroundMusic(audioContext) {
        // Create a simple looping background tune
        const audioBuffer = audioContext.createBuffer(2, audioContext.sampleRate * 10, audioContext.sampleRate);
        
        for (let channel = 0; channel < 2; channel++) {
            const data = audioBuffer.getChannelData(channel);
            
            for (let i = 0; i < audioBuffer.length; i++) {
                // Simple melody generation
                const t = i / audioContext.sampleRate;
                const note1 = Math.sin(2 * Math.PI * 220 * t) * Math.exp(-0.0005 * t);
                const note2 = Math.sin(2 * Math.PI * 330 * (t % 2)) * Math.exp(-0.001 * (t % 2));
                const note3 = Math.sin(2 * Math.PI * 440 * (t % 4)) * Math.exp(-0.002 * (t % 4));
                
                data[i] = (note1 + note2 + note3) * 0.2;
            }
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    generateCardFlipSound(audioContext) {
        const duration = 0.2;
        const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            const t = i / audioContext.sampleRate;
            // Quick frequency sweep from high to low
            const freq = 2000 - 1500 * (t / duration);
            data[i] = Math.sin(2 * Math.PI * freq * t) * Math.exp(-10 * t);
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    generateWinSound(audioContext) {
        const duration = 1.0;
        const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            const t = i / audioContext.sampleRate;
            // A happy ascending arpeggio
            const note1 = Math.sin(2 * Math.PI * 440 * t) * Math.exp(-3 * t);
            const note2 = (t > 0.2) ? Math.sin(2 * Math.PI * 554 * (t - 0.2)) * Math.exp(-3 * (t - 0.2)) : 0;
            const note3 = (t > 0.4) ? Math.sin(2 * Math.PI * 659 * (t - 0.4)) * Math.exp(-3 * (t - 0.4)) : 0;
            const note4 = (t > 0.6) ? Math.sin(2 * Math.PI * 880 * (t - 0.6)) * Math.exp(-3 * (t - 0.6)) : 0;
            
            data[i] = (note1 + note2 + note3 + note4) * 0.25;
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    generateLoseSound(audioContext) {
        const duration = 0.8;
        const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            const t = i / audioContext.sampleRate;
            // A sad descending tone
            const note1 = Math.sin(2 * Math.PI * 300 * t) * Math.exp(-2 * t);
            const note2 = (t > 0.2) ? Math.sin(2 * Math.PI * 250 * (t - 0.2)) * Math.exp(-2 * (t - 0.2)) : 0;
            const note3 = (t > 0.4) ? Math.sin(2 * Math.PI * 200 * (t - 0.4)) * Math.exp(-2 * (t - 0.4)) : 0;
            
            data[i] = (note1 + note2 + note3) * 0.3;
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    generateTieSound(audioContext) {
        const duration = 0.6;
        const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            const t = i / audioContext.sampleRate;
            // A neutral sound - two tones
            const note1 = Math.sin(2 * Math.PI * 350 * t) * Math.exp(-4 * t);
            const note2 = (t > 0.3) ? Math.sin(2 * Math.PI * 350 * (t - 0.3)) * Math.exp(-4 * (t - 0.3)) : 0;
            
            data[i] = (note1 + note2) * 0.3;
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    generateBetSound(audioContext) {
        const duration = 0.2;
        const audioBuffer = audioContext.createBuffer(1, audioContext.sampleRate * duration, audioContext.sampleRate);
        const data = audioBuffer.getChannelData(0);
        
        for (let i = 0; i < audioBuffer.length; i++) {
            const t = i / audioContext.sampleRate;
            // Coin/chip sound - metallic clink
            const base = Math.sin(2 * Math.PI * 800 * t);
            const noise = Math.random() * 0.3;
            data[i] = (base + noise) * Math.exp(-15 * t) * 0.3;
        }
        
        return this.audioBufferToWave(audioBuffer);
    }
    
    // Utility function to convert AudioBuffer to a WAV Blob
    audioBufferToWave(audioBuffer) {
        const numChannels = audioBuffer.numberOfChannels;
        const length = audioBuffer.length * numChannels * 2;
        const buffer = new ArrayBuffer(44 + length);
        const view = new DataView(buffer);
        
        // Write WAV header
        // "RIFF" chunk descriptor
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length, true);
        this.writeString(view, 8, 'WAVE');
        
        // "fmt " sub-chunk
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true);
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, audioBuffer.sampleRate, true);
        view.setUint32(28, audioBuffer.sampleRate * numChannels * 2, true); // Byte rate
        view.setUint16(32, numChannels * 2, true); // Block align
        view.setUint16(34, 16, true); // Bits per sample
        
        // "data" sub-chunk
        this.writeString(view, 36, 'data');
        view.setUint32(40, length, true);
        
        // Write audio data
        const offset = 44;
        let index = 0;
        for (let i = 0; i < audioBuffer.length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, audioBuffer.getChannelData(channel)[i]));
                view.setInt16(offset + index, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                index += 2;
            }
        }
        
        return new Blob([buffer], { type: 'audio/wav' });
    }
    
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }
}

// Create global audio controller instance
const audioController = new AudioController();
