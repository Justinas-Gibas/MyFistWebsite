// Import the module loader class
import { loadUserProfile } from './modules/userProfile.js';
import { ModuleLoader } from './modules/moduleLoader.js';

// Bootstrap function to start loading micro frontends
async function bootstrap() {
    // Load user profile to determine which modules to load
    const userProfile = await loadUserProfile();

    // Create an instance of ModuleLoader to handle dynamic loading of micro frontends
    const moduleLoader = new ModuleLoader(userProfile);

    // Load essential base modules
    await moduleLoader.load('base');

    // Load additional modules based on user preferences
    if (userProfile.wantsVRModule) {
        await moduleLoader.load('vrModule');
    }

    if (userProfile.needsAdvancedPhysics) {
        await moduleLoader.load('physicsModule');
    }

    // Initialize the user interface for interaction
    moduleLoader.initializeUI();
}

// Execute bootstrap function to kickstart the app
bootstrap();
