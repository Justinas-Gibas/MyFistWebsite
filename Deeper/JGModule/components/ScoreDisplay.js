import { EventBus } from '../core/EventBus.js';

export class ScoreDisplay {
    constructor() {
        this.element = document.createElement('div');
        this.score = 0;
        this.init();
        this.setupListeners();
    }

    init() {
        Object.assign(this.element.style, {
            position: 'fixed',
            top: '10px',
            left: '10px',
            padding: '10px 20px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            fontFamily: 'Arial, sans-serif',
            fontSize: '18px',
            zIndex: 9999
        });

        this.updateDisplay();
    }

    setupListeners() {
        EventBus.subscribe('score.updated', ({ score, reason }) => {
            this.score = score;
            this.updateDisplay(reason);
        });
    }

    updateDisplay(reason = null) {
        this.element.innerHTML = `
            Score: ${this.score}
            ${reason ? `<div style="font-size: 12px; color: #666">+${reason}</div>` : ''}
        `;
    }

    mount(parent) {
        parent.appendChild(this.element);
    }
}
