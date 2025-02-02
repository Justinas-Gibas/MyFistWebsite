// script.js

// --- Utility Logging Functions ---
function getCurrentTime() {
  return new Date().toLocaleTimeString();
}

function logMessage(message) {
  const logDiv = document.getElementById('log');
  const p = document.createElement('p');
  p.textContent = `[${getCurrentTime()}] ${message}`;
  logDiv.appendChild(p);
  // Keep the log from overflowing
  while (logDiv.children.length > 100) {
    logDiv.removeChild(logDiv.firstChild);
  }
}

// --- Global Version String ---
const VERSION = "Final MVP - 1.0";

// --- Main Async Function ---
let main = async () => {
  try {
    // Initialize Taichi.js
    await ti.init();
    logMessage(`${VERSION}: Taichi.js initialized.`);

    // Get canvas and set dimensions (adjust for fixed log height)
    const htmlCanvas = document.getElementById('result_canvas');
    htmlCanvas.width = window.innerWidth;
    htmlCanvas.height = window.innerHeight - 200;

    // --- Simulation Setup ---
    const N = 16; // Grid dimensions: 16x16x16
    const TOTAL_CELLS = N * N * N;
    const liveCellsMax = 4096; // Maximum live cell positions

    // Fields for simulation: liveness, neighbor counts, and live cell count
    const liveness = ti.field(ti.i32, [TOTAL_CELLS]);
    const numNeighbors = ti.field(ti.i32, [TOTAL_CELLS]);
    const liveCellCount = ti.field(ti.i32, [1]);

    // VBO to store live cell positions (a 3D vector per cell)
    const VBO = ti.Vector.field(3, ti.f32, [liveCellsMax]);
    // IBO to provide vertex indices (for use in rendering)
    const IBO = ti.field(ti.i32, [liveCellsMax]);

    // Helper to map 3D indices to 1D index
    function get1DIndex(x, y, z, N) {
      return x * N * N + y * N + z;
    }

    // Add these fields to Taichi’s kernel scope
    ti.addToKernelScope({
      N,
      TOTAL_CELLS,
      liveness,
      numNeighbors,
      VBO,
      IBO,
      liveCellsMax,
      liveCellCount,
      get1DIndex,
    });

    // --- Kernel: Initialize IBO ---
    const initIBO = ti.kernel(() => {
      for (let i of ti.range(liveCellsMax)) {
        IBO[i] = i;
      }
    });
    await initIBO();
    logMessage(`${VERSION}: IBO initialized.`);

    // --- Kernel: Initialize Grid with Random Live Cells ---
    const initGrid = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        liveness[idx] = 0;
        if (ti.random() < 0.2) { // 20% chance alive
          liveness[idx] = 1;
        }
      }
    });
    await initGrid();
    logMessage(`${VERSION}: Grid initialized.`);

    // --- Kernel: Count Neighbors (with wrap–around) ---
    const countNeighbors = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        let x = idx / (N * N) | 0;
        let y = (idx % (N * N)) / N | 0;
        let z = idx % N;
        let neighbors = 0;
        for (let dx of ti.range(3)) {
          for (let dy of ti.range(3)) {
            for (let dz of ti.range(3)) {
              if (dx === 1 && dy === 1 && dz === 1) continue; // Skip self
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

    // --- Kernel: Update Liveness (Game of Life Rules) ---
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

    // --- Kernel: Transfer Live Cell Positions into VBO ---
    const transferLiveCells = ti.kernel(() => {
      let count = 0;
      for (let i of ti.range(TOTAL_CELLS)) {
        if (liveness[i] === 1) {
          if (count < liveCellsMax) {
            let ix = i / (N * N) | 0;
            let iy = (i % (N * N)) / N | 0;
            let iz = i % N;
            // Center the grid around the origin
            VBO[count] = [ix + 0.5 - N / 2, iy + 0.5 - N / 2, iz + 0.5 - N / 2];
            count = count + 1;
          }
        }
      }
      liveCellCount[0] = count;
      // For any unused VBO entry, assign an off–screen position
      for (let j of ti.range(liveCellsMax)) {
        if (j >= count) {
          VBO[j] = [999, 999, 999];
        }
      }
    });
    await transferLiveCells();
    logMessage(`${VERSION}: Live cells transferred.`);

    // --- Renderer Class with Emissive Live Cells ---
    class Renderer3DGameOfLife {
      constructor(canvas, gridSize, liveCellsField, taichiInstance, iboField) {
        this.canvas = canvas;
        this.taichi = taichiInstance;
        this.liveCells = liveCellsField;
        this.liveCellsMax = liveCellsField.shape[0];
        this.gridSize = gridSize;
        this.aspectRatio = canvas.width / canvas.height;
        this.cameraDistance = gridSize * 2;

        // Initialize camera angles (fields of size 1)
        this.angleX = this.taichi.field(this.taichi.f32, [1]);
        this.angleY = this.taichi.field(this.taichi.f32, [1]);
        this.angleX[0] = 0.0;
        this.angleY[0] = 0.0;

        // Create textures for canvas and depth buffer
        this.canvasTexture = this.taichi.canvasTexture(canvas, 4);
        this.depthTexture = this.taichi.depthTexture([canvas.width, canvas.height], 4);

        // Add fields to kernel scope (including IBO for rendering)
        this.taichi.addToKernelScope({
          canvasTexture: this.canvasTexture,
          depthTexture: this.depthTexture,
          gridSize: this.gridSize,
          aspectRatio: this.aspectRatio,
          angleX: this.angleX,
          angleY: this.angleY,
          cameraDistance: this.cameraDistance,
          liveCells: this.liveCells,
          liveCellsMax: this.liveCellsMax,
          IBO: iboField,
        });

        // Define the rendering kernel.
        // This kernel renders each live cell as a bright, emissive point sprite.
        this.renderKernel = this.taichi.kernel(() => {
          // --- Vertex Shader Phase ---
          let theta = angleY[0];
          let phi = angleX[0];
          let eye = [
            cameraDistance * ti.sin(theta) * ti.cos(phi),
            cameraDistance * ti.sin(theta) * ti.sin(phi),
            cameraDistance * ti.cos(theta),
          ];
          let center = [0.0, 0.0, 0.0];
          let up = [0.0, 1.0, 0.0];
          let view = ti.lookAt(eye, center, up);
          let proj = ti.perspective(60.0, aspectRatio, 0.1, 1000.0);
          let mvp = proj.matmul(view);

          // Clear the canvas and depth buffer
          ti.clearColor(canvasTexture, [0.0, 0.0, 0.0, 1.0]);
          ti.useDepth(depthTexture);

          // For each live cell, output a vertex
          // We use IBO to iterate over the liveCells array
          for (let v of ti.inputVertices(liveCells, IBO)) {
            // Transform position with the MVP matrix
            let pos = [v.x, v.y, v.z, 1.0];
            let clipPos = mvp.matmul(pos);
            ti.outputPosition(clipPos);
            // Increase point size so the emissive effect is visible
            ti.outputPointSize(20.0);
            // Pass a base emissive color (here: bright orange)
            ti.outputVertex({ baseColor: [1.0, 0.6, 0.2, 1.0] });
          }

          // --- Fragment Shader Phase ---
          // Create a radial gradient for an emissive glow effect.
          for (let f of ti.inputFragments()) {
            // f.point_coord: built–in coordinates for point sprites in [0,1] range.
            let pCoord = f.point_coord - [0.5, 0.5];
            let r = pCoord.norm() / 0.5; // Normalize: edge of the point ~1.0
            if (r > 1.0) {
              ti.discard();
            }
            // Emissive intensity falls off radially (stronger at center)
            let intensity = 1.0 - r;
            let color = f.baseColor; // From vertex shader
            let emissiveColor = [color[0] * intensity,
                                 color[1] * intensity,
                                 color[2] * intensity,
                                 1.0];
            ti.outputColor(canvasTexture, emissiveColor);
          }
        });
      }

      // Method to update camera angles from mouse movements
      updateCamera(deltaX, deltaY) {
        this.angleX[0] += deltaX;
        this.angleY[0] += deltaY;
      }

      // Render one frame
      render() {
        try {
          this.renderKernel();
        } catch (error) {
          logMessage(`${VERSION} - Render Error: ${error.message}`);
          console.error("Render Error:", error);
        }
      }
    }

    // Create the renderer, passing in the IBO as well.
    const renderer = new Renderer3DGameOfLife(htmlCanvas, N, VBO, ti, IBO);

    // --- Mouse–Based Camera Controls ---
    let isDragging = false;
    let lastMouseX, lastMouseY;
    htmlCanvas.addEventListener("mousedown", (e) => {
      isDragging = true;
      lastMouseX = e.clientX;
      lastMouseY = e.clientY;
    });
    htmlCanvas.addEventListener("mousemove", (e) => {
      if (isDragging) {
        const deltaX = (e.clientX - lastMouseX) * 0.005;
        const deltaY = (e.clientY - lastMouseY) * 0.005;
        renderer.updateCamera(deltaX, deltaY);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });
    htmlCanvas.addEventListener("mouseup", () => isDragging = false);
    htmlCanvas.addEventListener("mouseleave", () => isDragging = false);

    // --- Simulation Step and Animation Loop ---
    const simulationStep = async () => {
      try {
        await countNeighbors();
        await updateLiveness();
        await transferLiveCells();
        renderer.render();
        const countArray = await liveCellCount.toArray();
        logMessage(`${VERSION}: Live Cells Count: ${countArray[0]}`);
      } catch (error) {
        logMessage(`${VERSION} - Simulation Step Error: ${error.message}`);
        console.error("Simulation Step Error:", error);
      }
    };

    const animate = async () => {
      await simulationStep();
      requestAnimationFrame(animate);
    };

    animate();
    logMessage(`${VERSION}: Animation loop started.`);

    // --- Handle Window Resize ---
    window.addEventListener("resize", () => {
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight - 200;
      renderer.aspectRatio = htmlCanvas.width / htmlCanvas.height;
    });

  } catch (error) {
    logMessage(`${VERSION} - Main Error: ${error.message}`);
    console.error("Main Error:", error);
  }
};

window.onload = main;
