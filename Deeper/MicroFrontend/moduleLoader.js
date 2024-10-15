// moduleLoader.js

import { store } from './store.js';

export class ModuleLoader {
    constructor() {
        // Map of module names to their paths
        this.modules = {
            base: './modules/base.js',
            vrModule: './modules/vrModule.js',
            physicsModule: './modules/physicsModule.js',
            analyticsModule: './modules/analyticsModule.js',
            threeJSModule: './modules/threeJSModule.js',
        };

        // Keep track of loaded modules
        this.loadedModules = {};
    }

    async load(moduleName) {
        if (this.modules[moduleName]) {
            try {
                const module = await import(this.modules[moduleName]);
                await module.init();

                // Store the loaded module
                this.loadedModules[moduleName] = module;

                // Dispatch action to update module status
                store.dispatch({
                    type: 'MODULE_LOADED',
                    payload: { moduleName },
                });

                console.log(`Module '${moduleName}' loaded successfully.`);
            } catch (error) {
                console.error(`Failed to load module '${moduleName}':`, error);
            }
        } else {
            console.warn(`Module '${moduleName}' does not exist.`);
        }
    }

    initializeUI() {
        console.log('Initializing User Interface...');
        // Additional UI initialization code if needed
    }
}
