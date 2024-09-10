import * as THREE from '../../lib/three.module.js';

// WebGPU setup for wavefunction calculations
async function initWebGPU() {
    // Request WebGPU adapter and device
    const adapter = await navigator.gpu.requestAdapter();
    const device = await adapter.requestDevice();

    // Fetch WGSL shader code
    const response = await fetch('electronWave.wgsl');
    const shaderCode = await response.text();

    // Create shader module
    const shaderModule = device.createShaderModule({
        code: shaderCode,
    });

    // Create a buffer to store probabilities (the output from the shader)
    const probabilitiesBuffer = device.createBuffer({
        size: 1024 * 4, // Space for 1024 floats (we may adjust this later)
        usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_SRC,
    });

    // Create compute pipeline
    const computePipeline = device.createComputePipeline({
        compute: {
            module: shaderModule,
            entryPoint: "main",  // Entry point in WGSL shader
        },
    });

    // Set up bind group to pass the buffer to the shader
    const bindGroup = device.createBindGroup({
        layout: computePipeline.getBindGroupLayout(0),
        entries: [
            {
                binding: 0,
                resource: {
                    buffer: probabilitiesBuffer,
                },
            },
        ],
    });

    return { device, computePipeline, bindGroup, probabilitiesBuffer };
}

async function startSimulation() {
    const { device, computePipeline, bindGroup, probabilitiesBuffer } = await initWebGPU();
    const wasmModule = await initWebAssembly();
    
    const canvas = document.getElementById('simulationCanvas');
    const renderer = new THREE.WebGLRenderer({ canvas });
    renderer.setSize(window.innerWidth, window.innerHeight);

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 1000);
    camera.position.z = 5;

    // Create nucleus (just for visualization)
    const nucleusGeometry = new THREE.SphereGeometry(0.2, 16, 16);
    const nucleusMaterial = new THREE.MeshBasicMaterial({ color: 0xff0000 });
    const nucleus = new THREE.Mesh(nucleusGeometry, nucleusMaterial);
    scene.add(nucleus);

    // Create electron as a point
    const electronGeometry = new THREE.SphereGeometry(0.05, 16, 16);
    const electronMaterial = new THREE.MeshBasicMaterial({ color: 0x0000ff });
    const electron = new THREE.Mesh(electronGeometry, electronMaterial);
    scene.add(electron);

    // Run WebGPU compute shader to update the probabilities
    function runComputeShader() {
        const commandEncoder = device.createCommandEncoder();

        // Set up pass for running the compute shader
        const passEncoder = commandEncoder.beginComputePass();
        passEncoder.setPipeline(computePipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.dispatchWorkgroups(16); // Adjust based on workgroup size
        passEncoder.end();

        // Submit the compute commands
        device.queue.submit([commandEncoder.finish()]);

        // Get the data back from the buffer (we can copy it to the CPU)
        const readBuffer = device.createBuffer({
            size: probabilitiesBuffer.size,
            usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
        });

        commandEncoder.copyBufferToBuffer(probabilitiesBuffer, 0, readBuffer, 0, probabilitiesBuffer.size);
        device.queue.submit([commandEncoder.finish()]);

        // Map the buffer and read the data
        readBuffer.mapAsync(GPUMapMode.READ).then(() => {
            const mappedArray = new Float32Array(readBuffer.getMappedRange());
            console.log('Electron probabilities:', mappedArray);  // Debugging: See the probabilities in the console
            readBuffer.unmap();
        });
    }

    // Main render loop
    function animate() {
        renderer.render(scene, camera);

        // Run the compute shader
        runComputeShader();

        // Update electron position based on WebAssembly wavefunction collapse
        const electronPosition = new Float32Array(wasmModule.exports.memory.buffer, wasmModule.exports.get_electron_position(), 3);
        electron.position.set(electronPosition[0], electronPosition[1], electronPosition[2]);

        requestAnimationFrame(animate);
    }

    animate();
}

// Start the simulation
startSimulation();
