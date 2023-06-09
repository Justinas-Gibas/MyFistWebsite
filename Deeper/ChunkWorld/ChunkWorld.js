import * as THREE from '../lib/three.module.js';
import { PointerLockControls } from '../lib/controls/PointerLockControls.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import Stats from '../lib/libs/stats.module.js'

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 5000);

// Create the character
const character = new THREE.Object3D();
character.position.set(0, 0, 0);

// Create a sphere geometry with a radius of 1, and 32 segments both along the width and height
const sphereGeometry = new THREE.SphereGeometry(1, 32, 32);

// Create a black basic material
const blackMaterial = new THREE.MeshBasicMaterial({color: 0x000000}); // 0x000000 is black

// Combine the geometry and material into a mesh
const characterMesh = new THREE.Mesh(sphereGeometry, blackMaterial);

// Add the mesh to the character
character.add(characterMesh);

// Add the character to the scene
scene.add(character);

// Position the camera a bit higher than the character
camera.position.set(0, 2, 0);  // Adjust as necessary
character.add(camera);  // Add the camera as a child of the character

// Add an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(ambientLight);

// Create the renderer
const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.7);
document.body.appendChild(renderer.domElement);

// Add the renderer's canvas to the div with id "canvas-container"
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// add an event listener for the window's 'resize' event
window.addEventListener('resize', function() {
  let width = window.innerWidth * 0.9;
  let height = window.innerHeight * 0.7;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Add pointer lock controls
const controls = new PointerLockControls(camera, document.body);

// Create the GLTF loader and model cache
const loader = new GLTFLoader();
const modelCache = {};

// Create a stats instance
const stats = new Stats();
document.body.appendChild(stats.dom);

// Load a glTF resource
loader.load(
  // resource URL
  '../lib/models/chunk2.gltf',
  // called when the resource is loaded
  function ( gltf ) {
    scene.add( gltf.scene );
  },
  // called while loading is progressing
  function ( xhr ) {
    console.log( ( xhr.loaded / xhr.total * 100 ) + '% loaded' );
  },
  // called when loading has errors
  function ( error ) {
    console.log( 'An error happened' );
  }
);

const chunkSize = 100;
const chunkMap = new Map();
const models = ['../lib/models/chunk1.gltf', '../lib/models/chunk2.gltf'];
let lastChunkPosition = null;


// calculate the chunk at character position and load it to a chunkmap
function getCurrentChunk(character) {
  const chunkCoordinates = {
    x: Math.floor(character.position.x / chunkSize),
    y: Math.floor(character.position.y / chunkSize),
    z: Math.floor(character.position.z / chunkSize)
  };
  let chunk = chunkMap.get(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`);
  if (!chunk) {
    chunk = { ...chunkCoordinates, modelLoaded: false };
    chunkMap.set(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`, chunk);
  }
  console.log("getCurrentChunk", chunk);
  return chunk;
}

function generateModelPathForChunk(chunk) {
  const modelPath = models[Math.floor(Math.random() * models.length)];
  chunk.modelPath = modelPath;
  console.log("generateModelPathForChunk", chunk);
  return modelPath;
}

function loadModel(chunk, modelPath) {
  if (chunk.modelLoaded) return;
  
  if (modelCache[modelPath]) {
    const model = modelCache[modelPath].clone();
    model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
    scene.add(model);
    chunk.modelLoaded = true;
  } else {
    loader.load(modelPath, (gltf) => {
      modelCache[modelPath] = gltf.scene;
      const model = gltf.scene.clone();
      model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
      scene.add(model);
      chunk.modelLoaded = true;
    });
  }
  console.log("loadModel", chunk);
}

const CHUNK_DISTANCE = 3; // Number of chunks in each direction to load

function updateChunks(character) {
  const currentChunk = getCurrentChunk(character);

  if (lastChunkPosition && lastChunkPosition.x === currentChunk.x && lastChunkPosition.y === currentChunk.y && lastChunkPosition.z === currentChunk.z) {
    return;
  }
  lastChunkPosition = { ...currentChunk };
    console.log("lastChunkPosition",currentChunk, lastChunkPosition);

  for (let x = currentChunk.x - CHUNK_DISTANCE; x <= currentChunk.x + CHUNK_DISTANCE; x++) {
    for (let y = currentChunk.y - CHUNK_DISTANCE; y <= currentChunk.y + CHUNK_DISTANCE; y++) {
      for (let z = currentChunk.z - CHUNK_DISTANCE; z <= currentChunk.z + CHUNK_DISTANCE; z++) {
        if (y != 0) continue;

        let chunk = chunkMap.get(`${x},${y},${z}`);
        if (!chunk) {
          chunk = { x, y, z, modelLoaded: false };
          chunkMap.set(`${x},${y},${z}`, chunk);
          let modelPath = generateModelPathForChunk(chunk);
           loadModel(chunk, modelPath);
        }
      }
    }
  }
}

const moveSpeed = 2.5; // adjust as needed
const rotationSpeed = 0.1; // How fast the character rotates to face the camera direction
const keyState = {};
controls.isLocked = false;
controls.movementEnabled = true; 

window.addEventListener('keydown', function(event) {
  keyState[event.code] = true;
});

window.addEventListener('keyup', function(event) {
  keyState[event.code] = false;
});

document.addEventListener('pointerlockchange', function() {
  if (document.pointerLockElement === document.body) {
    // The pointer is locked, increase the look speed
    controls.lookSpeed = 0.5;
    controls.isLocked = true;
  } else {
    // The pointer is not locked, set the look speed to 0
    controls.lookSpeed = 0;
    controls.isLocked = false;
  }
}, false);

// Add event listener for when the control key is pressed
document.addEventListener('keydown', function(event) {
  if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
      if (controls.isLocked) {
          // If the pointer is currently locked, unlock it
          controls.unlock();
      } else {
          // If the pointer is not currently locked, lock it
          controls.lock();
      }
  }
});

function update() {
  console.log("Position", character.position);

  const direction = new THREE.Vector3();
  if (keyState['KeyW']) {
    direction.z = -moveSpeed;
  } else if (keyState['KeyS']) {
    direction.z = moveSpeed;
  }
  if (keyState['KeyA']) {
    direction.x = -moveSpeed;
  } else if (keyState['KeyD']) {
    direction.x = moveSpeed;
  }
  
  direction.applyQuaternion(camera.quaternion);
  character.position.add(direction);

  controls.update
  //controls.update(clock.getDelta());
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);

  // Update controls and handle collisions
  update();

  // Update the chunks
  updateChunks(character);

  // Update the fps stats
  stats.update();

  // Render the scene
  renderer.render(scene, camera);
}

animate();
