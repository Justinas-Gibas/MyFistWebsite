export class ModuleLoader {
    constructor(userProfile) {
        this.userProfile = userProfile;
        this.modules = {
            base: './microfrontends/base.js',
            vrModule: './microfrontends/vrModule.js',
            physicsModule: './microfrontends/physicsModule.js',
        };
    }

    async load(moduleName) {
        if (this.modules[moduleName]) {
            try {
                const module = await import(this.modules[moduleName]);
                module.init();
                console.log(`${moduleName} loaded successfully.`);
            } catch (err) {
                console.error(`Failed to load ${moduleName}:`, err);
            }
        }
    }

    initializeUI() {
        // Placeholder for initializing any UI elements after loading modules
        console.log('Initializing User Interface...');
    }
}
