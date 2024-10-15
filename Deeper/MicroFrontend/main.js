// main.js

import { loadUserProfile } from './userProfile.js';
import { ModuleLoader } from './moduleLoader.js';
import { store } from './store.js';
import { environmentManager } from './EnvironmentManager.js';

async function bootstrap() {
    // Load user preferences
    const userProfile = await loadUserProfile();

    // Dispatch action to set user preferences
    store.dispatch({ type: 'SET_PREFERENCES', payload: userProfile });

    // Create the module loader
    const moduleLoader = new ModuleLoader();

    // Load the base module
    await moduleLoader.load('base');

    // Get updated preferences from the store
    const state = store.getState();
    const preferences = state.userPreferences;

    // Load modules based on preferences
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

    moduleLoader.initializeUI();
}

bootstrap();
