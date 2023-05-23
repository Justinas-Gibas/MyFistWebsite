import * as THREE from '../lib/three.module.js'
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js'
import { OrbitControls } from '../lib/controls/OrbitControls.js'
import Stats from '../lib/libs/stats.module.js'

// Instantiate a loader
export const loader = new GLTFLoader();

// Create a scene
export const scene = new THREE.Scene();

// Create a camera and position it
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Add an ambient light
const ambientLight = new THREE.AmbientLight(0x404040); // soft white light
scene.add(ambientLight);

// Add a point light
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, 0, 5); // you can change the position as you need
scene.add(pointLight);

// Create a renderer
export const renderer = new THREE.WebGLRenderer();
let width = window.innerWidth * 0.8;  // 80% of the viewport width
let height = window.innerHeight * 0.8; // 80% of the viewport height
renderer.setSize(width, height);
document.body.appendChild(renderer.domElement);

// Create a stats instance
const stats = new Stats();
document.body.appendChild(stats.dom);

// Window resize event handler
window.addEventListener('resize', () => {
    let width = window.innerWidth * 0.8;
    let height = window.innerHeight * 0.8;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}, false);

// Add orbit controls so that we can pan around the object
export const controls = new OrbitControls(camera, renderer.domElement);
