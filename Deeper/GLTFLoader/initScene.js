import * as THREE from '../lib/three.module.js'
import { OrbitControls } from '../lib/controls/OrbitControls.js'
import { GLTFLoader } from '../lib/loaders/GLTFLoader.js'
import { RGBELoader } from '../lib/loaders/RGBELoader.js'
import Stats from '../lib/libs/stats.module.js'

// Instantiate a loader
export const loader = new GLTFLoader();

// Create a scene
export const scene = new THREE.Scene();

// Create a camera and position it
export const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;
camera.position.y = 1;

// Background texture
export const backgroundloader = new RGBELoader()
.load('../lib/images/potw2046a360.hdr', function(texture) {
    texture.maping = THREE.EquirectangularReflectionMapping;
    scene.background = texture;
    scene.environment = texture;
});

// Add an ambient light
const ambientLight = new THREE.AmbientLight(0xffffff); // soft white light
scene.add(ambientLight);

// Add a point light
const pointLight = new THREE.PointLight(0xffffff, 1, 100);
pointLight.position.set(0, -1, 0); // you can change the position as you need
scene.add(pointLight);

// Create a renderer
export const renderer = new THREE.WebGLRenderer();
let width = window.innerWidth * 0.9;  // 80% of the viewport width
let height = window.innerHeight * 0.7; // 80% of the viewport height
renderer.setSize(width, height);

// Add the renderer's canvas to the body
//document.body.appendChild(renderer.domElement);

// Add the renderer's canvas to the div with id "canvas-container"
const canvasContainer = document.getElementById('canvas-container');
canvasContainer.appendChild(renderer.domElement);

// Create a stats instance
export const stats = new Stats();
document.body.appendChild(stats.dom);

// Window resize event handler
window.addEventListener('resize', () => {
    let width = window.innerWidth * 0.9;
    let height = window.innerHeight * 0.7;
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    renderer.setSize(width, height);
}, false);

// Add orbit controls so that we can pan around the object
export const controls = new OrbitControls(camera, renderer.domElement);

// Function to start rendering the scene
export function startRendering() {
    function render() {
        requestAnimationFrame(render);
        controls.update();
        renderer.render(scene, camera);
        stats.update();
    }
    // Render the scene
    render();
}