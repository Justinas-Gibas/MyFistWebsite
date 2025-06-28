struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>,
    @location(4) normal: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) modelPos: vec3<f32>,
    @location(1) normal: vec3<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> time: f32;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.modelPos = in.position.xyz; // Pass the original vertex position
    out.normal = in.normal;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    let repetitions = 3.0; // How many cubes to repeat across the main cube's space
    let speed = 0.2;
    
    // Animate the coordinate system to make the grid appear to move.
    let p = in.modelPos + time * speed * normalize(vec3<f32>(1.0, 0.7, 0.5));
    
    // Create a repeating grid coordinate system.
    let grid_coords = fract(p * repetitions) - 0.5;
    let grid_cell = floor(p * repetitions);

    // --- Draw the small cubes ---
    let dist_from_center = max(abs(grid_coords.x), max(abs(grid_coords.y), abs(grid_coords.z)));
    let cube_size = 0.25;
    let glow_width = 0.1;
    let cube_intensity = smoothstep(cube_size, cube_size - glow_width, dist_from_center);

    // --- Color and Lighting ---
    let color_seed = grid_cell * 0.2;
    let cube_color = vec3<f32>(
        0.6 + 0.4 * sin(color_seed.x + color_seed.y * 2.0),
        0.6 + 0.4 * sin(color_seed.y + color_seed.z * 2.0),
        0.6 + 0.4 * sin(color_seed.z + color_seed.x * 2.0)
    );

    let light_dir = normalize(vec3<f32>(0.5, 1.0, 0.5));
    let surface_lighting = max(dot(in.normal, light_dir), 0.2) + 0.1;

    let lit_cube_color = cube_intensity * cube_color * surface_lighting;

    // Create a faint background haze for the "empty" space.
    let haze_color = vec3<f32>(0.05, 0.0, 0.1) * surface_lighting;
    
    // Blend between the haze and the lit cube based on cube_intensity.
    let final_rgb = mix(haze_color, lit_cube_color, cube_intensity);
    
    // The final alpha makes the empty space slightly visible and the cubes opaque.
    let final_alpha = mix(0.1, 1.0, cube_intensity);

    return vec4<f32>(final_rgb, final_alpha);
}
    let final_color = cube_intensity * cube_color * surface_lighting;

    return vec4<f32>(final_color, cube_intensity);
}
