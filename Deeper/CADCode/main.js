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
    renderer.xr.enabled = true; // Enable VR support
    document.body.appendChild(renderer.domElement);
    document.body.appendChild(XRButton.createButton(renderer));

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

// Add sliders and buttons dynamically through JavaScript
function addUIElements(params, onUpdate, camera, stator) {
    // Container for UI elements
    const uiContainer = document.createElement('div');
    uiContainer.style.position = 'absolute';
    uiContainer.style.top = '10px';
    uiContainer.style.left = '10px';
    uiContainer.style.padding = '10px';
    uiContainer.style.backgroundColor = 'rgba(255, 255, 255, 0.8)';
    uiContainer.style.borderRadius = '8px';
    document.body.appendChild(uiContainer);

    // Function to create sliders dynamically
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
        uiContainer.appendChild(wrapper);

        slider.addEventListener('input', (event) => {
            params[id] = parseFloat(event.target.value);
            onUpdate();
        });
    }

    // Add sliders for stator parameters
    createSlider('outerRadius', 'Outer Radius', 100, 300, params.outerRadius);
    createSlider('statorHeight', 'Stator Height', 5, 50, params.statorHeight);
    createSlider('segments', 'Segments', 16, 128, params.segments);

    // Create button for resetting the camera
    const resetCameraButton = document.createElement('button');
    resetCameraButton.textContent = 'Reset Camera';
    resetCameraButton.style.marginTop = '10px';
    resetCameraButton.addEventListener('click', () => {
        camera.position.set(0, 1.6, 500);
        camera.lookAt(scene.position);
        controls.update();
    });
    uiContainer.appendChild(resetCameraButton);

    // Create button for toggling stator visibility
    const toggleVisibilityButton = document.createElement('button');
    toggleVisibilityButton.textContent = 'Toggle Stator Visibility';
    toggleVisibilityButton.style.marginTop = '10px';
    toggleVisibilityButton.addEventListener('click', () => {
        if (stator) {
            stator.visible = !stator.visible;
        }
    });
    uiContainer.appendChild(toggleVisibilityButton);

    // Create button for changing material type
    const changeMaterialButton = document.createElement('button');
    changeMaterialButton.textContent = 'Change Stator Material';
    changeMaterialButton.style.marginTop = '10px';
    changeMaterialButton.addEventListener('click', () => {
        isWireframe = !isWireframe;
        if (stator) {
            stator.material.wireframe = isWireframe;
        }
    });
    uiContainer.appendChild(changeMaterialButton);
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
let isWireframe = true;

function createStator() {
    if (stator) {
        scene.remove(stator);
    }
    const statorGeometry = new THREE.CylinderGeometry(params.outerRadius, params.outerRadius, params.statorHeight, params.segments);
    const statorMaterial = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: isWireframe });
    stator = new THREE.Mesh(statorGeometry, statorMaterial);
    scene.add(stator);
}

createStator();
addUIElements(params, createStator, camera, stator);

// Animation loop
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    stats.update();
    renderer.render(scene, camera);
}
animate();
