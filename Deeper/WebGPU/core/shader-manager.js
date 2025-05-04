/**
 * Shader Manager Module
 * 
 * This module handles shader compilation and management.
 */

import { createShaderModule } from './webgpu.js';

export class ShaderManager {
    /**
     * @param {Object} appContext - The application context
     */
    constructor(appContext) {
        this.app = appContext;
        this.device = this.app.webgpuManager?.device;
        
        // Don't proceed if WebGPU device is not initialized
        if (!this.device) {
            console.error("ShaderManager: WebGPU device not available");
            return;
        }
        
        // Store compiled modules, not pipelines or render state
        this.vertexShaderModule = null;
        this.fragmentShaderModule = null;
        this.currentVertexCode = null;
        this.currentFragmentCode = null;
        this.lastError = null;

        // Default shaders (code only)
        this.defaultVertexShader = `
            // Default Vertex Shader (ShaderManager)
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
        
        this.defaultFragmentShader = `
            // Default Fragment Shader (ShaderManager)
            @fragment
            fn main() -> @location(0) vec4<f32> {
                return vec4<f32>(0.0, 0.5, 1.0, 1.0); // Default blue color
            }
        `;
        
        // Compile default shaders immediately (but don't create pipeline)
        this.initializeDefaultShaders();
    }
    
    /**
     * Initialize default shaders by compiling them
     */
    async initializeDefaultShaders() {
        try {
            const result = await this.compileShaders(this.defaultVertexShader, this.defaultFragmentShader, "DefaultSM");
            if (!result.success) {
                 console.error("Error initializing default shaders:", result.error);
            }
        } catch (error) {
            console.error("Unexpected error initializing default shaders:", error);
        }
    }

    /**
     * Compile vertex and fragment shaders, store modules
     * @param {string} vertexCode - WGSL vertex shader code
     * @param {string} fragmentCode - WGSL fragment shader code
     * @param {string} labelPrefix - A prefix for labeling created resources
     * @returns {Promise<{success: boolean, vertexShaderModule?: GPUShaderModule, fragmentShaderModule?: GPUShaderModule, error?: string}>}
     */
    async compileShaders(vertexCode, fragmentCode, labelPrefix = "Custom") {
        if (!this.device) {
             console.error("ShaderManager.compileShaders: Device not available.");
             this.lastError = "Device not available.";
             return { success: false, error: this.lastError };
        }
        this.lastError = null; // Clear last error
        try {
            // Compile shaders with labels
            const vsModule = createShaderModule(this.device, vertexCode, `${labelPrefix} Vertex Shader`);
            const fsModule = createShaderModule(this.device, fragmentCode, `${labelPrefix} Fragment Shader`);
            
            // Validate shaders (optional but recommended)
            // Use await to ensure validation completes before returning success
            const vsInfo = await vsModule.getCompilationInfo();
            if (vsInfo.messages.some(m => m.type === 'error')) {
                console.error(`Vertex Shader (${labelPrefix}) Compilation Error:`, vsInfo.messages);
                throw new Error(`Vertex shader compilation failed. ${vsInfo.messages.map(m => m.message).join('\n')}`);
            }
            const fsInfo = await fsModule.getCompilationInfo();
             if (fsInfo.messages.some(m => m.type === 'error')) {
                console.error(`Fragment Shader (${labelPrefix}) Compilation Error:`, fsInfo.messages);
                throw new Error(`Fragment shader compilation failed. ${fsInfo.messages.map(m => m.message).join('\n')}`);
            }

            // Store the compiled modules and code
            this.vertexShaderModule = vsModule;
            this.fragmentShaderModule = fsModule;
            this.currentVertexCode = vertexCode;
            this.currentFragmentCode = fragmentCode;
            
            console.log(`Successfully compiled shaders: ${labelPrefix}`);
            return { 
                success: true, 
                vertexShaderModule: this.vertexShaderModule,
                fragmentShaderModule: this.fragmentShaderModule
            };
        } catch (error) {
            console.error(`Failed to compile shaders (${labelPrefix}):`, error);
            this.lastError = error.message;
            // Don't store failed modules
            this.vertexShaderModule = null; 
            this.fragmentShaderModule = null;
            this.currentVertexCode = vertexCode; // Keep code for potential editing/retry
            this.currentFragmentCode = fragmentCode;
            return { 
                success: false, 
                error: this.lastError 
            };
        }
    }

    /**
     * Retrieve current shader state
     * @returns {Object} - Current shader state
     */
    getCurrentShaders() {
        return {
            vertexCode: this.currentVertexCode,
            fragmentCode: this.currentFragmentCode,
            vertexShaderModule: this.vertexShaderModule,
            fragmentShaderModule: this.fragmentShaderModule,
            lastError: this.lastError
        };
    }
}