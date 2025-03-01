import { Window } from '../components/Window.js';
import { EventBus } from '../core/EventBus.js';

export class StartScreen extends Window {
    static styles = {
        startButton: {
            width: '200px',
            height: '200px',
            borderRadius: '50%',
            backgroundColor: '#4CAF50',
            color: 'white',
            border: 'none',
            fontSize: '24px',
            cursor: 'pointer',
            boxShadow: '0 4px 8px rgba(0,0,0,0.2)',
            transition: 'transform 0.2s, box-shadow 0.2s',
            position: 'absolute',
            top: '50%',
            left: '50%',
            transform: 'translate(-50%, -50%)'
        }
    };

    constructor() {
        super({
            title: 'Window Master Game',
            width: '100%',
            height: '100%',
            content: `
                <div class="start-container" style="width: 100%; height: 100%; position: relative;">
                    <button class="start-button">Start Game</button>
                </div>
            `
        });
        
        this.initStartScreen();
    }

    initStartScreen() {
        const startButton = this.element.querySelector('.start-button');
        if (startButton) {
            Object.assign(startButton.style, StartScreen.styles.startButton);
            
            startButton.addEventListener('mouseover', () => {
                startButton.style.transform = 'translate(-50%, -50%) scale(1.1)';
                startButton.style.boxShadow = '0 6px 12px rgba(0,0,0,0.3)';
            });

            startButton.addEventListener('mouseout', () => {
                startButton.style.transform = 'translate(-50%, -50%)';
                startButton.style.boxShadow = '0 4px 8px rgba(0,0,0,0.2)';
            });

            startButton.addEventListener('click', () => {
                EventBus.emit('game.start');
                this.close();
            });
        }
    }
}
