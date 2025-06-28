import { environmentManager } from '../EnvironmentManager.js';  // To detect environment
import { eventBus } from '../eventBus.js';  // For event-driven communication
import { ModuleLoader } from '../moduleLoader.js';  // To load the Three.js module

export async function init() {
    console.log('Initializing VR Module...');

    // Detect the environment
    const environment = environmentManager.getEnvironment();

    // Initialize the module loader
    const moduleLoader = new ModuleLoader();

    // Check if we are in a VR environment
    if (environment === 'vr') {
        console.log('Detected VR environment.');
        
        // Check if WebXR is supported
        if (navigator.xr) {
            console.log('WebXR is supported.');

            // Dynamically load the Three.js module
            await moduleLoader.load('threeJSModule');
        } else {
            console.warn('WebXR is not supported in this browser.');
        }

        // Update the UI to reflect that the VR module is active (or transfer this to the 3D scene)
        // Emit event to dynamically render text
        eventBus.emit('RENDER_TEXT', 'Virtual Reality features are now enabled.');

    } else if (environment === 'web') {
        // If in a web environment, load web-specific modules (e.g., base module)
        console.log('Detected Web environment.');
        await moduleLoader.load('base');  // Loading base module
    }

    // Placeholder for user preferences if needed in the future
    await loadUserPreferencesPlaceholder();

    console.log('VR Module Initialized.');
}

// Placeholder function to handle user preferences logic (can be filled in later)
async function loadUserPreferencesPlaceholder() {
    console.log('No user preferences to load at the moment.');
    // If needed, you could add logic here to check and load modules based on user preferences in the future.
}
