// environmentManager.js
import { store } from './store.js';
import { eventBus } from './eventBus.js';

class EnvironmentManager {
    constructor() {
        this.environment = 'web';  // Default environment
    }

    detectEnvironment() {
        if (navigator.xr) {
            navigator.xr.isSessionSupported('immersive-vr').then((supported) => {
                if (supported) {
                    this.setEnvironment('vr');
                } else if (navigator.xr.isSessionSupported('immersive-ar')) {
                    this.setEnvironment('ar');
                }
            });
        } else {
            this.setEnvironment('web');
        }
    }

    setEnvironment(environment) {
        this.environment = environment;

        // Update the store with the new environment
        store.dispatch({ type: 'SET_ENVIRONMENT', payload: { environment } });

        // Emit an event to notify modules of the environment change
        eventBus.emit('ENVIRONMENT_CHANGED', { environment });
    }

    getEnvironment() {
        return this.environment;
    }
}

export const environmentManager = new EnvironmentManager();
environmentManager.detectEnvironment();  // Initialize environment detection
