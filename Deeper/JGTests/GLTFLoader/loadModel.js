import { loader, scene, startRendering } from './initScene.js';

// Load a glTF resource
loader.load(
  // resource URL
  '../lib/models/TimeBeast01.gltf',
  // called when the resource is loaded
  function ( gltf ) {
    scene.add( gltf.scene );
    startRendering();  // Start the rendering loop after the model is loaded
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