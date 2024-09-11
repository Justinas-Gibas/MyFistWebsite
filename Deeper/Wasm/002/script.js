let wasmModule; // Variable to store the WebAssembly module

// Step 1: Function to load and instantiate the WebAssembly module
async function loadWasm() {
    try {
        const response = await fetch('doubleSlit.wasm'); // Fetch the WASM file
        const buffer = await response.arrayBuffer(); // Convert to ArrayBuffer
        const wasmInstance = await WebAssembly.instantiate(buffer, {}); // Instantiate WASM
        wasmModule = wasmInstance.instance; // Store the instance
        console.log('WebAssembly module loaded:', wasmModule);
    } catch (error) {
        console.error('Error loading WebAssembly:', error);
    }
}

// Call the WebAssembly function (This is just to verify that WASM is working)
function testWaveFunction() {
    if (wasmModule) {
        const result = wasmModule.exports._calculate_wave(1.0, 0.5); // Example call with dummy values
        console.log('WASM Wave Function Output:', result); // Log result to verify
    } else {
        console.error('WebAssembly module is not loaded yet!');
    }
}

// Initialize the simulation
async function init() {
    await loadWasm(); // Load WASM first

    // Test the WASM function
    testWaveFunction(); // You should see a result printed to the console
}

// Call the init function to start everything
init();
