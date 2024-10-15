// modules/threeJSModule.js

import * as THREE from 'three';
import { eventBus } from '../eventBus.js'; // To enable communication
import { store } from '../store.js'; // To manage global state

let scene, camera, renderer;

export async function init() {
    console.log('Initializing Three.js Module...');

    // Initialize basic three.js setup
    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Basic example cube
    const geometry = new THREE.BoxGeometry();
    const material = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    const cube = new THREE.Mesh(geometry, material);
    scene.add(cube);

    animate();

    // Event listener to update objects
    eventBus.on('ADD_TO_SCENE', (object) => {
        scene.add(object);
    });

    console.log('Three.js Module Initialized.');
}

// Basic animation loop
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
