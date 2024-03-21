import * as THREE from '../lib/three.module.js';
import { XRButton } from '../lib/webxr/XRButton.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';

console.log("Starting script execution...");

let camera, scene, renderer;
let room, controls;

init();
animate();

function init() {
    console.log("Initializing scene...");
    // Scene setup
    scene = new THREE.Scene();

    // Camera setup
    camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 100);
    camera.position.set(0, 1.6, 3);

    // Renderer setup
    renderer = new THREE.WebGLRenderer({ antialias: true });
    if (renderer) {
        console.log("Renderer initialized successfully.");
        renderer.setSize(window.innerWidth, window.innerHeight);
        renderer.xr.enabled = true;
        document.body.appendChild(renderer.domElement);
        document.body.appendChild(XRButton.createButton(renderer));
    } else {
        console.error("Failed to initialize renderer.");
        return; // Stop initialization if renderer fails
    }

    // Orbit Controls
    controls = new OrbitControls(camera, renderer.domElement);
    controls.addEventListener('change', () => console.log("OrbitControls change event"));
    console.log("OrbitControls added.");

    // Room setup
    const geometry = new THREE.BoxGeometry(30, 12, 30);
    const material = new THREE.MeshPhongMaterial({ color: 0xffffff, side: THREE.BackSide });
    room = new THREE.Mesh(geometry, material);
    scene.add(room);
    console.log("Room added to scene.");

    // Lighting setup
    const ambientLight = new THREE.AmbientLight(0xffffff, 0.7);
    scene.add(ambientLight);
    const pointLight = new THREE.PointLight(0xffffff, 0.5);
    pointLight.position.set(0, 10, 0);
    scene.add(pointLight);
    console.log("Lighting added to scene.");

    // Handle window resize
    window.addEventListener('resize', onWindowResize, false);
    console.log("Scene initialization complete.");
}

function onWindowResize() {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
    console.log("Window resize handled.");
}

function animate() {
    renderer.setAnimationLoop(render);
}

function render() {
    controls.update(); // Required if controls.enableDamping or controls.autoRotate are set to true
    renderer.render(scene, camera);
}

console.log("Script setup complete. Entering animation loop...");
