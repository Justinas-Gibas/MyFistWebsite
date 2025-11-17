// modules/base.js

// Import the event bus and store
import { eventBus } from '../eventBus.js';
import { store } from '../store.js';

export async function init() {
    console.log('Initializing Base Module...');

    // Base module provides core functionality
    // The UI module will handle the actual DOM structure
    
    // Set up core event listeners
    eventBus.on('SYSTEM_READY', () => {
        console.log('Base module: System is ready');
    });

    // Provide base utilities
    window.baseUtils = {
        formatDate: (date) => new Date(date).toLocaleString(),
        generateId: () => Math.random().toString(36).substr(2, 9),
        debounce: (func, wait) => {
            let timeout;
            return function executedFunction(...args) {
                const later = () => {
                    clearTimeout(timeout);
                    func(...args);
                };
                clearTimeout(timeout);
                timeout = setTimeout(later, wait);
            };
        }
    };

    // Update the store to indicate the base module is loaded
    store.dispatch({
        type: 'MODULE_LOADED',
        payload: {
            moduleName: 'base'
        }
    });

    // Emit an event indicating the base module has been initialized
    eventBus.emit('MODULE_LOADED', { moduleName: 'base' });

    console.log('Base Module Initialized with utilities.');
}
