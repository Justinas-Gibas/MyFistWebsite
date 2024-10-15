import { store } from '../store.js';  // For state management
import { eventBus } from '../eventBus.js';  // For event-driven communication

export async function init() {
    console.log('Initializing VR Module...');

    // Check if WebXR is supported
    if (navigator.xr) {
        console.log('WebXR is supported.');
        
        // Dynamically load three.js only when VR or 3D is needed
        try {
            const THREE = await import('three');  // Dynamic import for three.js
            
            // Create a simple sphere using Three.js
            const sphere = new THREE.Mesh(
                new THREE.SphereGeometry(1, 32, 32), 
                new THREE.MeshBasicMaterial({ color: 0xff0000 })
            );
            
            // Emit event to add VR-specific objects to the scene
            eventBus.emit('ADD_TO_SCENE', sphere);
            
        } catch (error) {
            console.error('Error loading Three.js or rendering VR content:', error);
        }
        
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
