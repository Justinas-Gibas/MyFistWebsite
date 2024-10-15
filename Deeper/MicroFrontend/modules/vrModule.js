// modules/vrModule.js

import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing VR Module...');

    // Simulate loading a VR library (e.g., Three.js)
    // In a real application, you would import and set up the VR environment here

    // Update the store to indicate the VR module is loaded
    store.update((prevState) => ({
        ...prevState,
        moduleStatus: {
            ...prevState.moduleStatus,
            vrModule: 'loaded',
        },
    }));

    // Emit an event indicating the VR module has been initialized
    eventBus.emit('MODULE_LOADED', { moduleName: 'vrModule' });

    // Optionally, update the UI to reflect that the VR module is active
    const appDiv = document.getElementById('app');
    const vrDiv = document.createElement('div');
    vrDiv.innerHTML = `
        <h2>VR Module</h2>
        <p>Virtual Reality features are now enabled.</p>
    `;
    appDiv.appendChild(vrDiv);

    console.log('VR Module Initialized.');
}
