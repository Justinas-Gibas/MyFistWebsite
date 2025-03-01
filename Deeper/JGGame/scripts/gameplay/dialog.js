/**
 * Dialog System
 * 
 * Manages conversations with NPCs, including dialog trees, choices, and consequences.
 */
window.Game = window.Game || {};
Game.gameplay = Game.gameplay || {};
Game.gameplay.dialog = {};

(function() {
    // Current dialog state
    let currentDialog = null;
    let currentNPC = null;
    let currentNode = null;
    let dialogHistory = [];
    
    // Dialog container elements
    let dialogContainer = null;
    let npcPortrait = null;
    let dialogText = null;
    let dialogOptions = null;
    
    // Initialize dialog system
    Game.gameplay.dialog.init = function() {
        console.log('Initializing dialog system');
        
        // Get dialog UI elements
        dialogContainer = document.getElementById('dialog-container');
        npcPortrait = document.getElementById('npc-portrait');
        dialogText = document.getElementById('dialog-text');
        dialogOptions = document.getElementById('dialog-options');
        
        // Set up event listeners
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && isDialogOpen()) {
                Game.gameplay.dialog.endDialog();
            }
        });
        
        return Promise.resolve();
    };
    
    // Start a dialog with an NPC
    Game.gameplay.dialog.startDialog = function(npcId, dialogTree) {
        // Get NPC data
        currentNPC = Game.gameplay.npc.getNPC(npcId);
        if (!currentNPC) {
            console.error('NPC not found:', npcId);
            return;
        }
        
        console.log(`Starting dialog with ${currentNPC.name}`);
        
        // Use provided dialog tree or get from NPC
        currentDialog = dialogTree || currentNPC.dialogTree;
        if (!currentDialog) {
            console.error('No dialog tree found for NPC:', npcId);
            return;
        }
        
        // Reset dialog history
        dialogHistory = [];
        
        // Open dialog UI
        showDialogUI();
        
        // Start with the first dialog node
        navigateToNode('start');
        
        // Pause player movement during dialog
        pausePlayerMovement();
        
        // Emit dialog start event
        Game.engine.events.emit('dialog:start', { npcId: npcId });
    };
    
    // End the current dialog
    Game.gameplay.dialog.endDialog = function() {
        if (!isDialogOpen()) return;
        
        // Hide dialog UI
        hideDialogUI();
        
        // Resume player movement
        resumePlayerMovement();
        
        // Reset current dialog state
        currentDialog = null;
        currentNPC = null;
        currentNode = null;
        
        // Emit dialog end event
        Game.engine.events.emit('dialog:end', {});
    };
    
    // Navigate to a specific dialog node
    Game.gameplay.dialog.navigateToNode = function(nodeId) {
        navigateToNode(nodeId);
    };
    
    // Select a dialog option
    Game.gameplay.dialog.selectOption = function(optionIndex) {
        if (!currentNode || !currentNode.options || optionIndex >= currentNode.options.length) {
            console.error('Invalid dialog option selected:', optionIndex);
            return;
        }
        
        const selectedOption = currentNode.options[optionIndex];
        
        // Add to dialog history
        dialogHistory.push({
            speaker: 'player',
            text: selectedOption.text
        });
        
        // Apply any consequences of the option
        applyOptionConsequences(selectedOption);
        
        // Navigate to the next node
        if (selectedOption.nextNode) {
            navigateToNode(selectedOption.nextNode);
        } else {
            // If no next node, end the dialog
            Game.gameplay.dialog.endDialog();
        }
    };
    
    // Check if dialog is currently open
    Game.gameplay.dialog.isDialogOpen = function() {
        return isDialogOpen();
    };
    
    // Get dialog history
    Game.gameplay.dialog.getDialogHistory = function() {
        return [...dialogHistory];
    };
    
    // Generate dynamic response using context and NPC personality
    Game.gameplay.dialog.generateDynamicResponse = async function(context) {
        if (!currentNPC) return "...";
        
        // Base response on NPC personality, player relationship, and context
        try {
            // If we have an AI integration, we could use it here
            // For now, use template-based approach
            const baseResponses = {
                greeting: [
                    `Greetings, traveler. What brings you to these parts?`,
                    `Ah, a visitor. How can I help you today?`,
                    `*nods* What do you need?`
                ],
                quest: [
                    `I've been having trouble with something, perhaps you could help...`,
                    `If you're looking for work, I might have something for you.`,
                    `I need someone with your skills for a task.`
                ],
                trade: [
                    `Looking to trade? I've got some fine wares.`,
                    `Perhaps I have something that might interest you?`,
                    `My goods are of the finest quality, I assure you.`
                ],
                farewell: [
                    `Safe travels, friend.`,
                    `Until we meet again.`,
                    `May your path be clear of danger.`
                ]
            };
            
            // Select response based on context
            const responses = baseResponses[context] || baseResponses.greeting;
            const responseIndex = Math.floor(Math.random() * responses.length);
            
            return responses[responseIndex];
        } catch (error) {
            console.error('Error generating dynamic response:', error);
            return "I have nothing more to say.";
        }
    };
    
    // Private functions
    
    // Show dialog UI
    function showDialogUI() {
        if (!dialogContainer) return;
        
        // Show dialog container
        dialogContainer.classList.remove('hidden');
        
        // Set NPC portrait if available
        if (currentNPC && npcPortrait) {
            const portraitImg = document.createElement('img');
            portraitImg.src = Game.generation.textures.generateNPCPortrait(currentNPC.type, currentNPC.seed);
            
            // Clear and add new portrait
            npcPortrait.innerHTML = '';
            npcPortrait.appendChild(portraitImg);
        }
    }
    
    // Hide dialog UI
    function hideDialogUI() {
        if (!dialogContainer) return;
        
        // Hide dialog container
        dialogContainer.classList.add('hidden');
        
        // Clear dialog elements
        if (dialogText) dialogText.innerHTML = '';
        if (dialogOptions) dialogOptions.innerHTML = '';
        if (npcPortrait) npcPortrait.innerHTML = '';
    }
    
    // Navigate to a specific dialog node
    function navigateToNode(nodeId) {
        if (!currentDialog || !currentDialog.nodes) {
            console.error('Invalid dialog structure');
            return;
        }
        
        // Get the dialog node
        currentNode = currentDialog.nodes[nodeId];
        if (!currentNode) {
            console.error('Dialog node not found:', nodeId);
            return;
        }
        
        // Add to dialog history
        if (currentNode.text) {
            dialogHistory.push({
                speaker: currentNPC.name,
                text: currentNode.text
            });
        }
        
        // Update dialog text
        if (dialogText) {
            dialogText.innerHTML = `<p class="npc-name">${currentNPC.name}:</p><p class="npc-dialog">${currentNode.text}</p>`;
        }
        
        // Clear previous options
        if (dialogOptions) {
            dialogOptions.innerHTML = '';
            
            // Add dialog options
            if (currentNode.options && currentNode.options.length > 0) {
                currentNode.options.forEach((option, index) => {
                    const optionButton = document.createElement('button');
                    optionButton.classList.add('dialog-option');
                    optionButton.textContent = option.text;
                    optionButton.addEventListener('click', () => {
                        Game.gameplay.dialog.selectOption(index);
                    });
                    dialogOptions.appendChild(optionButton);
                });
            } else {
                // No options - add a "continue" button
                const continueButton = document.createElement('button');
                continueButton.classList.add('dialog-option');
                continueButton.textContent = 'Continue';
                continueButton.addEventListener('click', () => {
                    Game.gameplay.dialog.endDialog();
                });
                dialogOptions.appendChild(continueButton);
            }
        }
        
        // Play voiceline if available
        playDialogAudio(currentNode.audio);
        
        // Emit dialog node event
        Game.engine.events.emit('dialog:node', { 
            nodeId: nodeId, 
            npcId: currentNPC.id 
        });
        
        // Execute any immediate actions
        executeNodeActions(currentNode);
    }
    
    // Apply consequences of a dialog option
    function applyOptionConsequences(option) {
        if (!option.consequences) return;
        
        // Handle different types of consequences
        for (const consequence of option.consequences) {
            switch (consequence.type) {
                case 'quest':
                    // Start or update a quest
                    handleQuestConsequence(consequence);
                    break;
                    
                case 'reputation':
                    // Update faction reputation
                    handleReputationConsequence(consequence);
                    break;
                    
                case 'item':
                    // Give or take items
                    handleItemConsequence(consequence);
                    break;
                    
                case 'custom':
                    // Execute custom JavaScript
                    if (consequence.execute && typeof consequence.execute === 'function') {
                        consequence.execute();
                    }
                    break;
            }
        }
    }
    
    // Execute actions associated with a dialog node
    function executeNodeActions(node) {
        if (!node.actions) return;
        
        // Execute each action
        for (const action of node.actions) {
            switch (action.type) {
                case 'animation':
                    // Play NPC animation
                    if (currentNPC.entity) {
                        playNPCAnimation(action.animation);
                    }
                    break;
                    
                case 'sound':
                    // Play sound effect
                    if (action.sound) {
                        Game.audio.playSound(action.sound);
                    }
                    break;
                    
                case 'custom':
                    // Execute custom JavaScript
                    if (action.execute && typeof action.execute === 'function') {
                        action.execute();
                    }
                    break;
            }
        }
    }
    
    // Play NPC animation
    function playNPCAnimation(animationName) {
        if (!currentNPC || !currentNPC.entity) return;
        
        // Play animation based on name
        switch (animationName) {
            case 'talk':
                currentNPC.entity.setAttribute('animation__talk', {
                    property: 'position',
                    dir: 'alternate',
                    dur: 300,
                    easing: 'easeInOutSine',
                    loop: 3,
                    from: '0 0 0',
                    to: '0 0.05 0'
                });
                break;
                
            case 'nod':
                currentNPC.entity.setAttribute('animation__nod', {
                    property: 'rotation',
                    dir: 'alternate',
                    dur: 500,
                    easing: 'easeInOutSine',
                    loop: 2,
                    from: '0 0 0',
                    to: '-10 0 0'
                });
                break;
                
            case 'shake':
                currentNPC.entity.setAttribute('animation__shake', {
                    property: 'rotation',
                    dir: 'alternate',
                    dur: 300,
                    easing: 'easeInOutSine',
                    loop: 2,
                    from: '0 0 0',
                    to: '0 15 0'
                });
                break;
        }
    }
    
    // Play dialog audio
    function playDialogAudio(audioId) {
        if (!audioId) return;
        
        // If we have vocal audio for this line, play it
        if (Game.audio && Game.audio.playSound) {
            Game.audio.playSound(audioId, { volume: 0.8 });
        }
    }
    
    // Handler for quest-related consequences
    function handleQuestConsequence(consequence) {
        if (!consequence.questId) return;
        
        switch (consequence.action) {
            case 'start':
                if (Game.gameplay.quests) {
                    Game.gameplay.quests.startQuest(consequence.questId);
                }
                break;
                
            case 'complete':
                if (Game.gameplay.quests) {
                    Game.gameplay.quests.completeQuest(consequence.questId);
                }
                break;
                
            case 'fail':
                if (Game.gameplay.quests) {
                    Game.gameplay.quests.failQuest(consequence.questId);
                }
                break;
                
            case 'update':
                if (Game.gameplay.quests) {
                    Game.gameplay.quests.updateQuestObjective(consequence.questId, consequence.objective);
                }
                break;
        }
    }
    
    // Handler for reputation consequences
    function handleReputationConsequence(consequence) {
        const gameState = Game.engine.getState();
        if (!gameState.factions) {
            gameState.factions = {};
        }
        
        // Update faction reputation
        if (consequence.faction) {
            if (!gameState.factions[consequence.faction]) {
                gameState.factions[consequence.faction] = {
                    reputation: 0
                };
            }
            
            // Apply reputation change
            gameState.factions[consequence.faction].reputation += consequence.value || 0;
            
            // Update state
            Game.engine.setState(gameState);
            
            // Notify player of significant reputation changes
            if (Math.abs(consequence.value) >= 5) {
                const direction = consequence.value > 0 ? 'increased' : 'decreased';
                Game.engine.ui.showNotification(`Your reputation with ${consequence.faction} has ${direction}.`, 'reputation');
            }
        }
    }
    
    // Handler for item consequences
    function handleItemConsequence(consequence) {
        if (!consequence.itemId) return;
        
        switch (consequence.action) {
            case 'give':
                if (Game.gameplay.inventory) {
                    // Create item if amount specified, otherwise assume 1
                    const item = Game.gameplay.loot.generateItem(consequence.itemId, consequence.quality || 'common', consequence.level || 1);
                    const amount = consequence.amount || 1;
                    
                    // Add to inventory
                    for (let i = 0; i < amount; i++) {
                        Game.gameplay.inventory.addItem(item);
                    }
                    
                    // Notify player
                    Game.engine.ui.showNotification(`Received: ${item.name} x${amount}`, 'item');
                }
                break;
                
            case 'take':
                if (Game.gameplay.inventory) {
                    const amount = consequence.amount || 1;
                    Game.gameplay.inventory.removeItemById(consequence.itemId, amount);
                    
                    // Notify player
                    Game.engine.ui.showNotification(`Lost: ${consequence.itemId} x${amount}`, 'item');
                }
                break;
        }
    }
    
    // Check if dialog is currently open
    function isDialogOpen() {
        return dialogContainer && !dialogContainer.classList.contains('hidden');
    }
    
    // Pause player movement during dialog
    function pausePlayerMovement() {
        const rig = document.getElementById('rig');
        if (rig) {
            rig.setAttribute('movement-controls', 'enabled', false);
        }
    }
    
    // Resume player movement after dialog
    function resumePlayerMovement() {
        const rig = document.getElementById('rig');
        if (rig) {
            rig.setAttribute('movement-controls', 'enabled', true);
        }
    }
})();
