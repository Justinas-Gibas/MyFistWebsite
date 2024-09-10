// Log to see if the file is loaded
console.log("simulation.js loaded");

// Try importing Three.js and log any potential issues
import * as THREE from 'three';
console.log("Three.js loaded:", THREE);

const canvas = document.getElementById('simulationCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);
console.log('Renderer initialized');

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;
console.log('Scene and camera initialized');

// Create atoms (nuclei) as spheres
const atoms = [];
const electrons = [];

// Re-add the currentFlow code
let currentFlow = 1.0;  // Default current flow

document.getElementById('currentFlowSlider').addEventListener('input', function (event) {
    currentFlow = parseFloat(event.target.value);
    document.getElementById('currentValue').innerText = currentFlow.toFixed(1);
});

function init() {
    console.log('Initialization started');
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    // Atoms setup
    for (let i = 0; i < 10; i++) {
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const atom = new THREE.Mesh(geometry, material);
        atom.position.x = i * 2;
        scene.add(atom);
        atoms.push(atom);

        // Electrons setup
        const electronGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const electron = new THREE.Mesh(electronGeometry, electronMaterial);
        electron.position.x = atom.position.x;
        scene.add(electron);
        electrons.push(electron);
    }

    loadWebAssembly();
    console.log('Initialization finished');
}

let wasmModule;
function loadWebAssembly() {
    console.log('Loading WebAssembly');
    fetch('simulation.wasm').then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, {})
    ).then(results => {
        wasmModule = results.instance;
        wasmModule.exports.initialize_atoms();
        console.log('WebAssembly module loaded and initialized');
    });
}

function animate() {
    renderer.setAnimationLoop(() => {
        render();
        if (wasmModule) {
            wasmModule.exports.update_electrons(currentFlow);
            const electronPositions = new Float32Array(wasmModule.exports.memory.buffer, wasmModule.exports.get_electron_positions(), 10);

            for (let i = 0; i < electrons.length; i++) {
                electrons[i].position.x = electronPositions[i] * 2;
            }
            console.log('Electron positions updated:', electronPositions);
        }
    });
}

function render() {
    renderer.render(scene, camera);
}

// Check if initialization completes
console.log('Starting initialization...');
init();
animate();
