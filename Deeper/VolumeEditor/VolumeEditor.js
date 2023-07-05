// Import Three.js and OrbitControls
import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js';

// Create a scene, camera, and renderer
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
const renderer = new THREE.WebGLRenderer();

renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.7);
document.body.appendChild(renderer.domElement);

// Add OrbitControls
const controls = new OrbitControls(camera, renderer.domElement);

// Define the size of the grid
const gridSize = 10;

// Create a 3D array to represent the grid
let grid = new Array(gridSize).fill().map(() => 
    new Array(gridSize).fill().map(() => 
        new Array(gridSize).fill(0)
    )
);

// Import necessary THREE.js components
import { BoxGeometry, MeshBasicMaterial, Mesh, PointLight } from 'three';

// Add a basic light source
const light = new PointLight(0xffffff, 1, 1000);
light.position.set(50, 50, 50);
scene.add(light);

// Define a block
class Block {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type; // This could be a number representing different block types

        // Create a cube to represent the block
        const geometry = new BoxGeometry(1, 1, 1);
        const material = new MeshBasicMaterial({ color: 0x00ff00 });
        this.cube = new Mesh(geometry, material);

        // Position the cube
        this.cube.position.set(x, y, z);

        // Add the cube to the scene
        scene.add(this.cube);
    }
}

// Function to add a block to the grid
function addBlock(x, y, z, type) {
    let block = new Block(x, y, z, type);
    grid[x][y][z] = block;
}

// Add a block to the grid
addBlock(1, 1, 1, 1);

// Render the scene
function animate() {
    requestAnimationFrame(animate);
    renderer.render(scene, camera);
}
animate();
