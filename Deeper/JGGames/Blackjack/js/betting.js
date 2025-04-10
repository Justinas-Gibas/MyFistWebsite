/**
 * Betting-related functionality for Blackjack game
 * Separates betting logic for better organization
 */
class BettingManager {
    constructor(player) {
        this.player = player;
        this.betPlaced = false;
        this.setupChips();
    }
    
    setupChips() {
        const chips = document.querySelectorAll('.chip');
        
        // Add visual feedback for chips
        chips.forEach(chip => {
            // Highlight chip on hover
            chip.addEventListener('mouseenter', () => {
                if (gameInProgress) return;
                chip.style.boxShadow = '0 0 10px 2px gold';
            });
            
            chip.addEventListener('mouseleave', () => {
                chip.style.boxShadow = '';
            });
            
            // Apply pulse animation on click
            chip.addEventListener('click', () => {
                if (gameInProgress) return;
                
                // Add quick pulse animation
                chip.animate([
                    { transform: 'scale(1)' },
                    { transform: 'scale(1.2)' },
                    { transform: 'scale(1)' }
                ], {
                    duration: 300,
                    easing: 'ease-out'
                });
            });
        });
    }
    
    adjustBet(amount) {
        // Validate amount
        if (amount <= 0) {
            ui.setMessage("Invalid bet amount!");
            return false;
        }
        
        // Check if player has enough balance
        if (amount > this.player.balance) {
            ui.setMessage("Not enough balance for that bet!");
            return false;
        }
        
        // Add to current bet
        this.player.currentBet += amount;
        this.player.balance -= amount;
        this.player.updateBalance();
        
        // Play bet sound
        audioController.playBet();
        
        // Visual feedback for the bet
        this.animateBetPlacement();
        
        // Update UI
        ui.enableBettingButtons();
        this.betPlaced = true;
        
        return true;
    }
    
    resetBet() {
        // Return bet to balance
        this.player.balance += this.player.currentBet;
        this.player.currentBet = 0;
        this.player.updateBalance();
        
        // Update UI
        ui.setMessage("Bet reset. Place your bet!");
        ui.dealButton.disabled = true;
        ui.resetBetButton.disabled = true;
        this.betPlaced = false;
        
        // Play sound
        audioController.playCardFlip();
    }
    
    animateBetPlacement() {
        // Animate the current bet display
        const betElement = document.getElementById('current-bet');
        
        betElement.animate([
            { transform: 'scale(1)', opacity: 1 },
            { transform: 'scale(1.2)', opacity: 1 },
            { transform: 'scale(1)', opacity: 1 }
        ], {
            duration: 300,
            easing: 'ease-out'
        });
        
        // Show amount placed
        ui.setMessage(`Bet placed: $${this.player.currentBet}`);
    }
    
    handleWin(multiplier = 2) {
        // Calculate winnings (bet * multiplier)
        const winnings = this.player.currentBet * multiplier;
        
        // Add to balance
        this.player.balance += winnings;
        this.player.currentBet = 0;
        this.player.updateBalance();
        
        // Animate winning
        this.animateWinnings(winnings);
    }
    
    handleBlackjack() {
        // Blackjack pays 3:2
        this.handleWin(2.5);
    }
    
    handlePush() {
        // Return bet
        this.player.balance += this.player.currentBet;
        this.player.currentBet = 0;
        this.player.updateBalance();
    }
    
    handleLoss() {
        // Just clear the bet
        this.player.currentBet = 0;
        this.player.updateBalance();
    }
    
    animateWinnings(amount) {
        // Create floating number to show winnings
        const winDisplay = document.createElement('div');
        winDisplay.classList.add('win-amount');
        winDisplay.textContent = `+$${amount}`;
        
        // Position near the balance
        const balanceElement = document.getElementById('balance');
        const rect = balanceElement.getBoundingClientRect();
        
        winDisplay.style.position = 'absolute';
        winDisplay.style.left = `${rect.left}px`;
        winDisplay.style.top = `${rect.top - 30}px`;
        winDisplay.style.color = 'gold';
        winDisplay.style.fontWeight = 'bold';
        winDisplay.style.fontSize = '24px';
        winDisplay.style.zIndex = '100';
        winDisplay.style.textShadow = '0 0 5px black';
        
        document.body.appendChild(winDisplay);
        
        // Animate floating up and fading out
        winDisplay.animate([
            { transform: 'translateY(0)', opacity: 1 },
            { transform: 'translateY(-50px)', opacity: 0 }
        ], {
            duration: 1500,
            easing: 'ease-out'
        }).onfinish = () => {
            document.body.removeChild(winDisplay);
        };
    }
}
