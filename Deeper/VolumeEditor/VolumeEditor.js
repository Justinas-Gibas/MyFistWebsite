// Import Three.js
import * as THREE from 'three';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Create a grid of cubes
const geometry = new THREE.BoxGeometry(1, 1, 1);
const material = new THREE.MeshBasicMaterial({color: 0x00ff00});

for(let i = -5; i <= 5; i++) {
    for(let j = -5; j <= 5; j++) {
        for(let k = -5; k <= 5; k++) {
            const cube = new THREE.Mesh(geometry, material);
            cube.position.set(i * 2, j * 2, k * 2);
            scene.add(cube);
        }
    }
}

// Set the camera position
camera.position.z = 5;

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
