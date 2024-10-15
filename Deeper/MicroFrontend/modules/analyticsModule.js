// modules/analyticsModule.js

import { store } from '../store.js';

export async function init() {
    console.log('Initializing Analytics Module...');

    // Access user preferences from the store
    const state = store.getState();
    const preferences = state.userPreferences;

    if (preferences.enableAnalytics) {
        // Set up analytics tracking
        // For example, initialize Google Analytics
        console.log('Analytics tracking enabled.');
    } else {
        console.log('Analytics tracking disabled.');
    }

    // Update the UI if necessary
    const appDiv = document.getElementById('app');
    const analyticsDiv = document.createElement('div');
    analyticsDiv.innerHTML = `
        <h2>Analytics Module</h2>
        <p>Analytics features are now ${preferences.enableAnalytics ? 'enabled' : 'disabled'}.</p>
    `;
    appDiv.appendChild(analyticsDiv);

    console.log('Analytics Module Initialized.');
}
