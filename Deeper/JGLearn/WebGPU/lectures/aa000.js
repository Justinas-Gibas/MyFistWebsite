/**
 * WebGPU Explorer - Lesson AA000
 * Welcome and UI Introduction
 */

const lesson = {
    id: 'aa000',
    title: 'Welcome to WebGPU Explorer!',
    description: 'An introduction to the UI and how to navigate the lessons.',
    
    content: `
# Welcome to WebGPU Explorer!

Hello there! Welcome to this interactive journey into the world of WebGPU.

## What is This?

This application is designed to teach you the fundamentals and advanced concepts of WebGPU through hands-on lessons. You'll read explanations, examine code, and experiment directly in the browser.

## How to Use the Interface

Let's break down the layout:

1.  **Canvas (Right Side):** This large area is where the WebGPU output is rendered. You'll see triangles, colors, animations, and more appear here as you progress through the lessons.

2.  **Lecture Panel (Left Side):** This is your main learning area.
    *   **Title & Description:** Shows the current lesson topic.
    *   **Content Area:** Displays the text, explanations, and instructions for the lesson. Scroll down to read everything!
    *   **Navigation Buttons (< >):** Use these buttons at the top-right of this panel to move to the previous or next lesson.
    *   **Code Tabs:** Below the lesson content, you'll find tabs containing the relevant code (Vertex Shader, Fragment Shader, JavaScript) for the current example. You can view and edit this code directly!
    *   **Controls Tab:** Many lessons include interactive controls (sliders, checkboxes) that allow you to experiment with parameters in real-time without editing code.

3.  **Editor Tab:** This is where you can edit and run the shaders. Try making changes and clicking the "Run" button to see your modifications in action!

4.  **FPS Counter (Top Left):** Shows the current rendering speed (Frames Per Second).

## Interactive Elements

This course includes many interactive elements:

- **Interactive Controls:** Sliders, color pickers, and checkboxes that let you modify shader parameters in real-time
- **Editable Code:** You can modify any example and run it to see the changes immediately
- **Quiz Questions:** Test your understanding with multiple-choice questions at the end of each lesson
- **Reference Resources:** Links to additional learning materials and documentation

## Try it yourself!

Use the controls in the Controls tab to change the welcome message below. This simple example demonstrates how the interactive controls work in this application.

## Getting Started

*   Read through the content in this panel.
*   When you're ready, click the **>** button (Next Lesson) at the top-right of this panel to proceed to your first real WebGPU lesson: "Your First Triangle".

Happy exploring!
    `,
    
    // Demo example with a simple welcome message
    examples: [
        {
            id: 'welcome-demo',
            title: 'Welcome Demo',
            description: 'A simple welcome message to demonstrate the interface',
            vertexShader: `
@vertex
fn main(@builtin(vertex_index) vertexIndex: u32) -> @builtin(position) vec4<f32> {
    // Create a simple quad that fills the screen
    var positions = array<vec2<f32>, 6>(
        vec2<f32>(-1.0, -1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(-1.0, 1.0),
        vec2<f32>(1.0, -1.0),
        vec2<f32>(1.0, 1.0)
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
    // Normalized pixel coordinates
    var uv = fragCoord.xy / uniforms.resolution;
    
    // Background color gradient
    let bgColor1 = vec3<f32>(0.1, 0.1, 0.2);
    let bgColor2 = vec3<f32>(0.0, 0.0, 0.1);
    let mixFactor = uv.y;
    
    // Mix the background colors
    let bgColor = mix(bgColor1, bgColor2, mixFactor);
    
    // Simple animation based on time
    let pulseSpeed: f32 = 1.0;
    let pulseSize: f32 = 0.1;
    let pulseFactor = sin(uniforms.time * pulseSpeed) * pulseSize + 0.9;
    
    // Create a simple circle in the center
    let center = vec2<f32>(0.5, 0.5);
    let dist = distance(uv, center);
    let radius: f32 = 0.2 * pulseFactor;
    
    // Determine color based on distance from center
    if (dist < radius) {
        // Inside the circle - use white for message color
        return vec4<f32>(1.0, 1.0, 1.0, 1.0);
    } else {
        // Outside the circle - use the background gradient
        return vec4<f32>(bgColor, 1.0);
    }
}`
        }
    ],
    
    // Interactive controls for the welcome screen
    controls: [
        {
            id: "bgColor1R",
            label: "Background Top (Red)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.1,
            description: "Red component of the top background color"
        },
        {
            id: "bgColor1G",
            label: "Background Top (Green)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.1,
            description: "Green component of the top background color"
        },
        {
            id: "bgColor1B",
            label: "Background Top (Blue)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.2,
            description: "Blue component of the top background color"
        },
        {
            id: "bgColor2R",
            label: "Background Bottom (Red)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Red component of the bottom background color"
        },
        {
            id: "bgColor2G",
            label: "Background Bottom (Green)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.0,
            description: "Green component of the bottom background color"
        },
        {
            id: "bgColor2B",
            label: "Background Bottom (Blue)",
            type: "range",
            min: 0.0,
            max: 1.0,
            step: 0.01,
            value: 0.1,
            description: "Blue component of the bottom background color"
        }
    ],
    
    quiz: [],
    resources: []
};

export default lesson;