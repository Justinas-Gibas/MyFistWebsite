import { Button } from './components/Button.js';
import { GameController } from './game/GameController.js';
import { QuestWindow } from './components/QuestWindow.js';
import { EventBus } from './core/EventBus.js';
import { UIManager } from './managers/UIManager.js';
import { ScoreDisplay } from './components/ScoreDisplay.js';

class App {
    constructor() {
        this.container = document.getElementById('app');
        this.gameController = new GameController();
        this.init();
        this.setupEventListeners();
    }

    init() {
        this.createScoreDisplay();
        const createWindowBtn = new Button('Create Window [+10 points]', () => {
            this.createNewWindow();
        });
        createWindowBtn.mount(this.container);
    }

    createScoreDisplay() {
        const scoreDisplay = document.createElement('div');
        Object.assign(scoreDisplay.style, {
            position: 'fixed',
            top: '10px',
            right: '10px',
            padding: '10px',
            backgroundColor: '#f0f0f0',
            border: '1px solid #ccc',
            borderRadius: '5px'
        });
        scoreDisplay.innerHTML = 'Score: 0';
        this.container.appendChild(scoreDisplay);

        EventBus.subscribe('score.updated', ({score, reason}) => {
            scoreDisplay.innerHTML = `Score: ${score}<br><small>${reason}</small>`;
            setTimeout(() => {
                scoreDisplay.innerHTML = `Score: ${score}`;
            }, 1000);
        });

        EventBus.subscribe('achievement.unlocked', (achievement) => {
            const notification = document.createElement('div');
            Object.assign(notification.style, {
                position: 'fixed',
                top: '50px',
                right: '10px',
                padding: '10px',
                backgroundColor: '#4CAF50',
                color: 'white',
                borderRadius: '5px',
                animation: 'fadeIn 0.5s'
            });
            notification.textContent = `Achievement Unlocked: ${achievement}`;
            this.container.appendChild(notification);
            setTimeout(() => notification.remove(), 3000);
        });
    }

    createNewWindow() {
        const window = new Window({
            title: 'Test Window',
            content: 'This is a draggable window!'
        });
        window.mount(this.container);
    }

    setupEventListeners() {
        EventBus.subscribe('window.mounted', (window) => {
            console.log('Window mounted:', window);
        });
    }
}

class Game {
    constructor() {
        this.gameController = new GameController();
        this.uiManager = new UIManager();
        this.init();
    }

    init() {
        const app = document.getElementById('app');
        
        // Initialize score display
        const scoreDisplay = new ScoreDisplay();
        scoreDisplay.mount(app);

        // Initialize quest window
        const questWindow = new QuestWindow();
        questWindow.mount(app);
        questWindow.element.style.right = '10px';
        questWindow.element.style.top = '10px';
    }
}

// Start the game when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new Game();
});
