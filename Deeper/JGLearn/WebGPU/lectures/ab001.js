/**
 * WebGPU Explorer - Lesson AA001
 * Introduction to WebGPU
 */

const lessonAA001 = {
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
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}`,
            fragmentShader: `
@fragment
fn main() -> @location(0) vec4<f32> {
    return vec4<f32>(1.0, 0.0, 0.0, 1.0); // Red color
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

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    // Define colors for each vertex
    var colors = array<vec3<f32>, 3>(
        vec3<f32>(1.0, 0.0, 0.0),  // red (top)
        vec3<f32>(0.0, 1.0, 0.0),  // green (bottom left)
        vec3<f32>(0.0, 0.0, 1.0)   // blue (bottom right)
    );
    
    var output: VertexOutput;
    output.position = vec4<f32>(positions[vertexIndex], 0.0, 1.0);
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

/**
 * WebGPU Explorer - Lesson AB001
 * Introduction to WebGPU Shading Language
 */

const lessonAB001 = {
    id: 'ab001',
    title: 'Advanced Triangle Rendering',
    description: 'Learn more advanced techniques for rendering triangles with WebGPU',
    
    // Lesson content in markdown format
    content: `
# Advanced Triangle Rendering

In this lesson, we'll explore more advanced techniques for rendering triangles in WebGPU, building on the concepts you've learned so far.

## Vertex Attributes

In addition to the position of vertices, we often want to associate other data with each vertex, such as:
- Colors
- Texture coordinates
- Normals
- Tangents
- Custom data

## Passing Vertex Data

To pass data between the vertex and fragment shader stages, we use structures and location attributes:

\`\`\`wgsl
struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    var output: VertexOutput;
    // Set position and other attributes
    return output;
}

@fragment
fn main(@location(0) color: vec3<f32>) -> @location(0) vec4<f32> {
    return vec4<f32>(color, 1.0);
}
\`\`\`

## Transformations

We can transform vertices by applying matrices. Common transformations include:

1. **Translation**: Moving objects
2. **Rotation**: Rotating objects around an axis
3. **Scaling**: Changing the size of objects

These transformations are typically combined into a single matrix called a model matrix.

## Try It Yourself

Use the controls to experiment with different transformations:
- Change the triangle's position
- Adjust its rotation
- Scale it up or down
- Change the vertex colors

This interactive example helps you understand how transformations affect rendering.

## Next Steps

In future lessons, we'll explore more complex rendering techniques, including textures, lighting models, and post-processing effects.
    `,
    
    // Interactive examples for advanced triangle rendering
    examples: [
        {
            id: 'transformable-triangle',
            title: 'Transformable Triangle',
            description: 'A triangle that can be transformed using controls',
            vertexShader: `
struct Uniforms {
    translation: vec2<f32>,
    rotation: f32,
    scale: f32,
    time: f32,
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
    
    // Apply transformations
    let angle = uniforms.rotation + uniforms.time * ${autoRotateSpeed};
    
    // First scale
    let scaled = position * ${triangleScale};
    
    // Then rotate
    let rotated = vec2<f32>(
        scaled.x * cos(angle) - scaled.y * sin(angle),
        scaled.x * sin(angle) + scaled.y * cos(angle)
    );
    
    // Then translate
    let translated = rotated + vec2<f32>(${xPosition}, ${yPosition});
    
    return vec4<f32>(translated, 0.0, 1.0);
}`,
            fragmentShader: `
struct Uniforms {
    translation: vec2<f32>,
    rotation: f32,
    scale: f32,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main() -> @location(0) vec4<f32> {
    // Animate colors based on time for a rainbow effect
    let useRainbow = ${useRainbowColors};
    
    let r = ${redValue};
    let g = ${greenValue};
    let b = ${blueValue};
    
    // If rainbow mode is enabled, override with animated colors
    if (useRainbow > 0.5) {
        return vec4<f32>(
            sin(uniforms.time) * 0.5 + 0.5,
            cos(uniforms.time * 0.3) * 0.5 + 0.5,
            sin(uniforms.time * 0.7) * 0.5 + 0.5,
            1.0
        );
    }
    
    return vec4<f32>(r, g, b, 1.0);
}`
        },
        {
            id: 'vertex-colored-triangle',
            title: 'Vertex Colored Triangle',
            description: 'A triangle with individual vertex colors and transformations',
            vertexShader: `
struct Uniforms {
    translation: vec2<f32>,
    rotation: f32,
    scale: f32,
    time: f32,
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec3<f32>
};

@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> VertexOutput {
    // Define triangle vertices in clip space
    var positions = array<vec2<f32>, 3>(
        vec2<f32>(0.0, 0.5),    // top
        vec2<f32>(-0.5, -0.5),  // bottom left
        vec2<f32>(0.5, -0.5)    // bottom right
    );
    
    // Define colors for each vertex
    var colors = array<vec3<f32>, 3>(
        vec3<f32>(${vertex1Red}, ${vertex1Green}, ${vertex1Blue}),  // top vertex
        vec3<f32>(${vertex2Red}, ${vertex2Green}, ${vertex2Blue}),  // bottom left
        vec3<f32>(${vertex3Red}, ${vertex3Green}, ${vertex3Blue})   // bottom right
    );
    
    let position = positions[vertexIndex];
    
    // Apply transformations
    let angle = uniforms.rotation + uniforms.time * ${autoRotateSpeed};
    
    // Scale, rotate, translate
    let scaled = position * ${triangleScale};
    let rotated = vec2<f32>(
        scaled.x * cos(angle) - scaled.y * sin(angle),
        scaled.x * sin(angle) + scaled.y * cos(angle)
    );
    let translated = rotated + vec2<f32>(${xPosition}, ${yPosition});
    
    var output: VertexOutput;
    output.position = vec4<f32>(translated, 0.0, 1.0);
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
        // Position controls
        {
            id: "xPosition",
            label: "X Position",
            type: "range",
            min: -1.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Horizontal position of the triangle"
        },
        {
            id: "yPosition",
            label: "Y Position",
            type: "range",
            min: -1.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Vertical position of the triangle"
        },
        // Scale control
        {
            id: "triangleScale",
            label: "Scale",
            type: "range",
            min: 0.1,
            max: 2.0,
            step: 0.05,
            value: 1.0,
            description: "Size of the triangle"
        },
        // Rotation control
        {
            id: "autoRotateSpeed",
            label: "Auto-Rotation Speed",
            type: "range",
            min: 0.0,
            max: 2.0,
            step: 0.1,
            value: 0.5,
            description: "Speed of automatic rotation"
        },
        // Color controls for solid color shader
        {
            id: "useRainbowColors",
            label: "Rainbow Colors",
            type: "checkbox",
            value: false,
            description: "Enable animated rainbow colors"
        },
        {
            id: "redValue",
            label: "Red",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 1.0,
            description: "Red component for solid color (when Rainbow Colors is off)"
        },
        {
            id: "greenValue",
            label: "Green",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Green component for solid color (when Rainbow Colors is off)"
        },
        {
            id: "blueValue",
            label: "Blue",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Blue component for solid color (when Rainbow Colors is off)"
        },
        // Color controls for vertex colors
        {
            id: "vertex1Red",
            label: "Vertex 1 Red",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 1.0,
            description: "Red component for top vertex"
        },
        {
            id: "vertex1Green",
            label: "Vertex 1 Green",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Green component for top vertex"
        },
        {
            id: "vertex1Blue",
            label: "Vertex 1 Blue",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Blue component for top vertex"
        },
        {
            id: "vertex2Red",
            label: "Vertex 2 Red",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Red component for bottom-left vertex"
        },
        {
            id: "vertex2Green",
            label: "Vertex 2 Green",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 1.0,
            description: "Green component for bottom-left vertex"
        },
        {
            id: "vertex2Blue",
            label: "Vertex 2 Blue",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Blue component for bottom-left vertex"
        },
        {
            id: "vertex3Red",
            label: "Vertex 3 Red",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Red component for bottom-right vertex"
        },
        {
            id: "vertex3Green",
            label: "Vertex 3 Green",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Green component for bottom-right vertex"
        },
        {
            id: "vertex3Blue",
            label: "Vertex 3 Blue",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 1.0,
            description: "Blue component for bottom-right vertex"
        }
    ],
    
    // Quiz questions
    quiz: [
        {
            question: "How do you pass data from the vertex shader to the fragment shader in WGSL?",
            options: [
                "Using global variables",
                "Using location attributes (@location)",
                "Using uniform buffers only",
                "Using JavaScript callbacks"
            ],
            correctAnswer: 1 // 0-based index
        },
        {
            question: "Which transformation should be applied first when transforming a vertex?",
            options: [
                "Translation, then rotation, then scaling",
                "Scaling, then rotation, then translation",
                "Rotation, then scaling, then translation",
                "The order doesn't matter"
            ],
            correctAnswer: 1 // 0-based index (Scaling, then rotation, then translation)
        },
        {
            question: "What does the @builtin(position) attribute indicate in WGSL?",
            options: [
                "It's a user input position",
                "It's used for mesh positioning",
                "It's the final clip space position used by the GPU",
                "It's a reference to the model's origin"
            ],
            correctAnswer: 2 // 0-based index
        }
    ],
    
    // Additional resources
    resources: [
        {
            title: "WGSL Specification",
            url: "https://www.w3.org/TR/WGSL/"
        },
        {
            title: "3D Math Primer for Graphics Development",
            url: "https://gamemath.com/"
        },
        {
            title: "WebGPU Transformation Examples",
            url: "https://austin-eng.com/webgpu-samples/samples/transformFeedback"
        }
    ]
};

// Export the lessons as default exports
export { lessonAA001, lessonAB001 };