/**
 * Uniforms Feature Module
 * This module demonstrates how to use uniform buffers in WebGPU to animate colors
 */

import { createBuffer } from '../core/webgpu.js';

/**
 * Sets up uniform buffer animation for a triangle renderer
 * @param {GPUDevice} device - The WebGPU device
 * @param {Object} renderer - The triangle renderer object
 * @returns {Object} - Controller for the uniform animation
 */
export async function setupUniforms(device, renderer) {
    // Create a uniform buffer for color animation
    const uniformBufferSize = 4 * 4; // vec4 (4 floats, 4 bytes each)
    const uniformBuffer = device.createBuffer({
        size: uniformBufferSize,
        usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST,
    });
    
    // Create a bind group layout
    const bindGroupLayout = device.createBindGroupLayout({
        entries: [{
            binding: 0,
            visibility: GPUShaderStage.FRAGMENT,
            buffer: {
                type: 'uniform',
            }
        }]
    });
    
    // Create a pipeline layout
    const pipelineLayout = device.createPipelineLayout({
        bindGroupLayouts: [bindGroupLayout]
    });
    
    // Create a bind group
    const bindGroup = device.createBindGroup({
        layout: bindGroupLayout,
        entries: [{
            binding: 0,
            resource: {
                buffer: uniformBuffer,
            }
        }]
    });
    
    // Update the vertex shader to keep it simple
    const vertexShaderCode = `
        @vertex
        fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
            var positions = array<vec2<f32>, 3>(
                vec2<f32>(0.0, 0.5),
                vec2<f32>(-0.5, -0.5),
                vec2<f32>(0.5, -0.5)
            );
            return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
        }
    `;
    
    // Create a fragment shader that uses the uniform buffer
    const fragmentShaderCode = `
        @group(0) @binding(0)
        var<uniform> color: vec4<f32>;
        
        @fragment
        fn main() -> @location(0) vec4<f32> {
            return color; // Use the uniform color
        }
    `;
    
    // Compile new shaders
    const vertexShader = device.createShaderModule({
        code: vertexShaderCode
    });
    
    const fragmentShader = device.createShaderModule({
        code: fragmentShaderCode
    });
    
    // Create a new pipeline that uses the uniform
    const format = navigator.gpu.getPreferredCanvasFormat();
    const pipeline = device.createRenderPipeline({
        layout: pipelineLayout,
        vertex: {
            module: vertexShader,
            entryPoint: 'main'
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
    
    // Animation variables
    let startTime = performance.now();
    let animationFrameId = null;
    
    // Create a render pass descriptor (borrowing from the existing one)
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
    
    // Animation function
    function animate() {
        // Calculate the time elapsed
        const now = performance.now();
        const timeElapsed = (now - startTime) / 1000; // Convert to seconds
        
        // Calculate a color based on time
        const r = Math.sin(timeElapsed) * 0.5 + 0.5;
        const g = Math.sin(timeElapsed * 0.5) * 0.5 + 0.5;
        const b = Math.sin(timeElapsed * 0.3) * 0.5 + 0.5;
        
        // Create a color array
        const colorData = new Float32Array([r, g, b, 1.0]);
        
        // Write the color to the uniform buffer
        device.queue.writeBuffer(uniformBuffer, 0, colorData);
        
        // Get the current texture view from the context (assuming canvas is available)
        const canvas = document.getElementById('canvas');
        const context = canvas.getContext('webgpu');
        const textureView = context.getCurrentTexture().createView();
        renderPassDescriptor.colorAttachments[0].view = textureView;
        
        // Create a command encoder
        const commandEncoder = device.createCommandEncoder();
        
        // Create a render pass
        const passEncoder = commandEncoder.beginRenderPass(renderPassDescriptor);
        passEncoder.setPipeline(pipeline);
        passEncoder.setBindGroup(0, bindGroup);
        passEncoder.draw(3); // Draw 3 vertices (a triangle)
        passEncoder.end();
        
        // Submit the commands
        const commandBuffer = commandEncoder.finish();
        device.queue.submit([commandBuffer]);
        
        // Request the next frame
        animationFrameId = requestAnimationFrame(animate);
    }
    
    // Start the animation
    animationFrameId = requestAnimationFrame(animate);
    
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
                startTime = performance.now();
                animationFrameId = requestAnimationFrame(animate);
            }
        },
        setColor: (r, g, b) => {
            const colorData = new Float32Array([r, g, b, 1.0]);
            device.queue.writeBuffer(uniformBuffer, 0, colorData);
        }
    };
}