struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>, // Not used here, but kept for compatibility
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> time: f32;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.color = in.color; // Pass original color through
    out.uv = in.uv;       // Pass UV coordinates through
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let speed = 2.0;
    let grid_scale = 10.0;

    // Create two scrolling UV sets for a Moiré pattern effect
    let uv1 = vec2<f32>(in.uv.x + time * speed * 0.1, in.uv.y);
    let uv2 = vec2<f32>(in.uv.x, in.uv.y + time * speed * 0.15);

    // Create grid lines from both UV sets
    let grid1 = step(vec2<f32>(0.9), fract(uv1 * grid_scale));
    let line1 = max(grid1.x, grid1.y);

    let grid2 = step(vec2<f32>(0.9), fract(uv2 * grid_scale));
    let line2 = max(grid2.x, grid2.y);

    let lines = max(line1, line2);

    // Create a rainbow color effect that shifts with time
    let rainbow = vec3<f32>(
        0.5 + 0.5 * sin(time + in.uv.x),
        0.5 + 0.5 * sin(time + in.uv.y + 2.0),
        0.5 + 0.5 * sin(time + in.uv.x + 4.0)
    );

    // Mix the original vertex color with the rainbow, and then overlay the black grid lines
    let final_color = mix(in.color.rgb * rainbow, vec3<f32>(0.0, 0.0, 0.0), lines);

    return vec4<f32>(final_color, 1.0);
}
