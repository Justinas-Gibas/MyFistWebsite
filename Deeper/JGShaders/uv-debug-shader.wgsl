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
    // Map UV coordinates directly to RGB colors.
    // U (horizontal) -> Red
    // V (vertical)   -> Green
    return vec4<f32>(in.uv.x, in.uv.y, 0.0, 1.0);
}
