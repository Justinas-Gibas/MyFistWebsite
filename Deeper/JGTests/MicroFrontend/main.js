import { environmentManager } from './EnvironmentManager.js';
import { loadUserProfile } from './userProfile.js';
import { ModuleLoader } from './moduleLoader.js';
import { store } from './store.js';

async function bootstrap() {
    // Detect the environment (web, VR, AR, etc.)
    const environment = environmentManager.detectEnvironment();

    // Load environment-specific modules
    await loadEnvironmentModules(environment);

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

    if (environment === 'vr') {
        await moduleLoader.load('vrModule');
        await moduleLoader.load('threeJSModule');
    } else if (environment === 'web') {
        await moduleLoader.load('base');  // The base module or any web-specific modules
    }
    // Handle other environments (e.g., AR) if needed
}

// Placeholder function for user preferences handling
async function loadPreferenceModules(preferences) {

    // Currently no preference-based modules are being loaded.
    if (preferences.needsAdvancedPhysics) {
        await moduleLoader.load('physicsModule');
    }

    if (preferences.enableAnalytics) {
        await moduleLoader.load('analyticsModule');
    }
    
    // Add logic here if preferences-based modules need to be loaded in the future.
    console.log('No user preferences loaded for now.');
}

bootstrap();
