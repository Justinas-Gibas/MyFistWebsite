// script.js

// =========================
// Utility Logging Functions
// =========================
function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

function logMessage(msg) {
  const logDiv = document.getElementById("log");
  const p = document.createElement("p");
  p.textContent = `[${getCurrentTime()}] ${msg}`;
  logDiv.appendChild(p);
  // Limit log messages to 100 entries.
  while (logDiv.children.length > 100) {
    logDiv.removeChild(logDiv.firstChild);
  }
  console.log(msg);
}

// Global version string
const VERSION = "3D Game of Life - Cube Version 1.0.1";

// =========================
// Main Async Function
// =========================
let main = async () => {
  try {
    logMessage(`${VERSION}: Starting main...`);

    // Initialize Taichi.js
    await ti.init();
    logMessage(`${VERSION}: Taichi.js initialized.`);

    // Set up the canvas
    const htmlCanvas = document.getElementById("result_canvas");
    htmlCanvas.width = window.innerWidth;
    htmlCanvas.height = window.innerHeight - 200;
    logMessage(`${VERSION}: Canvas set to ${htmlCanvas.width} x ${htmlCanvas.height}.`);

    // =========================
    // 1. Simulation Setup (3D Game of Life)
    // =========================
    const N = 16; // grid dimensions: 16x16x16
    const TOTAL_CELLS = N * N * N;
    const liveCellsMax = 4096; // maximum live cells

    // Create simulation fields
    const liveness = ti.field(ti.i32, [TOTAL_CELLS]);
    const numNeighbors = ti.field(ti.i32, [TOTAL_CELLS]);
    const liveCellCount = ti.field(ti.i32, [1]);

    // Field to hold live cell center positions
    const simVBO = ti.Vector.field(3, ti.f32, [liveCellsMax]);
    // Dummy IBO to iterate simVBO
    const simIBO = ti.field(ti.i32, [liveCellsMax]);

    logMessage(`${VERSION}: Simulation fields created.`);

    // Helper: Convert 3D indices to 1D
    function get1DIndex(x, y, z, N) {
      return x * N * N + y * N + z;
    }

    // Add simulation fields and helper to kernel scope
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
    logMessage(`${VERSION}: Added simulation fields to kernel scope.`);

    // --- Kernel: Initialize simIBO ---
    const initSimIBO = ti.kernel(() => {
      for (let i of ti.range(liveCellsMax)) {
        simIBO[i] = i;
      }
    });
    await initSimIBO();
    logMessage(`${VERSION}: Simulation IBO initialized.`);

    // --- Kernel: Initialize Grid (Random live cells) ---
    const initGrid = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        liveness[idx] = 0;
        if (ti.random() < 0.2) {
          liveness[idx] = 1;
        }
      }
    });
    await initGrid();
    logMessage(`${VERSION}: Grid initialized with random live cells.`);

    // --- Kernel: Count Neighbors (Wrap-around) ---
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

    // --- Kernel: Update Liveness (Rules) ---
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

    // --- Kernel: Transfer Live Cell Positions ---
    const transferLiveCells = ti.kernel(() => {
      let count = 0;
      for (let i of ti.range(TOTAL_CELLS)) {
        if (liveness[i] === 1) {
          if (count < liveCellsMax) {
            let ix = i32(i / (N * N));
            let iy = i32((i % (N * N)) / N);
            let iz = i % N;
            // Center the grid about the origin
            simVBO[count] = [ix + 0.5 - N / 2, iy + 0.5 - N / 2, iz + 0.5 - N / 2];
            count = count + 1;
          }
        }
      }
      liveCellCount[0] = count;
      // Place off-screen for any unused entry
      for (let j of ti.range(liveCellsMax)) {
        if (j >= count) {
          simVBO[j] = [999, 999, 999];
        }
      }
    });
    await transferLiveCells();
    logMessage(`${VERSION}: Live cell positions transferred.`);

    // =========================
    // 2. Cube Geometry Setup for Rendering
    // =========================
    // We allocate fields with maximum capacity.
    const maxCubeVertices = liveCellsMax * 8;   // each cube has 8 vertices
    const maxCubeIndices  = liveCellsMax * 36;    // each cube has 36 indices

    // Create geometry fields with fixed size.
    let geometryVBO = ti.Vector.field(3, ti.f32, [maxCubeVertices]);
    let geometryIBO = ti.field(ti.i32, [maxCubeIndices]);
    logMessage(`${VERSION}: Geometry fields created: geometryVBO (${maxCubeVertices} vertices), geometryIBO (${maxCubeIndices} indices).`);

    // Define a constant cube (unit cube with half-size 0.4)
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
    const cubeIBO_const = [
      0, 1, 2, 1, 3, 2,      // front face
      4, 5, 6, 5, 7, 6,      // back face
      0, 2, 4, 2, 6, 4,      // left face
      1, 3, 5, 3, 7, 5,      // right face
      0, 1, 4, 1, 5, 4,      // bottom face
      2, 3, 6, 3, 7, 6       // top face
    ];
    logMessage(`${VERSION}: Cube constants defined.`);

    // =========================
    // 3. CubeRenderer Class (with Detailed Logging)
    // =========================
    class CubeRenderer {
      constructor(canvas, tiInstance, geometryVBO, geometryIBO) {
        console.log("CubeRenderer: Constructor called.");
        console.log("CubeRenderer: Received geometryVBO:", geometryVBO);
        console.log("CubeRenderer: Received geometryIBO:", geometryIBO);
        
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
        console.log("CubeRenderer: angleX field:", this.angleX, "angleY field:", this.angleY);

        // Add geometry fields and camera globals to kernel scope
        ti.addToKernelScope({
          target: this.target,
          depth: this.depth,
          aspectRatio: this.aspectRatio,
          angleX: this.angleX,
          angleY: this.angleY,
          geometryVBO: this.geometryVBO,
          geometryIBO: this.geometryIBO,
        });
        console.log("CubeRenderer: Kernel scope updated with geometryVBO and geometryIBO.");

        // Define the render kernel with logging for errors
        this.renderKernel = ti.kernel(() => {
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

          // Transform and output each vertex
          for (let v of ti.inputVertices(geometryVBO, geometryIBO)) {
            let pos = mvp.matmul(v.concat([1.0]));
            ti.outputPosition(pos);
            ti.outputVertex({ color: [0.8, 0.8, 0.8, 1.0] });
          }
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
          console.log("CubeRenderer: Render kernel executed successfully.");
        } catch (error) {
          console.error("CubeRenderer render error:", error);
          logMessage(`CubeRenderer render error: ${error.message}`);
        }
      }
    }
    const cubeRenderer = new CubeRenderer(htmlCanvas, ti, geometryVBO, geometryIBO);
    logMessage(`${VERSION}: CubeRenderer created.`);

    // =========================
    // 4. Mouse-Based Camera Controls
    // =========================
    let isDragging = false;
    let lastMouseX, lastMouseY;
    htmlCanvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
      logMessage("Mouse down: starting camera drag.");
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
    htmlCanvas.addEventListener("mouseup", () => {
      isDragging = false;
      logMessage("Mouse up: ending camera drag.");
    });
    htmlCanvas.addEventListener("mouseleave", () => {
      isDragging = false;
      logMessage("Mouse left canvas: ending camera drag.");
    });

    // =========================
    // 5. Animation Loop: Simulation, Geometry Build, and Rendering
    // =========================
    async function animate() {
      try {
        // Run simulation kernels:
        await countNeighbors();
        await updateLiveness();
        await transferLiveCells();
        logMessage("Simulation kernels executed.");

        // Read live cell count and positions
        let liveCountArr = await liveCellCount.toArray();
        let liveCount = liveCountArr[0];
        logMessage(`Live cell count: ${liveCount}`);

        let simPositions = await simVBO.toArray();
        console.log("Simulation positions (first few):", simPositions.slice(0, Math.min(10, liveCount)));

        // Build cube geometry arrays.
        // IMPORTANT: We must pad the arrays to match the fixed field sizes.
        let totalCubeVertices = maxCubeVertices; // liveCellsMax * 8
        let totalCubeIndices = maxCubeIndices;   // liveCellsMax * 36
        let cubeVerticesArray = new Float32Array(totalCubeVertices * 3); // each vertex has 3 components
        let cubeIndicesArray = new Int32Array(totalCubeIndices);

        // Fill geometry for each live cell.
        for (let i = 0; i < liveCount; i++) {
          let baseVertexIndex = i * 8;
          let baseIndexIndex = i * 36;
          let pos = simPositions[i]; // center of live cell cube
          for (let j = 0; j < 8; j++) {
            let vertexIndex = (baseVertexIndex + j) * 3;
            cubeVerticesArray[vertexIndex + 0] = pos[0] + cubeOffsets[j][0];
            cubeVerticesArray[vertexIndex + 1] = pos[1] + cubeOffsets[j][1];
            cubeVerticesArray[vertexIndex + 2] = pos[2] + cubeOffsets[j][2];
          }
          for (let j = 0; j < 36; j++) {
            cubeIndicesArray[baseIndexIndex + j] = baseVertexIndex + cubeIBO_const[j];
          }
        }
        // Pad remaining geometry with dummy data.
        for (let i = liveCount; i < liveCellsMax; i++) {
          let baseVertexIndex = i * 8;
          for (let j = 0; j < 8; j++) {
            let vertexIndex = (baseVertexIndex + j) * 3;
            cubeVerticesArray[vertexIndex + 0] = 999;
            cubeVerticesArray[vertexIndex + 1] = 999;
            cubeVerticesArray[vertexIndex + 2] = 999;
          }
          let baseIndexIndex = i * 36;
          for (let j = 0; j < 36; j++) {
            cubeIndicesArray[baseIndexIndex + j] = 0;
          }
        }
        logMessage(`Built geometry for ${liveCount} cubes.`);

        // Update Taichi geometry fields with padded arrays.
        await geometryVBO.fromArray(Array.from(cubeVerticesArray));
        await geometryIBO.fromArray(Array.from(cubeIndicesArray));
        logMessage("Geometry fields updated with new cube geometry.");

        // Render the cubes.
        cubeRenderer.render();

        requestAnimationFrame(animate);
      } catch (error) {
        console.error("Animation loop error:", error);
        logMessage(`Animation loop error: ${error.message}`);
        requestAnimationFrame(animate);
      }
    }
    animate();
    logMessage(`${VERSION}: Animation loop started.`);

    // =========================
    // 6. Handle Window Resize
    // =========================
    window.addEventListener("resize", () => {
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight - 200;
      cubeRenderer.aspectRatio = htmlCanvas.width / htmlCanvas.height;
      logMessage(`Window resized: New canvas dimensions ${htmlCanvas.width} x ${htmlCanvas.height}`);
    });

  } catch (error) {
    console.error("Main error:", error);
    logMessage(`${VERSION} - Main Error: ${error.message}`);
  }
};

window.onload = main;
