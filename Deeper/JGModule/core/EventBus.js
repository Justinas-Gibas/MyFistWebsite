export class EventBus {
    static #listeners = new Map();

    static subscribe(event, callback) {
        if (!this.#listeners.has(event)) {
            this.#listeners.set(event, new Set());
        }
        this.#listeners.get(event).add(callback);
        return () => this.unsubscribe(event, callback);
    }

    static unsubscribe(event, callback) {
        this.#listeners.get(event)?.delete(callback);
    }

    static emit(event, data) {
        this.#listeners.get(event)?.forEach(callback => callback(data));
    }
}
