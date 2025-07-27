let gpuDevice, gpuContext, gpuPipeline, wasmModule;
let vertexBuffer, uniformBuffer;
let time = 0;
let speed = 1.0; // Default speed

// Function to load the WebAssembly module
async function loadWasm() {
    try {
        const response = await fetch('./doubleSlit.wasm');
        if (!response.ok) throw new Error("Failed to load WASM file");
        const bytes = await response.arrayBuffer();
        const module = await WebAssembly.instantiate(bytes);
        wasmModule = module.instance.exports;
        console.log("WASM loaded successfully, available functions:", Object.keys(wasmModule));
        return wasmModule;
    } catch (error) {
        console.error("Error loading WASM:", error);
    }
}

// Step 2: Initialize WebGPU
async function initWebGPU() {
    if (!navigator.gpu) {
        console.error("WebGPU is not supported in this browser.");
        return;
    }

    try {
        const adapter = await navigator.gpu.requestAdapter();
        gpuDevice = await adapter.requestDevice();

        const canvas = document.getElementById('simulationCanvas');
        canvas.width = 800;
        canvas.height = 600;
        
        const gpuCanvasContext = canvas.getContext('webgpu');
        gpuContext = gpuCanvasContext;
        gpuContext.configure({
            device: gpuDevice,
            format: navigator.gpu.getPreferredCanvasFormat(),
        });

        // Create vertex buffer for wave points
        const numPoints = 200;
        const vertices = new Float32Array(numPoints * 4); // x, y for each point, 2 points per line segment
        for (let i = 0; i < numPoints; i++) {
            const x = (i / (numPoints - 1)) * 2 - 1; // -1 to 1
            vertices[i * 4] = x;
            vertices[i * 4 + 1] = 0; // y will be updated by WASM
            vertices[i * 4 + 2] = x;
            vertices[i * 4 + 3] = 0;
        }

        vertexBuffer = gpuDevice.createBuffer({
            size: vertices.byteLength,
            usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        });

        // Create uniform buffer for time
        uniformBuffer = gpuDevice.createBuffer({
            size: 16, // vec4 alignment
            usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
        });

        // Creating a pipeline for wave visualization
        gpuPipeline = gpuDevice.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: gpuDevice.createShaderModule({
                    code: `
                        struct VertexOutput {
                            @builtin(position) position: vec4<f32>,
                        }

                        @vertex
                        fn main(@location(0) pos: vec2<f32>) -> VertexOutput {
                            var output: VertexOutput;
                            output.position = vec4<f32>(pos, 0.0, 1.0);
                            return output;
                        }
                    `,
                }),
                entryPoint: 'main',
                buffers: [{
                    arrayStride: 8,
                    attributes: [{
                        shaderLocation: 0,
                        offset: 0,
                        format: 'float32x2'
                    }]
                }]
            },
            fragment: {
                module: gpuDevice.createShaderModule({
                    code: `
                        @fragment
                        fn main() -> @location(0) vec4<f32> {
                            return vec4<f32>(0.0, 1.0, 1.0, 1.0); // Cyan color for wave
                        }
                    `,
                }),
                entryPoint: 'main',
                targets: [{
                    format: navigator.gpu.getPreferredCanvasFormat(),
                }]
            },
            primitive: {
                topology: 'line-strip',
            },
        });

        console.log("WebGPU initialized successfully");

    } catch (error) {
        console.error("Error initializing WebGPU:", error);
    }
}

// Function to update wave data using WASM
function updateWaveData() {
    if (!wasmModule || !wasmModule.calculate_wave) return;

    const numPoints = 200;
    const vertices = new Float32Array(numPoints * 2);
    
    for (let i = 0; i < numPoints; i++) {
        const x = (i / (numPoints - 1)) * 2 - 1; // -1 to 1
        const position = i * 0.1; // Scale for wave calculation
        const y = wasmModule.calculate_wave(position, time) * 0.5; // Scale amplitude
        
        vertices[i * 2] = x;
        vertices[i * 2 + 1] = y;
    }

    // Update the vertex buffer with new wave data
    gpuDevice.queue.writeBuffer(vertexBuffer, 0, vertices);
}

// Render the wave using WebGPU
function renderWebGPU() {
    if (!gpuDevice || !gpuPipeline) return;

    updateWaveData();

    const commandEncoder = gpuDevice.createCommandEncoder();
    const renderPassDescriptor = {
        colorAttachments: [{
            view: gpuContext.getCurrentTexture().createView(),
            clearValue: { r: 0.1, g: 0.1, b: 0.2, a: 1.0 }, // Dark blue background
            loadOp: 'clear',
            storeOp: 'store',
        }],
    };

    const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
    passEncoder.setPipeline(gpuPipeline);
    passEncoder.setVertexBuffer(0, vertexBuffer);
    passEncoder.draw(200, 1, 0, 0); // Draw wave line
    passEncoder.end();

    gpuDevice.queue.submit([commandEncoder.finish()]);
}

// Animation loop
function animate() {
    time += 0.05 * speed; // Use speed variable to control animation speed
    renderWebGPU();
    requestAnimationFrame(animate);
}

// Function to setup UI controls
function setupControls() {
    const speedSlider = document.getElementById('speed');
    if (speedSlider) {
        // Set initial value
        speedSlider.value = speed;
        
        // Add event listener for slider changes
        speedSlider.addEventListener('input', (event) => {
            speed = parseFloat(event.target.value);
            console.log(`Speed set to: ${speed}`);
        });
        
        console.log("Speed control initialized");
    } else {
        console.warn("Speed slider not found in HTML");
    }
}

// Update the init function to include WebGPU initialization
async function init() {
    await loadWasm(); // Load WASM first
    await initWebGPU(); // Initialize WebGPU after
    setupControls(); // Setup UI controls

    if (wasmModule && gpuDevice) {
        console.log("Starting wave animation using WASM calculate_wave function");
        animate(); // Start the animation loop
    } else {
        console.error("Failed to initialize WASM or WebGPU");
    }
}

// Start the simulation
init();
