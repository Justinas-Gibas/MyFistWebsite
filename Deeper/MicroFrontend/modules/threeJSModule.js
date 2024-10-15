import * as THREE from "../../lib/three.module.js";
import { FontLoader } from '../../lib/loaders/FontLoader.js';
import { TextGeometry } from '../../lib/utils/TextGeometry.js';
import { GLTFLoader } from '../../lib/loaders/GLTFLoader.js';
import { RGBELoader } from '../../lib/loaders/RGBELoader.js';
import { OrbitControls } from '../../lib/controls/OrbitControls.js';
import { XRButton } from '../../lib/webxr/XRButton.js';
import { Sky } from '../../lib/utils/Sky.js';
import Stats from '../../lib/libs/stats.module.js'
import { eventBus } from '../eventBus.js';

let scene, camera, renderer, controls;

export async function init() {
    console.log('Initializing Three.js Module...');

    scene = new THREE.Scene();
    scene.background = new THREE.Color(0xffffff);
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    renderer = new THREE.WebGLRenderer();
    renderer.setSize(window.innerWidth, window.innerHeight);
    document.body.appendChild(renderer.domElement);

    // Add OrbitControls if needed (import this too, if used)
    controls = new THREE.OrbitControls(camera, renderer.domElement);
    controls.enableDamping = true; // Smoother experience
    controls.dampingFactor = 0.25;

    animate();
}

eventBus.on('RENDER_TEXT_IN_VR', (text) => {
    renderTextInVR(text);
});

function renderTextInVR(text) {
    const loader = new THREE.FontLoader();
    loader.load('../../lib/styles/helvetiker_regular.typeface.json', (font) => {
        const textGeometry = new THREE.TextGeometry(text, {
            font: font,
            size: 1,
            height: 0.2,
        });

        const textMaterial = new THREE.MeshBasicMaterial({ color: 0x222222 });
        const textMesh = new THREE.Mesh(textGeometry, textMaterial);
        textMesh.position.set(0, 2, 0);  // Adjust the position in the scene
        scene.add(textMesh);
    });
}

function animate() {
    requestAnimationFrame(animate);
    controls.update();  // If OrbitControls is used
    renderer.render(scene, camera);
}
