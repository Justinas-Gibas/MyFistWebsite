// This file contains WebGPU related functionalities.
// It is part of the JGGame library and is used to handle WebGPU rendering and context creation.
// we ant WebGPU to be used for compiuting grid transforms 
// and other GPU related tasks.
// The code is written in JavaScript and is designed to be reused

// test the WebGPU is available in the browser
if (!navigator.gpu) {
    console.error("WebGPU is not supported in this browser.");
}


    