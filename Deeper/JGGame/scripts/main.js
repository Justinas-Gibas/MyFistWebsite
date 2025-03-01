/**
 * Main application entry point
 * 
 * Initializes all game systems in the correct order and starts the game loop
 */
window.addEventListener('DOMContentLoaded', () => {
    // Initialize loading screen
    showLoadingScreen('Initializing game systems...');
    
    // Initialize systems in order
    initializeGameSystems()
        .then(() => {
            // Hide loading screen and start game
            hideLoadingScreen();
            Game.engine.start();
        })
        .catch(error => {
            console.error('Error initializing game:', error);
            showErrorScreen('Failed to initialize game. Please refresh the page.');
        });
});

// Initialize all game systems in the proper sequence
function initializeGameSystems() {
    // Define initialization sequence
    const initSequence = [
        { name: 'Utility Systems', fn: initUtilitySystems },
        { name: 'Asset Generation', fn: initAssetSystems },
        { name: 'World Generation', fn: initWorldSystems },
        { name: 'Core Engine', fn: initCoreEngine },
        { name: 'Gameplay Systems', fn: initGameplaySystems },
        { name: 'User Interface', fn: initUISystems },
    ];
    
    // Execute sequence
    return initSequence.reduce(
        (promise, system) => promise.then(() => {
            updateLoadingProgress(`Loading ${system.name}...`);
            return system.fn();
        }),
        Promise.resolve()
    );
}

// Initialize utility systems
function initUtilitySystems() {
    return Promise.all([
        Game.utils.math.init(),
        Game.assets.init()
    ]);
}

// Initialize asset generation systems
function initAssetSystems() {
    return Promise.all([
        Game.generation.noise.init(),
        Game.generation.textures.init()
    ]);
}

// Initialize world generation systems
function initWorldSystems() {
    return Promise.all([
        Game.generation.world.init(),
        Game.generation.characters.init()
    ]);
}

// Initialize core engine systems
function initCoreEngine() {
    return Promise.all([
        Game.engine.init(),
        Game.engine.vr.init()
    ]);
}

// Initialize gameplay systems
function initGameplaySystems() {
    return Promise.all([
        Game.gameplay.player.init(),
        Game.gameplay.combat.init(),
        Game.gameplay.enemy.init(),
        Game.gameplay.building.init(),
        Game.gameplay.npc.init(),
        Game.gameplay.quests.init(),
        Game.gameplay.inventory.init(),
        Game.gameplay.skills.init(),
        Game.gameplay.loot.init()
    ]);
}

// Initialize UI systems
function initUISystems() {
    return Game.engine.ui.init();
}

// Loading screen utilities
function showLoadingScreen(message) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatus = document.querySelector('.loading-status');
    
    if (loadingScreen && loadingStatus) {
        loadingStatus.textContent = message;
        loadingScreen.style.display = 'flex';
    }
}

function updateLoadingProgress(message, percent) {
    const loadingStatus = document.querySelector('.loading-status');
    const progressBar = document.querySelector('.progress-value');
    
    if (loadingStatus) {
        loadingStatus.textContent = message;
    }
    
    if (progressBar && percent !== undefined) {
        progressBar.style.width = `${percent}%`;
    }
}

function hideLoadingScreen() {
    const loadingScreen = document.getElementById('loading-screen');
    
    if (loadingScreen) {
        loadingScreen.style.display = 'none';
    }
}

function showErrorScreen(message) {
    const loadingScreen = document.getElementById('loading-screen');
    const loadingStatus = document.querySelector('.loading-status');
    
    if (loadingScreen && loadingStatus) {
        loadingStatus.textContent = message;
        loadingStatus.classList.add('error');
        loadingScreen.style.display = 'flex';
    }
}
