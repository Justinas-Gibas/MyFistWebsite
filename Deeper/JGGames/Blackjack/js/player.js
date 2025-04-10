/**
 * Player and Dealer classes for Blackjack game
 */
class BlackjackParticipant {
    constructor(type) {
        this.type = type; // "player" or "dealer"
        this.hand = [];
        this.score = 0;
        this.element = document.getElementById(`${type}-hand`);
        this.scoreElement = document.getElementById(`${type}-score`);
    }
    
    reset() {
        this.hand = [];
        this.score = 0;
        this.element.innerHTML = '';
        this.updateScore();
    }
    
    addCard(card) {
        this.hand.push(card);
        this.updateHand();
        this.calculateScore();
    }
    
    updateHand() {
        this.element.innerHTML = '';
        this.hand.forEach(card => {
            this.element.appendChild(card.getHTML());
        });
    }
    
    calculateScore() {
        let score = 0;
        let aces = 0;
        
        // First pass: count all non-ace cards and track aces
        for (const card of this.hand) {
            if (!card.faceDown) {
                const value = card.getBlackjackValue();
                if (value === 11) {
                    aces++;
                } else {
                    score += value;
                }
            }
        }
        
        // Second pass: add aces with optimal values
        for (let i = 0; i < aces; i++) {
            if (score + 11 <= 21) {
                score += 11;
            } else {
                score += 1;
            }
        }
        
        this.score = score;
        this.updateScore();
        return score;
    }
    
    updateScore() {
        this.scoreElement.textContent = `Score: ${this.score}`;
    }
    
    flipAllCards() {
        this.hand.forEach(card => {
            card.faceDown = false;
        });
        this.updateHand();
        this.calculateScore();
    }
}

class Player extends BlackjackParticipant {
    constructor() {
        super('player');
        this.balance = 1000;
        this.currentBet = 0;
        this.balanceElement = document.getElementById('balance');
        this.betElement = document.getElementById('current-bet');
    }
    
    updateBalance() {
        this.balanceElement.textContent = `Balance: $${this.balance}`;
        this.betElement.textContent = `Current Bet: $${this.currentBet}`;
        
        // Highlight changes
        this.balanceElement.animate([
            { color: 'gold' },
            { color: 'white' }
        ], {
            duration: 800
        });
        
        this.betElement.animate([
            { color: 'gold' },
            { color: 'white' }
        ], {
            duration: 800
        });
    }
    
    // Basic methods to integrate with the BettingManager
    win() {
        bettingManager.handleWin();
    }
    
    blackjack() {
        bettingManager.handleBlackjack();
    }
    
    push() {
        bettingManager.handlePush();
    }
    
    lose() {
        bettingManager.handleLoss();
    }
}

class Dealer extends BlackjackParticipant {
    constructor() {
        super('dealer');
    }
    
    async dealInitialCards() {
        // Deal cards in the traditional casino way: one card at a time to each player, alternating
        ui.setMessage("Dealing cards...");
        
        // First card to player face up
        await deck.dealCardToHand(player);
        await new Promise(resolve => setTimeout(resolve, 300)); // Slight pause between deals
        
        // First card to dealer face up
        await deck.dealCardToHand(this);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Second card to player face up
        await deck.dealCardToHand(player);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Second card to dealer face down
        await deck.dealCardToHand(this, true);
        
        // Check for blackjack after all cards are dealt
        await new Promise(resolve => setTimeout(resolve, 500));
        
        if (player.score === 21) {
            ui.setMessage("Blackjack! You got 21!");
        }
    }
    
    revealHiddenCard() {
        if (this.hand.length > 0 && this.hand[1].faceDown) {
            this.hand[1].flip();
            this.calculateScore();
        }
    }
    
    async autoPlay() {
        this.revealHiddenCard();
        
        // Dealer must hit until 17 or higher
        while (this.score < 17) {
            await deck.dealCardToHand(this);
            
            // Add a pause between dealer draws
            await new Promise(resolve => setTimeout(resolve, 800));
            
            // Check if dealer busted
            if (this.score > 21) {
                break;
            }
        }
        
        // Update UI once all cards are dealt
        ui.updateGameState();
    }
}

// Create global player and dealer instances
const player = new Player();
const dealer = new Dealer();
