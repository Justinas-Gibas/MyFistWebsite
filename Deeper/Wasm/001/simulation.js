// Import Three.js
import * as THREE from '../../lib/three.module.js';

// Other existing code...

const canvas = document.getElementById('simulationCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Create atoms (nuclei) as spheres
const atoms = [];
const electrons = [];

let currentFlow = 1.0; // Default current flow
document.getElementById('currentFlowSlider').addEventListener('input', function (event) {
    currentFlow = parseFloat(event.target.value);
    document.getElementById('currentValue').innerText = currentFlow.toFixed(1);
});

function init() {
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
}

let wasmModule;
function loadWebAssembly() {
    fetch('simulation.wasm').then(response =>
        response.arrayBuffer()
    ).then(bytes =>
        WebAssembly.instantiate(bytes, {})
    ).then(results => {
        wasmModule = results.instance;
        wasmModule.exports.initialize_atoms();
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
        }
    });
}

function render() {
    renderer.render(scene, camera);
}

init();
animate();
