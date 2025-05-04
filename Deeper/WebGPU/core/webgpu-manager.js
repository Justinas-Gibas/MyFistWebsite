/**
 * WebGPU Manager
 * 
 * Handles WebGPU initialization, resource management, and rendering.
 */

export class WebGPUManager {
    /**
     * Initialize the WebGPU manager
     * @param {Object} appContext - The application context
     * @param {HTMLCanvasElement} canvas - The canvas element to render to
     */
    constructor(appContext, canvas) {
        this.app = appContext;
        this.canvas = canvas;
        this.device = null;
        this.context = null;
        this.pipeline = null;
        this.bindGroup = null;
        this.uniformBuffer = null;
        this.vertexBuffer = null;
        this.isInitialized = false;
        this.defaultShadersInitialized = false;
        
        // Uniform values
        this.uniforms = {
            time: 0,
            resolution: [canvas.width, canvas.height],
            _pad: 0 // For alignment
        };
        
        // Animation
        this.startTime = performance.now() / 1000;
        this.animationFrameId = null;

        // Current shader modules
        this.currentVertexModule = null;
        this.currentFragmentModule = null;
    }
    
    /**
     * Initialize WebGPU
     * @returns {Promise<boolean>} Whether initialization was successful
     */
    async initialize() {
        try {
            // Check if WebGPU is supported
            if (!navigator.gpu) {
                throw new Error("WebGPU is not supported in this browser.");
            }
            
            // Request adapter
            const adapter = await navigator.gpu.requestAdapter();
            if (!adapter) {
                throw new Error("Failed to get GPU adapter.");
            }
            
            // Request device
            this.device = await adapter.requestDevice();
            
            // Configure canvas
            this.context = this.canvas.getContext("webgpu");
            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            
            this.context.configure({
                device: this.device,
                format: presentationFormat,
                alphaMode: "premultiplied"
            });
            
            // Create vertex buffer with a quad
            const vertices = new Float32Array([
                // Position (xy), TexCoord (uv)
                -1.0,  1.0,   0.0, 0.0,  // top-left
                 1.0,  1.0,   1.0, 0.0,  // top-right
                -1.0, -1.0,   0.0, 1.0,  // bottom-left
                
                -1.0, -1.0,   0.0, 1.0,  // bottom-left
                 1.0,  1.0,   1.0, 0.0,  // top-right
                 1.0, -1.0,   1.0, 1.0   // bottom-right
            ]);
            
            this.vertexBuffer = this.device.createBuffer({
                size: vertices.byteLength,
                usage: GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST,
                mappedAtCreation: true
            });
            
            new Float32Array(this.vertexBuffer.getMappedRange()).set(vertices);
            this.vertexBuffer.unmap();
            
            // Create uniform buffer
            const uniformsSize = 24; // Increased from 16 to 24 bytes to match shader requirements
            this.uniformBuffer = this.device.createBuffer({
                size: uniformsSize,
                usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
            });
            
            this.isInitialized = true;
            
            // Don't try to create default pipeline yet - let that happen after ShaderManager is initialized
            // We'll return true to indicate that WebGPU is initialized, even though shaders aren't ready
            return true;
        } catch (error) {
            console.error("WebGPU initialization error:", error);
            this.isInitialized = false;
            return false;
        }
    }
    
    /**
     * Initialize shaders and pipeline after ShaderManager is available
     * This should be called from app.js after creating the ShaderManager
     */
    async initializeShaders() {
        if (!this.isInitialized) {
            console.error("WebGPUManager.initializeShaders: WebGPU not initialized");
            return false;
        }
        
        try {
            // Create default pipeline now that ShaderManager should be available
            const success = await this.createDefaultPipeline();
            this.defaultShadersInitialized = success;
            return success;
        } catch (error) {
            console.error("Error initializing shaders:", error);
            this.defaultShadersInitialized = false;
            return false;
        }
    }
    
    /**
     * Create a default rendering pipeline
     * @returns {Promise<boolean>} Whether creation was successful
     */
    async createDefaultPipeline() {
        if (!this.isInitialized) return false;
        
        try {
            // Check that ShaderManager is available
            if (!this.app.shaderManager) {
                console.error("WebGPUManager.createDefaultPipeline: ShaderManager not available");
                return false;
            }

            // First ensure default shaders are initialized
            await this.app.shaderManager.initializeDefaultShaders();
            
            // Get the shader modules after initialization
            const shaderState = this.app.shaderManager.getCurrentShaders();
            
            if (!shaderState || !shaderState.vertexShaderModule || !shaderState.fragmentShaderModule) {
                console.error("WebGPUManager: Default shader modules still not available after initialization.");
                throw new Error("Default shader modules failed to compile or load.");
            }

            // Use the initialized default modules
            console.log("WebGPUManager: Using initialized default shaders.");
            return await this.updatePipeline(shaderState.vertexShaderModule, shaderState.fragmentShaderModule, "Default");

        } catch (error) {
            console.error("Error creating default pipeline:", error);
            this.pipeline = null; // Ensure pipeline is null on error
            return false;
        }
    }
    
    /**
     * Update the rendering pipeline using compiled shader modules
     * @param {GPUShaderModule} vertexShaderModule - Compiled vertex shader module
     * @param {GPUShaderModule} fragmentShaderModule - Compiled fragment shader module
     * @param {string} labelPrefix - Prefix for pipeline label
     * @returns {Promise<boolean>} Whether update was successful
     */
    async updatePipeline(vertexShaderModule, fragmentShaderModule, labelPrefix = "Custom") {
        if (!this.isInitialized || !vertexShaderModule || !fragmentShaderModule) {
            console.error("WebGPUManager.updatePipeline: Not initialized or missing shader modules.");
            return false;
        }
        
        try {
            // Check if this is a duplicate compilation with the same modules
            if (this.currentVertexModule === vertexShaderModule && 
                this.currentFragmentModule === fragmentShaderModule &&
                this.pipeline) {
                // Skip recompilation if modules are the same and pipeline exists
                // This prevents unnecessary duplicate compilations
                return true;
            }
            
            // Store current modules for future comparison
            this.currentVertexModule = vertexShaderModule;
            this.currentFragmentModule = fragmentShaderModule;
            
            const presentationFormat = navigator.gpu.getPreferredCanvasFormat();
            
            // Bind group layout (assuming simple uniforms for now)
            const bindGroupLayout = this.device.createBindGroupLayout({
                label: `${labelPrefix} BindGroupLayout`, // Added label
                entries: [
                    {
                        binding: 0,
                        visibility: GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT,
                        buffer: { type: "uniform" }
                    }
                    // Add more entries here for textures, storage buffers etc. if needed
                ]
            });
            
            // Create the bind group (if buffer exists)
            if (this.uniformBuffer) {
                this.bindGroup = this.device.createBindGroup({
                    label: `${labelPrefix} BindGroup`, // Added label
                    layout: bindGroupLayout,
                    entries: [
                        {
                            binding: 0,
                            resource: { buffer: this.uniformBuffer }
                        }
                    ]
                });
            } else {
                console.warn("WebGPUManager.updatePipeline: Uniform buffer not created yet. Bind group not set.");
                this.bindGroup = null; // Ensure bind group is null if buffer doesn't exist
            }
            
            const pipelineLayout = this.device.createPipelineLayout({
                label: `${labelPrefix} PipelineLayout`, // Added label
                bindGroupLayouts: [bindGroupLayout]
            });
            
            // Create the render pipeline using the provided modules
            this.pipeline = await this.device.createRenderPipelineAsync({
                label: `${labelPrefix} Render Pipeline`, // Use prefix for label
                layout: pipelineLayout,
                vertex: {
                    module: vertexShaderModule, // Use module directly
                    entryPoint: "main",
                    buffers: [
                        {
                            arrayStride: 4 * 4, // 4 floats * 4 bytes each (pos + uv)
                            attributes: [
                                { shaderLocation: 0, offset: 0, format: "float32x2" }, // Position
                                { shaderLocation: 1, offset: 2 * 4, format: "float32x2" }  // TexCoord
                            ]
                        }
                    ]
                },
                fragment: {
                    module: fragmentShaderModule, // Use module directly
                    entryPoint: "main",
                    targets: [
                        {
                            format: presentationFormat,
                            blend: {
                                color: {
                                    srcFactor: "src-alpha",
                                    dstFactor: "one-minus-src-alpha",
                                    operation: "add"
                                },
                                alpha: {
                                    srcFactor: "one",
                                    dstFactor: "zero",
                                    operation: "add"
                                }
                            }
                        }
                    ]
                },
                primitive: {
                    topology: "triangle-list"
                }
            });
            
            console.log(`WebGPUManager: Pipeline updated successfully (${labelPrefix})`);
            
            // Update uniforms (might be needed if buffer layout changes)
            this.updateUniforms();
            
            // Ensure rendering loop is running
            if (!this.animationFrameId) {
                this.startRendering();
            }
            
            return true;
        } catch (error) {
            console.error(`Error updating pipeline (${labelPrefix}):`, error);
            this.pipeline = null; // Invalidate pipeline on error
            // Consider showing an error message to the user via UIManager
            this.app.uiManager?.showNotification(`Pipeline Error: ${error.message}`, 'error', 10000);
            return false;
        }
    }
    
    /**
     * Update uniform values
     */
    updateUniforms() {
        if (!this.isInitialized) return;
        
        // Update resolution if canvas size has changed
        this.uniforms.resolution = [this.canvas.width, this.canvas.height];
        
        // Write to uniform buffer
        const uniformsArray = new Float32Array([
            this.uniforms.time,
            this.uniforms.resolution[0],
            this.uniforms.resolution[1],
            this.uniforms._pad
        ]);
        
        this.device.queue.writeBuffer(
            this.uniformBuffer,
            0,
            uniformsArray.buffer,
            uniformsArray.byteOffset,
            uniformsArray.byteLength
        );
    }
    
    /**
     * Update the time uniform
     * @param {number} time - Current time in seconds
     */
    updateTimeUniform(time) {
        if (!this.isInitialized) return;
        
        this.uniforms.time = time;
        this.updateUniforms();
    }
    
    /**
     * Start the render loop
     */
    startRendering() {
        const renderLoop = () => {
            this.render();
            this.animationFrameId = requestAnimationFrame(renderLoop);
        };
        
        renderLoop();
    }
    
    /**
     * Stop the render loop
     */
    stopRendering() {
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }
    
    /**
     * Resize the canvas and update uniforms
     */
    resize() {
        if (!this.isInitialized) return;
        
        // Update canvas size to match display size
        const rect = this.canvas.getBoundingClientRect();
        this.canvas.width = rect.width;
        this.canvas.height = rect.height;
        
        // Update uniforms
        this.updateUniforms();
    }
    
    /**
     * Render a frame
     */
    render() {
        if (!this.isInitialized || !this.pipeline) return;
        
        // Update time
        const currentTime = performance.now() / 1000;
        this.uniforms.time = currentTime - this.startTime;
        this.updateUniforms();
        
        // Create command encoder
        const commandEncoder = this.device.createCommandEncoder();
        
        // Begin render pass
        const textureView = this.context.getCurrentTexture().createView();
        const renderPass = commandEncoder.beginRenderPass({
            colorAttachments: [
                {
                    view: textureView,
                    clearValue: { r: 0.0, g: 0.0, b: 0.0, a: 1.0 },
                    loadOp: "clear",
                    storeOp: "store"
                }
            ]
        });
        
        // Set pipeline and vertex buffer
        renderPass.setPipeline(this.pipeline);
        renderPass.setBindGroup(0, this.bindGroup);
        renderPass.setVertexBuffer(0, this.vertexBuffer);
        
        // Draw 6 vertices (2 triangles)
        renderPass.draw(6);
        
        // End render pass
        renderPass.end();
        
        // Submit command buffer
        this.device.queue.submit([commandEncoder.finish()]);
    }
    
    /**
     * Clean up resources
     */
    cleanup() {
        this.stopRendering();
        this.isInitialized = false;
    }
}