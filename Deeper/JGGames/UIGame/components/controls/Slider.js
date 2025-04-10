import { EventBus } from '../../core/EventBus.js';

export class Slider {
    constructor({ label, min = 0, max = 100, value = 50, color = '#4CAF50' }) {
        this.element = document.createElement('div');
        this.value = value;
        this.init(label, min, max, value, color);
    }

    init(label, min, max, value, color) {
        this.element.className = 'slider-container';
        this.element.innerHTML = `
            <label>${label}: <span>${value}</span></label>
            <input type="range" min="${min}" max="${max}" value="${value}">
        `;

        const input = this.element.querySelector('input');
        const valueDisplay = this.element.querySelector('span');

        input.addEventListener('input', (e) => {
            this.value = e.target.value;
            valueDisplay.textContent = this.value;
            EventBus.emit('slider.change', { value: this.value, slider: this });
        });

        this.applyStyles(color);
    }

    applyStyles(color) {
        Object.assign(this.element.style, {
            margin: '10px 0',
            padding: '5px',
            fontFamily: 'Arial, sans-serif'
        });

        const input = this.element.querySelector('input');
        input.style.width = '100%';
        input.style.accentColor = color;
    }

    mount(parent) {
        parent.appendChild(this.element);
    }
}
