import * as THREE from '../lib/three.module.js'
import { OrbitControls } from '../lib/controls/OrbitControls.js'
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js'

// Instantiate a loader
export const loader = new GLTFLoader();

// Create a scene
export const scene = new THREE.Scene();

// Create a camera and position it
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a renderer
export const renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Window resize event handler
window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight;
    camera.updateProjectionMatrix();
    renderer.setSize(window.innerWidth, window.innerHeight);
}, false);

// Add orbit controls so that we can pan around the object
export const controls = new OrbitControls(camera, renderer.domElement);
