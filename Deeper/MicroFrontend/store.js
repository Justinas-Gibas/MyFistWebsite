// store.js

class Store {
    constructor(initialState) {
        // Initialize the state and listeners
        this.state = initialState;
        this.listeners = [];
    }

    // Get the current state
    getState() {
        return this.state;
    }

    // Subscribe to state changes
    subscribe(listener) {
        this.listeners.push(listener);
    }

    // Update the state and notify listeners
    update(updater) {
        // 'updater' is a function that receives the previous state and returns the new state
        this.state = updater(this.state);

        // Notify all listeners about the state change
        this.listeners.forEach((listener) => listener(this.state));
    }
}

// Create and export an instance of the store with initial state
export const store = new Store({
    userPreferences: {},
    moduleStatus: {},
    // Add more global state variables as needed
});
