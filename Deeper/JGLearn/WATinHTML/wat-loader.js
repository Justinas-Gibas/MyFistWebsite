/**
 * WAT-Loader - Minimal WAT integration for HTML/CSS/JS stack
 * Treats WebAssembly Text (WAT) as a first-class citizen alongside HTML/CSS/JS
 * 
 * Usage:
 *   <script src="wat-loader.js"></script>
 *   <wat-module name="myModule">
 *     (module
 *       (func $add (param i32 i32) (result i32)
 *         local.get 0 local.get 1 i32.add)
 *       (export "add" (func $add)))
 *   </wat-module>
 *   
 *   // In JavaScript:
 *   const result = await WATLoader.call('myModule', 'add', [5, 3]); // returns 8
 */

class WATLoader {
  static wabtInstance = null;
  static modules = new Map();
  static isLoading = false;
  static loadPromise = null;

  // Initialize the WAT loader
  static async init() {
    if (this.wabtInstance) return this.wabtInstance;
    if (this.isLoading) return this.loadPromise;
    
    this.isLoading = true;
    this.loadPromise = this._loadWabt();
    
    try {
      this.wabtInstance = await this.loadPromise;
      this._processWATElements();
      return this.wabtInstance;
    } finally {
      this.isLoading = false;
    }
  }

  // Load wabt.js library
  static async _loadWabt() {
    // Try multiple CDN sources for reliability
    const cdnSources = [
      'https://cdn.jsdelivr.net/npm/wabt@1.0.37/index.min.js',
      'https://unpkg.com/wabt@1.0.37/index.js'
    ];

    for (const cdnUrl of cdnSources) {
      try {
        await this._loadScript(cdnUrl);
        
        // Wait for WabtModule to be available
        let attempts = 0;
        while (attempts < 50 && !window.WabtModule) {
          await this._sleep(100);
          attempts++;
        }
        
        if (window.WabtModule) {
          return await window.WabtModule();
        }
      } catch (error) {
        console.warn(`Failed to load from ${cdnUrl}:`, error);
      }
    }
    
    throw new Error('Failed to load wabt.js from all CDN sources');
  }

  // Load script helper
  static _loadScript(src) {
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = src;
      script.onload = resolve;
      script.onerror = reject;
      document.head.appendChild(script);
    });
  }

  // Sleep helper
  static _sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  // Process all <wat-module> elements
  static _processWATElements() {
    const watElements = document.querySelectorAll('wat-module');
    
    watElements.forEach(async (element) => {
      try {
        const name = element.getAttribute('name');
        const watCode = element.textContent.trim();
        
        if (!name) {
          console.error('wat-module missing name attribute:', element);
          return;
        }
        
        if (!watCode) {
          console.error('wat-module empty:', element);
          return;
        }

        const wasmModule = await this._compileWAT(name, watCode);
        this.modules.set(name, wasmModule);
        
        // Mark as loaded
        element.setAttribute('data-loaded', 'true');
        element.style.display = 'none'; // Hide the element
        
        // Dispatch loaded event
        element.dispatchEvent(new CustomEvent('wat-loaded', { 
          detail: { name, exports: Object.keys(wasmModule.exports) }
        }));
        
      } catch (error) {
        console.error('Failed to compile WAT module:', error);
        element.setAttribute('data-error', error.message);
        element.dispatchEvent(new CustomEvent('wat-error', { 
          detail: { error: error.message }
        }));
      }
    });
  }

  // Compile WAT to WASM
  static async _compileWAT(name, watCode) {
    if (!this.wabtInstance) {
      throw new Error('WAT loader not initialized');
    }

    try {
      const module = this.wabtInstance.parseWat(`${name}.wat`, watCode);
      const binary = module.toBinary({});
      
      const wasmModule = await WebAssembly.compile(binary.buffer);
      const wasmInstance = await WebAssembly.instantiate(wasmModule);
      
      return wasmInstance;
    } catch (error) {
      throw new Error(`Failed to compile WAT module '${name}': ${error.message}`);
    }
  }

  // Call a function from a WAT module
  static async call(moduleName, functionName, args = []) {
    const module = this.modules.get(moduleName);
    if (!module) {
      throw new Error(`WAT module '${moduleName}' not found`);
    }

    const func = module.exports[functionName];
    if (!func) {
      throw new Error(`Function '${functionName}' not found in module '${moduleName}'`);
    }

    return func(...args);
  }

  // Get a reference to a WAT module
  static getModule(moduleName) {
    return this.modules.get(moduleName);
  }

  // Get all available modules
  static getModules() {
    return Array.from(this.modules.keys());
  }

  // Compile and add a WAT module programmatically
  static async addModule(name, watCode) {
    if (!this.wabtInstance) {
      await this.init();
    }
    
    const wasmModule = await this._compileWAT(name, watCode);
    this.modules.set(name, wasmModule);
    return wasmModule;
  }

  // Create a WAT module element programmatically
  static createWATElement(name, watCode) {
    const element = document.createElement('wat-module');
    element.setAttribute('name', name);
    element.textContent = watCode;
    return element;
  }
}

// Auto-initialize when DOM is ready
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', () => WATLoader.init());
} else {
  WATLoader.init();
}

// Export for use in modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = WATLoader;
}

// Global access
window.WATLoader = WATLoader;
