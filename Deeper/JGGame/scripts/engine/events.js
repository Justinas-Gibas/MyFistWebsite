/**
 * Event System
 * 
 * Handles game events, triggers, and the pub/sub system for component communication.
 */
window.Game = window.Game || {};
Game.engine = Game.engine || {};
Game.engine.events = {};

(function() {
    // Event storage
    const subscribers = new Map();
    const eventHistory = [];
    const maxEventHistory = 100;
    const eventDebugEnabled = true;
    
    // Event categories
    const categories = {
        PLAYER: 'player',
        COMBAT: 'combat',
        ENEMY: 'enemy',
        WORLD: 'world',
        NPC: 'npc',
        UI: 'ui',
        SYSTEM: 'system',
        BUILDING: 'building',
        QUEST: 'quest',
        RESOURCE: 'resource',
        MAGIC: 'magic',
        DIALOG: 'dialog'
    };
    
    // Initialize event system
    Game.engine.events.init = function() {
        console.log('Initializing event system');
        return Promise.resolve();
    };
    
    // Emit an event
    Game.engine.events.emit = function(eventName, data = {}) {
        if (!eventName) {
            console.error('Event name is required');
            return;
        }
        
        // Add timestamp to event data
        const eventData = {
            ...data,
            timestamp: Date.now()
        };
        
        try {
            // Log event for debugging
            if (eventDebugEnabled) {
                logEvent(eventName, eventData);
            }
            
            // Get subscribers for this event
            const eventSubscribers = subscribers.get(eventName) || [];
            
            // Call all subscribers
            eventSubscribers.forEach(subscriber => {
                try {
                    subscriber.callback(eventData);
                } catch (error) {
                    console.error(`Error in subscriber to event '${eventName}':`, error);
                    
                    // Handle subscriber errors based on error policy
                    if (subscriber.errorPolicy === 'remove') {
                        Game.engine.events.unsubscribe(eventName, subscriber.id);
                    }
                }
            });
            
            // Return true for successful emission
            return true;
        } catch (error) {
            console.error(`Error emitting event '${eventName}':`, error);
            return false;
        }
    };
    
    // Subscribe to an event
    Game.engine.events.subscribe = function(eventName, callback, options = {}) {
        if (!eventName || typeof callback !== 'function') {
            console.error('Event name and callback function are required');
            return null;
        }
        
        try {
            // Generate a unique ID for this subscription
            const id = generateSubscriptionId();
            
            // Set default options
            const subscriberOptions = {
                id: id,
                callback: callback,
                priority: options.priority || 0,
                once: options.once || false,
                errorPolicy: options.errorPolicy || 'continue' // 'continue' or 'remove'
            };
            
            // Get or create subscribers array for this event
            if (!subscribers.has(eventName)) {
                subscribers.set(eventName, []);
            }
            
            // Add subscriber
            const eventSubscribers = subscribers.get(eventName);
            eventSubscribers.push(subscriberOptions);
            
            // Sort by priority
            eventSubscribers.sort((a, b) => b.priority - a.priority);
            
            // Return subscription ID for later unsubscription
            return id;
        } catch (error) {
            console.error(`Error subscribing to event '${eventName}':`, error);
            return null;
        }
    };
    
    // Subscribe to an event once
    Game.engine.events.once = function(eventName, callback, options = {}) {
        options.once = true;
        return Game.engine.events.subscribe(eventName, callback, options);
    };
    
    // Unsubscribe from an event
    Game.engine.events.unsubscribe = function(eventName, subscriptionId) {
        if (!eventName || !subscriptionId) {
            console.error('Event name and subscription ID are required');
            return false;
        }
        
        try {
            // Get subscribers for this event
            const eventSubscribers = subscribers.get(eventName);
            
            if (!eventSubscribers) {
                return false;
            }
            
            // Find and remove subscriber
            const index = eventSubscribers.findIndex(sub => sub.id === subscriptionId);
            
            if (index >= 0) {
                eventSubscribers.splice(index, 1);
                return true;
            }
            
            return false;
        } catch (error) {
            console.error(`Error unsubscribing from event '${eventName}':`, error);
            return false;
        }
    };
    
    // Get event categories
    Game.engine.events.getCategories = function() {
        return { ...categories };
    };
    
    // Get event history
    Game.engine.events.getEventHistory = function(filter = null) {
        if (!filter) {
            return [...eventHistory];
        }
        
        // Filter by event name
        if (typeof filter === 'string') {
            return eventHistory.filter(event => event.name === filter);
        }
        
        // Filter by custom function
        if (typeof filter === 'function') {
            return eventHistory.filter(filter);
        }
        
        return [...eventHistory];
    };
    
    // Clear event history
    Game.engine.events.clearEventHistory = function() {
        eventHistory.length = 0;
    };
    
    // Enable/disable event debugging
    Game.engine.events.setDebugEnabled = function(enabled) {
        eventDebugEnabled = enabled;
    };
    
    // Generate a unique subscription ID
    function generateSubscriptionId() {
        return 'sub_' + Date.now() + '_' + Math.random().toString(36).substr(2, 9);
    }
    
    // Log event for debugging
    function logEvent(eventName, data) {
        // Add to history, limiting size
        eventHistory.push({
            name: eventName,
            data: data,
            time: new Date().toLocaleTimeString()
        });
        
        // Keep history under maximum size
        if (eventHistory.length > maxEventHistory) {
            eventHistory.shift();
        }
        
        // Log to console in development mode
        if (process.env.NODE_ENV === 'development') {
            console.debug(`📢 EVENT: ${eventName}`, data);
        }
    }
})();
