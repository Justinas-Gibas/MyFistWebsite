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

// Define a block
class Block {
    constructor(x, y, z, type) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.type = type; // This could be a number representing different block types
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
animate()