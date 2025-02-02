// script.js

// =========================
// Utility Logging Functions
// =========================
function getCurrentTime() {
  return new Date().toLocaleTimeString();
}
function logMessage(message) {
  const logDiv = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = `[${getCurrentTime()}] ${message}`;
  logDiv.appendChild(p);
  while (logDiv.children.length > 100) {
    logDiv.removeChild(logDiv.firstChild);
  }
}

const VERSION = "3D Game of Life - Cube Version";

// =========================
// Main Function
// =========================
let main = async () => {
  try {
    // Initialize Taichi.js
    await ti.init();
    logMessage(`${VERSION}: Taichi.js initialized.`);

    // Set up canvas dimensions (adjust height for log panel)
    const htmlCanvas = document.getElementById("result_canvas");
    htmlCanvas.width = window.innerWidth;
    htmlCanvas.height = window.innerHeight - 200;

    // =========================
    // 1. Simulation Setup (3D Game of Life)
    // =========================
    const N = 16; // Grid dimensions (16x16x16)
    const TOTAL_CELLS = N * N * N;
    const liveCellsMax = 4096; // Maximum number of live cells

    // Fields for simulation:
    const liveness = ti.field(ti.i32, [TOTAL_CELLS]);
    const numNeighbors = ti.field(ti.i32, [TOTAL_CELLS]);
    const liveCellCount = ti.field(ti.i32, [1]); // Will hold the number of live cells

    // VBO for live cell centers (each live cell will later spawn a cube)
    const simVBO = ti.Vector.field(3, ti.f32, [liveCellsMax]);
    // Dummy IBO (used only to iterate over simVBO; not used for geometry here)
    const simIBO = ti.field(ti.i32, [liveCellsMax]);

    // Helper: 3D index → 1D index
    function get1DIndex(x, y, z, N) {
      return x * N * N + y * N + z;
    }

    // Add to Taichi kernel scope:
    ti.addToKernelScope({
      N,
      TOTAL_CELLS,
      liveness,
      numNeighbors,
      simVBO,
      simIBO,
      liveCellsMax,
      liveCellCount,
      get1DIndex,
    });

    // --- Kernel: Initialize simIBO ---
    const initSimIBO = ti.kernel(() => {
      for (let i of ti.range(liveCellsMax)) {
        simIBO[i] = i;
      }
    });
    await initSimIBO();
    logMessage(`${VERSION}: Simulation IBO initialized.`);

    // --- Kernel: Initialize Grid with Random Live Cells ---
    const initGrid = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        liveness[idx] = 0;
        if (ti.random() < 0.2) {
          liveness[idx] = 1;
        }
      }
    });
    await initGrid();
    logMessage(`${VERSION}: Grid initialized.`);

    // --- Kernel: Count Neighbors (with wrap-around) ---
    const countNeighbors = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        let x = i32(idx / (N * N));
        let y = i32((idx % (N * N)) / N);
        let z = idx % N;
        let neighbors = 0;
        for (let dx of ti.range(3)) {
          for (let dy of ti.range(3)) {
            for (let dz of ti.range(3)) {
              if (dx === 1 && dy === 1 && dz === 1) continue;
              let nx = (x + dx - 1 + N) % N;
              let ny = (y + dy - 1 + N) % N;
              let nz = (z + dz - 1 + N) % N;
              let nIdx = get1DIndex(nx, ny, nz, N);
              neighbors += liveness[nIdx];
            }
          }
        }
        numNeighbors[idx] = neighbors;
      }
    });
    await countNeighbors();
    logMessage(`${VERSION}: Neighbors counted.`);

    // --- Kernel: Update Liveness (Game of Life Rules)
    const updateLiveness = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        let state = liveness[idx];
        let neighbors = numNeighbors[idx];
        if (state === 1) {
          if (neighbors < 5 || neighbors > 7) {
            liveness[idx] = 0;
          }
        } else {
          if (neighbors === 5) {
            liveness[idx] = 1;
          }
        }
      }
    });
    await updateLiveness();
    logMessage(`${VERSION}: Liveness updated.`);

    // --- Kernel: Transfer Live Cell Positions into simVBO ---
    const transferLiveCells = ti.kernel(() => {
      let count = 0;
      for (let i of ti.range(TOTAL_CELLS)) {
        if (liveness[i] === 1) {
          if (count < liveCellsMax) {
            let ix = i32(i / (N * N));
            let iy = i32((i % (N * N)) / N);
            let iz = i % N;
            // Center the grid around origin
            simVBO[count] = [ix + 0.5 - N / 2, iy + 0.5 - N / 2, iz + 0.5 - N / 2];
            count = count + 1;
          }
        }
      }
      liveCellCount[0] = count;
      // For any unused entry, place off-screen
      for (let j of ti.range(liveCellsMax)) {
        if (j >= count) {
          simVBO[j] = [999, 999, 999];
        }
      }
    });
    await transferLiveCells();
    logMessage(`${VERSION}: Live cells transferred.`);

    // =========================
    // 2. Cube Geometry Setup (for Rendering each live cell as a cube)
    // =========================
    // We'll create (and update each frame) a geometry VBO and IBO.
    const maxCubeVertices = liveCellsMax * 8;   // 8 vertices per cube
    const maxCubeIndices  = liveCellsMax * 36;    // 36 indices per cube

    let geometryVBO = ti.Vector.field(3, ti.f32, [maxCubeVertices]);
    let geometryIBO = ti.field(ti.i32, [maxCubeIndices]);

    // Define a constant cube (unit cube centered at origin, half-size = 0.4)
    const cubeOffsets = [
      [-0.4, -0.4, -0.4],
      [ 0.4, -0.4, -0.4],
      [ 0.4,  0.4, -0.4],
      [-0.4,  0.4, -0.4],
      [-0.4, -0.4,  0.4],
      [ 0.4, -0.4,  0.4],
      [ 0.4,  0.4,  0.4],
      [-0.4,  0.4,  0.4]
    ];
    // 36 indices for a cube (two triangles per face)
    const cubeIBO_const = [
      0, 1, 2, 1, 3, 2,      // front face
      4, 5, 6, 5, 7, 6,      // back face
      0, 2, 4, 2, 6, 4,      // left face
      1, 3, 5, 3, 7, 5,      // right face
      0, 1, 4, 1, 5, 4,      // bottom face
      2, 3, 6, 3, 7, 6       // top face
    ];

    // =========================
    // 3. Cube Renderer (renders all cubes from geometryVBO/geometryIBO)
    // =========================
    class CubeRenderer {
      constructor(canvas, tiInstance, geometryVBO, geometryIBO) {
        this.canvas = canvas;
        this.taichi = tiInstance;
        this.geometryVBO = geometryVBO;
        this.geometryIBO = geometryIBO;
        this.aspectRatio = canvas.width / canvas.height;
        this.target = ti.canvasTexture(canvas);
        this.depth = ti.depthTexture([canvas.width, canvas.height]);

        // Create camera angle fields
        this.angleX = ti.field(ti.f32, [1]);
        this.angleY = ti.field(ti.f32, [1]);
        this.angleX[0] = 0.0;
        this.angleY[0] = 0.0;

        // Add necessary globals to kernel scope
        ti.addToKernelScope({
          target: this.target,
          depth: this.depth,
          aspectRatio: this.aspectRatio,
          angleX: this.angleX,
          angleY: this.angleY,
        });

        // Define the render kernel (iterate over geometryVBO via IBO)
        this.renderKernel = ti.kernel(() => {
          // Set up camera (here we use a fixed distance; adjust as desired)
          let theta = angleY[0];
          let phi = angleX[0];
          let eye = [
            40.0 * ti.sin(theta) * ti.cos(phi),
            40.0 * ti.sin(theta) * ti.sin(phi),
            40.0 * ti.cos(theta)
          ];
          let center = [0.0, 0.0, 0.0];
          let up = [0.0, 1.0, 0.0];
          let view = ti.lookAt(eye, center, up);
          let proj = ti.perspective(45.0, aspectRatio, 0.1, 1000.0);
          let mvp = proj.matmul(view);
          ti.clearColor(target, [0.1, 0.1, 0.1, 1.0]);
          ti.useDepth(depth);

          // Vertex loop: transform each vertex
          for (let v of ti.inputVertices(geometryVBO, geometryIBO)) {
            let pos = mvp.matmul(v.concat([1.0]));
            ti.outputPosition(pos);
            // Set a constant color (here light gray)
            ti.outputVertex({ color: [0.8, 0.8, 0.8, 1.0] });
          }
          // Fragment loop: simply output the interpolated color
          for (let f of ti.inputFragments()) {
            ti.outputColor(target, f.color);
          }
        });
      }
      updateCamera(deltaX, deltaY) {
        this.angleX[0] += deltaX;
        this.angleY[0] += deltaY;
      }
      render() {
        try {
          this.renderKernel();
        } catch (error) {
          logMessage(`${VERSION} - Render Error: ${error.message}`);
          console.error("Render Error:", error);
        }
      }
    }
    const cubeRenderer = new CubeRenderer(htmlCanvas, ti, geometryVBO, geometryIBO);

    // =========================
    // 4. Mouse-Based Camera Controls
    // =========================
    let isDragging = false;
    let lastMouseX, lastMouseY;
    htmlCanvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    htmlCanvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        let deltaX = (e.clientX - lastMouseX) * 0.005;
        let deltaY = (e.clientY - lastMouseY) * 0.005;
        cubeRenderer.updateCamera(deltaX, deltaY);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });
    htmlCanvas.addEventListener("mouseup", () => (isDragging = false));
    htmlCanvas.addEventListener("mouseleave", () => (isDragging = false));

    // =========================
    // 5. Animation Loop:
    //    Run simulation kernels, build cube geometry from simulation live cell positions,
    //    update geometry fields, and render the cubes.
    // =========================
    async function animate() {
      // Run simulation kernels:
      await countNeighbors();
      await updateLiveness();
      await transferLiveCells();

      // Get the live cell count and positions from simulation:
      let liveCountArr = await liveCellCount.toArray();
      let liveCount = liveCountArr[0];
      let simPositions = await simVBO.toArray(); // array of [x,y,z]

      // Build combined cube geometry (vertices & indices) on CPU:
      let cubeVerticesArray = new Float32Array(liveCount * 8 * 3); // 8 vertices per cube, 3 components each
      let cubeIndicesArray = new Int32Array(liveCount * 36);         // 36 indices per cube
      for (let i = 0; i < liveCount; i++) {
        let baseVertexIndex = i * 8;
        let baseIndexIndex = i * 36;
        let pos = simPositions[i]; // live cell center position
        // For each of the 8 cube vertices:
        for (let j = 0; j < 8; j++) {
          cubeVerticesArray[(baseVertexIndex + j) * 3 + 0] = pos[0] + cubeOffsets[j][0];
          cubeVerticesArray[(baseVertexIndex + j) * 3 + 1] = pos[1] + cubeOffsets[j][1];
          cubeVerticesArray[(baseVertexIndex + j) * 3 + 2] = pos[2] + cubeOffsets[j][2];
        }
        // For each of the 36 cube indices:
        for (let j = 0; j < 36; j++) {
          cubeIndicesArray[baseIndexIndex + j] = baseVertexIndex + cubeIBO_const[j];
        }
      }
      // Update geometry fields (convert typed arrays to normal arrays)
      await geometryVBO.fromArray(Array.from(cubeVerticesArray));
      await geometryIBO.fromArray(Array.from(cubeIndicesArray));

      // Render cubes:
      cubeRenderer.render();

      requestAnimationFrame(animate);
    }
    animate();

    // =========================
    // 6. Handle Window Resize
    // =========================
    window.addEventListener("resize", () => {
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight - 200;
      cubeRenderer.aspectRatio = htmlCanvas.width / htmlCanvas.height;
    });

  } catch (error) {
    logMessage(`${VERSION} - Main Error: ${error.message}`);
    console.error("Main Error:", error);
  }
};

window.onload = main;
