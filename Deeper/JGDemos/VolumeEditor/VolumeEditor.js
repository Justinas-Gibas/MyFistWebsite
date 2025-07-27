/**
 * @fileoverview 3D Volume Editor - A Three.js based voxel editor for creating and manipulating 3D grids
 * @author Justinas Gibas
 * @version 1.0.0
 */

// ============================
// IMPORTS
// ============================
import * as THREE from "three";
import { OrbitControls } from "../../lib/controls/OrbitControls.js";
import { Mesh, BoxGeometry, MeshStandardMaterial, DirectionalLight, AmbientLight } from 'three';

// ============================
// CONSTANTS AND CONFIGURATION
// ============================

/**
 * Chunk type definitions with PBR material properties
 * @readonly
 * @enum {Object}
 */
const CHUNK_TYPES = [
    { 
        name: 'empty', 
        size: 0.2, 
        color: 0xcccccc,
        roughness: 0.8,
        metalness: 0.1,
        emissive: 0x222222,
        opacity: 0.3
    },   // 0
    { 
        name: 'ground', 
        size: 1, 
        color: 0x8b4513,
        roughness: 0.9,
        metalness: 0.0,
        emissive: 0x000000,
        opacity: 1.0
    },    // 1
    { 
        name: 'air', 
        size: 1.1, 
        color: 0x0000ff,
        roughness: 1,
        metalness: 0,
        emissive: 0xaaffff,
        opacity: 0.3
    },     // 2
    
    { 
        name: 'full', 
        size: 1.1, 
        color: 0xffffff,
        roughness: 0.1,
        metalness: 0.6,
        emissive: 0x000000,
        opacity: 1.0
    }       // 3
];

/**
 * Default grid configuration
 * @readonly
 * @type {Object}
 */
const DEFAULT_GRID_SIZE = { x: 3, y: 3, z: 3 };

/**
 * Renderer configuration
 * @readonly
 * @type {Object}
 */
const RENDERER_CONFIG = {
    width: window.innerWidth * 0.9,
    height: window.innerHeight * 0.7,
    clearColor: 0x000000,
    clearAlpha: 0.5
};

// ============================
// SCENE SETUP
// ============================

/**
 * Three.js scene instance
 * @type {THREE.Scene}
 */
const scene = new THREE.Scene();

/**
 * Three.js camera instance
 * @type {THREE.PerspectiveCamera}
 */
const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);

/**
 * Three.js renderer instance
 * @type {THREE.WebGLRenderer}
 */
const renderer = new THREE.WebGLRenderer();

/**
 * OrbitControls instance for camera manipulation
 * @type {OrbitControls}
 */
const controls = new OrbitControls(camera, renderer.domElement);

/**
 * Raycaster for mouse interaction
 * @type {THREE.Raycaster}
 */
const raycaster = new THREE.Raycaster();

/**
 * Mouse position vector
 * @type {THREE.Vector2}
 */
const mouse = new THREE.Vector2();

/**
 * Initialize the Three.js scene, camera, renderer, and lighting with shadows
 */
function initializeScene() {
    // Camera setup
    camera.position.set(5, 5, 5);
    
    // Renderer setup with shadows
    renderer.setSize(RENDERER_CONFIG.width, RENDERER_CONFIG.height);
    renderer.setClearColor(RENDERER_CONFIG.clearColor, RENDERER_CONFIG.clearAlpha);
    renderer.shadowMap.enabled = true;
    renderer.shadowMap.type = THREE.PCFSoftShadowMap; // Soft shadows
    renderer.toneMapping = THREE.ACESFilmicToneMapping;
    renderer.toneMappingExposure = 1.0;
    document.getElementById("canvas-container").appendChild(renderer.domElement);
    
    // Enhanced lighting setup
    setupLighting();
}

/**
 * Sets up realistic lighting with shadows
 */
function setupLighting() {
    // Main directional light (sun)
    const directionalLight = new DirectionalLight(0xffffff, 1.2);
    directionalLight.position.set(10, 15, 5);
    directionalLight.castShadow = false;

    // Shadow camera settings for better quality
    directionalLight.shadow.mapSize.width = 2048;
    directionalLight.shadow.mapSize.height = 2048;
    directionalLight.shadow.camera.near = 0.5;
    directionalLight.shadow.camera.far = 50;
    directionalLight.shadow.camera.left = -20;
    directionalLight.shadow.camera.right = 20;
    directionalLight.shadow.camera.top = 20;
    directionalLight.shadow.camera.bottom = -20;
    directionalLight.shadow.bias = -0.0001;
    
    scene.add(directionalLight);
    
    // Ambient light for general illumination
    const ambientLight = new AmbientLight(0xffffff, 0.3); // Soft ambient
    scene.add(ambientLight);
    
    // Fill light (opposite direction, softer)
    const fillLight = new DirectionalLight(0xffffff, 0.4);
    fillLight.position.set(-5, 5, -5);
    scene.add(fillLight);
    
    // Optional: Add environment lighting
    addEnvironmentMap();
}

/**
 * Adds environment mapping for reflections
 */
function addEnvironmentMap() {
    // Create a simple environment map using a cube texture
    const pmremGenerator = new THREE.PMREMGenerator(renderer);
    
    // Create a simple gradient environment
    const renderTarget = pmremGenerator.fromScene(createEnvironmentScene());
    scene.environment = renderTarget.texture;
    
    pmremGenerator.dispose();
}

/**
 * Creates a simple environment scene for reflections
 * @returns {THREE.Scene} Environment scene
 */
function createEnvironmentScene() {
    const envScene = new THREE.Scene();
    
    // Create a sky gradient
    const skyGeometry = new THREE.SphereGeometry(100, 32, 32);
    const skyMaterial = new THREE.MeshBasicMaterial({
        color: 0xaaaaff,
        side: THREE.BackSide
    });
    const sky = new THREE.Mesh(skyGeometry, skyMaterial);
    envScene.add(sky);
    
    return envScene;
}

// ============================
// CHUNK CLASS
// ============================

/**
 * Represents a single voxel/chunk in the 3D grid
 * @class
 */
class Chunk {
    /**
     * Creates a new chunk instance
     * @param {number} x - The x-coordinate of the chunk
     * @param {number} y - The y-coordinate of the chunk
     * @param {number} z - The z-coordinate of the chunk
     * @param {number} [type=0] - The type of the chunk (0-3)
     */
    constructor(x, y, z, type = 0) {
        /**
         * X-coordinate in the grid
         * @type {number}
         */
        this.x = x;
        
        /**
         * Y-coordinate in the grid
         * @type {number}
         */
        this.y = y;
        
        /**
         * Z-coordinate in the grid
         * @type {number}
         */
        this.z = z;
        
        /**
         * Chunk type (0: empty, 1: air, 2: ground, 3: full)
         * @type {number}
         */
        this.type = type;
        
        /**
         * Three.js mesh representing this chunk
         * @type {THREE.Mesh}
         */
        this.mesh = null;
    }

    /**
     * Creates and returns a Three.js mesh for this chunk with PBR materials
     * @returns {THREE.Mesh} The mesh representation of the chunk
     */
    createChunk() {
        const geometry = new BoxGeometry(0.9, 0.9, 0.9);
        
        // Create PBR material
        const chunkType = CHUNK_TYPES[this.type];
        const material = new MeshStandardMaterial({
            color: chunkType.color,
            roughness: chunkType.roughness,
            metalness: chunkType.metalness,
            emissive: chunkType.emissive,
            transparent: chunkType.opacity < 1.0,
            opacity: chunkType.opacity
        });
        
        this.mesh = new Mesh(geometry, material);
        this.mesh.position.set(this.x, this.y, this.z);
        this.mesh.userData.chunk = this;
        
        // Enable shadows
        this.mesh.castShadow = false;
        this.mesh.receiveShadow = false;
        
        this.updateMesh();
        return this.mesh;
    }

    /**
     * Updates the mesh appearance based on the chunk's current type
     */
    updateMesh() {
        if (!this.mesh) return;
        
        const chunkType = CHUNK_TYPES[this.type];
        
        // Update scale
        this.mesh.scale.set(chunkType.size, chunkType.size, chunkType.size);
        
        // Update material properties
        this.mesh.material.color.set(chunkType.color);
        this.mesh.material.roughness = chunkType.roughness;
        this.mesh.material.metalness = chunkType.metalness;
        this.mesh.material.emissive.set(chunkType.emissive);
        this.mesh.material.opacity = chunkType.opacity;
        this.mesh.material.transparent = chunkType.opacity < 1.0;
        
        console.log(`Chunk at (${this.x}, ${this.y}, ${this.z}) type updated to: ${chunkType.name}`);
    }

    /**
     * Handles click events on this chunk - cycles through chunk types
     */
    onClick() {
        this.type = (this.type + 1) % CHUNK_TYPES.length;
        this.updateMesh();
    }
}

// ============================
// GRID MANAGEMENT
// ============================

/**
 * Current grid dimensions
 * @type {Object}
 */
let gridSize = { ...DEFAULT_GRID_SIZE };

/**
 * Map storing all chunks with coordinate-based keys
 * @type {Map<string, Chunk>}
 */
let chunkMap = new Map();

/**
 * Generates a unique key for chunk coordinates
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate  
 * @param {number} z - Z coordinate
 * @returns {string} Unique coordinate key
 */
function getChunkKey(x, y, z) {
    return `${x},${y},${z}`;
}

/**
 * Creates the initial grid of chunks with ground at Y=0
 */
function createGrid() {
    chunkMap.clear();
    
    // Clear existing chunks from scene
    scene.children = scene.children.filter(child => !child.userData.chunk);
    
    // Create new chunks with ground at bottom layer
    for (let x = 0; x < gridSize.x; x++) {
        for (let y = 0; y < gridSize.y; y++) {
            for (let z = 0; z < gridSize.z; z++) {
                // Default to ground type for bottom layer (y=0)
                const defaultType = (y === 0) ? 1 : 0;
                const chunk = new Chunk(x, y, z, defaultType);
                const mesh = chunk.createChunk();
                scene.add(mesh);
                chunkMap.set(getChunkKey(x, y, z), chunk);
            }
        }
    }
}

/**
 * Updates the grid when dimensions change - optimized to reuse existing chunks
 */
function updateGrid() {
    const newChunkMap = new Map();
    
    // Step 1: Create/keep chunks that should exist
    for (let x = 0; x < gridSize.x; x++) {
        for (let y = 0; y < gridSize.y; y++) {
            for (let z = 0; z < gridSize.z; z++) {
                const key = getChunkKey(x, y, z);
                
                if (chunkMap.has(key)) {
                    // Reuse existing chunk
                    newChunkMap.set(key, chunkMap.get(key));
                } else {
                    // Create new chunk
                    const chunk = new Chunk(x, y, z);
                    const mesh = chunk.createChunk();
                    scene.add(mesh);
                    newChunkMap.set(key, chunk);
                    console.log(`Added new chunk at (${x}, ${y}, ${z})`);
                }
            }
        }
    }
    
    // Step 2: Remove chunks that are no longer needed
    chunkMap.forEach((chunk, key) => {
        if (!newChunkMap.has(key)) {
            scene.remove(chunk.mesh);
            console.log(`Removed chunk at key: ${key}`);
        }
    });
    
    // Step 3: Update the chunk map reference
    chunkMap = newChunkMap;
}

// ============================
// USER INTERFACE
// ============================

/**
 * Creates a spinner control for adjusting grid dimensions
 * @param {string} label - Display label for the spinner
 * @param {number} initialValue - Initial numeric value
 * @param {Function} onChangeCallback - Callback function when value changes
 * @returns {Object} Object containing container and input elements
 */
function createSpinner(label, initialValue, onChangeCallback) {
    const spinnerDiv = document.createElement("div");
    spinnerDiv.className = `spinner${label}`;
    
    // Styling
    Object.assign(spinnerDiv.style, {
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "5px"
    });

    // Create label
    const labelElement = document.createElement("label");
    labelElement.textContent = label;
    Object.assign(labelElement.style, {
        color: "white",
        fontSize: "10px",
        fontWeight: "bold"
    });

    // Create input
    const textBox = document.createElement("input");
    textBox.type = "number";
    textBox.value = initialValue.toString();
    textBox.min = "1";
    textBox.max = "20";
    
    Object.assign(textBox.style, {
        width: "50px",
        textAlign: "center",
        backgroundColor: "rgba(0, 0, 0, 0.8)",
        color: "white",
        border: "1px solid #555",
        borderRadius: "4px",
        padding: "5px"
    });

    // Event handling
    textBox.onchange = () => {
        const newValue = parseInt(textBox.value);
        if (!isNaN(newValue) && newValue >= 1 && newValue <= 20) {
            onChangeCallback(newValue);
        } else {
            textBox.value = initialValue; // Reset on invalid input
        }
    };

    spinnerDiv.appendChild(labelElement);
    spinnerDiv.appendChild(textBox);

    return { container: spinnerDiv, input: textBox };
}

/**
 * Initializes the user interface controls
 */
function initializeUI() {
    const container = document.getElementById("canvas-container");
    const controlsDiv = document.createElement("div");
    
    controlsDiv.className = "controls";
    Object.assign(controlsDiv.style, {
        position: "absolute",
        width: "80vw",
        bottom: "10vh",
        left: "10vw",
        padding: "20px",
        borderRadius: "10px",
        display: "grid",
        gridTemplateColumns: "repeat(3, 1fr)",
        gap: "20px",
        justifyItems: "center",
        alignItems: "center"
    });

    // Create dimension control spinners
    const xSpinner = createSpinner("X", gridSize.x, (value) => {
        gridSize.x = value;
        console.log("X dimension changed to:", value);
        updateGrid();
    });

    const ySpinner = createSpinner("Y", gridSize.y, (value) => {
        gridSize.y = value;
        console.log("Y dimension changed to:", value);
        updateGrid();
    });

    const zSpinner = createSpinner("Z", gridSize.z, (value) => {
        gridSize.z = value;
        console.log("Z dimension changed to:", value);
        updateGrid();
    });

    // Add controls to DOM
    controlsDiv.appendChild(xSpinner.container);
    controlsDiv.appendChild(ySpinner.container);
    controlsDiv.appendChild(zSpinner.container);
    container.appendChild(controlsDiv);
}

// ============================
// EVENT HANDLING
// ============================

/**
 * Handles mouse click events for chunk interaction
 * @param {MouseEvent} event - The mouse click event
 */
function handleMouseClick(event) {
    const rect = renderer.domElement.getBoundingClientRect();
    
    // Check if click is within canvas bounds
    if (event.clientX < rect.left || event.clientX > rect.right ||
        event.clientY < rect.top || event.clientY > rect.bottom) {
        return;
    }
    
    // Calculate normalized device coordinates
    mouse.x = ((event.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((event.clientY - rect.top) / rect.height) * 2 + 1;

    // Perform raycasting
    raycaster.setFromCamera(mouse, camera);
    const intersects = raycaster.intersectObjects(scene.children);

    if (intersects.length > 0) {
        const clickedChunk = intersects[0].object;
        if (clickedChunk.userData.chunk) {
            console.log('Clicked chunk:', clickedChunk.userData.chunk);
            clickedChunk.userData.chunk.onClick();
        }
    }
}

/**
 * Handles window resize events
 */
function handleWindowResize() {
    const aspect = window.innerWidth / window.innerHeight;
    camera.aspect = aspect;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth * 0.9, window.innerHeight * 0.7);
}

/**
 * Sets up all event listeners
 */
function setupEventListeners() {
    window.addEventListener('click', handleMouseClick, false);
    window.addEventListener('resize', handleWindowResize);
}

// ============================
// ANIMATION AND RENDERING
// ============================

/**
 * Main animation loop
 */
function animate() {
    requestAnimationFrame(animate);
    controls.update();
    renderer.render(scene, camera);
}

// ============================
// INITIALIZATION
// ============================

/**
 * Initializes the entire application
 */
function init() {
    initializeScene();
    initializeUI();
    setupEventListeners();
    createGrid();
    animate();
}

// Start the application
init();

// ============================
// FUTURE ENHANCEMENTS
// ============================

/**
 * @todo Add save/load functionality for grid data
 * @todo Implement undo/redo system
 * @todo Implement chunk data export (e.g., to Uint8Array)
 * @todo Implement chunk highlighting on hover
 * @todo Make cube size responsive to mouse
 * @todo Add procedural textures for different materials
 * @todo Implement normal maps for surface detail
 * @todo Add particle effects for interaction feedback
 * @todo Implement proper material presets (wood, metal, stone, etc.)
 */
