// main.js

// Import the user profile loader and module loader
import { loadUserProfile } from './userProfile.js';
import { ModuleLoader } from './moduleLoader.js';

// Bootstrap function to start the application
async function bootstrap() {
    // Load user preferences (could be from an API or localStorage)
    const userProfile = await loadUserProfile();

    // Initialize the module loader with the user profile
    const moduleLoader = new ModuleLoader(userProfile);

    // Load the base module (essential for all users)
    await moduleLoader.load('base');

    // Load modules based on user preferences
    if (userProfile.wantsVRModule) {
        await moduleLoader.load('vrModule');
    }

    if (userProfile.needsAdvancedPhysics) {
        await moduleLoader.load('physicsModule');
    }

    // Example: Load an analytics module
    if (userProfile.enableAnalytics) {
        await moduleLoader.load('analyticsModule');
    }

    // Initialize the UI or any final setup
    moduleLoader.initializeUI();
}

// Start the application
bootstrap();
