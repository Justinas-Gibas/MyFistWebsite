/**
 * Card-related functionality for Blackjack game
 */
class Card {
    constructor(suit, value) {
        this.suit = suit;
        this.value = value;
        this.faceDown = false;
        this.element = null;
        this.position = { x: 0, y: 0 };
        this.rotation = 0;
        this.inDeck = true;
        this.id = `card_${suit}_${value}_${Date.now()}_${Math.floor(Math.random() * 1000)}`;
    }
    
    getHTML() {
        if (this.element) return this.element;
        
        const cardDiv = document.createElement('div');
        cardDiv.classList.add('card');
        cardDiv.id = this.id;
        
        if (this.faceDown) {
            cardDiv.classList.add('face-down');
        } else {
            // Add suit and value classes for styling
            cardDiv.classList.add(`suit-${this.suit.toLowerCase()}`);
            
            const valueDiv = document.createElement('div');
            valueDiv.classList.add('value');
            valueDiv.textContent = this.getDisplayValue();
            
            const suitDiv = document.createElement('div');
            suitDiv.classList.add('suit');
            suitDiv.textContent = this.getSuitSymbol();
            
            cardDiv.appendChild(valueDiv);
            cardDiv.appendChild(suitDiv);
        }
        
        // Store element reference
        this.element = cardDiv;
        
        return cardDiv;
    }
    
    getDisplayValue() {
        if (this.value === 1) return 'A';
        if (this.value === 11) return 'J';
        if (this.value === 12) return 'Q';
        if (this.value === 13) return 'K';
        return this.value;
    }
    
    getSuitSymbol() {
        switch (this.suit) {
            case 'hearts': return '♥';
            case 'diamonds': return '♦';
            case 'clubs': return '♣';
            case 'spades': return '♠';
        }
    }
    
    getBlackjackValue() {
        if (this.value === 1) return 11; // Ace
        if (this.value >= 10) return 10; // Face cards
        return this.value;
    }
    
    flip(animated = true) {
        if (animated) {
            // Add flip animation class
            this.element.classList.add('card-flipping');
            
            // Wait for animation midpoint to change card appearance
            setTimeout(() => {
                this.faceDown = !this.faceDown;
                if (this.faceDown) {
                    this.element.classList.add('face-down');
                    // Remove any suit/value elements
                    this.element.innerHTML = '';
                } else {
                    this.element.classList.remove('face-down');
                    
                    // Add suit and value back
                    this.element.classList.add(`suit-${this.suit.toLowerCase()}`);
                    
                    const valueDiv = document.createElement('div');
                    valueDiv.classList.add('value');
                    valueDiv.textContent = this.getDisplayValue();
                    
                    const suitDiv = document.createElement('div');
                    suitDiv.classList.add('suit');
                    suitDiv.textContent = this.getSuitSymbol();
                    
                    this.element.appendChild(valueDiv);
                    this.element.appendChild(suitDiv);
                }
            }, 150); // Half of the flip animation duration
            
            // Remove animation class when complete
            setTimeout(() => {
                this.element.classList.remove('card-flipping');
            }, 300);
        } else {
            // Instant flip without animation
            this.faceDown = !this.faceDown;
            if (this.faceDown) {
                this.element.classList.add('face-down');
                this.element.innerHTML = '';
            } else {
                this.element.classList.remove('face-down');
                
                // Add suit and value back
                this.element.classList.add(`suit-${this.suit.toLowerCase()}`);
                
                const valueDiv = document.createElement('div');
                valueDiv.classList.add('value');
                valueDiv.textContent = this.getDisplayValue();
                
                const suitDiv = document.createElement('div');
                suitDiv.classList.add('suit');
                suitDiv.textContent = this.getSuitSymbol();
                
                this.element.appendChild(valueDiv);
                this.element.appendChild(suitDiv);
            }
        }
        
        return this;
    }
    
    // Track card position
    setPosition(x, y, rotation = 0) {
        this.position.x = x;
        this.position.y = y;
        this.rotation = rotation;
        
        if (this.element) {
            this.element.style.left = `${x}px`;
            this.element.style.top = `${y}px`;
            this.element.style.transform = `rotate(${rotation}deg)`;
        }
    }
    
    // Animate the card from one position to another
    animateTo(targetX, targetY, targetRotation = 0, duration = 500) {
        if (!this.element) return Promise.reject('Card element not created');
        
        // Add dealing animation
        this.element.classList.add('card-dealing');
        
        // Update position after animation
        return new Promise(resolve => {
            setTimeout(() => {
                this.setPosition(targetX, targetY, targetRotation);
                this.element.classList.remove('card-dealing');
                resolve();
            }, duration);
        });
    }
    
    removeFromDeck() {
        this.inDeck = false;
    }
}

class Deck {
    constructor() {
        this.reset();
        this.deckElement = document.getElementById('deck-container');
        this.deckCardsElement = document.getElementById('deck-cards');
        this.cardElements = [];
        this.initialized = false;
    }
    
    reset() {
        this.cards = [];
        const suits = ['hearts', 'diamonds', 'clubs', 'spades'];
        
        // Create a standard deck of 52 cards
        for (const suit of suits) {
            for (let value = 1; value <= 13; value++) {
                this.cards.push(new Card(suit, value));
            }
        }
        
        this.shuffle();
    }
    
    // Initialize visible deck with all cards
    initializeVisibleDeck() {
        if (this.initialized) return;
        
        // Clear previous cards
        if (this.deckCardsElement) {
            this.deckCardsElement.innerHTML = '';
        } else {
            this.deckCardsElement = document.createElement('div');
            this.deckCardsElement.id = 'deck-cards';
            this.deckCardsElement.className = 'deck-cards';
            this.deckElement.appendChild(this.deckCardsElement);
        }
        
        // Create visual representation of all cards in the deck
        this.cardElements = [];
        
        this.cards.forEach((card, index) => {
            // Create a visual representation of each card
            const cardDiv = document.createElement('div');
            cardDiv.classList.add('card', 'deck-card', 'face-down');
            cardDiv.dataset.cardIndex = index;
            
            // Position cards in a stack
            const offset = index * 0.1;
            cardDiv.style.left = `${offset}px`;
            cardDiv.style.top = `${offset}px`;
            cardDiv.style.zIndex = index;
            
            this.deckCardsElement.appendChild(cardDiv);
            this.cardElements.push(cardDiv);
        });
        
        // Add count indicator
        const countDiv = document.createElement('div');
        countDiv.classList.add('deck-count');
        countDiv.textContent = this.cards.length;
        this.deckElement.appendChild(countDiv);
        
        this.initialized = true;
        
        // Create a deck shuffle animation
        this.animateShuffleDeck();
    }
    
    // Animate deck shuffling
    animateShuffleDeck() {
        if (!this.cardElements.length) return;
        
        // Apply shuffle animation to each card
        this.cardElements.forEach((cardEl, i) => {
            const delay = i * 10;
            const randomX = (Math.random() - 0.5) * 40;
            const randomY = (Math.random() - 0.5) * 40;
            const randomRotate = (Math.random() - 0.5) * 180;
            
            // Initial random position
            cardEl.style.transition = 'none';
            cardEl.style.transform = `translate(${randomX}px, ${randomY}px) rotate(${randomRotate}deg)`;
            
            // Return to stacked position with delay
            setTimeout(() => {
                cardEl.style.transition = 'all 0.5s ease-out';
                cardEl.style.transform = `translate(${i * 0.1}px, ${i * 0.1}px) rotate(0deg)`;
            }, delay);
        });
    }
    
    shuffle() {
        // Fisher-Yates shuffle algorithm
        for (let i = this.cards.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [this.cards[i], this.cards[j]] = [this.cards[j], this.cards[i]];
        }
        
        // If deck is visually initialized, animate the shuffle
        if (this.initialized) {
            this.animateShuffleDeck();
        }
    }
    
    deal(faceDown = false) {
        if (this.cards.length === 0) {
            this.reset();
        }
        
        const card = this.cards.pop();
        if (faceDown) {
            card.faceDown = true;
        }
        
        // Play card flip sound
        audioController.playCardFlip();
        
        // Update the deck visual - remove a card visually
        if (this.cardElements.length) {
            const cardEl = this.cardElements.pop();
            if (cardEl.parentNode) {
                cardEl.parentNode.removeChild(cardEl);
            }
        }
        
        // Update the count display
        const countDiv = this.deckElement.querySelector('.deck-count');
        if (countDiv) {
            countDiv.textContent = this.cards.length;
        }
        
        return card;
    }
    
    // Deal a card with improved animation to a specific hand
    async dealCardToHand(participant, faceDown = false) {
        // Find the top card in the deck
        const topDeckCardEl = this.cardElements[this.cardElements.length - 1];
        
        if (!topDeckCardEl) {
            console.warn("No visible card in deck to animate");
            return this.fallbackDealCardToHand(participant, faceDown);
        }
        
        // Get position of the top deck card
        const deckCardRect = topDeckCardEl.getBoundingClientRect();
        
        // Deal the card (updates internal state)
        const card = this.deal(faceDown);
        
        // Add card to hand data structure first (before animation)
        participant.hand.push(card);
        
        // Get target element (player or dealer hand)
        const targetElement = participant.element;
        const targetRect = targetElement.getBoundingClientRect();
        
        // Create the card element that will be animated
        const cardElement = card.getHTML();
        
        // Set initial appearance - face down during movement
        cardElement.classList.add('face-down');
        document.body.appendChild(cardElement);
        
        // Position card initially at the deck's top card position
        cardElement.style.position = 'absolute';
        cardElement.style.zIndex = '100';
        cardElement.style.left = `${deckCardRect.left}px`;
        cardElement.style.top = `${deckCardRect.top}px`;
        cardElement.style.width = `${deckCardRect.width}px`;
        cardElement.style.height = `${deckCardRect.height}px`;
        
        // Hide the top card from the deck
        topDeckCardEl.style.opacity = '0';
        
        // Calculate target position in the hand
        const targetX = targetRect.left + (targetRect.width / 2) - (cardElement.offsetWidth / 2);
        const targetY = targetRect.top + (targetRect.height / 2) - (cardElement.offsetHeight / 2);
        
        // Add slight shadow and tilt during movement
        cardElement.style.boxShadow = '0 5px 15px rgba(0,0,0,0.5)';
        const initialRotation = Math.random() * 10 - 5; // Random slight rotation
        cardElement.style.transform = `rotate(${initialRotation}deg) translateZ(0)`;
        
        // Play card sound at start of animation
        audioController.playCardFlip();
        
        // Move card with animation
        await new Promise(resolve => {
            // Make sure the card is visible initially
            cardElement.style.opacity = '1';
            
            // Set transition for smooth movement - eased acceleration/deceleration
            cardElement.style.transition = 'left 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2), top 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2), transform 0.6s cubic-bezier(0.2, 0.8, 0.2, 1.2)';
            
            // Start the animation after a small delay
            setTimeout(() => {
                cardElement.style.left = `${targetX}px`;
                cardElement.style.top = `${targetY}px`;
                cardElement.style.transform = 'rotate(0deg) translateZ(0)';
                
                // When movement animation is complete, flip if necessary and move to hand
                setTimeout(() => {
                    // Remove from body
                    document.body.removeChild(cardElement);
                    
                    // Add to target hand
                    targetElement.appendChild(cardElement);
                    
                    // Reset positioning now that it's in the container
                    cardElement.style.position = '';
                    cardElement.style.left = '';
                    cardElement.style.top = '';
                    cardElement.style.width = '';
                    cardElement.style.height = '';
                    cardElement.style.zIndex = '';
                    cardElement.style.boxShadow = '';
                    cardElement.style.transition = '';
                    
                    // If the card should be face up, flip it with animation
                    if (!faceDown) {
                        // Set face down first
                        card.faceDown = true;
                        setTimeout(() => {
                            card.flip(true);
                        }, 200);
                    }
                    
                    // Update score
                    participant.calculateScore();
                    
                    // Position cards in an arc
                    ui.updateCardPositions();
                    
                    resolve();
                }, 600); // Match the transition duration
            }, 50);
        });
        
        return card;
    }

    // Fallback method if we can't animate from the deck
    async fallbackDealCardToHand(participant, faceDown = false) {
        const card = this.deal(faceDown);
        
        // Get deck position
        const deckRect = this.deckElement.getBoundingClientRect();
        const targetElement = participant.element;
        const targetRect = targetElement.getBoundingClientRect();
        
        // Create card element and add to DOM first at deck position
        const cardElement = card.getHTML();
        document.body.appendChild(cardElement);
        
        // Position card initially at the deck
        cardElement.style.position = 'absolute';
        cardElement.style.zIndex = '100';
        cardElement.style.left = `${deckRect.left}px`;
        cardElement.style.top = `${deckRect.top}px`;
        
        // Calculate target position (center of the hand)
        const targetX = targetRect.left + (targetRect.width / 2) - (cardElement.offsetWidth / 2);
        const targetY = targetRect.top + (targetRect.height / 2) - (cardElement.offsetHeight / 2);
        
        // Apply initial rotation
        const initialRotation = Math.random() * 10 - 5; // Random slight rotation
        cardElement.style.transform = `rotate(${initialRotation}deg)`;
        
        // Add card to hand data structure
        participant.hand.push(card);
        
        // Move card with animation
        await new Promise(resolve => {
            // Add animation class
            cardElement.classList.add('card-dealing');
            
            // Set transition for smooth movement
            cardElement.style.transition = 'left 0.5s ease-out, top 0.5s ease-out, transform 0.5s ease-out';
            
            // Set target position after a small delay (to ensure transition works)
            setTimeout(() => {
                cardElement.style.left = `${targetX}px`;
                cardElement.style.top = `${targetY}px`;
                cardElement.style.transform = 'rotate(0deg)';
                
                // When animation is complete, move the card to the actual hand
                setTimeout(() => {
                    // Remove from body
                    document.body.removeChild(cardElement);
                    
                    // Add to target hand
                    targetElement.appendChild(cardElement);
                    
                    // Reset positioning now that it's in the container
                    cardElement.style.position = '';
                    cardElement.style.left = '';
                    cardElement.style.top = '';
                    cardElement.style.zIndex = '';
                    cardElement.classList.remove('card-dealing');
                    
                    // Update score
                    participant.calculateScore();
                    
                    // Position cards in an arc
                    ui.updateCardPositions();
                    
                    resolve();
                }, 500);
            }, 10);
        });
        
        return card;
    }

    // Updates the visual representation of the deck
    updateDeckDisplay() {
        // This method is kept for compatibility, but now initialization is done once
        if (!this.initialized) {
            this.initializeVisibleDeck();
        }
        
        // Just update the count
        const countDiv = this.deckElement.querySelector('.deck-count');
        if (countDiv) {
            countDiv.textContent = this.cards.length;
        }
        
        // Refresh the deck visual if cards have been dealt
        this.refreshDeckVisual();
    }
    
    // Refresh the visual appearance of the deck after cards have been dealt
    refreshDeckVisual() {
        // Clean up any hidden cards
        this.cardElements = this.cardElements.filter(cardEl => {
            if (cardEl.style.opacity === '0') {
                if (cardEl.parentNode) {
                    cardEl.parentNode.removeChild(cardEl);
                }
                return false;
            }
            return true;
        });
        
        // Add any missing cards to match the deck count
        const cardsToAdd = this.cards.length - this.cardElements.length;
        if (cardsToAdd > 0) {
            for (let i = 0; i < cardsToAdd; i++) {
                const cardDiv = document.createElement('div');
                cardDiv.classList.add('card', 'deck-card', 'face-down');
                
                // Position cards in a stack
                const offset = this.cardElements.length * 0.1;
                cardDiv.style.left = `${offset}px`;
                cardDiv.style.top = `${offset}px`;
                cardDiv.style.zIndex = this.cardElements.length;
                
                this.deckCardsElement.appendChild(cardDiv);
                this.cardElements.push(cardDiv);
            }
        }
        
        // Update z-index of all cards for proper stacking
        this.cardElements.forEach((card, index) => {
            card.style.zIndex = index;
        });
    }
}

// Create global deck instance
const deck = new Deck();
