import { Window } from '../components/Window.js';
import { Slider } from '../components/controls/Slider.js';
import { ToggleSwitch } from '../components/controls/ToggleSwitch.js';
import { EventBus } from '../core/EventBus.js';

export class Level2Window extends Window {
    constructor() {
        super({
            title: 'Level 2: Control Panel',
            width: 400,
            height: 500,
            content: '<div class="level2-container"></div>'
        });
        
        this.init();
    }

    init() {
        const container = this.element.querySelector('.level2-container');

        // Create RGB sliders
        this.redSlider = new Slider({ label: 'Red', color: '#ff0000' });
        this.greenSlider = new Slider({ label: 'Green', color: '#00ff00' });
        this.blueSlider = new Slider({ label: 'Blue', color: '#0000ff' });

        // Create theme toggle
        this.themeToggle = new ToggleSwitch({ label: 'Dark Theme' });

        // Mount components
        [this.redSlider, this.greenSlider, this.blueSlider, this.themeToggle]
            .forEach(component => component.mount(container));

        // Add color preview
        this.colorPreview = document.createElement('div');
        Object.assign(this.colorPreview.style, {
            width: '100%',
            height: '50px',
            marginTop: '20px',
            border: '1px solid #ccc'
        });
        container.appendChild(this.colorPreview);

        this.setupEventListeners();
    }

    setupEventListeners() {
        EventBus.subscribe('slider.change', () => this.updateColorPreview());
        EventBus.subscribe('toggle.change', ({ state }) => {
            document.body.style.backgroundColor = state ? '#333' : '#fff';
            document.body.style.color = state ? '#fff' : '#333';
        });
    }

    updateColorPreview() {
        const color = `rgb(${this.redSlider.value}, ${this.greenSlider.value}, ${this.blueSlider.value})`;
        this.colorPreview.style.backgroundColor = color;
    }
}
