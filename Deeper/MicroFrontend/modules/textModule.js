
// textModule.js
import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing Text Module...');

    eventBus.on('RENDER_TEXT', (text) => {
        const state = store.getState();
        const isVR = state.userPreferences.wantsVRModule;

        if (isVR) {
            eventBus.emit('RENDER_TEXT_IN_VR', text);
        } else {
            eventBus.emit('RENDER_TEXT_HTML', text);
        }
    });
}
