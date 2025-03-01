/**
 * Quest System
 * 
 * Handles quest generation, tracking, and completion.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.quests = {};

(function() {
    // Quest definitions
    const questTemplates = {
        // Gather resource quests
        gather_wood: {
            type: 'gather',
            title: 'Lumber Supply',
            description: 'Gather {amount} wood for building supplies.',
            resourceType: 'wood',
            baseAmount: 15,
            scaling: 5, // Additional per level
            reward: {
                experience: 50,
                gold: 10
            }
        },
        gather_stone: {
            type: 'gather',
            title: 'Stone Collection',
            description: 'Collect {amount} stone for construction.',
            resourceType: 'stone',
            baseAmount: 10,
            scaling: 3,
            reward: {
                experience: 60,
                gold: 15
            }
        },
        
        // Kill enemy quests
        kill_enemies: {
            type: 'kill',
            title: 'Clear the Threat',
            description: 'Defeat {amount} {enemyType} threatening the area.',
            baseAmount: 5,
            scaling: 1,
            enemyTypes: ['skeleton', 'zombie', 'spider'],
            reward: {
                experience: 100,
                gold: 25
            }
        },
        
        // Exploration quests
        explore_landmark: {
            type: 'explore',
            title: 'Chart the Unknown',
            description: 'Discover the {landmarkType} located to the {direction}.',
            landmarkTypes: ['ruins', 'cave', 'tower', 'dungeon'],
            directions: ['north', 'east', 'south', 'west'],
            reward: {
                experience: 150,
                gold: 30,
                item: true // Has chance for item reward
            }
        },
        
        // Defense quests
        defend_location: {
            type: 'defend',
            title: 'Stand Your Ground',
            description: 'Protect the {locationType} from waves of enemies for {time} minutes.',
            locationTypes: ['village', 'outpost', 'camp', 'caravan'],
            baseDuration: 2, // minutes
            scaling: 0.5, // Additional minutes per level
            reward: {
                experience: 200,
                gold: 50,
                item: true
            }
        }
    };
    
    // Active quests
    let activeQuests = [];
    
    // Completed quests
    let completedQuests = [];
    
    // Quest markers
    const questMarkers = new Map();
    
    // Quest generation parameters
    let lastQuestGeneration = 0;
    const questGenerationInterval = 1000 * 60 * 5; // 5 minutes
    
    // Initialize quests system
    Game.gameplay.quests.init = function() {
        console.log('Initializing quests system');
        loadQuests();
        setupQuestEvents();
        return Promise.resolve();
    };
    
    // Update quests (called each frame)
    Game.gameplay.quests.update = function(deltaTime) {
        updateQuestMarkers();
        checkQuestProgressAutomatic();
        generateRandomQuests();
    };
    
    // Load quests from game state
    function loadQuests() {
        const state = Game.engine.getState();
        if (state && state.quests) {
            activeQuests = [...(state.quests.active || [])];
            completedQuests = [...(state.quests.completed || [])];
        }
        
        updateQuestUI();
    }
    
    // Set up quest event listeners
    function setupQuestEvents() {
        // Listen for relevant game events that might update quest progress
        
        // Resource collection
        Game.engine.events.subscribe('resource:collected', (data) => {
            updateGatherQuestProgress(data.resourceType, data.amount);
        });
        
        // Enemy defeat
        Game.engine.events.subscribe('enemy:defeated', (data) => {
            updateKillQuestProgress(data.enemyType);
        });
        
        // Location discovery
        Game.engine.events.subscribe('landmark:discovered', (data) => {
            updateExploreQuestProgress(data.landmarkType, data.landmarkId);
        });
    }
    
    // Generate new quests periodically
    function generateRandomQuests() {
        const currentTime = Date.now();
        
        if (currentTime - lastQuestGeneration > questGenerationInterval) {
            // Only generate new quests if below maximum
            if (activeQuests.length < 5) {
                const possibleTypes = Object.keys(questTempl
