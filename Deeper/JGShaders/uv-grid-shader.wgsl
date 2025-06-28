struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) uv: vec2<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> time: f32; // Unused, but keeps layout compatible

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
    let uv = in.uv * grid_scale;

    // --- Calculate Cell Color ---
    // Get the integer coordinate of the grid cell.
    let cell = floor(uv);
    // Generate a unique, pseudo-random color for each cell based on its coordinate.
    let cell_color = vec3<f32>(
        0.5 + 0.5 * sin(cell.x * 0.5 + cell.y * 0.3),
        0.5 + 0.5 * sin(cell.x * 0.4 + cell.y * 0.6 + 2.0),
        0.5 + 0.5 * sin(cell.x * 0.3 + cell.y * 0.9 + 4.0)
    );

    // --- Calculate Grid Lines ---
    // Use fwidth for anti-aliased lines that have a consistent pixel thickness.
    let grid_width = fwidth(uv) * 1.5;
    let grid_lines = smoothstep(grid_width, vec2<f32>(0.0), abs(fract(uv - 0.5) - 0.5));
    let grid_intensity = 1.0 - max(grid_lines.x, grid_lines.y);

    // Mix the cell color with black for the grid lines.
    let final_color = mix(cell_color, vec3<f32>(0.0), grid_intensity);

    return vec4<f32>(final_color, 1.0);
}
