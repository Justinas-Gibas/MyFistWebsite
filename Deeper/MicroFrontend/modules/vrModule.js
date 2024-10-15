// modules/vrModule.js

import { store } from '../store.js';
import { eventBus } from '../eventBus.js';  // Import eventBus

export async function init() {
    console.log('Initializing VR Module...');

    // Check if WebXR is supported
    if (navigator.xr) {
        console.log('WebXR is supported.');

        // Emit event to add VR-specific objects to the scene
        eventBus.emit('ADD_TO_SCENE', new THREE.Mesh(new THREE.SphereGeometry(1, 32, 32), new THREE.MeshBasicMaterial({ color: 0xff0000 })));

    } else {
        console.warn('WebXR is not supported in this browser.');
    }

    // Update the UI to reflect that the VR module is active
    const appDiv = document.getElementById('app');
    const vrDiv = document.createElement('div');
    vrDiv.innerHTML = `
        <h2>VR Module</h2>
        <p>Virtual Reality features are now enabled.</p>
    `;
    appDiv.appendChild(vrDiv);

    console.log('VR Module Initialized.');
}
