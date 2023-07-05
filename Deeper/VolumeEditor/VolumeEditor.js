// Import Three.js and OrbitControls
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Create a grid of cubes
const geometry = new THREE.BoxGeometry(0.5, 0.5, 0.5); // Make the cubes smaller
const material = new THREE.MeshBasicMaterial({color: 0x808080}); // Make the cubes gray
const cubes = [];

for(let i = -5; i <= 5; i++) {
    for(let j = -5; j <= 5; j++) {
        for(let k = -5; k <= 5; k++) {
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(i * 2, j * 2, k * 2);
            scene.add(cube);
            cubes.push(cube);
        }
    }
}

// Set the camera position
camera.position.z = 5;

// Add a raycaster and a mouse vector
const raycaster = new THREE.Raycaster();
const mouse = new THREE.Vector2();

// Add an event listener for when the user clicks
window.addEventListener('click', (event) => {
    // Calculate where the user clicked in normalized device coordinates
    mouse.x = (event.clientX / window.innerWidth) * 2 - 1;
    mouse.y = -(event.clientY / window.innerHeight) * 2 + 1;

    // Update the picking ray with the camera and mouse position
    raycaster.setFromCamera(mouse, camera);

    // Calculate objects intersecting the picking ray
    const intersects = raycaster.intersectObjects(cubes);

    // Change the color of the intersected objects
    for(let i = 0; i < intersects.length; i++) {
        intersects[i].object.material.color.set(0xff0000);
    }
});

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate()