// webModule.js
import { eventBus } from '../eventBus.js';

export async function init() {
    console.log('Initializing Web Module...');

    eventBus.on('RENDER_TEXT_HTML', (text) => {
        const appDiv = document.getElementById('app');
        const vrDiv = document.createElement('div');
        vrDiv.innerHTML = `
            <h2>VR Module</h2>
            <p>${text}</p>
        `;
        appDiv.appendChild(vrDiv);
    });    
}
