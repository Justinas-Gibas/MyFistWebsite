// moduleLoader.js
import { eventBus } from './eventBus.js';
import { store } from './store.js';

export class ModuleLoader {
    constructor() {
        this.modules = {
            vrModule: './modules/vrModule.js',
            threeJSModule: './modules/threeJSModule.js',
            webModule: './modules/webModule.js',
            textModule: './modules/textModule.js',
            physicsModule: './modules/physicsModule.js',
            // Additional modules
        };
        this.loadedModules = {};
    }

    async load(moduleName) {
        if (this.modules[moduleName]) {
            const module = await import(this.modules[moduleName]);
            await module.init();
            this.loadedModules[moduleName] = module;

            store.dispatch({ type: 'MODULE_LOADED', payload: { moduleName } });
            eventBus.emit('MODULE_LOADED', { moduleName });
        }
    }

    initializeUI() {
        console.log('Initializing User Interface...');
    }
}
