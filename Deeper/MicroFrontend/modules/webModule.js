// webModule.js
import { eventBus } from './eventBus.js';

export async function init() {
    console.log('Initializing Web Module...');

    eventBus.on('RENDER_TEXT_HTML', (text) => {
        const appDiv = document.getElementById('app');
        const textDiv = document.createElement('div');
        textDiv.innerHTML = `<p>${text}</p>`;
        appDiv.appendChild(textDiv);
    });
}
