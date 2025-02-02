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
  while (logDiv.children.length > 100) {
    logDiv.removeChild(logDiv.firstChild);
  }
}

// --- Global Version String ---
const VERSION = "Final MVP - 1.2";

// --- Main Async Function ---
let main = async () => {
  try {
    // Initialize Taichi.js
    await ti.init();
    logMessage(`${VERSION}: Taichi.js initialized.`);

    // Setup HTML Canvas dimensions (adjust height for log panel)
    const htmlCanvas = document.getElementById('result_canvas');
    htmlCanvas.width = window.innerWidth;
    htmlCanvas.height = window.innerHeight - 200;

    // --- Simulation Setup ---
    const N = 16; // Grid dimensions: 16x16x16
    const TOTAL_CELLS = N * N * N;
    const liveCellsMax = 4096; // Maximum number of live cells

    // Fields for simulation: liveness, neighbor count, and live cell count
    const liveness = ti.field(ti.i32, [TOTAL_CELLS]);
    const numNeighbors = ti.field(ti.i32, [TOTAL_CELLS]);
    const liveCellCount = ti.field(ti.i32, [1]);

    // VBO to store live cell positions (a 3D vector per cell)
    const VBO = ti.Vector.field(3, ti.f32, [liveCellsMax]);
    // IBO for vertex indexing
    const IBO = ti.field(ti.i32, [liveCellsMax]);

    // Helper function to map 3D indices to 1D index
    function get1DIndex(x, y, z, N) {
      return x * N * N + y * N + z;
    }

    // Add these fields and helper to Taichi’s kernel scope
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
        if (ti.random() < 0.2) { // 20% chance to be alive
          liveness[idx] = 1;
        }
      }
    });
    await initGrid();
    logMessage(`${VERSION}: Grid initialized.`);

    // --- Kernel: Count Neighbors (with wrap–around) ---
    const countNeighbors = ti.kernel(() => {
      for (let idx of ti.range(TOTAL_CELLS)) {
        // Use i32() to cast the division result to integer
        let x = i32(idx / (N * N));
        let y = i32((idx % (N * N)) / N);
        let z = idx % N;
        let neighbors = 0;
        for (let dx of ti.range(3)) {
          for (let dy of ti.range(3)) {
            for (let dz of ti.range(3)) {
              if (dx === 1 && dy === 1 && dz === 1) continue; // skip self
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
            // Use i32() for integer division
            let ix = i32(i / (N * N));
            let iy = i32((i % (N * N)) / N);
            let iz = i % N;
            VBO[count] = [ix + 0.5 - N / 2, iy + 0.5 - N / 2, iz + 0.5 - N / 2];
            count = count + 1;
          }
        }
      }
      liveCellCount[0] = count;
      // For unused entries, assign an off-screen position
      for (let j of ti.range(liveCellsMax)) {
        if (j >= count) {
          VBO[j] = [999, 999, 999];
        }
      }
    });
    await transferLiveCells();
    logMessage(`${VERSION}: Live cells transferred.`);

    // --- Renderer Class with Test Marker ---
    class Renderer3DGameOfLife {
      constructor(canvas, gridSize, liveCellsField, tiInstance, iboField) {
        this.canvas = canvas;
        this.taichi = tiInstance;
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
        // First, it draws a test marker (a large green point at [0,0,0])
        // Then it draws the simulation live cells as emissive points.
        this.renderKernel = this.taichi.kernel(() => {
          // --- Compute camera matrices ---
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

          // Clear the canvas and depth buffer.
          ti.clearColor(canvasTexture, [0.0, 0.0, 0.0, 1.0]);
          ti.useDepth(depthTexture);

          // *** Test Marker: Draw a bright green point at world origin ***
          {
            let testPos = [0.0, 0.0, 0.0, 1.0];
            let clipTestPos = mvp.matmul(testPos);
            ti.outputPosition(clipTestPos);
            ti.outputPointSize(30.0);
            ti.outputVertex({ baseColor: [0.0, 1.0, 0.0, 1.0] });
          }

          // Draw simulation live cells as emissive points.
          for (let v of ti.inputVertices(liveCells, IBO)) {
            let pos = [v.x, v.y, v.z, 1.0];
            let clipPos = mvp.matmul(pos);
            ti.outputPosition(clipPos);
            ti.outputPointSize(20.0);
            ti.outputVertex({ baseColor: [1.0, 0.6, 0.2, 1.0] });
          }

          // --- Fragment Shader: Create a radial emissive glow ---
          for (let f of ti.inputFragments()) {
            // f.point_coord is in [0, 1] range for point sprites.
            let pCoord = f.point_coord - [0.5, 0.5];
            let r = pCoord.norm() / 0.5;
            if (r > 1.0) {
              ti.discard();
            }
            let intensity = 1.0 - r;
            let color = f.baseColor;
            let emissiveColor = [
              color[0] * intensity,
              color[1] * intensity,
              color[2] * intensity,
              1.0,
            ];
            ti.outputColor(canvasTexture, emissiveColor);
          }
        });
      }

      // Method to update camera angles (e.g., via mouse dragging)
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

    // Create the renderer (pass VBO and IBO)
    const renderer = new Renderer3DGameOfLife(htmlCanvas, N, VBO, ti, IBO);

    // --- Mouse-Based Camera Controls ---
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
        renderer.updateCamera(deltaX, deltaY);
        lastMouseX = e.clientX;
        lastMouseY = e.clientY;
      }
    });
    htmlCanvas.addEventListener("mouseup", () => (isDragging = false));
    htmlCanvas.addEventListener("mouseleave", () => (isDragging = false));

    // --- Simulation Step & Animation Loop ---
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
