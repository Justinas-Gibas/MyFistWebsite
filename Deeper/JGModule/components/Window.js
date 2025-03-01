import { Draggable } from '../core/Draggable.js';
import { EventBus } from '../core/EventBus.js';

export class Window {
    constructor({ title = 'Window', width = 400, height = 300, content = '', closeable = true }) {
        this.element = document.createElement('div');
        this.titleBar = document.createElement('div');
        this.content = document.createElement('div');
        this.closeable = closeable;
        
        this.init(title, width, height, content);
        this.applyStyles();
        Draggable.enableDrag(this.element, this.titleBar);
        this.setupResizing();
        this.setupMoveTracking();
    }

    init(title, width, height, content) {
        this.element.className = 'window';
        this.element.style.width = `${width}px`;
        this.element.style.height = `${height}px`;

        this.titleBar.className = 'window-titlebar';
        this.titleBar.innerHTML = `
            <span>${title}</span>
            ${this.closeable ? '<button class="window-close">×</button>' : ''}
        `;

        this.content.className = 'window-content';
        this.content.innerHTML = content;

        this.element.appendChild(this.titleBar);
        this.element.appendChild(this.content);

        if (this.closeable) {
            this.titleBar.querySelector('.window-close').onclick = () => this.close();
        }
    }

    applyStyles() {
        Object.assign(this.element.style, {
            position: 'absolute',
            border: '1px solid #ccc',
            borderRadius: '4px',
            backgroundColor: '#fff',
            boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
            overflow: 'hidden'
        });

        Object.assign(this.titleBar.style, {
            padding: '8px',
            backgroundColor: '#f0f0f0',
            borderBottom: '1px solid #ccc',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
        });

        Object.assign(this.content.style, {
            padding: '10px',
            height: 'calc(100% - 37px)',
            overflow: 'auto'
        });
    }

    setupResizing() {
        const resizer = document.createElement('div');
        resizer.className = 'window-resizer';
        Object.assign(resizer.style, {
            position: 'absolute',
            bottom: '0',
            right: '0',
            width: '15px',
            height: '15px',
            cursor: 'se-resize',
            backgroundColor: '#f0f0f0'
        });

        let startX, startY, startWidth, startHeight;

        const initResize = (e) => {
            startX = e.clientX;
            startY = e.clientY;
            startWidth = this.element.offsetWidth;
            startHeight = this.element.offsetHeight;
            document.addEventListener('mousemove', resize);
            document.addEventListener('mouseup', stopResize);
        };

        const resize = (e) => {
            const width = startWidth + (e.clientX - startX);
            const height = startHeight + (e.clientY - startY);
            this.element.style.width = `${width}px`;
            this.element.style.height = `${height}px`;
            EventBus.emit('window.resized', this);
        };

        const stopResize = () => {
            document.removeEventListener('mousemove', resize);
            document.removeEventListener('mouseup', stopResize);
        };

        resizer.addEventListener('mousedown', initResize);
        this.element.appendChild(resizer);
    }

    setupMoveTracking() {
        let lastX = 0, lastY = 0;
        const checkMovement = () => {
            const currentX = this.element.offsetLeft;
            const currentY = this.element.offsetTop;
            if (currentX !== lastX || currentY !== lastY) {
                lastX = currentX;
                lastY = currentY;
                EventBus.emit('window.moved', this);
            }
        };
        this.element.addEventListener('mousedown', () => {
            const interval = setInterval(checkMovement, 100);
            document.addEventListener('mouseup', () => clearInterval(interval), { once: true });
        });
    }

    mount(parent) {
        parent.appendChild(this.element);
        EventBus.emit('window.mounted', this);
    }

    close() {
        this.element.remove();
        EventBus.emit('window.closed', this);
    }
}
