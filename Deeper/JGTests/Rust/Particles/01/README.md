# Rust Particle System Simulator

## Development Plan

This project aims to create a high-performance, easy-to-use particle system simulator using Rust, WGPU, and WebAssembly. The design focuses on educational value through simple, concise code organization.

### Project Goals

- Create a performant particle system simulator
- Ensure code is beginner-friendly and well-documented
- Support first-person camera controls (WASD + SHIFT(down) SPACE(up) + mouse)
- Deploy as WASM for web browsers
- Maintain modular architecture with small, focused files 

### Project Structure

```
/src
    /core
        camera.rs           # Camera implementation for 3D movement
        input_handler.rs    # WASD + mouse controls
        time.rs             # Delta time calculation
    /math
        vector.rs           # Vector math utilities
        random.rs           # Random number generation
    /particles
        particle.rs         # Basic particle structure
        emitter.rs          # Particle emission logic
        forces.rs           # Physics forces (gravity, wind, etc)
        updater.rs          # Particle position/lifecycle updates
    /rendering
        renderer.rs         # Main WGPU rendering setup
        shader.rs           # GLSL/WGSL shader management
        texture.rs          # Texture loading and management
        instance.rs         # Instanced drawing for particles
    /wasm
        bindings.rs         # JavaScript/WASM interface
    main.rs               # Application entry point
    lib.rs                # Library setup for WASM compilation
```

### Implementation Phases

1. **Setup Phase**
     - Create project structure
     - Set up WGPU renderer with basic window
     - Implement camera system

2. **Core Particle System**
     - Develop particle data structures
     - Create basic emitter
     - Implement particle lifecycle management

3. **Physics & Movement**
     - Add physics forces (gravity, etc.)
     - Implement collision detection (optional)
     - Create movement controls (WASD + mouse)

4. **Visual Improvements**
     - Add different particle types
     - Implement texture support
     - Add color and size variation

5. **Optimization**
     - GPU instancing for particles
     - Performance profiling and optimization
     - Memory usage optimization

6. **WASM Compilation**
     - Set up WASM build pipeline
     - Create JS/WASM bindings
     - Test in browser environment

7. **Documentation & Examples**
     - Write comprehensive comments
     - Create example effects
     - Document API usage

### Dependencies

Main:
- `wgpu`: GPU rendering.
- `rend3`: 
- `wasm-bindgen`: For WASM compilation and JS interop.

in discution:
- `winit`: Window management.
- `cgmath` or `glam`: Linear algebra operations.
- `instant`: Cross-platform timing.
- `rand`: Random number generation.
- `log`: A logging facade.
- `env_logger` or `wasm-logger`: For implementing logging, especially useful for debugging.
- `console_error_panic_hook`: For better panic messages in WASM.
- `web-sys`: Provides raw bindings to Web APIs (optional, for specific browser interactions).
- `nalgebra`: Offers more advanced linear algebra features (optional).
- `anyhow`: Simplifies error handling in complex Rust programs.
- `bytemuck`: Safe casting between plain data types (useful for GPU buffers).
- `pollster`: Block on async functions (helpful for WGPU initialization).
- `cfg-if`: Conditional compilation for different targets (native vs WASM).
- `js-sys`: Low-level bindings to JS APIs (for WASM).
- `wee_alloc`: Small allocator optimized for WASM (reduces bundle size).
- `criterion`: Benchmarking library for performance testing.
- `tracy-client`: For advanced performance profiling (optional).

#### 3D Graphics Specific
- `image`: For loading and manipulating images, useful for textures.
- `tobj` or `gltf`: For loading 3D models (e.g., from .obj or .gltf files). `gltf` is more modern and feature-rich.
- `nalgebra-glm`: A `glm` compatible math library built on `nalgebra`, often used in graphics. (If you choose `nalgebra` over `cgmath`/`glam`).
- `spirv_cross` or `naga`: For shader reflection, cross-compilation if you work with SPIR-V or need to translate shaders. `naga` is integrated with `wgpu`.
- `meshopt-rs`: Rust bindings for `meshoptimizer`, a library to optimize meshes for rendering performance.
- `kdtree`: For spatial indexing (e.g., k-d trees), which can be useful for culling or nearest neighbor searches in 3D scenes.
- `noise-rs`: For generating procedural noise, often used in texture generation or procedural geometry.
- `ultraviolet`: A SIMD-optimized linear algebra library specifically designed for computer graphics.
- `palette`: For advanced color manipulation and color space conversions.
- `lyon`: For 2D path tessellation (useful if you need complex particle shapes).
- `rapier3d`: A 3D physics engine (if you want advanced collision detection beyond basic forces).
- `parry3d`: Just the collision detection part of Rapier (lighter weight if you only need collision queries).
- `wgpu-profiler`: GPU profiling specifically for WGPU applications.
- `three-d`: High-level, batteries-included 3D engine (scenes, materials, lighting).
- `rend3`: Flexible WGPU-based renderer with PBR, post-processing, and more.
- `shaderc` or `shaderc-rs`: Compile GLSL/HLSL to SPIR-V at build time.
- `spirv-tools`: SPIR-V validation and optimization utilities.
- `wgpu_glyph` or `glyph_brush`: Text rendering support for WGPU.
- `hecs` or `bevy_ecs`: Lightweight ECS for managing scene entities and components.

### Deployment

The final artifact will be a WASM bundle with JavaScript glue code that can be hosted on GitHub Pages or any web server.

### Educational Focus

Each file should be kept small (under 100 lines where possible) with extensive comments explaining the purpose and functionality. Complex operations should be broken down into smaller, well-named functions to improve readability and learning.

## Getting Started

1. Install Rust (https://www.rust-lang.org/tools/install)
2. Clone the repo
3. Build and run using:
   ```bash
   cargo run
   ```

## Code Quality

For consistent code style and error prevention, consider:
```bash
cargo fmt       # Formats your code using rustfmt
cargo clippy    # Lints your code to catch common mistakes
cargo test      # Run unit tests
cargo bench     # Run performance benchmarks
```

### Development Workflow

1. **Pre-commit hooks**: Use `git hooks` with `cargo fmt` and `cargo clippy`
2. **IDE Setup**: Configure rust-analyzer for better development experience
3. **Debugging**: Use `cargo expand` to see macro expansions
4. **WASM debugging**: Use browser dev tools with source maps

### Performance Considerations

- Use `cargo flamegraph` for CPU profiling
- Monitor memory usage with `cargo bloat`
- For WASM: Use `wasm-pack build --profiling` for debug builds
- Consider `rayon` for CPU parallelization (native builds only)

## Usage

- Use WASD + SHIFT (down) + SPACE (up) + mouse to move and look around
- Further controls will be documented as features develop

## AI Developer Reference

For AI-driven enhancements, focus on these modules:

- **core/input_handler.rs**  
  Quickly hook in procedural controllers or ML-based input pipelining.
- **particles/emitter.rs**  
  Replace emit logic with AI-determined spawn patterns (`predict()` hook).
- **particles/forces.rs**  
  Inject learned force fields (e.g., via TensorFlow or ONNX).
- **rendering/instance.rs**  
  Extend to batch AI-guided instancing for dynamic effects.
- **wasm/bindings.rs**  
  Expose new JS-WASM API for online model loading or inference.

Tips:
1. Use the existing `OnUpdate` trait in `particles/updater.rs` as an extension point.
2. Load and invoke WebAssembly-based inference engines in `wasm/bindings.rs`.
3. Leverage `rand` and `noise-rs` for procedural variation as AI inputs.