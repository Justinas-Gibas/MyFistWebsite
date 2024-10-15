
// textModule.js
import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing Text Module...');

    eventBus.on('RENDER_TEXT', (text) => {
        // Use environmentManager to determine if the environment is VR
        const environment = environmentManager.getEnvironment();
        const isVR = environment === 'vr';  // Use the detected environment
    
        if (isVR) {
            eventBus.emit('RENDER_TEXT_IN_VR', text);
        } else {
            eventBus.emit('RENDER_TEXT_HTML', text);
        }
    });
}
