let gpuDevice, gpuContext, gpuPipeline;

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
        const gpuCanvasContext = canvas.getContext('gpupresent');
        gpuContext = gpuCanvasContext;
        gpuContext.configure({
            device: gpuDevice,
            format: gpuContext.getPreferredFormat(adapter),
        });

        // Creating a simple pipeline layout for WebGPU
        gpuPipeline = gpuDevice.createRenderPipeline({
            layout: 'auto',
            vertex: {
                module: gpuDevice.createShaderModule({
                    code: `
                        @stage(vertex)
                        fn main(@builtin(vertex_index) VertexIndex: u32) -> @builtin(position) vec4<f32> {
                            var positions = array<vec2<f32>, 3>(
                                vec2<f32>(0.0, 0.5),
                                vec2<f32>(-0.5, -0.5),
                                vec2<f32>(0.5, -0.5)
                            );
                            return vec4<f32>(positions[VertexIndex], 0.0, 1.0);
                        }
                    `,
                }),
                entryPoint: 'main'
            },
            fragment: {
                module: gpuDevice.createShaderModule({
                    code: `
                        @stage(fragment)
                        fn main() -> @location(0) vec4<f32> {
                            return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red Color
                        }
                    `,
                }),
                entryPoint: 'main',
                targets: [{
                    format: gpuContext.getPreferredFormat(adapter),
                }]
            },
            primitive: {
                topology: 'triangle-list',
            },
        });

        console.log("WebGPU initialized successfully");

    } catch (error) {
        console.error("Error initializing WebGPU:", error);
    }
}

// Render a simple shape (triangle) using WebGPU
function renderWebGPU() {
    if (gpuDevice) {
        const commandEncoder = gpuDevice.createCommandEncoder();
        const renderPassDescriptor = {
            colorAttachments: [{
                view: gpuContext.getCurrentTexture().createView(),
                loadValue: { r: 0, g: 0, b: 0, a: 1.0 }, // Clear to black
                storeOp: 'store',
            }],
        };

        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(gpuPipeline);
        passEncoder.draw(3, 1, 0, 0); // Draw 1 triangle
        passEncoder.endPass();

        gpuDevice.queue.submit([commandEncoder.finish()]);
    }
}

// Update the init function to include WebGPU initialization
async function init() {
    await loadWasm(); // Load WASM first
    await initWebGPU(); // Initialize WebGPU after

    // Test the WebGPU rendering
    renderWebGPU();
}

// Start the simulation
init();
