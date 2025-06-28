/**
 * WebGPU Explorer - Lesson AA001
 * Introduction to WebGPU
 */

const lesson = {
    id: 'aa001',
    title: 'Introduction to WebGPU',
    description: 'Learn the basics of WebGPU API and how to set up a rendering context',
    
    // Lesson content in markdown format
    content: `
# Introduction to WebGPU

WebGPU is a modern graphics and compute API that provides access to the GPU from web applications. It is the successor to WebGL, designed from the ground up with modern GPU capabilities in mind.

## Why WebGPU?

- **Performance**: Direct mapping to modern GPU APIs like Vulkan, Metal, and Direct3D 12
- **Compute capabilities**: First-class support for GPU compute operations
- **Modern architecture**: More explicit control than WebGL, similar to modern native APIs
- **Safety**: Built with security in mind for the web platform

## Key Concepts

### The WebGPU Pipeline

1. **Adapter & Device**: Hardware connection
2. **Buffers & Textures**: Data storage
3. **Shaders**: GPU code written in WGSL (WebGPU Shading Language)
4. **Pipeline**: Fixed and programmable states
5. **Command Encoder**: Recording GPU commands
6. **Queue**: Submitting commands to the GPU

### Basic Setup

This is how you initialize WebGPU:

\`\`\`javascript
async function initWebGPU() {
    // Check if WebGPU is supported
    if (!navigator.gpu) {
        throw new Error('WebGPU not supported');
    }

    // Request an adapter (physical device)
    const adapter = await navigator.gpu.requestAdapter();
    if (!adapter) {
        throw new Error('No adapter found');
    }

    // Request a device (logical device)
    const device = await adapter.requestDevice();
    
    return { adapter, device };
}
\`\`\`

## Your First Triangle

Let's examine the code for rendering a simple triangle:

\`\`\`javascript
// Vertex shader
const vertexShaderCode = \`
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}
\`;

// Fragment shader
const fragmentShaderCode = \`
@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color
}
\`;
\`\`\`

## Exercises

1. Try changing the color in the fragment shader to blue (0.0, 0.0, 1.0, 1.0)
2. Add a fourth vertex to make a square instead of a triangle
3. Use a uniform buffer to animate the triangle's position

## Next Steps

In the next lesson, we'll explore more about buffers and how to pass data between JavaScript and GPU shaders.
    `,
    
    // Interactive examples
    examples: [
        {
            id: 'simple-triangle',
            title: 'Simple Triangle',
            description: 'A basic triangle rendered with WebGPU',
            vertexShader: `
struct Uniforms {
    time: f32,
    resolution: vec2<f32>,
    _padding: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    let position = positions[vertexIndex];
    
    // Apply a simple animation if enabled
    var finalPos = position;
    
    // Use 0.0 directly instead of template variable to avoid errors
    // Note: This will be replaced by the actual control value when controls are implemented
    if (0.0 > 0.5) {
        // Apply sine wave animation
        let offset = vec2<f32>(
            sin(uniforms.time * 1.0) * 0.1,
            cos(uniforms.time * 1.0 * 0.7) * 0.1 * 0.5
        );
        
        finalPos = position + offset;
    }
    
    return vec4<f32>(finalPos, 0.0, 1.0);
}`,
            fragmentShader: `
@fragment
fn main() -> @location(0) vec4<f32> {
    // Use direct values instead of template variables
    return vec4<f32>(1.0, 0.0, 0.0, 1.0);
}`
        },
        {
            id: 'colored-triangle',
            title: 'Colored Triangle',
            description: 'A triangle with vertex colors',
            vertexShader: `
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>
};

struct Uniforms {
    time: f32,
    resolution: vec2<f32>,
    _padding: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    // Define colors for each vertex with direct values
    var colors = array<vec3<f32>, 3>(
        vec3<f32>(1.0, 0.0, 0.0),  // top - red
        vec3<f32>(0.0, 1.0, 0.0),  // bottom left - green
        vec3<f32>(0.0, 0.0, 1.0)   // bottom right - blue
    );
    
    let position = positions[vertexIndex];
    
    // Apply a simple animation if enabled
    var finalPos = position;
    
    // Use direct values instead of template variables
    if (0.0 > 0.5) {
        // Apply sine wave animation
        let offset = vec2<f32>(
            sin(uniforms.time * 1.0) * 0.1,
            cos(uniforms.time * 1.0 * 0.7) * 0.1 * 0.5
        );
        
        finalPos = position + offset;
    }
    
    var output: VertexOutput;
    output.position = vec4<f32>(finalPos, 0.0, 1.0);
    output.color = colors[vertexIndex];
    return output;
}`,
            fragmentShader: `
@fragment
fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(color, 1.0);
}`
        }
    ],
    
    // Interactive controls
    controls: [
    ],
    
    // Quiz questions to test understanding
    quiz: [
        {
            question: "What is the main advantage of WebGPU over WebGL?",
            options: [
                "WebGPU works on more browsers",
                "WebGPU maps more directly to modern GPU APIs like Vulkan and Metal",
                "WebGPU is easier to learn",
                "WebGPU uses JavaScript instead of shaders"
            ],
            correctAnswer: 1 // 0-based index
        },
        {
            question: "Which function is used to request a physical GPU adapter in WebGPU?",
            options: [
                "navigator.gpu.requestDevice()",
                "navigator.gpu.requestAdapter()",
                "navigator.gpu.getAdapter()",
                "navigator.gpu.createAdapter()"
            ],
            correctAnswer: 1 // 0-based index
        },
        {
            question: "What language are WebGPU shaders written in?",
            options: [
                "GLSL (OpenGL Shading Language)",
                "HLSL (High-Level Shading Language)",
                "WGSL (WebGPU Shading Language)",
                "JavaScript"
            ],
            correctAnswer: 2 // 0-based index
        }
    ],
    
    // Additional resources
    resources: [
        {
            title: "WebGPU API Specification",
            url: "https://www.w3.org/TR/webgpu/"
        },
        {
            title: "WebGPU Shading Language Specification",
            url: "https://www.w3.org/TR/WGSL/"
        },
        {
            title: "WebGPU Samples",
            url: "https://austin-eng.com/webgpu-samples/"
        }
    ]
};

// Export the lesson as default export
export default lesson;