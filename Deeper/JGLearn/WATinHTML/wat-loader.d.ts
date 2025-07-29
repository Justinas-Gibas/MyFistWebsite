declare global {
  interface HTMLElementTagNameMap {
    'wat-module': WATModuleElement;
  }
}

interface WATModuleElement extends HTMLElement {
  name: string;
  'data-loaded'?: string;
  'data-error'?: string;
  addEventListener(type: 'wat-loaded', listener: (event: CustomEvent) => void): void;
  addEventListener(type: 'wat-error', listener: (event: CustomEvent<{error: string}>) => void): void;
}

interface WATLoader {
  /**
   * Call a function from a compiled WAT module
   * @param moduleName - Name of the WAT module
   * @param functionName - Name of the exported function
   * @param args - Array of arguments to pass to the function
   * @returns Promise that resolves to the function result
   */
  call(moduleName: string, functionName: string, args?: any[]): Promise<any>;
  
  /**
   * Programmatically add a WAT module
   * @param name - Unique name for the module
   * @param watCode - WAT source code
   * @returns Promise that resolves when module is compiled
   */
  addModule(name: string, watCode: string): Promise<void>;
  
  /**
   * Get direct access to a WebAssembly instance
   * @param moduleName - Name of the module
   * @returns WebAssembly instance or undefined if not found
   */
  getModule(moduleName: string): WebAssembly.Instance | undefined;
  
  /**
   * List all available module names
   * @returns Array of module names
   */
  getModules(): string[];
}

declare const WATLoader: WATLoader;

export = WATLoader;
export as namespace WATLoader;
