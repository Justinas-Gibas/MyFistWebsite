import * as THREE from '../lib/three.module.js';
import { FirstPersonControls } from '../lib/controls/FirstPersonControls.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import Stats from '../lib/libs/stats.module.js'


// Create a Clock instance
const clock = new THREE.Clock();

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

// Add first person controls
export const controls = new FirstPersonControls(camera, renderer.domElement);

// Create the GLTF loader and model cache
const loader = new GLTFLoader();
const modelCache = {};

// Create a stats instance
export const stats = new Stats();
document.body.appendChild(stats.dom);

// Define the size of the chunks
const chunkSize = 100;

// chunk Map
const chunkMap = new Map();  // This will map chunk coordinates to chunks

// Define the available models
const models = [
  '../lib/models/chunk1.gltf',
  '../lib/models/chunk2.gltf'
];

// Define the model to be loded into chunk
function generateModelPathForChunk(chunk) {
  // In this example, we select a model at random.
  // You could replace this with your own logic, e.g., based on the neighboring chunks.
  const modelPath = models[Math.floor(Math.random() * models.length)];
  chunk.modelPath = modelPath;
  return modelPath;
}
  
// load GLTF file into scene
function loadModelIntoChunk(chunk) {
    const modelPath = chunk.modelPath || generateModelPathForChunk(chunk);
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

// calculate the chunk at camera position and load it to a chunkmap
function getCurrentChunk(camera) {
  const chunkCoordinates = {
    x: Math.floor(camera.position.x / chunkSize),
    y: Math.floor(camera.position.y / chunkSize),
    //z: Math.floor(camera.position.z / chunkSize)
  };
  let chunk = chunkMap.get(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`);
  if (!chunk) {
    // If the chunk does not exist yet, create it
    chunk = { ...chunkCoordinates };
    chunkMap.set(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`, chunk);
  }
  return chunk;
}

// Chunk size setting
const CHUNK_DISTANCE = 1; // Number of chunks in each direction to load

// Function to update the scene based on the camera position and addtional chunks
function updateChunks(camera) {
  const currentChunk = getCurrentChunk(camera);

  // Look for new chunks to load
  for (let x = currentChunk.x - CHUNK_DISTANCE; x <= currentChunk.x + CHUNK_DISTANCE; x++) {
    for (let y = currentChunk.y - CHUNK_DISTANCE; y <= currentChunk.y + CHUNK_DISTANCE; y++) {
      for (let z = currentChunk.z - CHUNK_DISTANCE; z <= currentChunk.z + CHUNK_DISTANCE; z++) {
        let chunk = chunkMap.get(`${x},${y},${z}`);
        if (!chunk) {
          // If the chunk does not exist yet, create it
          chunk = { x, y, z };
          chunkMap.set(`${x},${y},${z}`, chunk);
        }
        loadModelIntoChunk(chunk);
      }
    }
  }
  // Refresh the scene if necessary
}

// controls settings
controls.movementSpeed = 10; // Adjust to your liking
controls.lookSpeed = 0.1; // Adjust to your liking

// Collisions V0.1.1
function update() {
  // Get the camera's next position
  const nextPosition = camera.position.clone();

  // Check if the next position intersects with any object
  let collision = false;
  scene.traverse(object => {
      if (object.isMesh) {
          // Generate a raycaster from the current position to the next position
          const direction = nextPosition.clone().sub(camera.position).normalize();
          const raycaster = new THREE.Raycaster(camera.position, direction);

          // Check if the ray intersects with the object
          const intersections = raycaster.intersectObject(object);
          if (intersections.length > 0) {
              collision = true;
          }
      }
  });

  // If there's a collision, prevent the controls from moving
  if (collision) {
      controls.movementSpeed = 0;
  } else {
      controls.movementSpeed = 10;
  }

  controls.update(clock.getDelta());
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls and handle collisions
  update();

  // Update the chunks
  updateChunks(camera);

  // Render the scene
  renderer.render(scene, camera);
}

animate();
