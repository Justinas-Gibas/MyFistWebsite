# Project File Overview

List of core files, their need, purpose, and where to find in-depth docs:

- **src/core/camera.rs**
  - Need: 3D camera movement
  - Purpose: Compute view/projection matrices
  - Docs: See comments in core/camera.rs

- **src/core/input_handler.rs**
  - Need: User input capture (WASD, mouse)
  - Purpose: Translate events into movement vectors
  - Docs: See comments in core/input_handler.rs

- **src/core/time.rs**
  - Need: Delta-time calculation
  - Purpose: Ensure frame-rate–independent updates
  - Docs: See comments in core/time.rs

- **src/math/vector.rs**
  - Need: Vector math utilities
  - Purpose: Basic linear algebra operations
  - Docs: See comments in math/vector.rs

- **src/particles/updater.rs**
  - Need: Particle lifecycle updates
  - Purpose: Move, age, and cull particles each frame
  - Docs: See comments in particles/updater.rs