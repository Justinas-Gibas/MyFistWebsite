// Import Three.js
import * as THREE from '../../lib/three.module.js';

let renderer, scene, camera, electron, wasmModule;

// Initialize Three.js Renderer and Camera
const canvas = document.getElementById('simulationCanvas');
renderer = new THREE.WebGLRenderer({ canvas });
renderer.setSize(window.innerWidth, window.innerHeight);

scene = new THREE.Scene();
camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
camera.position.z = 20;

const material = new THREE.MeshBasicMaterial({ color: 0xff0000 });
const electronGeometry = new THREE.SphereGeometry(0.2, 16, 16);

// Electron setup (represented by a small sphere)
electron = new THREE.Mesh(electronGeometry, material);
electron.position.set(0, 0, 0);  // Initial position at origin
scene.add(electron);

let gpuDevice, gpuContext, gpuBindGroupLayout, gpuPipeline, gpuBindGroup, gpuCommandEncoder, gpuPassEncoder;

// Function to initialize WebAssembly
async function loadWebAssembly() {
    try {
        const response = await fetch('simulation.wasm');
        const bytes = await response.arrayBuffer();
        const results = await WebAssembly.instantiate(bytes, {});
        wasmModule = results.instance;
        wasmModule.exports.initialize_electron();
        console.log("WebAssembly loaded successfully");
    } catch (error) {
        console.error("Error loading WebAssembly:", error);
    }
}

// Function to initialize WebGPU
async function initWebGPU() {
    if (!navigator.gpu) {
        console.error("WebGPU is not supported in this browser.");
        return;
    }

    try {
        const adapter = await navigator.gpu.requestAdapter();
        gpuDevice = await adapter.requestDevice();

        const canvasContext = canvas.getContext('gpupresent');
        gpuContext = canvasContext;
        gpuContext.configure({
            device: gpuDevice,
            format: gpuContext.getPreferredFormat(adapter),
        });

        // Creating a pipeline layout
        gpuBindGroupLayout = gpuDevice.createBindGroupLayout({
            entries: []
        });

        gpuPipeline = gpuDevice.createRenderPipeline({
            layout: gpuDevice.createPipelineLayout({
                bindGroupLayouts: [gpuBindGroupLayout]
            }),
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

// Function to start the simulation
async function startSimulation() {
    await loadWebAssembly();
    await initWebGPU();
    animate();
}

// Function to update electron position (WebAssembly)
function updateElectronPosition() {
    if (wasmModule) {
        const electronPosition = new Float32Array(wasmModule.exports.memory.buffer, wasmModule.exports.get_electron_position(), 3);
        console.log("Electron positions:", electronPosition);
        electron.position.set(electronPosition[0], electronPosition[1], electronPosition[2]);
    }
}

// Function to animate the scene
function animate() {
    renderer.setAnimationLoop(() => {
        render();
        updateElectronPosition();
    });
}

// Function to render the scene
function render() {
    renderer.render(scene, camera);
    if (gpuDevice) {
        gpuCommandEncoder = gpuDevice.createCommandEncoder();
        gpuPassEncoder = gpuCommandEncoder.beginRenderPass({
            colorAttachments: [{
                view: gpuContext.getCurrentTexture().createView(),
                loadValue: { r: 0, g: 0, b: 0, a: 1 },  // Clear to black
                storeOp: 'store',
            }],
        });

        gpuPassEncoder.setPipeline(gpuPipeline);
        gpuPassEncoder.draw(3, 1, 0, 0);
        gpuPassEncoder.endPass();

        gpuDevice.queue.submit([gpuCommandEncoder.finish()]);
    }
}

// Start the simulation
startSimulation();
