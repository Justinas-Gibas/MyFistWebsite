struct VertexInput {
    @location(0) position: vec4<f32>,
    @location(1) color: vec4<f32>,
    @location(2) uv: vec2<f32>,
    @location(3) barycentric: vec3<f32>,
    @location(4) normal: vec3<f32>, // New attribute for the surface normal
};

struct VertexOutput {
    @builtin(position) position: vec4<f32>,
    @location(0) color: vec4<f32>,
    @location(1) normal: vec3<f32>,
};

@group(0) @binding(0) var<uniform> modelViewProjectionMatrix: mat4x4<f32>;

@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.color = in.color;
    // For correct lighting with non-uniform scaling, this normal would need to be
    // transformed by the inverse-transpose of the model matrix. For uniform scaling,
    // passing it directly is sufficient.
    out.normal = in.normal;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // A fixed directional light pointing from the top-right.
    let light_direction = normalize(vec3<f32>(0.5, 1.0, 0.75));
    let ambient_light = 0.2;

    // Calculate diffuse lighting intensity.
    let diffuse_intensity = max(dot(in.normal, light_direction), 0.0);
    let lighting = ambient_light + diffuse_intensity;

    // Apply lighting to the original vertex color.
    let final_color = in.color.rgb * lighting;
    return vec4<f32>(final_color, in.color.a);
}
