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

// This function performs one iteration of the Mandelbox fractal transformation.
fn box_fold(p: vec3<f32>) -> vec3<f32> {
    let fixed_radius = 1.0;
    let min_radius = 0.5;
    
    // If a component is > fixed_radius, fold it back.
    var v = p;
    if (v.x > fixed_radius) { v.x = 2.0 * fixed_radius - v.x; }
    else if (v.x < -fixed_radius) { v.x = -2.0 * fixed_radius - v.x; }
    
    if (v.y > fixed_radius) { v.y = 2.0 * fixed_radius - v.y; }
    else if (v.y < -fixed_radius) { v.y = -2.0 * fixed_radius - v.y; }

    if (v.z > fixed_radius) { v.z = 2.0 * fixed_radius - v.z; }
    else if (v.z < -fixed_radius) { v.z = -2.0 * fixed_radius - v.z; }

    return v;
}

// This function scales the point if its magnitude is below a threshold.
fn sphere_fold(p: vec3<f32>) -> vec3<f32> {
    let min_radius_sq = 0.25; // 0.5 * 0.5
    let fixed_radius_sq = 1.0; // 1.0 * 1.0
    let r2 = dot(p, p);
    if (r2 < min_radius_sq) {
        return p * (fixed_radius_sq / min_radius_sq);
    }
    return p;
}


@vertex
fn vs_main(in: VertexInput) -> VertexOutput {
    var out: VertexOutput;
    out.position = modelViewProjectionMatrix * in.position;
    out.modelPos = in.position.xyz;
    out.normal = in.normal;
    return out;
}

@fragment
fn fs_main(in: VertexOutput) -> @location(0) vec4<f32> {
    // Setup initial point and parameters
    var p = in.modelPos * 2.0; // Scale up the input position
    let scale = -2.2 + 0.4 * sin(time * 0.2); // Animate the scale
    
    // The 'c' value is the offset, which we animate to make the fractal evolve.
    let c = p + vec3<f32>(
        0.8 + 0.2 * sin(time * 0.3), 
        -0.7 + 0.1 * cos(time * 0.5), 
        0.9 + 0.15 * sin(time * 0.4)
    );

    var trap = vec4<f32>(1000.0);
    
    // Iterate the fractal function
    for (var i = 0; i < 10; i = i + 1) {
        p = box_fold(p);
        p = sphere_fold(p);
        p = p * scale + c;
        
        // "Orbit trap" - capture the closest point during iteration to generate color
        trap = min(trap, abs(vec4<f32>(p, dot(p,p))));
    }

    // Generate color from the orbit trap data
    let col = vec3<f32>(
        trap.w * 0.15, 
        trap.x * 0.2, 
        trap.y * 0.25
    );

    // Add a simple directional light to give it form
    let light_dir = normalize(vec3<f32>(0.5, 0.8, 0.2));
    let lighting = max(dot(in.normal, light_dir), 0.1) + 0.2;

    return vec4<f32>(col * lighting, 1.0);
}
