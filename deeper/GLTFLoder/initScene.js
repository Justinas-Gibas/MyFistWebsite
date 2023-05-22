import * as THREE from 'https://threejs.org/build/three.module.js';
import { GLTFLoader } from './deeper/lib/loaders/GLTFLoader.js';
import { OrbitControls } from './deeper/lib/controls/OrbitControls.js';

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

// Add orbit controls so that we can pan around the object
export const controls = new OrbitControls(camera, renderer.domElement);
