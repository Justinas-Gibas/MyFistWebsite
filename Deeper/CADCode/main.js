import * as THREE from 'three';
import { FontLoader } from '../lib/loaders/FontLoader.js';
import { TextGeometry } from '../lib/utils/TextGeometry.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import { RGBELoader } from '../lib/loaders/RGBELoader.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';
import { XRButton } from '../lib/webxr/XRButton.js';
import { Sky } from '../lib/utils/Sky.js';
import Stats from '../lib/libs/stats.module.js';

const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();
const stats = new Stats();
document.body.appendChild(stats.dom);

// Function to set up the environment
export function setupEnvironment() {
    // Create the scene
    const scene = new THREE.Scene();

    // Set up the camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.set(0, 1.6, 3);

    // Set up the renderer
    const renderer = new THREE.WebGLRenderer({ antialias: true });
    renderer.setSize(window.innerWidth, window.innerHeight);
    renderer.setPixelRatio(window.devicePixelRatio);
    renderer.outputEncoding = THREE.sRGBEncoding;
    document.body.appendChild(renderer.domElement);

    // Set up OrbitControls
    const controls = new OrbitControls(camera, renderer.domElement);
    controls.target.set(0, 1.6, 0);
    controls.update();

    return { scene, camera, renderer, controls };
}

// Function to set up event handlers and resize listeners
export function setupEventHandlers(camera, renderer) {
    window.addEventListener('resize', () => {
        camera.aspect = window.innerWidth / window.innerHeight;
        camera.updateProjectionMatrix();
        renderer.setSize(window.innerWidth, window.innerHeight);
    });
}

// Initialize the environment and set up event handlers
const { scene, camera, renderer, controls } = setupEnvironment();
setupEventHandlers(camera, renderer);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}
animate();
