export class Button {
    constructor(text, onClick) {
        this.element = document.createElement('button');
        this.element.textContent = text;
        this.element.onclick = onClick;
        this.applyStyles();
    }

    applyStyles() {
        Object.assign(this.element.style, {
            padding: '10px 20px',
            margin: '5px',
            borderRadius: '5px',
            border: '1px solid #ccc',
            backgroundColor: '#f0f0f0',
            cursor: 'pointer'
        });
    }

    mount(parent) {
        parent.appendChild(this.element);
    }
}
