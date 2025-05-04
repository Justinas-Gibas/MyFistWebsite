/**
 * WebGPU Explorer - Lesson AA002
 * Understanding Buffers and Uniforms
 */

const lesson = {
    id: 'aa002',
    title: 'Understanding Buffers and Uniforms',
    description: 'Learn how to create and use buffers to pass data between JavaScript and WebGPU shaders',
    
    // Lesson content in markdown format
    content: `
# Understanding Buffers and Uniforms

In this lesson, we'll explore how to pass data between JavaScript and your shaders using buffers and uniforms.

## Types of Buffers in WebGPU

WebGPU provides several types of buffers for different purposes:

1. **Vertex Buffers**: Store vertex data like positions, normals, and texture coordinates
2. **Index Buffers**: Store indices that reference vertices in a vertex buffer
3. **Uniform Buffers**: Store constant data accessible by shaders
4. **Storage Buffers**: Store data that can be read and written by shaders

## Working with Uniform Buffers

Uniform buffers are particularly useful for passing data that doesn't change for each vertex, such as transformation matrices, time, or colors.

### JavaScript Side

Here's how to create and update a uniform buffer in JavaScript:

\`\`\`javascript
// Define the uniform data size (must match the shader)
const uniformBufferSize = 4 * 4; // 4 floats x 4 bytes each

// Create the buffer
const uniformBuffer = device.createBuffer({
    size: uniformBufferSize,
    usage: GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST
});

// Update the buffer data
const uniformData = new Float32Array([
    time,          // Time in seconds
    resolution[0], // Canvas width
    resolution[1], // Canvas height
    0.0            // Padding for alignment
]);

device.queue.writeBuffer(
    uniformBuffer,
    0,
    uniformData.buffer,
    uniformData.byteOffset,
    uniformData.byteLength
);
\`\`\`

### Shader Side (WGSL)

In your WGSL shader, you need to define a matching structure:

\`\`\`wgsl
struct Uniforms {
    time: f32,
    resolution: vec2<f32>,
    _padding: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@vertex
fn main(@location(0) position: vec2<f32>) -> @builtin(position) vec4<f32> {
    // Use uniform values in your shader
    let wobble = sin(uniforms.time * 2.0) * 0.1;
    return vec4<f32>(position.x + wobble, position.y, 0.0, 1.0);
}
\`\`\`

## Animation Example

Let's see how uniforms enable animation. This shader creates a simple animated gradient:

\`\`\`wgsl
@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Normalize pixel coordinates
    let uv = fragCoord.xy / uniforms.resolution;
    
    // Create a moving gradient
    let color = vec3<f32>(
        sin(uv.x * 3.0 + uniforms.time) * 0.5 + 0.5,
        sin(uv.y * 2.0 + uniforms.time * 0.5) * 0.5 + 0.5,
        sin((uv.x + uv.y) * 5.0 + uniforms.time * 2.0) * 0.5 + 0.5
    );
    
    return vec4<f32>(color, 1.0);
}
\`\`\`

## Interactive Controls

Try using the sliders in the Controls tab to modify the parameters of the animation. You can:
- Adjust the rotation speed
- Change the color intensity
- Modify the scale of the pattern

## Exercise

Try updating the fragment shader to create different animated patterns using the time and resolution uniforms.

## Next Steps

In the next lesson, we'll explore more complex data structures and how to work with textures in WebGPU.
    `,
    
    // Interactive examples for this lesson
    examples: [
        {
            id: 'simple-animation',
            title: 'Time-Based Animation',
            description: 'Animate a triangle using uniform time values',
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
    
    // Add some animation based on time - rotate triangle
    let angle = uniforms.time * ${rotationSpeed};
    let position = positions[vertexIndex];
    let animated = vec2<f32>(
        position.x * cos(angle) - position.y * sin(angle),
        position.x * sin(angle) + position.y * cos(angle)
    );
    
    // Scale the triangle based on control
    let scale = ${triangleScale};
    
    return vec4<f32>(animated * scale, 0.0, 1.0);
}`,
            fragmentShader: `
struct Uniforms {
    time: f32,
    resolution: vec2<f32>,
    _padding: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main() -> @location(0) vec4<f32> {
    // Pulse color based on time with adjustable intensity
    let intensity: f32 = ${colorIntensity};
    let r = sin(uniforms.time) * intensity + (1.0 - intensity);
    let g = cos(uniforms.time * 0.5) * intensity + (1.0 - intensity);
    let b = sin(uniforms.time * 0.2) * intensity + (1.0 - intensity);
    
    return vec4<f32>(r, g, b, 1.0);
}`
        },
        {
            id: 'resolution-effect',
            title: 'Resolution-Based Effect',
            description: 'Create a gradient effect using the resolution uniform',
            vertexShader: `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Create a fullscreen quad
    var positions = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),  // bottom left
        vec2<f32>( 1.0, -1.0),  // bottom right
        vec2<f32>(-1.0,  1.0),  // top left
        vec2<f32>(-1.0,  1.0),  // top left
        vec2<f32>( 1.0, -1.0),  // bottom right
        vec2<f32>( 1.0,  1.0)   // top right
    );
    
    return vec4<f32>(positions[vertexIndex], 0.0, 1.0);
}`,
            fragmentShader: `
struct Uniforms {
    time: f32,
    resolution: vec2<f32>,
    _padding: f32
}

@group(0) @binding(0) var<uniform> uniforms: Uniforms;

@fragment
fn main(@builtin(position) fragCoord: vec4<f32>) -> @location(0) vec4<f32> {
    // Normalize pixel coordinates
    let uv = fragCoord.xy / uniforms.resolution;
    
    // Create a gradient effect with adjustable frequency
    let freq: f32 = ${patternFrequency};
    let animSpeed: f32 = ${animationSpeed};
    
    let color = vec3<f32>(
        sin(uv.x * freq + uniforms.time * animSpeed) * 0.5 + 0.5,
        sin(uv.y * freq * 0.8 + uniforms.time * animSpeed * 1.5) * 0.5 + 0.5,
        sin((uv.x + uv.y) * freq * 0.5 + uniforms.time * animSpeed * 0.5) * 0.5 + 0.5
    );
    
    return vec4<f32>(color, 1.0);
}`
        }
    ],
    
    // Interactive controls for this lesson
    controls: [
        {
            id: "rotationSpeed",
            label: "Rotation Speed",
            type: "range",
            min: 0.1,
            max: 5.0,
            step: 0.1,
            value: 1.0,
            description: "Controls how fast the triangle rotates"
        },
        {
            id: "triangleScale",
            label: "Triangle Scale",
            type: "range",
            min: 0.1,
            max: 2.0,
            step: 0.1,
            value: 1.0,
            description: "Controls the size of the triangle"
        },
        {
            id: "colorIntensity",
            label: "Color Intensity",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.5,
            description: "Controls how much the colors change over time"
        },
        {
            id: "patternFrequency",
            label: "Pattern Frequency",
            type: "range",
            min: 1.0,
            max: 30.0,
            step: 1.0,
            value: 10.0,
            description: "Controls the frequency of the gradient pattern"
        },
        {
            id: "animationSpeed",
            label: "Animation Speed",
            type: "range",
            min: 0.1,
            max: 5.0,
            step: 0.1,
            value: 1.0,
            description: "Controls the speed of the animation"
        }
    ],
    
    // Quiz questions
    quiz: [
        {
            question: "Which buffer type is best for passing data that doesn't change for each vertex?",
            options: [
                "Vertex Buffer",
                "Index Buffer", 
                "Uniform Buffer",
                "Storage Buffer"
            ],
            correctAnswer: 2 // 0-based index
        },
        {
            question: "In WGSL, how do you declare a uniform buffer?",
            options: [
                "@group(0) @binding(0) var<uniform> bufferName: BufferType;",
                "@uniform var bufferName: BufferType;",
                "@binding(0) uniform bufferName: BufferType;",
                "uniform var<group(0)> bufferName: BufferType;"
            ],
            correctAnswer: 0 // 0-based index
        },
        {
            question: "How do you update a uniform buffer in JavaScript?",
            options: [
                "uniformBuffer.update(data);",
                "uniformBuffer.setData(data);",
                "device.queue.writeBuffer(uniformBuffer, offset, data);",
                "device.queue.updateBuffer(uniformBuffer, data);"
            ],
            correctAnswer: 2 // 0-based index
        }
    ],
    
    // Additional resources
    resources: [
        {
            title: "WebGPU Buffer Documentation",
            url: "https://www.w3.org/TR/webgpu/#buffer-interface"
        },
        {
            title: "Understanding WGSL",
            url: "https://www.w3.org/TR/WGSL/"
        },
        {
            title: "WebGPU Uniform Example",
            url: "https://austin-eng.com/webgpu-samples/samples/helloTriangle"
        }
    ]
};

// Export the lesson as default export
export default lesson;