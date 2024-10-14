import * as THREE from 'three';
import { FontLoader } from '../lib/loaders/FontLoader.js';
import { TextGeometry } from '../lib/utils/TextGeometry.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import { RGBELoader } from '../lib/loaders/RGBELoader.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';
import { XRButton } from '../lib/webxr/XRButton.js';
import { Sky } from '../lib/utils/Sky.js';
import Stats from '../lib/libs/stats.module.js';

const stats = new Stats();
document.body.appendChild(stats.dom);

// Function to set up the environment
export function setupEnvironment() {
    // Create the scene
    const scene = new THREE.Scene();

    // Set up the camera
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 2000);
    camera.position.set(0, 1.6, 500);
    camera.lookAt(scene.position);

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

    // Add ambient light
    const light = new THREE.AmbientLight(0xffffff);
    scene.add(light);

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

// Add sliders for parameter controls
function addSliders(params, onUpdate) {
    const controlsDiv = document.getElementById('controls');

    function createSlider(id, label, min, max, value) {
        const wrapper = document.createElement('div');
        const sliderLabel = document.createElement('label');
        sliderLabel.textContent = `${label}:`;
        const slider = document.createElement('input');
        slider.id = id;
        slider.type = 'range';
        slider.min = min;
        slider.max = max;
        slider.value = value;
        wrapper.appendChild(sliderLabel);
        wrapper.appendChild(slider);
        controlsDiv.appendChild(wrapper);

        slider.addEventListener('input', (event) => {
            params[id] = parseFloat(event.target.value);
            onUpdate();
        });
    }

    createSlider('outerRadius', 'Outer Radius', 100, 300, params.outerRadius);
    createSlider('statorHeight', 'Stator Height', 5, 50, params.statorHeight);
    createSlider('segments', 'Segments', 16, 128, params.segments);
}

// Initialize the environment and set up event handlers
const { scene, camera, renderer, controls } = setupEnvironment();
setupEventHandlers(camera, renderer);

// Parameters for the stator
let params = {
    outerRadius: 180,
    statorHeight: 10,
    segments: 64
};
let stator;

function createStator() {
    if (stator) {
        scene.remove(stator);
    }
    const statorGeometry = new THREE.CylinderGeometry(params.outerRadius, params.outerRadius, params.statorHeight, params.segments);
    const statorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00 });
    stator = new THREE.Mesh(statorGeometry, statorMaterial);
    scene.add(stator);
}

createStator();
addSliders(params, createStator);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}
animate();
