// Select all links with the .nav-link class
const navLinks = document.querySelectorAll('.nav-link');

// Add a click event listener to each link
navLinks.forEach(link => {
  link.addEventListener('click', (e) => {
    // Prevent the default link behavior
    e.preventDefault();

    // Get the target section from the link href attribute
    const targetSection = document.querySelector(link.getAttribute('href'));

    // Scroll smoothly to the target section
    targetSection.scrollIntoView({
      behavior: 'smooth'
    });
  });
});

const wrapper = document.querySelector('.wrapper');

window.addEventListener('scroll', () => {
  const scrollPosition = window.pageYOffset;
  wrapper.style.transform = `translateY(${scrollPosition * 0.5}px)`;
});

// Import the GLTFLoader from the three.js library
import { GLTFLoader } from './lib/GLTFLoader.js';

// Create a new Three.js scene
var scene = new THREE.Scene();

// Create a new camera and position it
var camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 5;

// Create a new renderer and add it to the page
var renderer = new THREE.WebGLRenderer();
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// Load the .gltf file using the GLTFLoader
var loader = new GLTFLoader();
loader.load('.models.chunk1.gltf', function(gltf) {
  // Add the loaded model to the scene
  scene.add(gltf.scene);
});

// Render the scene
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera);
}
animate();