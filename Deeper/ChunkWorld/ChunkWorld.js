import * as THREE from '../lib/three.module.js';
import { OrbitControls } from '../lib/controls/OrbitControls.js'
import { FirstPersonControls } from '../lib/controls/FirstPersonControls.js';
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js';
import Stats from '../lib/libs/stats.module.js'


// Create a Clock instance
const clock = new THREE.Clock();

// Create the character
const character = new THREE.Object3D();
character.position.set(0, 0, 0);

// Create a sphere and add it to the character
const geometry = new THREE.SphereGeometry(1, 32, 32); // Parameters: radius, widthSegments, heightSegments
const material = new THREE.MeshBasicMaterial({ color: 0xff0000 }); // Set color to red
const sphere = new THREE.Mesh(geometry, material);
character.add(sphere); // Add the sphere as a child of the character

// Create the scene and camera
const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(95, window.innerWidth / window.innerHeight, 0.1, 1000);

// Add the character to the scene
scene.add(character);

// Position the camera a bit higher than the character
camera.position.set(3, 0, 0);  // Adjust as necessary
character.add(camera);  // Add the camera as a child of the character

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
//const controls = new OrbitControls(camera, renderer.domElement);

// Add first person controls
const controls = new FirstPersonControls(character, renderer.domElement);

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
    console.log("get model path function called", chunk);

  // In this example, we select a model at random.
  // You could replace this with your own logic, e.g., based on the neighboring chunks.
  const modelPath = models[Math.floor(Math.random() * models.length)];
  chunk.modelPath = modelPath;
  return modelPath;
}
  
// load GLTF file into scene
function loadModelIntoChunk(chunk) {
  console.log("Load model into chunk function called", chunk);
  if (chunk.modelLoaded) {
    // The model has already been loaded into this chunk, so no need to load it again
    return;
  }
    const modelPath = chunk.modelPath || generateModelPathForChunk(chunk);
    if (modelPath) {
      // Check if the model is in the cache
      if (modelCache[modelPath]) {
        // If the model is in the cache, clone it and add it to the chunk
        const model = modelCache[modelPath].clone();
        model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
        scene.add(model);
          console.log("load model from cache done", chunk);
      } else {
        // If the model is not in the cache, load it
        loader.load(modelPath, (gltf) => {
          // Store the model in the cache
          modelCache[modelPath] = gltf.scene;
  
          // Clone the model and add it to the chunk
          const model = gltf.scene.clone();
          model.position.set(chunk.x * chunkSize, chunk.y * chunkSize, chunk.z * chunkSize);
          scene.add(model);
          chunk.modelLoaded = true;
            console.log("load model To cache and scene. done", chunk);
        });
      }
    }
}

// calculate the chunk at character position and load it to a chunkmap
function getCurrentChunk(character) {
  //console.log("get chunk coordinates function called", character.position);
  const chunkCoordinates = {
    x: Math.floor(character.position.x / chunkSize),
    y: Math.floor(character.position.y / chunkSize),
    z: Math.floor(character.position.z / chunkSize)
  };
  let chunk = chunkMap.get(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`);
  if (!chunk) {
    // If the chunk does not exist yet, create it and load model to it
    chunk = { ...chunkCoordinates };
    chunkMap.set(`${chunkCoordinates.x},${chunkCoordinates.y},${chunkCoordinates.z}`, chunk);
    loadModelIntoChunk(chunk);
      console.log("create new chunk 1 done", chunk);
  }
  return chunk;
}

// Chunk settings
const CHUNK_DISTANCE = 1; // Number of chunks in each direction to load
let lastChunkPosition = null;

// Function to update the scene based on the character position and addtional chunks
function updateChunks(character) {
  //console.log("update chunks function called");
  const currentChunk = getCurrentChunk(character);

  if (lastChunkPosition && lastChunkPosition.x === currentChunk.x && lastChunkPosition.y === currentChunk.y && lastChunkPosition.z === currentChunk.z) {
    // The character is still in the same chunk, so no need to update
    return;
  }
  lastChunkPosition = { ...currentChunk }; // update last known chunk position

  // Look for new chunks to load
  for (let x = currentChunk.x - CHUNK_DISTANCE; x <= currentChunk.x + CHUNK_DISTANCE; x++) {
    for (let y = currentChunk.y - CHUNK_DISTANCE; y <= currentChunk.y + CHUNK_DISTANCE; y++) {
      for (let z = currentChunk.z - CHUNK_DISTANCE; z <= currentChunk.z + CHUNK_DISTANCE; z++) {
        // Skip the loop if z is not zero
        if (z != 0) continue;
        
        let chunk = chunkMap.get(`${x},${y},${z}`);
        if (!chunk) {
          // If the chunk does not exist yet, create it
          chunk = { x, y, z };
          chunkMap.set(`${x},${y},${z}`, chunk);
            console.log("create new chunk 2 done", chunk);
        }
        loadModelIntoChunk(chunk);
          console.log("update  1 function done", chunk);
      }
        console.log("update  2 (z) function done");
    }
    console.log("update  3 (y) function done");
  }
  // Refresh the scene if necessary
  console.log("update  4 (x) function done");
}

// Controls setup
controls.movementSpeed = 30; // Adjust to your liking
controls.lookSpeed = 0; // Adjust to your liking
const rotationSpeed = 0.01; // How fast the character rotates to face the camera direction
let pointerLocked = false;

document.addEventListener('pointerlockchange', function() {
  if (document.pointerLockElement === document.body) {
    // The pointer is locked, increase the look speed
    controls.lookSpeed = 0.1;
    pointerLocked = true;
  } else {
    // The pointer is not locked, set the look speed to 0
    controls.lookSpeed = 0;
    pointerLocked = false;
  }
}, false);

document.addEventListener('keydown', function(event) {
  if (event.code === 'ControlLeft' || event.code === 'ControlRight') {
    if (pointerLocked) {
      // If the pointer is currently locked, unlock it
      document.exitPointerLock();
    } else {
      // If the pointer is not currently locked, lock it
      document.body.requestPointerLock();
    }
  }
});

function update() {
  // First, we'll calculate the character's forward direction
  const forward = new THREE.Vector3(0, 0, -1);
  forward.applyQuaternion(character.quaternion);
  forward.normalize();

  // Next, we calculate the direction the camera is looking
  const cameraDirection = new THREE.Vector3(0, 0, -1);
  cameraDirection.applyQuaternion(camera.quaternion);
  cameraDirection.normalize();

  // Now we calculate the angle between the forward direction and camera direction
  const angle = forward.angleTo(cameraDirection);

  // If the angle is more than 5 degrees, we start rotating the character
  if (angle > 5 * Math.PI / 180) {
    // We calculate the cross product of the forward and camera direction
    // This gives us a vector that is perpendicular to the two vectors, and its
    // direction tells us whether we need to rotate left or right
    const cross = forward.cross(cameraDirection);

    // We rotate the character around the Y axis, at the specified speed and direction
    character.rotateY(rotationSpeed * Math.sign(cross.y));
  }

  controls.update(clock.getDelta());
}

/* Collisions V0.1.1
function update() {
  // Get the character's next position
  const nextPosition = character.position.clone();

  // Check if the next position intersects with any object
  let collision = false;
  scene.traverse(object => {
      if (object.isMesh) {
          // Generate a raycaster from the current position to the next position
          const direction = nextPosition.clone().sub(character.position).normalize();
          const raycaster = new THREE.Raycaster(character.position, direction);

          // Check if the ray intersects with the object
          const intersections = raycaster.intersectObject(object);
          if (intersections.length > 0) {
              collision = true;
          }
      }
  });

  // If there's a collision, prevent the controls from moving
  if (collision) {
    console.log("collision on function called")
      controls.movementSpeed = 1;
  } else {
    //console.log("collision off function called")
      controls.movementSpeed = 10;
  }

  controls.update(clock.getDelta());
}
*/

// Animation loop
function animate() {
  //console.log("animate function called");  // This will print to the console every time animate is called
  requestAnimationFrame(animate);

  // Update the control
  //controls.update();

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
