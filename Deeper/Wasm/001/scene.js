import * as THREE from 'three';
import { OrbitControls } from 'OrbitControls';

let scene, camera, renderer, plane, controls;
let initialWidthSegments = 32;
let initialHeightSegments = 32;

// Scene setup
scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
document.body.appendChild(renderer.domElement);

// OrbitControls setup
controls = new OrbitControls(camera, renderer.domElement);
controls.enableDamping = true;
controls.dampingFactor = 0.05;
controls.screenSpacePanning = false;

// Plane setup with wireframe
let geometry = new THREE.PlaneGeometry(5, 5, initialWidthSegments, initialHeightSegments);
const material = new THREE.MeshBasicMaterial({ color: 0x00ff00, wireframe: true });
plane = new THREE.Mesh(geometry, material);
plane.rotation.x = Math.PI / 2; // Rotate plane to make it horizontal
scene.add(plane);

// Camera position
camera.position.z = 5;

// Responsive window resize
window.addEventListener('resize', () => {
  const width = window.innerWidth;
  const height = window.innerHeight;
  renderer.setSize(width, height);
  camera.aspect = width / height;
  camera.updateProjectionMatrix();
});

// Export functions to be used in controls.js
export { scene, plane, camera, renderer, controls, initialWidthSegments, initialHeightSegments };

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  controls.update(); // Only if damping is enabled
  renderer.render(scene, camera);
}
animate();
