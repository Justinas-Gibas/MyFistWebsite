// threeJSModule.js
import * as THREE from 'three';
import { eventBus } from './eventBus.js';

let scene, camera, renderer;

export async function init() {
    console.log('Initializing Three.js Module...');

    scene = new THREE.Scene();
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    eventBus.on('RENDER_TEXT_IN_VR', (text) => {
        renderTextInVR(text);
    });

    animate();
}

function renderTextInVR(text) {
    const loader = new THREE.FontLoader();
    loader.load('path_to_font/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: 1,
            height: 0.2,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0xffffff });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 2, 0);  // Adjust the position in the scene
        scene.add(textMesh);
    });
}

function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
