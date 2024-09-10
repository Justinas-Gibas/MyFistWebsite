// Import Three.js
import * as THREE from '../../lib/three.module.js';

const canvas = document.getElementById('simulationCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Create a single atom and electron
let atom, electron;

let currentFlow = 1.0; // Default current flow
document.getElementById('currentFlowSlider').addEventListener('input', function (event) {
    currentFlow = parseFloat(event.target.value);
    document.getElementById('currentValue').innerText = currentFlow.toFixed(1);
});

function init() {
    const atomMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    // Atom setup
    const atomGeometry = new THREE.SphereGeometry(0.5, 16, 16);  // Bigger atom size
    atom = new THREE.Mesh(atomGeometry, atomMaterial);
    atom.position.x = 0;
    scene.add(atom);

    // Electron setup
    const electronGeometry = new THREE.SphereGeometry(0.1, 16, 16);  // Smaller electron
    electron = new THREE.Mesh(electronGeometry, electronMaterial);
    electron.position.x = 0;  // Initial electron position is with the atom
    scene.add(electron);

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
            const electronPositions = new Float32Array(wasmModule.exports.memory.buffer, wasmModule.exports.get_electron_positions(), 1);

            electron.position.x = electronPositions[0] * 10;  // Adjust scaling for visibility
        }
    });
}

function render() {
    renderer.render(scene, camera);
}

init();
animate();
