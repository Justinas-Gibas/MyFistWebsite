/**
 * Compute Shader Feature Module
 * This module demonstrates how to use compute shaders in WebGPU
 */

/**
 * Sets up a compute shader demonstration
 * @param {GPUDevice} device - The WebGPU device
 * @returns {Object} - Controller for the compute shader demo
 */
export async function setupCompute(device) {
    // Get canvas and context for rendering
    const canvas = document.getElementById('canvas');
    const context = canvas.getContext('webgpu');
    const format = navigator.gpu.getPreferredCanvasFormat();
    
    // Create texture for computation result
    const textureWidth = canvas.width;
    const textureHeight = canvas.height;
    
    const resultTexture = device.createTexture({
        size: [textureWidth, textureHeight],
        format: format,
        usage: GPUTextureUsage.COPY_DST | GPUTextureUsage.STORAGE_BINDING | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.RENDER_ATTACHMENT
    });
    
    // Create a compute shader that generates a dynamic pattern
    const computeShaderCode = `
        @group(0) @binding(0) var output_texture : texture_storage_2d<${format}, write>;
        
        struct Uniforms {
            time: f32,
            width: f32,
            height: f32,
            seed: f32,
        }
        
        @group(0) @binding(1) var<uniform> uniforms : Uniforms;
        
        // Helper function to generate pseudorandom numbers
        fn random(st: vec2<f32>) -> f32 {
            return fract(sin(dot(st, vec2<f32>(12.9898, 78.233))) * 43758.5453);
        }
        
        // Helper function to create noise pattern
        fn noise(st: vec2<f32>) -> f32 {
            let i = floor(st);
            let f = fract(st);
            
            // Four corners in 2D of a tile
            let a = random(i);
            let b = random(i + vec2<f32>(1.0, 0.0));
            let c = random(i + vec2<f32>(0.0, 1.0));
            let d = random(i + vec2<f32>(1.0, 1.0));
            
            // Smooth interpolation
            let u = f * f * (3.0 - 2.0 * f);
            
            // Mix the four corners
            return mix(a, b, u.x) + 
                   (c - a) * u.y * (1.0 - u.x) + 
                   (d - b) * u.x * u.y;
        }
        
        @compute @workgroup_size(8, 8)
        fn main(@builtin(global_invocation_id) id : vec3<u32>) {
            // Get the pixel coordinates
            let pixel = vec2<i32>(id.xy);
            let dims = vec2<f32>(uniforms.width, uniforms.height);
            
            // Check if within bounds
            if (pixel.x >= i32(uniforms.width) || pixel.y >= i32(uniforms.height)) {
                return;
            }
            
            // Create UV coordinates
            let uv = vec2<f32>(f32(pixel.x) / dims.x, f32(pixel.y) / dims.y);
            
            // Create a dynamic pattern using noise and time
            let t = uniforms.time * 0.2;
            
            // Create multiple noise layers
            let noise1 = noise((uv + t) * 5.0);
            let noise2 = noise((uv - t * 0.5) * 10.0);
            let noise3 = noise((uv + vec2<f32>(sin(t), cos(t))) * 2.0);
            
            // Combine noise layers
            let combined = (noise1 * 0.5 + noise2 * 0.3 + noise3 * 0.2);
            
            // Create a circular pattern
            let center = vec2<f32>(0.5, 0.5);
            let dist = distance(uv, center);
            let circle = smoothstep(0.3 + sin(t) * 0.1, 0.31 + sin(t) * 0.1, dist);
            
            // Create colors
            let r = combined * abs(sin(t * 0.5));
            let g = combined * abs(cos(t * 0.4));
            let b = combined * abs(sin(t * 0.3) * cos(t * 0.3));
            
            // Apply the circle mask
            let color = vec4<f32>(r, g, b, 1.0) * (1.0 - circle);
            
            // Output to texture
            textureStore(output_texture, pixel, color);
        }
    `;
    
    // Compile the compute shader
    const computeShaderModule = device.createShaderModule({
        code: computeShaderCode
    });
    
    // Create uniform buffer for time and dimensions
    const uniformBuffer = device.createBuffer({
        size: 4 * 4, // 4 floats (time, width, height, seed)
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
    });
    
    // Create bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.COMPUTE,
                storageTexture: {
                    access: 'write-only',
                    format: format,
                    viewDimension: '2d'
                }
            },
            {
                binding: 1,
                visibility: GPUShaderStage.COMPUTE,
                buffer: {
                    type: 'uniform'
                }
            }
        ]
    });
    
    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });
    
    // Create compute pipeline
    const computePipeline = device.createComputePipeline({
        layout: pipelineLayout,
        compute: {
            module: computeShaderModule,
            entryPoint: 'main'
        }
    });
    
    // Create bind group
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: resultTexture.createView()
            },
            {
                binding: 1,
                resource: {
                    buffer: uniformBuffer
                }
            }
        ]
    });
    
    // Create a simple render pipeline to display the texture
    const vertexShaderCode = `
        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
            var positions = array<vec2<f32>, 6>(
                // First triangle (bottom-left, bottom-right, top-left)
                vec2<f32>(-1.0, -1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(-1.0, 1.0),
                
                // Second triangle (top-left, bottom-right, top-right)
                vec2<f32>(-1.0, 1.0),
                vec2<f32>(1.0, -1.0),
                vec2<f32>(1.0, 1.0)
            );
            
            return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
        }
    `;
    
    const fragmentShaderCode = `
        @group(0) @binding(0) var resultTexture: texture_2d<f32>;
        @group(0) @binding(1) var textureSampler: sampler;
        
        @fragment
        fn main(@builtin(position) position: vec4<f32>) -> @location(0) vec4<f32> {
            let texCoord = vec2<f32>(position.x / ${textureWidth}.0, 1.0 - position.y / ${textureHeight}.0);
            return textureSample(resultTexture, textureSampler, texCoord);
        }
    `;
    
    // Compile the render shaders
    const vertexShaderModule = device.createShaderModule({
        code: vertexShaderCode
    });
    
    const fragmentShaderModule = device.createShaderModule({
        code: fragmentShaderCode
    });
    
    // Create sampler for rendering
    const renderSampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear'
    });
    
    // Create render bind group layout
    const renderBindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            }
        ]
    });
    
    // Create render pipeline layout
    const renderPipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [renderBindGroupLayout]
    });
    
    // Create render pipeline
    const renderPipeline = device.createRenderPipeline({
        layout: renderPipelineLayout,
        vertex: {
            module: vertexShaderModule,
            entryPoint: 'main'
        },
        fragment: {
            module: fragmentShaderModule,
            entryPoint: 'main',
            targets: [{ format }]
        },
        primitive: {
            topology: 'triangle-list'
        }
    });
    
    // Create render bind group
    const renderBindGroup = device.createBindGroup({
        layout: renderBindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: resultTexture.createView()
            },
            {
                binding: 1,
                resource: renderSampler
            }
        ]
    });
    
    // Animation variables
    let animationFrameId = null;
    let startTime = performance.now();
    let seed = Math.random() * 100;
    
    // Animation function
    function animate() {
        // Calculate time in seconds
        const now = performance.now();
        const time = (now - startTime) / 1000;
        
        // Update uniform buffer with time and dimensions
        const uniforms = new Float32Array([time, textureWidth, textureHeight, seed]);
        device.queue.writeBuffer(uniformBuffer, 0, uniforms);
        
        // Create command encoder
        const commandEncoder = device.createCommandEncoder();
        
        // Compute pass - run the compute shader
        const computePass = commandEncoder.beginComputePass();
        computePass.setPipeline(computePipeline);
        computePass.setBindGroup(0, bindGroup);
        
        // Dispatch workgroups to cover the entire texture
        // 8x8 is the workgroup size, so we need (width/8) x (height/8) workgroups
        computePass.dispatchWorkgroups(
            Math.ceil(textureWidth / 8),
            Math.ceil(textureHeight / 8)
        );
        computePass.end();
        
        // Render pass - display the texture
        const renderPassDescriptor = {
            colorAttachments: [
                {
                    view: context.getCurrentTexture().createView(),
                    loadOp: 'clear',
                    clearValue: { r: 0, g: 0, b: 0, a: 1 },
                    storeOp: 'store'
                }
            ]
        };
        
        const renderPass = commandEncoder.beginRenderPass(renderPassDescriptor);
        renderPass.setPipeline(renderPipeline);
        renderPass.setBindGroup(0, renderBindGroup);
        renderPass.draw(6); // Draw 6 vertices (2 triangles forming a quad)
        renderPass.end();
        
        // Submit the commands
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
        
        // Request the next frame
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Return controller
    return {
        stop: () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        },
        resume: () => {
            if (animationFrameId === null) {
                startTime = performance.now();
                animationFrameId = requestAnimationFrame(animate);
            }
        },
        regenerate: () => {
            seed = Math.random() * 100;
        }
    };
}