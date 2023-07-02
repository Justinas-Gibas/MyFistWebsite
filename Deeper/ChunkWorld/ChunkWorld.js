import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js'
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Add an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(ambientLight);

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Add the renderer's canvas to the div with id "canvas-container"
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Add orbit controls so that we can pan around the object
export const controls = new OrbitControls(camera, renderer.domElement);

// Create the GLTF loader and model cache
const loader = new GLTFLoader();
const modelCache = {};

// Define the size of the chunks
const chunkSize = 256;

const predefinedChunks = {
    '0,0,0':   '../lib/models/chunk1.gltf',
    // Add more predefined chunks here if needed...
};
  
function generateModelPathForChunk(chunk) {
    // This is a simple example that selects a model based on the x, y, and z coordinates.
    // Replace this with your own logic.
    if (chunk.x % 2 === 0 && chunk.y % 2 === 0 && chunk.z % 2 === 0) {
      return '../lib/models/chunk1.gltf';
    } else {
      return '../lib/models/chunk2.gltf';
    }
}
  
function getModelPathForChunk(chunk) {
    // Use the predefined model if available, otherwise generate one.
    return predefinedChunks[`${chunk.x},${chunk.y},${chunk.z}`] || generateModelPathForChunk(chunk);
}
  
function loadModelIntoChunk(chunk) {
    const modelPath = getModelPathForChunk(chunk);
    if (modelPath) {
      // Check if the model is in the cache
      if (modelCache[modelPath]) {
        // If the model is in the cache, clone it and add it to the chunk
        const model = modelCache[modelPath].clone();
        model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
        scene.add(model);
      } else {
        // If the model is not in the cache, load it
        loader.load(modelPath, (gltf) => {
          // Store the model in the cache
          modelCache[modelPath] = gltf.scene;
  
          // Clone the model and add it to the chunk
          const model = gltf.scene.clone();
          model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
          scene.add(model);
        });
      }
    }
}

// Function to calculate the current chunk based on the camera position
function getCurrentChunk(camera) {
    return {
      x: Math.floor(camera.position.x / chunkSize),
      y: Math.floor(camera.position.y / chunkSize),
      z: Math.floor(camera.position.z / chunkSize)-5
    };
}

// Function to update the scene based on the camera position
function updateChunks(camera) {
  const currentChunk = getCurrentChunk(camera);

  // Look for new chunks to load
  loadModelIntoChunk(currentChunk);

  // Refresh the scene if necessary
}

// Add the WASD controls

const keys = {
  W: false,
  A: false,
  S: false,
  D: false,
};

document.addEventListener('keydown', (event) => {
  const key = event.key.toUpperCase();
  if (key in keys) {
    keys[key] = true;
  }
});

document.addEventListener('keyup', (event) => {
  const key = event.key.toUpperCase();
  if (key in keys) {
    keys[key] = false;
  }
});

function updateCameraPosition(camera) {
  const movementSpeed = 1.1;

  if (keys.W) {
    camera.position.z -= movementSpeed;
  }
  if (keys.A) {
    camera.position.x -= movementSpeed;
  }
  if (keys.S) {
    camera.position.z += movementSpeed;
  }
  if (keys.D) {
    camera.position.x += movementSpeed;
  }
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update camera position
  updateCameraPosition(camera);

  // Update the chunks
  updateChunks(camera);

  // Update controls
  controls.update();

  // Render the scene
  renderer.render(scene, camera);
}

animate();