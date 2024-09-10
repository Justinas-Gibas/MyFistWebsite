// Get canvas and renderer
const canvas = document.getElementById('simulationCanvas');
const renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

// Create scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

// Create arrays for atoms and electrons
const atoms = [];
const electrons = [];
let currentFlow = 1.0; // Default current flow

// Add event listener for flow slider input
document.getElementById('currentFlowSlider').addEventListener('input', function(event) {
    currentFlow = parseFloat(event.target.value);
    document.getElementById('currentValue').innerText = currentFlow.toFixed(1);
});

// Initialize the scene
function init() {
    const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });

    // Create atoms and electrons
    for (let i = 0; i < 10; i++) {
        // Create atoms
        const geometry = new THREE.SphereGeometry(0.2, 16, 16);
        const atom = new THREE.Mesh(geometry, material);
        atom.position.x = i * 2;
        scene.add(atom);
        atoms.push(atom);

        // Create electrons
        const electronGeometry = new THREE.SphereGeometry(0.05, 16, 16);
        const electron = new THREE.Mesh(electronGeometry, electronMaterial);
        electron.position.x = atom.position.x;
        scene.add(electron);
        electrons.push(electron);
    }

    loadWebAssembly();
}

// Load WebAssembly module
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

// Update the electrons with flow and repulsion
function updateElectrons(currentFlow) {
    if (wasmModule) {
        // Get updated electron positions from WebAssembly
        wasmModule.exports.update_electrons(currentFlow);
        const electronPositions = new Float32Array(
            wasmModule.exports.memory.buffer, 
            wasmModule.exports.get_electron_positions(), 
            10
        );

        // Simple electrostatic repulsion
        const repulsionStrength = 0.01; // Adjust this value for stronger or weaker repulsion

        for (let i = 0; i < electrons.length; i++) {
            for (let j = i + 1; j < electrons.length; j++) {
                let dx = electronPositions[i] - electronPositions[j];
                if (Math.abs(dx) > 0.01) { // Avoid division by zero or very small values
                    let force = repulsionStrength / (dx * dx); // Inverse square law
                    electronPositions[i] += force;
                    electronPositions[j] -= force;
                }
            }

            // Apply the updated positions to the Three.js objects
            electrons[i].position.x = electronPositions[i] * 2;
        }
    }
}

// Animation loop
function animate() {
    renderer.setAnimationLoop(() => {
        updateElectrons(currentFlow); // Update positions and apply repulsion
        render();
    });
}

// Render the scene
function render() {
    renderer.render(scene, camera);
}

// Initialize and start the animation
init();
animate();
