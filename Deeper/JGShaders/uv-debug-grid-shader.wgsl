struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>,
    @location(4) normal: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> time: f32; // Unused, but kept for layout compatibility

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.uv = in.uv;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let grid_scale = 10.0;
    let scaled_uv = in.uv * grid_scale;

    // --- Calculate Cell Gradient Color ---
    // This creates a gradient in each cell, showing U direction in red and V in green.
    // This is useful for seeing the orientation of UVs on a face.
    let cell_gradient = vec3<f32>(fract(scaled_uv.x), fract(scaled_uv.y), 0.0);

    // --- Calculate Grid Lines ---
    // Use fwidth for anti-aliased lines that have a consistent pixel thickness.
    let line_width = fwidth(scaled_uv) * 1.5;
    let grid = abs(fract(scaled_uv - 0.5) - 0.5) / line_width;
    let line_intensity = 1.0 - min(min(grid.x, grid.y), 1.0);

    // Mix the gradient color with white for the grid lines for high contrast.
    let final_color = mix(cell_gradient, vec3<f32>(1.0), line_intensity);

    return vec4<f32>(final_color, 1.0);
}
