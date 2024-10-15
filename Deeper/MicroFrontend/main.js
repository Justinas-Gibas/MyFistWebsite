import { loadUserProfile } from './userProfile.js';
import { ModuleLoader } from './moduleLoader.js';
import { store } from './store.js';
import { environmentManager } from './EnvironmentManager.js';

async function bootstrap() {
    // Detect the environment (web, VR, AR, etc.)
    const environment = EnvironmentManager.detectEnvironment();

    // Load environment-specific modules
    await loadenvironmentModules(environment);

    // Load user preferences
    const userProfile = await loadUserProfile();

    // Dispatch action to set user preferences
    store.dispatch({ type: 'SET_PREFERENCES', payload: userProfile });

    // Get updated preferences from the store
    const state = store.getState();
    const preferences = state.userPreferences;

    // Load modules based on user preferences
    await loadPreferenceModules(preferences);
}

// Function to load environment-specific modules
async function loadEnvironmentModules(environment) {
    const moduleLoader = new ModuleLoader();

    if (environment === 'VR') {
        await moduleLoader.load('vrModule');
        await moduleLoader.load('threeJSModule');  // Since VR typically requires Three.js
    } else if (environment === 'WEB') {
        await moduleLoader.load('base');  // The base module or any web-specific modules
    }
    // Handle other environments (e.g., AR) if needed
}

// Function to load modules based on user preferences
async function loadPreferenceModules(preferences) {
    const moduleLoader = new ModuleLoader();

    if (preferences.wantsVRModule) {
        await moduleLoader.load('vrModule');
    }

    if (preferences.needsAdvancedPhysics) {
        await moduleLoader.load('physicsModule');
    }

    if (preferences.enableAnalytics) {
        await moduleLoader.load('analyticsModule');
    }

    if (preferences.enableThreeJS) {
        await moduleLoader.load('threeJSModule');
    }
}

bootstrap();
