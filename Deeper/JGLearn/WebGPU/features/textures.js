/**
 * Textures Feature Module
 * This module demonstrates how to use textures in WebGPU
 */

import { createTexture, uploadToTexture, createBuffer } from '../core/webgpu.js';

/**
 * Sets up texture mapping for a rendered triangle
 * @param {GPUDevice} device - The WebGPU device
 * @param {Object} renderer - The triangle renderer object
 * @returns {Object} - Controller for the texture demo
 */
export async function setupTextures(device, renderer) {
    // Create a quad with texture coordinates (replacing the triangle)
    const vertices = new Float32Array([
        // positions (x, y, z)     // texture coordinates (u, v)
        -0.5, -0.5, 0.0,          0.0, 1.0,
         0.5, -0.5, 0.0,          1.0, 1.0,
        -0.5,  0.5, 0.0,          0.0, 0.0,
        
        -0.5,  0.5, 0.0,          0.0, 0.0,
         0.5, -0.5, 0.0,          1.0, 1.0,
         0.5,  0.5, 0.0,          1.0, 0.0
    ]);
    
    // Create vertex buffer
    const vertexBuffer = device.createBuffer({
        size: vertices.byteLength,
        usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
        mappedAtCreation: true
    });
    
    // Write data to buffer
    new Float32Array(vertexBuffer.getMappedRange()).set(vertices);
    vertexBuffer.unmap();
    
    // Create a texture - first we'll create a procedural texture
    const textureWidth = 256;
    const textureHeight = 256;
    const texture = device.createTexture({
        size: [textureWidth, textureHeight],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    
    // Create procedural texture data (a simple checkerboard pattern)
    const textureData = new Uint8Array(textureWidth * textureHeight * 4);
    for (let y = 0; y < textureHeight; y++) {
        for (let x = 0; x < textureWidth; x++) {
            const i = (y * textureWidth + x) * 4;
            const isBlack = (Math.floor(x / 32) + Math.floor(y / 32)) % 2 === 0;
            
            if (isBlack) {
                textureData[i] = 0;     // R
                textureData[i+1] = 0;   // G
                textureData[i+2] = 0;   // B
                textureData[i+3] = 255; // A
            } else {
                // Create a gradient across the texture
                const r = Math.floor(255 * (x / textureWidth));
                const g = Math.floor(255 * (y / textureHeight));
                const b = Math.floor(255 * 0.5);
                
                textureData[i] = r;     // R
                textureData[i+1] = g;   // G
                textureData[i+2] = b;   // B
                textureData[i+3] = 255; // A
            }
        }
    }
    
    // Upload texture data to the GPU
    device.queue.writeTexture(
        { texture },
        textureData,
        { bytesPerRow: textureWidth * 4 },
        [textureWidth, textureHeight]
    );
    
    // Create sampler
    const sampler = device.createSampler({
        magFilter: 'linear',
        minFilter: 'linear',
        mipmapFilter: 'linear',
        addressModeU: 'repeat',
        addressModeV: 'repeat',
    });
    
    // Create bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [
            {
                binding: 0,
                visibility: GPUShaderStage.FRAGMENT,
                sampler: {}
            },
            {
                binding: 1,
                visibility: GPUShaderStage.FRAGMENT,
                texture: {}
            }
        ]
    });
    
    // Create bind group
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [
            {
                binding: 0,
                resource: sampler
            },
            {
                binding: 1,
                resource: texture.createView()
            }
        ]
    });
    
    // Create pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });
    
    // Create vertex shader
    const vertexShaderCode = `
        struct VertexOutput {
            @builtin(position) position: vec4<f32>,
            @location(0) texCoord: vec2<f32>
        }
        
        @vertex
        fn main(
            @location(0) position: vec3<f32>,
            @location(1) texCoord: vec2<f32>
        ) -> VertexOutput {
            var output: VertexOutput;
            output.position = vec4<f32>(position, 1.0);
            output.texCoord = texCoord;
            return output;
        }
    `;
    
    // Create fragment shader
    const fragmentShaderCode = `
        @group(0) @binding(0) var texSampler: sampler;
        @group(0) @binding(1) var tex: texture_2d<f32>;
        
        @fragment
        fn main(@location(0) texCoord: vec2<f32>) -> @location(0) vec4<f32> {
            return textureSample(tex, texSampler, texCoord);
        }
    `;
    
    // Compile shaders
    const vertexShader = device.createShaderModule({
        code: vertexShaderCode
    });
    
    const fragmentShader = device.createShaderModule({
        code: fragmentShaderCode
    });
    
    // Vertex buffer layout
    const vertexBufferLayout = {
        arrayStride: 5 * 4, // 5 floats, 4 bytes each
        attributes: [
            {
                // Position
                shaderLocation: 0,
                offset: 0,
                format: 'float32x3'
            },
            {
                // Texture coordinates
                shaderLocation: 1,
                offset: 3 * 4, // After the position
                format: 'float32x2'
            }
        ]
    };
    
    // Create pipeline
    const format = navigator.gpu.getPreferredCanvasFormat();
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexShader,
            entryPoint: 'main',
            buffers: [vertexBufferLayout]
        },
        fragment: {
            module: fragmentShader,
            entryPoint: 'main',
            targets: [{ format }]
        },
        primitive: {
            topology: 'triangle-list'
        }
    });
    
    // Create render pass descriptor
    const renderPassDescriptor = {
        colorAttachments: [
            {
                view: undefined, // Will be set in render loop
                clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                loadOp: 'clear',
                storeOp: 'store'
            }
        ]
    };
    
    // Animation variables
    let animationFrameId = null;
    let rotation = 0;
    const rotationSpeed = 0.01;
    
    // Animation function
    function animate() {
        // Rotate the texture coordinates
        rotation += rotationSpeed;
        
        // Get context and texture view
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('webgpu');
        const textureView = context.getCurrentTexture().createView();
        renderPassDescriptor.colorAttachments[0].view = textureView;
        
        // Create a command encoder
        const commandEncoder = device.createCommandEncoder();
        
        // Create a render pass
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setVertexBuffer(0, vertexBuffer);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(6); // Draw 6 vertices (2 triangles forming a quad)
        passEncoder.end();
        
        // Submit the commands
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
        
        // Request the next frame
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
    // Load a real texture from URL
    async function loadImageTexture(url) {
        try {
            // Fetch the image
            const response = await fetch(url);
            const blob = await response.blob();
            const imageBitmap = await createImageBitmap(blob);
            
            // Create a new texture
            const newTexture = device.createTexture({
                size: [imageBitmap.width, imageBitmap.height],
                format: 'rgba8unorm',
                usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
            });
            
            // Copy the image to the texture
            device.queue.copyExternalImageToTexture(
                { source: imageBitmap },
                { texture: newTexture },
                [imageBitmap.width, imageBitmap.height]
            );
            
            // Create a new bind group with the new texture
            const newBindGroup = device.createBindGroup({
                layout: bindGroupLayout,
                entries: [
                    {
                        binding: 0,
                        resource: sampler
                    },
                    {
                        binding: 1,
                        resource: newTexture.createView()
                    }
                ]
            });
            
            // Update the bind group
            bindGroup = newBindGroup;
            
            return true;
        } catch (error) {
            console.error("Failed to load texture:", error);
            return false;
        }
    }
    
    // Return a controller object
    return {
        stop: () => {
            if (animationFrameId !== null) {
                cancelAnimationFrame(animationFrameId);
                animationFrameId = null;
            }
        },
        resume: () => {
            if (animationFrameId === null) {
                animationFrameId = requestAnimationFrame(animate);
            }
        },
        loadTexture: loadImageTexture
    };
}