// webModule.js
import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing Web Module...');

    // Listen for web-specific text rendering
    eventBus.on('RENDER_TEXT_IN_WEB', (text) => {
        console.log('Web module rendering text:', text);
        // The UI module will handle the actual display
    });

    // Handle web-specific functionality
    eventBus.on('WEB_FEATURE_REQUEST', (feature) => {
        console.log('Web feature requested:', feature);
        eventBus.emit('WEB_FEATURE_LOADED', { feature, status: 'loaded' });
    });

    // Notify that web module is ready
    eventBus.emit('MODULE_LOADED', { moduleName: 'webModule' });
    store.dispatch({ type: 'MODULE_LOADED', payload: { moduleName: 'webModule' } });
}
