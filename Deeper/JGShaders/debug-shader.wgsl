struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>,
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) barycentric: vec3<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;
@group(0) @binding(1) var<uniform> time: f32;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.color = in.color;
    out.barycentric = in.barycentric;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Calculate wireframe using barycentric coordinates
    let thickness = 1.5;
    let deltas = fwidth(in.barycentric);
    let smoothed = smoothstep(deltas * (thickness - 0.5), deltas * (thickness + 0.5), in.barycentric);
    let wire = 1.0 - min(min(smoothed.x, smoothed.y), smoothed.z);

    // Base color with a subtle animation
    let time_color_shift = sin(time * 2.0) * 0.5 + 0.5;
    var final_color = in.color * vec4(time_color_shift, time_color_shift, time_color_shift, 1.0) + vec4(0.1, 0.1, 0.1, 0.0);

    // Define colors for each vertex index: Red for 1st, Green for 2nd, Blue for 3rd
    let vertex_colors = mat3x3<f32>(
        vec3<f32>(1.0, 0.0, 0.0), // Vertex 0: Red
        vec3<f32>(0.0, 1.0, 0.0), // Vertex 1: Green
        vec3<f32>(0.0, 0.0, 1.0)  // Vertex 2: Blue
    );

    // Create colored corners based on proximity to a vertex
    let bary_weights = smoothstep(vec3(0.4), deltas * 2.0 + vec3(0.4), in.barycentric);
    
    var blended_vertex_color = vec3(0.0);
    blended_vertex_color += vertex_colors[0] * bary_weights.x;
    blended_vertex_color += vertex_colors[1] * bary_weights.y;
    blended_vertex_color += vertex_colors[2] * bary_weights.z;

    // Mix vertex ID colors if we are close to a vertex
    if (dot(bary_weights, vec3(1.0)) > 0.1) {
        final_color = vec4(blended_vertex_color, 1.0);
    }

    // Overlay the wireframe (black)
    final_color = mix(final_color, vec4(0.0, 0.0, 0.0, 1.0), wire);

    return final_color;
}
