/**
 * Debug Console System
 * 
 * Provides an in-game console for viewing logs, errors, and debugging information.
 */
window.Game = window.Game || {};
Game.debug = Game.debug || {};
Game.debug.console = {};

(function() {
    // Console state
    let isVisible = false;
    let consoleElement = null;
    let logContainer = null;
    let commandInput = null;
    const maxLogEntries = 100;
    const logHistory = [];
    let commandHistory = [];
    let commandIndex = -1;

    // Initialize console
    Game.debug.console.init = function() {
        console.log('Initializing debug console');
        
        // Create console UI
        createConsoleUI();
        
        // Intercept console methods
        interceptConsoleMethods();
        
        // Set up event listeners
        setupEventListeners();
        
        return Promise.resolve();
    };
    
    // Show or hide console
    Game.debug.console.toggle = function() {
        isVisible = !isVisible;
        
        if (consoleElement) {
            consoleElement.style.display = isVisible ? 'flex' : 'none';
            
            if (isVisible && commandInput) {
                commandInput.focus();
            }
        }
        
        return isVisible;
    };
    
    // Log a message to the console
    Game.debug.console.log = function(message, type = 'log') {
        if (!logContainer) return;
        
        // Create log entry
        const entry = {
            message: message,
            type: type,
            timestamp: new Date().toLocaleTimeString()
        };
        
        // Add to history
        logHistory.push(entry);
        
        // Trim history if needed
        if (logHistory.length > maxLogEntries) {
            logHistory.shift();
        }
        
        // Add to UI
        addLogEntryToUI(entry);
    };
    
    // Clear the console
    Game.debug.console.clear = function() {
        logHistory.length = 0;
        
        if (logContainer) {
            logContainer.innerHTML = '';
        }
    };
    
    // Execute a command
    Game.debug.console.execute = function(command) {
        if (!command || command.trim() === '') return;
        
        // Add to command history
        commandHistory.push(command);
        if (commandHistory.length > 50) {
            commandHistory.shift();
        }
        commandIndex = -1;
        
        // Log the command
        Game.debug.console.log(`> ${command}`, 'command');
        
        try {
            // First try to handle built-in commands
            if (!handleBuiltInCommand(command)) {
                // If not a built-in command, try to evaluate
                const result = eval(command);
                Game.debug.console.log(result !== undefined ? result : 'undefined', 'result');
            }
        } catch (error) {
            Game.debug.console.log(`Error: ${error.message}`, 'error');
        }
        
        // Clear input
        if (commandInput) {
            commandInput.value = '';
        }
    };
    
    // Create the console UI
    function createConsoleUI() {
        // Create container
        consoleElement = document.createElement('div');
        consoleElement.id = 'debug-console';
        consoleElement.className = 'debug-console';
        consoleElement.style.display = 'none';
        
        // Create header with controls
        const header = document.createElement('div');
        header.className = 'console-header';
        header.innerHTML = `
            <span class="console-title">Debug Console</span>
            <div class="console-controls">
                <button class="console-btn" id="console-clear">Clear</button>
                <button class="console-btn" id="console-close">×</button>
            </div>
        `;
        
        // Create log container
        logContainer = document.createElement('div');
        logContainer.className = 'console-logs';
        
        // Create input area
        const inputArea = document.createElement('div');
        inputArea.className = 'console-input-area';
        
        commandInput = document.createElement('input');
        commandInput.type = 'text';
        commandInput.className = 'console-input';
        commandInput.placeholder = 'Enter command...';
        
        inputArea.appendChild(commandInput);
        
        // Assemble console
        consoleElement.appendChild(header);
        consoleElement.appendChild(logContainer);
        consoleElement.appendChild(inputArea);
        
        // Add to body
        document.body.appendChild(consoleElement);
        
        // Add style
        addConsoleStyles();
        
        // Set up UI event handlers
        document.getElementById('console-clear').addEventListener('click', Game.debug.console.clear);
        document.getElementById('console-close').addEventListener('click', Game.debug.console.toggle);
        
        commandInput.addEventListener('keydown', function(event) {
            if (event.key === 'Enter') {
                Game.debug.console.execute(this.value);
            } else if (event.key === 'ArrowUp') {
                navigateCommandHistory(-1);
                event.preventDefault();
            } else if (event.key === 'ArrowDown') {
                navigateCommandHistory(1);
                event.preventDefault();
            }
        });
    }
    
    // Add console styles
    function addConsoleStyles() {
        const style = document.createElement('style');
        style.textContent = `
            .debug-console {
                position: fixed;
                bottom: 0;
                left: 0;
                width: 100%;
                height: 300px;
                background-color: rgba(0, 0, 0, 0.85);
                color: #fff;
                font-family: monospace;
                z-index: 9999;
                display: flex;
                flex-direction: column;
                border-top: 2px solid #444;
            }
            
            .console-header {
                padding: 5px 10px;
                background-color: #333;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid #555;
            }
            
            .console-title {
                font-weight: bold;
            }
            
            .console-controls {
                display: flex;
            }
            
            .console-btn {
                background: #555;
                border: none;
                color: white;
                margin-left: 5px;
                cursor: pointer;
                padding: 2px 8px;
            }
            
            .console-logs {
                flex: 1;
                overflow-y: auto;
                padding: 10px;
                font-size: 14px;
            }
            
            .console-input-area {
                padding: 10px;
                border-top: 1px solid #555;
            }
            
            .console-input {
                width: 100%;
                background-color: #222;
                border: 1px solid #555;
                color: #fff;
                padding: 5px;
                font-family: inherit;
            }
            
            .log-entry {
                margin: 2px 0;
                padding: 1px 0;
                display: flex;
            }
            
            .log-timestamp {
                color: #888;
                margin-right: 8px;
                flex-shrink: 0;
            }
            
            .log-message {
                word-break: break-word;
                white-space: pre-wrap;
            }
            
            .log-type-error {
                color: #ff5555;
            }
            
            .log-type-warn {
                color: #ffaa55;
            }
            
            .log-type-info {
                color: #55aaff;
            }
            
            .log-type-success {
                color: #55ff55;
            }
            
            .log-type-command {
                color: #aaaaff;
                font-weight: bold;
            }
            
            .log-type-result {
                color: #ffff55;
            }
        `;
        
        document.head.appendChild(style);
    }
    
    // Add a log entry to the UI
    function addLogEntryToUI(entry) {
        if (!logContainer) return;
        
        const entryElement = document.createElement('div');
        entryElement.className = `log-entry log-type-${entry.type}`;
        
        const timestamp = document.createElement('span');
        timestamp.className = 'log-timestamp';
        timestamp.textContent = entry.timestamp;
        
        const message = document.createElement('span');
        message.className = 'log-message';
        
        // Handle different types of messages
        if (typeof entry.message === 'object') {
            try {
                message.textContent = JSON.stringify(entry.message, null, 2);
            } catch (e) {
                message.textContent = String(entry.message);
            }
        } else {
            message.textContent = String(entry.message);
        }
        
        entryElement.appendChild(timestamp);
        entryElement.appendChild(message);
        
        logContainer.appendChild(entryElement);
        
        // Auto-scroll to bottom
        logContainer.scrollTop = logContainer.scrollHeight;
    }
    
    // Intercept console methods to capture them in our console
    function interceptConsoleMethods() {
        const originalConsole = { 
            log: console.log,
            warn: console.warn,
            error: console.error,
            info: console.info
        };
        
        // Override console.log
        console.log = function() {
            // Call original method
            originalConsole.log.apply(console, arguments);
            
            // Log to our console
            const args = Array.from(arguments).join(' ');
            Game.debug.console.log(args, 'log');
        };
        
        // Override console.warn
        console.warn = function() {
            // Call original method
            originalConsole.warn.apply(console, arguments);
            
            // Log to our console
            const args = Array.from(arguments).join(' ');
            Game.debug.console.log(args, 'warn');
        };
        
        // Override console.error
        console.error = function() {
            // Call original method
            originalConsole.error.apply(console, arguments);
            
            // Log to our console
            const args = Array.from(arguments).join(' ');
            Game.debug.console.log(args, 'error');
        };
        
        // Override console.info
        console.info = function() {
            // Call original method
            originalConsole.info.apply(console, arguments);
            
            // Log to our console
            const args = Array.from(arguments).join(' ');
            Game.debug.console.log(args, 'info');
        };
        
        // Add global error handler
        window.addEventListener('error', function(event) {
            Game.debug.console.log(`${event.message} at ${event.filename}:${event.lineno}:${event.colno}`, 'error');
        });
    }
    
    // Handle built-in console commands
    function handleBuiltInCommand(command) {
        const cmd = command.trim().toLowerCase();
        
        if (cmd === 'clear') {
            Game.debug.console.clear();
            return true;
        }
        
        if (cmd === 'help') {
            showHelp();
            return true;
        }
        
        if (cmd.startsWith('get ')) {
            const path = cmd.substring(4).trim();
            try {
                const result = getNestedProperty(window, path);
                Game.debug.console.log(result, 'result');
            } catch (error) {
                Game.debug.console.log(`Error: ${error.message}`, 'error');
            }
            return true;
        }
        
        return false;
    }
    
    // Show help information
    function showHelp() {
        const helpText = `
Available commands:
- help: Show this help message
- clear: Clear the console
- get [path]: Get a property value (e.g., get Game.gameplay.player)

You can also run any JavaScript expression or access game objects directly:
- Game.gameplay.player.getStats()
- Object.keys(Game.gameplay)
`;
        Game.debug.console.log(helpText, 'info');
    }
    
    // Navigate command history
    function navigateCommandHistory(direction) {
        if (commandHistory.length === 0) return;
        
        commandIndex += direction;
        
        if (commandIndex < 0) {
            commandIndex = -1;
            commandInput.value = '';
            return;
        }
        
        if (commandIndex >= commandHistory.length) {
            commandIndex = commandHistory.length - 1;
        }
        
        commandInput.value = commandHistory[commandIndex];
        
        // Move cursor to end
        setTimeout(() => {
            commandInput.selectionStart = commandInput.selectionEnd = commandInput.value.length;
        }, 0);
    }
    
    // Get nested property value safely
    function getNestedProperty(obj, path) {
        const parts = path.split('.');
        let current = obj;
        
        for (const part of parts) {
            if (current === null || current === undefined) {
                throw new Error(`Cannot read property '${part}' of ${current}`);
            }
            current = current[part];
        }
        
        return current;
    }
    
    // Set up event listeners
    function setupEventListeners() {
        // Toggle console with ~ key (backtick)
        document.addEventListener('keydown', function(event) {
            if (event.key === '`' || event.key === '~') {
                Game.debug.console.toggle();
                event.preventDefault();
            }
        });
        
        // Listen for game events
        if (Game.engine && Game.engine.events) {
            Game.engine.events.subscribe('*', function(eventData, eventName) {
                if (isVisible) {
                    Game.debug.console.log(`Event: ${eventName}`, 'info');
                    Game.debug.console.log(eventData, 'info');
                }
            });
        }
    }
})();
