// UI.js - Main UI Module for Microfrontend System
import { eventBus } from './eventBus.js';
import { store } from './store.js';

export class UI {
    constructor() {
        this.container = document.getElementById('app');
        this.components = new Map();
        this.theme = 'dark';
        this.init();
    }

    init() {
        this.createBaseStructure();
        this.bindEvents();
        this.subscribeToStore();
        console.log('UI Module initialized');
    }

    createBaseStructure() {
        this.container.innerHTML = `
            <div class="ui-container">
                <header class="ui-header">
                    <div class="ui-logo">
                        <h1>🚀 Microfrontend System</h1>
                    </div>
                    <div class="ui-controls">
                        <button id="theme-toggle" class="ui-btn ui-btn-secondary">🌙 Dark</button>
                        <button id="settings-btn" class="ui-btn ui-btn-primary">⚙️ Settings</button>
                    </div>
                </header>

                <main class="ui-main">
                    <div class="ui-sidebar">
                        <div class="ui-section">
                            <h3>Environment</h3>
                            <div id="environment-info" class="ui-info-card">
                                <span class="ui-status">Detecting...</span>
                            </div>
                        </div>

                        <div class="ui-section">
                            <h3>Loaded Modules</h3>
                            <div id="modules-list" class="ui-modules-list">
                                <div class="ui-loading">Loading modules...</div>
                            </div>
                        </div>

                        <div class="ui-section">
                            <h3>User Preferences</h3>
                            <div id="preferences-panel" class="ui-preferences">
                                <label class="ui-checkbox">
                                    <input type="checkbox" id="advanced-physics">
                                    <span>Advanced Physics</span>
                                </label>
                                <label class="ui-checkbox">
                                    <input type="checkbox" id="enable-analytics">
                                    <span>Enable Analytics</span>
                                </label>
                                <button id="save-preferences" class="ui-btn ui-btn-primary">Save Preferences</button>
                            </div>
                        </div>
                    </div>

                    <div class="ui-content">
                        <div id="main-content" class="ui-main-content">
                            <div class="ui-welcome">
                                <h2>Welcome to Microfrontend System</h2>
                                <p>This system dynamically loads modules based on your environment and preferences.</p>
                                <div class="ui-stats">
                                    <div class="ui-stat-card">
                                        <span class="ui-stat-number" id="loaded-modules-count">0</span>
                                        <span class="ui-stat-label">Loaded Modules</span>
                                    </div>
                                    <div class="ui-stat-card">
                                        <span class="ui-stat-number" id="active-listeners">0</span>
                                        <span class="ui-stat-label">Event Listeners</span>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div id="output-panel" class="ui-output-panel">
                            <h3>System Output</h3>
                            <div id="output-content" class="ui-output-content">
                                <div class="ui-log-entry">System initialized</div>
                            </div>
                        </div>
                    </div>
                </main>

                <div id="settings-modal" class="ui-modal" style="display: none;">
                    <div class="ui-modal-content">
                        <div class="ui-modal-header">
                            <h3>System Settings</h3>
                            <button id="close-modal" class="ui-btn ui-btn-close">×</button>
                        </div>
                        <div class="ui-modal-body">
                            <div class="ui-setting-group">
                                <label>Theme</label>
                                <select id="theme-select" class="ui-select">
                                    <option value="dark">Dark</option>
                                    <option value="light">Light</option>
                                    <option value="auto">Auto</option>
                                </select>
                            </div>
                            <div class="ui-setting-group">
                                <label>Debug Mode</label>
                                <input type="checkbox" id="debug-mode" class="ui-toggle">
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        `;

        this.injectStyles();
    }

    injectStyles() {
        const styleSheet = document.createElement('style');
        styleSheet.textContent = `
            * {
                margin: 0;
                padding: 0;
                box-sizing: border-box;
            }

            .ui-container {
                min-height: 100vh;
                background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                color: #fff;
            }

            .ui-header {
                background: rgba(0, 0, 0, 0.3);
                backdrop-filter: blur(10px);
                padding: 1rem 2rem;
                display: flex;
                justify-content: space-between;
                align-items: center;
                border-bottom: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ui-logo h1 {
                font-size: 1.5rem;
                font-weight: 600;
            }

            .ui-controls {
                display: flex;
                gap: 1rem;
            }

            .ui-btn {
                padding: 0.5rem 1rem;
                border: none;
                border-radius: 8px;
                cursor: pointer;
                font-weight: 500;
                transition: all 0.3s ease;
            }

            .ui-btn-primary {
                background: #4CAF50;
                color: white;
            }

            .ui-btn-secondary {
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .ui-btn:hover {
                transform: translateY(-2px);
                box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
            }

            .ui-main {
                display: grid;
                grid-template-columns: 300px 1fr;
                min-height: calc(100vh - 80px);
            }

            .ui-sidebar {
                background: rgba(0, 0, 0, 0.2);
                padding: 2rem;
                border-right: 1px solid rgba(255, 255, 255, 0.1);
            }

            .ui-section {
                margin-bottom: 2rem;
            }

            .ui-section h3 {
                margin-bottom: 1rem;
                color: #fff;
                font-size: 1.1rem;
            }

            .ui-info-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 1rem;
                border-radius: 8px;
                backdrop-filter: blur(5px);
            }

            .ui-status {
                display: inline-block;
                padding: 0.25rem 0.5rem;
                background: #4CAF50;
                border-radius: 4px;
                font-size: 0.8rem;
            }

            .ui-modules-list {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .ui-module-item {
                background: rgba(255, 255, 255, 0.1);
                padding: 0.5rem;
                border-radius: 4px;
                display: flex;
                justify-content: space-between;
                align-items: center;
            }

            .ui-module-status {
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: #4CAF50;
            }

            .ui-preferences {
                display: flex;
                flex-direction: column;
                gap: 1rem;
            }

            .ui-checkbox {
                display: flex;
                align-items: center;
                gap: 0.5rem;
                cursor: pointer;
            }

            .ui-content {
                display: grid;
                grid-template-rows: 1fr 200px;
                padding: 2rem;
                gap: 2rem;
            }

            .ui-welcome {
                background: rgba(255, 255, 255, 0.1);
                padding: 2rem;
                border-radius: 12px;
                backdrop-filter: blur(10px);
            }

            .ui-stats {
                display: grid;
                grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
                gap: 1rem;
                margin-top: 2rem;
            }

            .ui-stat-card {
                background: rgba(255, 255, 255, 0.1);
                padding: 1.5rem;
                border-radius: 8px;
                text-align: center;
            }

            .ui-stat-number {
                display: block;
                font-size: 2rem;
                font-weight: bold;
                color: #4CAF50;
            }

            .ui-output-panel {
                background: rgba(0, 0, 0, 0.3);
                border-radius: 8px;
                padding: 1rem;
            }

            .ui-output-content {
                background: #000;
                color: #00ff00;
                padding: 1rem;
                border-radius: 4px;
                font-family: 'Courier New', monospace;
                font-size: 0.8rem;
                max-height: 150px;
                overflow-y: auto;
            }

            .ui-log-entry {
                margin-bottom: 0.25rem;
            }

            .ui-modal {
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: rgba(0, 0, 0, 0.8);
                display: flex;
                justify-content: center;
                align-items: center;
                z-index: 1000;
            }

            .ui-modal-content {
                background: rgba(255, 255, 255, 0.1);
                backdrop-filter: blur(20px);
                border-radius: 12px;
                padding: 2rem;
                min-width: 400px;
            }

            .ui-modal-header {
                display: flex;
                justify-content: space-between;
                align-items: center;
                margin-bottom: 1rem;
            }

            .ui-btn-close {
                background: transparent;
                border: none;
                color: white;
                font-size: 1.5rem;
                cursor: pointer;
            }

            .ui-setting-group {
                margin-bottom: 1rem;
            }

            .ui-setting-group label {
                display: block;
                margin-bottom: 0.5rem;
            }

            .ui-select {
                width: 100%;
                padding: 0.5rem;
                border-radius: 4px;
                border: none;
                background: rgba(255, 255, 255, 0.2);
                color: white;
            }

            .ui-loading {
                text-align: center;
                opacity: 0.7;
                font-style: italic;
            }

            @media (max-width: 768px) {
                .ui-main {
                    grid-template-columns: 1fr;
                }
                
                .ui-sidebar {
                    order: 2;
                }
            }

            @keyframes slideIn {
                from {
                    transform: translateX(100%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }

            @keyframes pulse {
                0%, 100% {
                    opacity: 1;
                }
                50% {
                    opacity: 0.5;
                }
            }

            .ui-loading {
                animation: pulse 2s infinite;
            }

            .ui-test-buttons {
                display: flex;
                flex-direction: column;
                gap: 0.5rem;
            }

            .ui-test-buttons .ui-btn {
                font-size: 0.8rem;
                padding: 0.4rem 0.8rem;
            }
        `;
        document.head.appendChild(styleSheet);
    }

    bindEvents() {
        // Theme toggle
        document.getElementById('theme-toggle').addEventListener('click', () => {
            this.toggleTheme();
        });

        // Settings modal
        document.getElementById('settings-btn').addEventListener('click', () => {
            this.showSettings();
        });

        document.getElementById('close-modal').addEventListener('click', () => {
            this.hideSettings();
        });

        // Preferences
        document.getElementById('save-preferences').addEventListener('click', () => {
            this.savePreferences();
        });

        // Module testing buttons
        this.addTestButtons();
    }

    addTestButtons() {
        const testSection = document.createElement('div');
        testSection.className = 'ui-section';
        testSection.innerHTML = `
            <h3>Module Testing</h3>
            <div class="ui-test-buttons">
                <button id="test-text-render" class="ui-btn ui-btn-secondary">Test Text Render</button>
                <button id="test-vr-mode" class="ui-btn ui-btn-secondary">Test VR Mode</button>
                <button id="clear-output" class="ui-btn ui-btn-secondary">Clear Output</button>
            </div>
        `;
        document.querySelector('.ui-sidebar').appendChild(testSection);

        // Bind test events
        document.getElementById('test-text-render').addEventListener('click', () => {
            eventBus.emit('RENDER_TEXT', 'Hello from UI Module!');
            this.addLogEntry('Emitted RENDER_TEXT event');
        });

        document.getElementById('test-vr-mode').addEventListener('click', () => {
            eventBus.emit('TOGGLE_VR_MODE');
            this.addLogEntry('Emitted TOGGLE_VR_MODE event');
        });

        document.getElementById('clear-output').addEventListener('click', () => {
            document.getElementById('output-content').innerHTML = '';
        });
    }

    subscribeToStore() {
        store.subscribe(() => {
            this.updateFromStore();
        });
        this.updateFromStore(); // Initial update
    }

    updateFromStore() {
        const state = store.getState();
        
        // Update environment info
        if (state.environment) {
            const envInfo = document.getElementById('environment-info');
            envInfo.innerHTML = `
                <span class="ui-status">${state.environment.toUpperCase()}</span>
                <div style="margin-top: 0.5rem; font-size: 0.8rem;">
                    Environment detected and configured
                </div>
            `;
        }

        // Update modules list
        if (state.moduleStatus) {
            this.updateModulesList(state.moduleStatus);
        }

        // Update preferences
        if (state.userPreferences) {
            this.updatePreferences(state.userPreferences);
        }
    }

    updateModulesList(moduleStatus) {
        const modulesList = document.getElementById('modules-list');
        const modules = Object.keys(moduleStatus);
        
        if (modules.length === 0) {
            modulesList.innerHTML = '<div class="ui-loading">No modules loaded yet...</div>';
            return;
        }

        modulesList.innerHTML = modules.map(moduleName => `
            <div class="ui-module-item">
                <span>${moduleName}</span>
                <div class="ui-module-status ${moduleStatus[moduleName] === 'loaded' ? 'loaded' : 'loading'}"></div>
            </div>
        `).join('');

        // Update stats
        document.getElementById('loaded-modules-count').textContent = modules.length;
    }

    updatePreferences(preferences) {
        document.getElementById('advanced-physics').checked = preferences.needsAdvancedPhysics || false;
        document.getElementById('enable-analytics').checked = preferences.enableAnalytics || false;
    }

    savePreferences() {
        const preferences = {
            needsAdvancedPhysics: document.getElementById('advanced-physics').checked,
            enableAnalytics: document.getElementById('enable-analytics').checked
        };

        store.dispatch({ type: 'SET_PREFERENCES', payload: preferences });
        this.addLogEntry('Preferences saved: ' + JSON.stringify(preferences));
        
        // Emit event for other modules to react
        eventBus.emit('PREFERENCES_UPDATED', preferences);
    }

    toggleTheme() {
        this.theme = this.theme === 'dark' ? 'light' : 'dark';
        document.getElementById('theme-toggle').textContent = 
            this.theme === 'dark' ? '🌙 Dark' : '☀️ Light';
        
        // You could implement actual theme switching here
        this.addLogEntry(`Theme switched to ${this.theme}`);
    }

    showSettings() {
        document.getElementById('settings-modal').style.display = 'flex';
    }

    hideSettings() {
        document.getElementById('settings-modal').style.display = 'none';
    }

    addLogEntry(message) {
        const outputContent = document.getElementById('output-content');
        const timestamp = new Date().toLocaleTimeString();
        const logEntry = document.createElement('div');
        logEntry.className = 'ui-log-entry';
        logEntry.textContent = `[${timestamp}] ${message}`;
        
        outputContent.appendChild(logEntry);
        outputContent.scrollTop = outputContent.scrollHeight;
    }

    // Public API for other modules
    showNotification(message, type = 'info') {
        const notification = document.createElement('div');
        notification.className = `ui-notification ui-notification-${type}`;
        notification.textContent = message;
        notification.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            background: ${type === 'error' ? '#f44336' : '#4CAF50'};
            color: white;
            padding: 1rem;
            border-radius: 8px;
            z-index: 1001;
            animation: slideIn 0.3s ease;
        `;

        document.body.appendChild(notification);
        
        setTimeout(() => {
            notification.remove();
        }, 3000);
    }

    updateMainContent(content) {
        const mainContent = document.getElementById('main-content');
        if (typeof content === 'string') {
            mainContent.innerHTML = content;
        } else {
            mainContent.innerHTML = '';
            mainContent.appendChild(content);
        }
    }
}

// Initialize UI and export for use in main.js
export const ui = new UI();

// Listen to various events and update UI accordingly
eventBus.on('MODULE_LOADED', (data) => {
    ui.addLogEntry(`Module loaded: ${data.moduleName}`);
});

eventBus.on('RENDER_TEXT', (text) => {
    ui.addLogEntry(`Text render requested: ${text}`);
});

eventBus.on('RENDER_TEXT_IN_VR', (text) => {
    ui.addLogEntry(`VR text render: ${text}`);
    ui.showNotification('VR text rendering activated!');
});

eventBus.on('RENDER_TEXT_IN_WEB', (text) => {
    ui.addLogEntry(`Web text render: ${text}`);
    ui.updateMainContent(`
        <div class="ui-text-display">
            <h2>Text Rendering</h2>
            <div style="background: rgba(255,255,255,0.1); padding: 2rem; border-radius: 8px; margin-top: 1rem;">
                <p style="font-size: 1.2rem;">${text}</p>
            </div>
        </div>
    `);
});

console.log('UI Module loaded successfully');
