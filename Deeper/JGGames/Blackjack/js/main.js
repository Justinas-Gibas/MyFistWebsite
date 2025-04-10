/**
 * Main game controller for Blackjack
 * Connects all modules and manages game flow
 */

// Game state
let gameInProgress = false;
let musicEnabled = true;

// Initialize the game
document.addEventListener('DOMContentLoaded', () => {
    initGame();
});

function initGame() {
    // Initialize betting manager
    window.bettingManager = new BettingManager(player);
    
    // Update UI with initial values
    player.updateBalance();
    
    // Initialize the deck visually
    deck.initializeVisibleDeck();
    
    // Listen for window resize to adjust layout
    window.addEventListener('resize', () => {
        ui.updateCardPositions();
    });
    
    // Force audio generation immediately rather than waiting for error
    audioController.generateSoundsImmediately();
    
    // Music toggle setup - update icon based on state
    updateMusicToggleIcon();
    
    // User interaction is required to start audio on many browsers
    // We'll use any click as an opportunity to initialize audio
    document.addEventListener('click', () => {
        // Try to initialize audio if music is enabled
        if (musicEnabled && audioController && typeof audioController.initializeAudioContext === 'function') {
            audioController.initializeAudioContext();
        }
    }, { once: true });
    
    // Initial UI update for responsive design
    ui.resizeGameElements();
}

// Toggle background music
function toggleMusic() {
    if (audioController.backgroundMusic.paused) {
        audioController.playBackgroundMusic();
        musicEnabled = true;
    } else {
        audioController.pauseBackgroundMusic();
        musicEnabled = false;
    }
    
    updateMusicToggleIcon();
}

// Update the music toggle button icon
function updateMusicToggleIcon() {
    const musicButton = document.getElementById('music-toggle');
    const musicIcon = musicButton.querySelector('.music-icon');
    
    if (musicEnabled) {
        musicIcon.textContent = '🔊';
        musicButton.title = 'Mute Music';
    } else {
        musicIcon.textContent = '🔇';
        musicButton.title = 'Play Music';
    }
}

// Game Actions
function adjustBet(amount) {
    if (!gameInProgress) {
        bettingManager.adjustBet(amount);
    }
}

function resetBet() {
    if (!gameInProgress) {
        bettingManager.resetBet();
    }
}

async function dealCards() {
    if (player.currentBet <= 0) {
        ui.updateInfoCard("No Bet Placed", "Please place a bet first by clicking on the chips.");
        
        // Highlight the betting chips with a pulse effect
        document.querySelectorAll('.chip').forEach(chip => {
            chip.animate([
                { boxShadow: '0 0 0 0 rgba(255, 215, 0, 0.7)' },
                { boxShadow: '0 0 0 10px rgba(255, 215, 0, 0)' }
            ], {
                duration: 1000,
                iterations: 2
            });
        });
        
        return;
    }
    
    gameInProgress = true;
    player.reset();
    dealer.reset();
    ui.updateInfoCard("Game Started", "Good luck! You can now Hit to take another card or Stand to keep your current hand.");
    
    // Enable game buttons
    ui.enableGameButtons();
    
    // Deal initial cards with animation
    await dealer.dealInitialCards();
    
    // Update UI
    ui.updateGameState();
    
    // Check for blackjack
    if (player.score === 21) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        stand(); // Auto-stand on blackjack
    }
}

async function hit() {
    if (!gameInProgress) return;
    
    // Deal card to player with animation
    await deck.dealCardToHand(player);
    
    // Update UI
    ui.updateGameState();
    
    // Check for bust or 21
    if (player.score > 21) {
        ui.handlePlayerBust();
        gameInProgress = false;
    } else if (player.score === 21) {
        // Auto-stand if player hits 21
        await new Promise(resolve => setTimeout(resolve, 800));
        stand();
    }
}

async function stand() {
    if (!gameInProgress) return;
    
    ui.disableGameButtons();
    
    // Dealer play with animation
    await dealer.autoPlay();
    
    // Determine winner after dealer finishes
    await new Promise(resolve => setTimeout(resolve, 800));
    ui.determineWinner();
    gameInProgress = false;
}

// Export functions to global scope for HTML onclick attributes
window.adjustBet = adjustBet;
window.resetBet = resetBet;
window.dealCards = dealCards;
window.hit = hit;
window.stand = stand;
window.toggleMusic = toggleMusic;
