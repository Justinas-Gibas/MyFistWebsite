/**
 * UI controller for Blackjack game
 * Handles responsive design and UI updates
 */
class UI {
    constructor() {
        this.messageElement = document.getElementById('game-message');
        this.dealButton = document.getElementById('deal-button');
        this.hitButton = document.getElementById('hit-button');
        this.standButton = document.getElementById('stand-button');
        this.resetBetButton = document.getElementById('reset-button');
        this.infoCard = document.getElementById('info-card');
        
        // Setup responsive design
        this.setupResponsiveDesign();
        
        // Track if we're on mobile
        this.isMobile = window.innerWidth < 768;
    }
    
    setupResponsiveDesign() {
        // Initial setup
        this.resizeGameElements();
        
        // Listen for window resize events
        window.addEventListener('resize', () => {
            // Check if we're switching between mobile/desktop
            const wasMobile = this.isMobile;
            this.isMobile = window.innerWidth < 768;
            
            // If we switched device type, rearrange layout
            if (wasMobile !== this.isMobile) {
                this.updateLayoutForDeviceType();
            }
            
            this.resizeGameElements();
        });
        
        // Initial layout
        this.updateLayoutForDeviceType();
    }
    
    updateLayoutForDeviceType() {
        const deckContainer = document.getElementById('deck-container');
        const gameContainer = document.querySelector('.game-container');
        const controls = document.querySelector('.controls');
        
        if (this.isMobile) {
            // Mobile layout adjustments
            deckContainer.style.top = '50%';
            deckContainer.style.right = '10px';
            
            // Adjust card size for mobile
            document.documentElement.style.setProperty('--card-width', '60px');
            document.documentElement.style.setProperty('--card-height', '84px');
            
            // Adjust bet area for mobile
            const betArea = document.querySelector('.bet-area');
            betArea.style.flexDirection = 'row';
            betArea.style.flexWrap = 'wrap';
            
            // Stack dealer and player areas vertically
            const table = document.querySelector('.table');
            table.style.gap = '10px';
            table.style.height = '280px'; // Reduce table height on mobile
            
            // Smaller controls on mobile
            controls.style.flexWrap = 'wrap';
            controls.style.position = 'relative';
        } else {
            // Desktop layout
            deckContainer.style.top = '50%';
            deckContainer.style.right = '20px';
            deckContainer.style.transform = 'translateY(-50%)';
            
            // Reset card size for desktop
            document.documentElement.style.setProperty('--card-width', '70px');
            document.documentElement.style.setProperty('--card-height', '100px');
            
            // Reset other styles
            const betArea = document.querySelector('.bet-area');
            betArea.style.flexDirection = '';
            betArea.style.flexWrap = '';
            
            // Taller table on desktop with more spacing for cards
            const table = document.querySelector('.table');
            table.style.gap = '40px'; // Increased gap for better spacing
            table.style.height = '270px'; // Control table height for better button visibility
            
            // Ensure controls are prominently visible
            controls.style.flexWrap = '';
            controls.style.position = 'relative';
            controls.style.zIndex = '20';
            controls.style.marginTop = '15px';
            
            // Position dealer and player labels for better visibility
            const dealerLabel = document.querySelector('.dealer-label');
            const playerLabel = document.querySelector('.player-label');
            
            if (dealerLabel) dealerLabel.style.top = '5px';
            if (playerLabel) playerLabel.style.bottom = '5px';
        }
        
        // Initialize info card
        this.initializeInfoCard();
        
        // Fix bottom spacing to ensure controls are visible
        document.getElementById('instructions').style.marginTop = this.isMobile ? '5px' : '10px';
        
        // Add table decorations if they don't exist
        this.addTableDecorations();
    }
    
    initializeInfoCard() {
        // Create/update info card to replace welcome message and instructions
        if (!this.infoCard) {
            this.infoCard = document.createElement('div');
            this.infoCard.id = 'info-card';
            this.infoCard.className = 'info-card';
            
            const gameContainer = document.querySelector('.game-container');
            const table = document.querySelector('.table');
            
            // Insert after table
            table.parentNode.insertBefore(this.infoCard, table.nextSibling);
        }
        
        // Set initial info card content
        this.updateInfoCard("Welcome to Blackjack!", "Place your bet using the chips, then click 'Deal' to begin. Try to get closer to 21 than the dealer without going over.");
        
        // Hide old message and instructions elements
        const oldMessage = document.getElementById('message');
        const oldInstructions = document.getElementById('instructions');
        
        if (oldMessage) oldMessage.style.display = 'none';
        if (oldInstructions) oldInstructions.style.display = 'none';
    }
    
    updateInfoCard(title, details) {
        if (!this.infoCard) return;
        
        // Update info card content
        this.infoCard.innerHTML = `
            <div class="info-title">${title}</div>
            <div class="info-details">${details}</div>
        `;
        
        // Animate the info card
        this.infoCard.animate([
            { opacity: 0.7, transform: 'scale(0.95)' },
            { opacity: 1, transform: 'scale(1)' }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
    }
    
    setMessage(msg) {
        // Update into info card instead of old message element
        this.updateInfoCard("Game Status", msg);
    }
    
    addTableDecorations() {
        if (!document.querySelector('.table-decoration')) {
            const gameContainer = document.querySelector('.game-container');
            
            const suits = [
                { class: 'spade', symbol: '♠', color: 'white' },
                { class: 'heart', symbol: '♥', color: '#e60000' },
                { class: 'diamond', symbol: '♦', color: '#e60000' },
                { class: 'club', symbol: '♣', color: 'white' }
            ];
            
            suits.forEach(suit => {
                const decoration = document.createElement('div');
                decoration.className = `table-decoration ${suit.class}`;
                decoration.textContent = suit.symbol;
                decoration.style.color = suit.color;
                gameContainer.appendChild(decoration);
            });
        }
    }
    
    resizeGameElements() {
        const gameContainer = document.querySelector('.game-container');
        const windowWidth = window.innerWidth;
        const windowHeight = window.innerHeight;
        
        // Base dimensions that we'll scale from
        const baseWidth = this.isMobile ? 400 : 800; 
        const baseHeight = this.isMobile ? 700 : 620; // Increased height on desktop
        
        // Calculate the ideal scale factor
        const scaleX = windowWidth / baseWidth;
        const scaleY = windowHeight / baseHeight;
        const scale = Math.min(scaleX, scaleY, 1.5); // Cap scale at 1.5x to prevent too large elements
        
        // Apply the scale
        gameContainer.style.transform = `scale(${scale})`;
        
        // Adjust container size to maintain aspect ratio
        const scaledWidth = baseWidth * scale;
        const scaledHeight = baseHeight * scale;
        
        // Center the container
        gameContainer.style.position = 'absolute';
        gameContainer.style.left = `${(windowWidth - scaledWidth) / 2}px`;
        gameContainer.style.top = `${(windowHeight - scaledHeight) / 2}px`;
        
        // Ensure the container has the right dimensions for scaling
        gameContainer.style.width = `${baseWidth}px`;
        gameContainer.style.height = `${baseHeight}px`;
        
        // Fix: Ensure controls are always visible by adjusting margins and vertical spacing
        this.adjustVerticalSpacing();
        
        // Adjust cards and other elements based on scale
        this.adjustElementSizes(scale);
        
        // Update card positions if game is in progress
        if (player && player.hand && player.hand.length > 0) {
            this.updateCardPositions();
        }
    }
    
    adjustVerticalSpacing() {
        // Adjust vertical spacing to ensure all elements are visible
        const table = document.querySelector('.table');
        const betContainer = document.querySelector('.bet-container');
        const betArea = document.querySelector('.bet-area');
        const controls = document.querySelector('.controls');
        const instructions = document.getElementById('instructions');
        
        if (this.isMobile) {
            // Compact spacing for mobile
            table.style.marginBottom = '5px';
            betContainer.style.marginTop = '5px';
            betContainer.style.marginBottom = '5px';
            betArea.style.marginTop = '5px';
            betArea.style.marginBottom = '5px';
            betArea.style.paddingTop = '5px';
            betArea.style.paddingBottom = '5px';
            controls.style.marginTop = '5px';
            controls.style.marginBottom = '5px';
            instructions.style.marginTop = '5px';
            instructions.style.padding = '5px';
        } else {
            // Appropriate spacing for desktop
            table.style.marginBottom = '5px';
            betContainer.style.marginTop = '5px';
            betContainer.style.marginBottom = '5px';
            betArea.style.marginTop = '5px';
            betArea.style.marginBottom = '10px';
            betArea.style.paddingTop = '8px';
            betArea.style.paddingBottom = '8px';
            controls.style.marginTop = '10px';
            controls.style.marginBottom = '5px';
            
            // Make buttons more prominent on desktop
            const buttons = controls.querySelectorAll('button');
            buttons.forEach(button => {
                button.style.padding = '10px 20px';
            });
            
            instructions.style.marginTop = '5px';
            instructions.style.padding = '5px';
        }
    }
    
    adjustElementSizes(scale) {
        // Adjust card sizes
        const cardElements = document.querySelectorAll('.card:not(.deck-card)');
        cardElements.forEach(card => {
            // Cards already have a base size in CSS variables, just ensure transitions are smooth
            card.style.transition = 'transform 0.3s ease, top 0.3s ease, left 0.3s ease, opacity 0.3s ease';
        });
        
        // Adjust chip sizes based on mobile/desktop
        const chips = document.querySelectorAll('.chip');
        const chipSize = this.isMobile ? '40px' : '50px';
        chips.forEach(chip => {
            chip.style.width = chipSize;
            chip.style.height = chipSize;
        });
        
        // Adjust font sizes for better readability
        document.documentElement.style.setProperty('--base-font-size', this.isMobile ? '14px' : '16px');
    }
    
    updateCardPositions() {
        // Position player cards in an arc
        if (player.hand.length > 0) {
            const playerHand = document.getElementById('player-hand');
            const cards = playerHand.querySelectorAll('.card');
            this.arrangeCardsInArc(cards, player.hand.length);
        }
        
        // Position dealer cards in an arc
        if (dealer.hand.length > 0) {
            const dealerHand = document.getElementById('dealer-hand');
            const cards = dealerHand.querySelectorAll('.card');
            this.arrangeCardsInArc(cards, dealer.hand.length);
        }
    }
    
    arrangeCardsInArc(cards, totalCards) {
        if (cards.length === 0) return;
        
        const radius = this.isMobile ? 120 : 150; // Reduced radius for desktop
        const arcAngle = Math.min(60, 20 * totalCards); // Narrower arc
        const startAngle = 270 - (arcAngle / 2); // Center the arc
        const verticalOffset = this.isMobile ? -20 : -20; // Move cards up by 20px
        
        cards.forEach((card, index) => {
            // Calculate position on arc
            const angle = startAngle + (arcAngle * index / (totalCards - 1 || 1));
            const radians = angle * Math.PI / 180;
            
            // Calculate position (centered in the hand element)
            const handElement = card.parentElement;
            const handRect = handElement.getBoundingClientRect();
            const cardWidth = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-width'));
            const cardHeight = parseInt(getComputedStyle(document.documentElement).getPropertyValue('--card-height'));
            
            // Position adjustment
            const centerX = (handRect.width / 2) - (cardWidth / 2);
            const bottomY = handRect.height - cardHeight + verticalOffset; // Apply vertical offset
            
            // Calculate position on the arc
            const x = centerX + (radius * Math.cos(radians));
            const y = bottomY - (radius * Math.sin(radians) * 0.25); // Flatter arc
            
            // Apply position
            card.style.position = 'absolute';
            card.style.left = `${x}px`;
            card.style.top = `${y}px`;
            
            // Apply rotation - more subtle rotation
            const rotation = (angle - 270) * 0.5; // Reduced rotation factor
            card.style.transform = `rotate(${rotation}deg)`;
            
            // Add a different z-index to each card so they stack nicely
            card.style.zIndex = index + 5;
        });
    }
    
    enableGameButtons() {
        this.hitButton.disabled = false;
        this.standButton.disabled = false;
        this.resetBetButton.disabled = true;
        this.dealButton.disabled = true;
    }
    
    disableGameButtons() {
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
    }
    
    enableBettingButtons() {
        this.resetBetButton.disabled = false;
        this.dealButton.disabled = player.currentBet <= 0; // Only enable if bet is placed
        this.hitButton.disabled = true;
        this.standButton.disabled = true;
    }
    
    updateGameState() {
        deck.updateDeckDisplay();
        
        // Update card positions
        this.updateCardPositions();
        
        // Check for player bust
        if (player.score > 21) {
            this.handlePlayerBust();
            return;
        }
        
        // Check for dealer bust
        if (dealer.score > 21) {
            this.handleDealerBust();
            return;
        }
        
        // Check for completed game (dealer has played automatically)
        if (dealer.score >= 17 && !this.hitButton.disabled) {
            this.determineWinner();
        }
    }
    
    handlePlayerBust() {
        this.updateInfoCard("Bust! You Lose!", `Your hand went over 21 with a score of ${player.score}.`);
        this.disableGameButtons();
        this.enableBettingButtons();
        audioController.playLose();
        player.lose();
    }
    
    handleDealerBust() {
        this.updateInfoCard("Dealer Busts! You Win!", `Dealer went over 21 with a score of ${dealer.score}.`);
        this.disableGameButtons();
        this.enableBettingButtons();
        audioController.playWin();
        player.win();
    }
    
    determineWinner() {
        this.disableGameButtons();
        this.enableBettingButtons();
        
        // Player has blackjack (21 with first two cards)
        if (player.score === 21 && player.hand.length === 2) {
            if (dealer.score === 21 && dealer.hand.length === 2) {
                // Both have blackjack
                this.updateInfoCard("It's a Push!", "Both you and the dealer have Blackjack!");
                audioController.playTie();
                player.push();
            } else {
                // Player has blackjack, dealer doesn't
                this.updateInfoCard("Blackjack! You Win!", "Your blackjack pays 3:2. Congratulations!");
                audioController.playWin();
                player.blackjack();
            }
        } 
        // Regular comparison
        else if (player.score > dealer.score) {
            this.updateInfoCard("You Win!", `Your score of ${player.score} beats the dealer's ${dealer.score}.`);
            audioController.playWin();
            player.win();
        } else if (player.score < dealer.score) {
            this.updateInfoCard("Dealer Wins", `Dealer's ${dealer.score} beats your ${player.score}.`);
            audioController.playLose();
            player.lose();
        } else {
            this.updateInfoCard("It's a Tie!", `Both you and the dealer have ${player.score}.`);
            audioController.playTie();
            player.push();
        }
    }
}

// Create global UI instance
const ui = new UI();
