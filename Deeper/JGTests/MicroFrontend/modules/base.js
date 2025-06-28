// modules/base.js

// Import the event bus and store
import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing Base Module...');

    // Get a reference to the app container
    const appDiv = document.getElementById('app');

    // Set the inner HTML of the app container
    appDiv.innerHTML = `
        <h1>Micro Frontend Modular System Demo</h1>
        <p>Welcome to the modular system demonstration.</p>
        <!-- Add more base content as needed -->
    `;

    // Update the store to indicate the base module is loaded
    store.dispatch({
        type: 'MODULE_LOADED',
        payload: {
            moduleName: 'base'
        }
    });

    // Emit an event indicating the base module has been initialized
    eventBus.emit('MODULE_LOADED', { moduleName: 'base' });

    console.log('Base Module Initialized.');
}
