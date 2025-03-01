import { Window } from '../components/Window.js';
import { Button } from '../components/Button.js';
import { Slider } from '../components/controls/Slider.js';
import { ToggleSwitch } from '../components/controls/ToggleSwitch.js';
import { EventBus } from '../core/EventBus.js';

export class UIManager {
    constructor() {
        this.windows = new Set();
        this.setupUI();
    }

    setupUI() {
        const app = document.getElementById('app');
        
        // Create control panel
        const controlPanel = document.createElement('div');
        Object.assign(controlPanel.style, {
            position: 'fixed',
            bottom: '20px',
            left: '50%',
            transform: 'translateX(-50%)',
            display: 'flex',
            gap: '10px',
            padding: '10px',
            backgroundColor: 'rgba(255, 255, 255, 0.9)',
            borderRadius: '8px',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)'
        });

        // Add window creation button
        const createWindowBtn = new Button('New Window', () => this.createRandomWindow());
        createWindowBtn.mount(controlPanel);

        app.appendChild(controlPanel);
    }

    createRandomWindow() {
        const window = new Window({
            title: 'Control Window',
            width: 300,
            height: 400,
            content: this.generateWindowContent()
        });

        const x = Math.random() * (document.documentElement.clientWidth - 300);
        const y = Math.random() * (document.documentElement.clientHeight - 400);
        window.element.style.left = `${x}px`;
        window.element.style.top = `${y}px`;

        window.mount(document.getElementById('app'));
        this.windows.add(window);
    }

    generateWindowContent() {
        const content = document.createElement('div');
        
        // Add a slider
        const slider = new Slider({
            label: 'Opacity',
            min: 20,
            max: 100,
            value: 100
        });
        slider.mount(content);

        // Add a toggle switch
        const toggle = new ToggleSwitch({
            label: 'Dark Mode'
        });
        toggle.mount(content);

        return content.innerHTML;
    }
}
