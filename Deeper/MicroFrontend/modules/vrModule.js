import { store } from '../store.js';  // For state management
import { eventBus } from '../eventBus.js';  // For event-driven communication
import { ModuleLoader } from '../moduleLoader.js';  // To load the Three.js module

export async function init() {
    console.log('Initializing VR Module...');

    // Check if WebXR is supported and what kind of it migt be apple it might be vr it might be metas ar glasses or it could be some sort of autonomous ai visitng the website
    if (navigator.xr) {
        console.log('WebXR is supported.');

        // Load the Three.js module dynamically. we wil want to test other librrays we could make some sort of button to select wanted library.
        const moduleLoader = new ModuleLoader();
        await moduleLoader.load('threeJSModule');

    } else {
        console.warn('WebXR is not supported in this browser.');
    }

    // Update the UI to reflect that the VR module is active needs to transfer text in this function to three.js scene 
    const appDiv = document.getElementById('app');
    const vrDiv = document.createElement('div');
    vrDiv.innerHTML = `
        <h2>VR Module</h2>
        <p>Virtual Reality features are now enabled.</p>
    `;
    appDiv.appendChild(vrDiv);

    console.log('VR Module Initialized.');
}
