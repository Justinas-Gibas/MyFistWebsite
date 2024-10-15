// store.js
class Store {
    constructor(initialState = {}) {
        this.state = initialState;
        this.listeners = [];
    }

    getState() {
        return this.state;
    }

    subscribe(listener) {
        this.listeners.push(listener);
        return () => {
            this.listeners = this.listeners.filter((l) => l !== listener);
        };
    }

    dispatch(action) {
        this.state = this.reducer(this.state, action);
        this.listeners.forEach(listener => listener());
    }

    reducer(state, action) {
        switch (action.type) {
            case 'SET_PREFERENCES':
                return { ...state, userPreferences: { ...state.userPreferences, ...action.payload }};
            case 'MODULE_LOADED':
                return { ...state, moduleStatus: { ...state.moduleStatus, [action.payload.moduleName]: 'loaded' }};
            default:
                return state;
        }
    }
}

export const store = new Store({ userPreferences: {}, moduleStatus: {} });
