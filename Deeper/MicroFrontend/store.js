// store.js

class Store {
    constructor(initialState = {}) {
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
        // Return an unsubscribe function
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    // Dispatch an action to update the state
    dispatch(action) {
        // Use a reducer to get the new state
        this.state = this.reducer(this.state, action);
        // Notify all listeners
        this.listeners.forEach((listener) => listener());
    }

    // Reducer function to handle state updates
    reducer(state, action) {
        switch (action.type) {
            case 'SET_PREFERENCES':
                return {
                    ...state,
                    userPreferences: {
                        ...state.userPreferences,
                        ...action.payload,
                    },
                };
            case 'MODULE_LOADED':
                return {
                    ...state,
                    moduleStatus: {
                        ...state.moduleStatus,
                        [action.payload.moduleName]: 'loaded',
                    },
                };
            case 'SET_ENVIRONMENT':
                return {
                    ...state,
                    environment: action.payload.environment,
                };
            // Add more cases as needed
            default:
                return state;
        }
    }
}

// Initialize and export the store with initial state
export const store = new Store({
    userPreferences: {},
    moduleStatus: {},
    environment: 'web',  // default state for environment
});
