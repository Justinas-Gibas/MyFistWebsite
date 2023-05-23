import { loader, scene, camera, renderer, controls } from './initScene.js';

// Load a glTF resource
loader.load(
  // resource URL
  '../lib/models/chunk1.gltf',
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

// Render the scene
function render() {
  requestAnimationFrame(render);
  controls.update();
  stats.update();
  renderer.render(scene, camera);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  renderer.render(scene, camera); // assuming you're rendering the scene here
  controls.update();
  stats.update();
}
animate(); // start the animation loop