// eventBus.js
class EventBus {
    constructor() {
        this.events = {};
    }

    // Register an event listener
    on(eventName, listener) {
        if (!this.events[eventName]) {
            this.events[eventName] = [];
        }
        this.events[eventName].push(listener);
    }

    // Unregister an event listener
    off(eventName, listener) {
        if (!this.events[eventName]) return;
        this.events[eventName] = this.events[eventName].filter((l) => l !== listener);
    }

    // Emit an event
    emit(eventName, data) {
        if (!this.events[eventName]) return;
        this.events[eventName].forEach((listener) => listener(data));
    }
}

// Export a singleton instance of EventBus
export const eventBus = new EventBus();
