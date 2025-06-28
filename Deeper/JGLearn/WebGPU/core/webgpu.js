/**
 * Core WebGPU Module
 * 
 * This module provides the essential WebGPU functionality including initialization,
 * buffer creation, shader compilation, and other utilities.
 */

/**
 * Initializes WebGPU on a canvas element
 * @param {HTMLCanvasElement} canvas - The canvas element to initialize WebGPU on
 * @returns {Promise<GPUDevice>} - A promise that resolves to the GPU device
 */
export async function initWebGPU(canvas) {
    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error("WebGPU is not supported in your browser. Try using Chrome or Edge with the #enable-unsafe-webgpu flag enabled.");
    }

    // Request an adapter (physical device)
    const adapter = await navigator.gpu.requestAdapter({
        powerPreference: 'high-performance'
    });

    if (!adapter) {
        throw new Error("No appropriate GPU adapter found.");
    }

    // Log adapter info
    console.log("GPU Adapter:", adapter.name);

    // Request a device (logical device) with optional features and limits
    const device = await adapter.requestDevice({
        requiredFeatures: [],
        requiredLimits: {
            maxStorageBufferBindingSize: adapter.limits.maxStorageBufferBindingSize,
            maxBufferSize: adapter.limits.maxBufferSize,
            maxComputeWorkgroupSizeX: adapter.limits.maxComputeWorkgroupSizeX,
        }
    });

    // Set up error handling
    device.addEventListener('uncapturederror', (event) => {
        console.error('A WebGPU error occurred:', event.error);
    });

    // Configure the canvas context
    const context = canvas.getContext('webgpu');
    if (!context) {
        throw new Error("Could not get WebGPU context from canvas.");
    }

    const canvasFormat = navigator.gpu.getPreferredCanvasFormat();
    context.configure({
        device: device,
        format: canvasFormat,
        alphaMode: 'premultiplied'
    });

    return device;
}

/**
 * Creates a buffer with the given data
 * @param {GPUDevice} device - The GPU device
 * @param {ArrayBuffer|TypedArray} data - The data to put in the buffer
 * @param {GPUBufferUsageFlags} usage - How the buffer will be used
 * @returns {GPUBuffer} - The created buffer
 */
export function createBuffer(device, data, usage) {
    const buffer = device.createBuffer({
        size: data.byteLength,
        usage: usage,
        mappedAtCreation: true
    });

    // Get a mapped range of the buffer to write data into
    const arrayBuffer = buffer.getMappedRange();
    
    // Write data to the buffer
    if (data instanceof ArrayBuffer) {
        new Uint8Array(arrayBuffer).set(new Uint8Array(data));
    } else {
        const constructor = data.constructor;
        new constructor(arrayBuffer).set(data);
    }

    // Unmap the buffer so the GPU can use it
    buffer.unmap();
    
    return buffer;
}

/**
 * Creates a shader module from WGSL code
 * @param {GPUDevice} device - The GPU device
 * @param {string} code - The WGSL shader code
 * @param {string} [label] - Optional label for the shader module
 * @returns {GPUShaderModule} - The created shader module
 */
export function createShaderModule(device, code, label = "Shader Module") {
    try {
        return device.createShaderModule({
            label: label,
            code: code
        });
    } catch (error) {
        console.error(`Error creating shader module (${label}):`, error);
        throw error;
    }
}

/**
 * Creates a simple render pipeline for basic rendering
 * @param {GPUDevice} device - The GPU device
 * @param {GPUShaderModule} vertexShader - The vertex shader module
 * @param {GPUShaderModule} fragmentShader - The fragment shader module
 * @param {GPUTextureFormat} format - The texture format of the canvas
 * @param {string} [label] - Optional label for the pipeline
 * @returns {GPURenderPipeline} - The created render pipeline
 */
export function createRenderPipeline(device, vertexShader, fragmentShader, format = navigator.gpu.getPreferredCanvasFormat(), label) { // Added label parameter
    const pipelineDescriptor = {
        label: label, // Use label
        vertex: {
            module: vertexShader,
            entryPoint: 'main'
        },
        fragment: {
            module: fragmentShader,
            entryPoint: 'main',
            targets: [
                {
                    format: format
                }
            ]
        },
        primitive: {
            topology: 'triangle-list'
        },
        layout: 'auto'
    };

    try {
        return device.createRenderPipeline(pipelineDescriptor);
    } catch (error) {
        console.error(`Error creating render pipeline${label ? ` (${label})` : ''}:`, error);
        throw error; // Re-throw the error after logging
    }
}

/**
 * Creates a compute pipeline
 * @param {GPUDevice} device - The GPU device
 * @param {GPUShaderModule} computeShader - The compute shader module
 * @param {GPUPipelineLayoutDescriptor} layout - The pipeline layout
 * @returns {GPUComputePipeline} - The created compute pipeline
 */
export function createComputePipeline(device, computeShader, layout = 'auto') {
    return device.createComputePipeline({
        layout: layout,
        compute: {
            module: computeShader,
            entryPoint: 'main'
        }
    });
}

/**
 * Creates a basic texture with specified dimensions
 * @param {GPUDevice} device - The GPU device
 * @param {number} width - Texture width
 * @param {number} height - Texture height
 * @param {GPUTextureFormat} format - Texture format
 * @param {GPUTextureUsageFlags} usage - How the texture will be used
 * @returns {GPUTexture} - The created texture
 */
export function createTexture(device, width, height, format = 'rgba8unorm', usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT) {
    return device.createTexture({
        size: { width, height, depthOrArrayLayers: 1 },
        format: format,
        usage: usage
    });
}

/**
 * Uploads image data to a texture
 * @param {GPUDevice} device - The GPU device
 * @param {GPUTexture} texture - The texture to upload to
 * @param {ImageBitmap|HTMLImageElement} source - The image source
 */
export function uploadToTexture(device, texture, source) {
    device.queue.copyExternalImageToTexture(
        { source },
        { texture },
        [source.width, source.height]
    );
}

/**
 * Loads an image as a texture
 * @param {GPUDevice} device - The GPU device
 * @param {string} url - URL of the image
 * @returns {Promise<{texture: GPUTexture, width: number, height: number}>} - The loaded texture
 */
export async function loadImageAsTexture(device, url) {
    const response = await fetch(url);
    const blob = await response.blob();
    const imgBitmap = await createImageBitmap(blob);
    
    const texture = device.createTexture({
        size: [imgBitmap.width, imgBitmap.height, 1],
        format: 'rgba8unorm',
        usage: GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.RENDER_ATTACHMENT
    });
    
    uploadToTexture(device, texture, imgBitmap);
    
    return {
        texture,
        width: imgBitmap.width,
        height: imgBitmap.height
    };
}

/**
 * Helper to create a bind group layout
 * @param {GPUDevice} device - The GPU device
 * @param {Array} entries - The bind group layout entries
 * @returns {GPUBindGroupLayout} - The created bind group layout
 */
export function createBindGroupLayout(device, entries) {
    return device.createBindGroupLayout({
        entries
    });
}

/**
 * Helper to create a bind group
 * @param {GPUDevice} device - The GPU device
 * @param {GPUBindGroupLayout} layout - The bind group layout
 * @param {Array} entries - The bind group entries
 * @returns {GPUBindGroup} - The created bind group
 */
export function createBindGroup(device, layout, entries) {
    return device.createBindGroup({
        layout,
        entries
    });
}

/**
 * Check if WebGPU is supported
 * @returns {boolean} Whether WebGPU is supported
 */
export function isWebGPUSupported() {
    return 'gpu' in navigator;
}

/**
 * Get preferred canvas format
 * @returns {string} The preferred canvas format
 */
export function getPreferredCanvasFormat() {
    return navigator.gpu?.getPreferredCanvasFormat() || 'bgra8unorm';
}