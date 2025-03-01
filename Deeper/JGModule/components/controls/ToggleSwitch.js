import { EventBus } from '../../core/EventBus.js';

export class ToggleSwitch {
    constructor({ label, initialState = false }) {
        this.element = document.createElement('div');
        this.state = initialState;
        this.init(label);
    }

    init(label) {
        this.element.className = 'toggle-switch';
        this.element.innerHTML = `
            <label>
                ${label}
                <div class="switch">
                    <input type="checkbox" ${this.state ? 'checked' : ''}>
                    <span class="slider"></span>
                </div>
            </label>
        `;

        const checkbox = this.element.querySelector('input');
        checkbox.addEventListener('change', (e) => {
            this.state = e.target.checked;
            EventBus.emit('toggle.change', { state: this.state, toggle: this });
        });

        this.applyStyles();
    }

    applyStyles() {
        // Add styles here
    }

    mount(parent) {
        parent.appendChild(this.element);
    }
}
