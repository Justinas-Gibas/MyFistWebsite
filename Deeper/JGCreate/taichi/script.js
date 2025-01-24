// script.js

// Function to log messages to the log div with log management
function logMessage(message) {
    const logDiv = document.getElementById('log');
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
  
    // Limit to last 100 messages to prevent overflow
    while (logDiv.children.length > 100) {
      logDiv.removeChild(logDiv.firstChild);
    }
  
    // Auto-scroll to the bottom
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
  // Version Label
  const VERSION = "Final MVP - 1.0";
  
  // Renderer3DGameOfLife Class
  class Renderer3DGameOfLife {
    constructor(htmlCanvas, gridSize, liveCellsMax, taichiInstance) {
      this.htmlCanvas = htmlCanvas;
      this.gridSize = gridSize;
      this.liveCellsMax = liveCellsMax; // Maximum number of live cells
      this.taichi = taichiInstance; // Reference to the Taichi.js instance
      this.aspectRatio = htmlCanvas.width / htmlCanvas.height;
      this.cameraDistance = gridSize * 2;
  
      // Initialize camera angles as 1-dimensional Taichi fields
      this.angleX = this.taichi.field(this.taichi.f32, [1]);
      this.angleY = this.taichi.field(this.taichi.f32, [1]);
      this.angleX[0] = 0.0;
      this.angleY[0] = 0.0;
  
      // Create textures
      this.canvasTexture = this.taichi.canvasTexture(this.htmlCanvas, 4);
      this.depthTexture = this.taichi.depthTexture(
        [this.htmlCanvas.width, this.htmlCanvas.height],
        4
      );
  
      // Create a field to store live cell positions (up to liveCellsMax)
      this.liveCells = this.taichi.Vector.field(3, this.taichi.f32, [this.liveCellsMax]);
  
      // Add necessary variables to kernel scope, including liveCellsMax
      this.taichi.addToKernelScope({
        canvasTexture: this.canvasTexture,
        depthTexture: this.depthTexture,
        gridSize: this.gridSize,
        aspectRatio: this.aspectRatio,
        angleX: this.angleX,
        angleY: this.angleY,
        cameraDistance: this.cameraDistance,
        liveCells: this.liveCells,
        liveCellsMax: this.liveCellsMax, // Added to kernel scope
      });
  
      // Define the rendering kernel
      this.renderKernel = this.taichi.kernel(() => {
        // --- Vertex Shader Phase ---
        // Retrieve camera angles
        let theta = angleY[0];
        let phi = angleX[0];
  
        // Compute eye position using Taichi's math functions
        let eye = [
          cameraDistance * ti.sin(theta) * ti.cos(phi),
          cameraDistance * ti.sin(theta) * ti.sin(phi),
          cameraDistance * ti.cos(theta),
        ];
  
        // Define the center and up vector
        let center = [0.0, 0.0, 0.0]; // Center at origin
        let up = [0.0, 1.0, 0.0];
  
        // Compute view and projection matrices
        let view = ti.lookAt(eye, center, up);
        let proj = ti.perspective(60.0, aspectRatio, 0.1, 1000.0);
        let mvp = proj.matmul(view);
  
        // Clear the canvas and depth buffer
        ti.clearColor(canvasTexture, [0.0, 0.0, 0.0, 1.0]); // Black background
        ti.useDepth(depthTexture);
  
        // Render live cells as white points using inputVertices
        for (let v of ti.inputVertices(liveCells, IBO)) { // Ensure inputVertices uses liveCells and IBO
          // Transform the position using the MVP matrix
          let transformed = mvp.matmul([v.x, v.y, v.z, 1.0]);
          ti.outputPosition(transformed); // Only transformed position
  
          // Pass color to fragment shader
          ti.outputVertex({ color: [1.0, 1.0, 1.0, 1.0] }); // White color
        }
  
        // --- Fragment Shader Phase ---
        for (let f of ti.inputFragments()) {
          // Retrieve the color passed from the vertex shader
          let color = f.color;
          ti.outputColor(canvasTexture, color); // Output Texture + Color
        }
      });
    }
  
    // Method to update camera angles
    updateCamera(deltaX, deltaY) {
      this.angleX[0] += deltaX;
      this.angleY[0] += deltaY;
    }
  
    // Method to render the current frame
    render() {
      try {
        this.renderKernel();
      } catch (error) {
        logMessage(`Version ${VERSION} - Render Error: ${error.message}`);
        console.error("Render Error:", error);
      }
    }
  }
  
  // Helper Function to Map 3D Indices to 1D
  function get1DIndex(x, y, z, N) {
    return x * N * N + y * N + z;
  }
  
  // Main Function
  let main = async () => {
    try {
      // Initialize Taichi.js
      await ti.init();
      logMessage(`Version ${VERSION}: Taichi.js initialized.`);
  
      // Define grid dimensions
      const N = 16; // 16x16x16 grid for performance
      const liveCellsMax = 4096; // Fixed compile-time constant
      const TOTAL_CELLS = N * N * N;
  
      // Initialize HTML Canvas (already present in HTML)
      let htmlCanvas = document.getElementById('result_canvas');
      htmlCanvas.width = window.innerWidth;
      htmlCanvas.height = window.innerHeight - 200; // Adjust height based on log panel
  
      // Define fields
      // Flattening the 3D fields to 1D
      const liveness = ti.field(ti.i32, [TOTAL_CELLS]);
      const numNeighbors = ti.field(ti.i32, [TOTAL_CELLS]);
  
      // Define VBO and IBO for rendering
      const VBO = ti.Vector.field(3, ti.f32, [liveCellsMax]); // Positions of live cells
      const IBO = ti.field(ti.i32, [liveCellsMax]); // Indices for live cells
  
      // Define liveCellCount field for logging
      const liveCellCount = ti.field(ti.i32, [1]); // Initialize with size 1
  
      // Define additional logging fields
      const transferIdx = ti.field(ti.i32, [1]); // To capture 'idx' from transferLiveCells
  
      // Add fields to kernel scope
      ti.addToKernelScope({
        N,
        TOTAL_CELLS,
        liveness,
        numNeighbors,
        VBO,
        IBO,
        liveCellsMax,
        liveCellCount, // Add liveCellCount to kernel scope
        transferIdx, // Add transferIdx to kernel scope
      });
  
      // Initialize IBO with indices 0 to liveCellsMax-1
      const initIBO = ti.kernel(() => {
        for (let i of ti.range(liveCellsMax)) { // Fixed loop range: liveCellsMax
          IBO[i] = i;
        }
      });
      await initIBO();
      logMessage(`Version ${VERSION}: IBO Initialization complete.`);
  
      // Kernel to initialize the grid with random live cells
      const initGrid = ti.kernel(() => {
        for (let idx of ti.range(TOTAL_CELLS)) { // Loop over 1D index with fixed range
          liveness[idx] = 0;
          let f = ti.random();
          if (f < 0.2) { // 20% chance to be alive
            liveness[idx] = 1;
          }
        }
      });
      await initGrid();
      logMessage(`Version ${VERSION}: Grid initialization complete.`);
  
      // Define Count Neighbors Kernel with Fixed Range
      const countNeighbors = ti.kernel(() => {
        for (let idx of ti.range(TOTAL_CELLS)) { // Use fixed TOTAL_CELLS
          let x = Math.floor(idx / (N * N));
          let y = Math.floor((idx % (N * N)) / N);
          let z = idx % N;
  
          let neighbors = 0;
          for (let dx of ti.range(3)) { // 0,1,2
            for (let dy of ti.range(3)) { // 0,1,2
              for (let dz of ti.range(3)) { // 0,1,2
                // Skip the cell itself
                if (dx === 1 && dy === 1 && dz === 1) continue;
  
                // Calculate neighbor coordinates with edge wrapping
                let nx = (x + dx - 1 + N) % N;
                let ny = (y + dy - 1 + N) % N;
                let nz = (z + dz - 1 + N) % N;
  
                // Map 3D coordinates to 1D index
                let neighborIdx = get1DIndex(nx, ny, nz, N);
  
                neighbors += liveness[neighborIdx];
              }
            }
          }
          numNeighbors[idx] = neighbors;
        }
      });
      await countNeighbors();
      logMessage(`Version ${VERSION}: Count Neighbors Kernel executed with fixed range.`);
  
      // Define Update Liveness Kernel
      const updateLiveness = ti.kernel(() => {
        for (let idx of ti.range(TOTAL_CELLS)) { // Loop over 1D index with fixed range
          let currentState = liveness[idx];
          let neighbors = numNeighbors[idx];
  
          if (currentState === 1) {
            if (neighbors < 5 || neighbors > 7) { // Survival rules adjusted for 26 neighbors
              liveness[idx] = 0;
            }
          } else {
            if (neighbors === 5) { // Birth condition
              liveness[idx] = 1;
            }
          }
        }
      });
      await updateLiveness();
      logMessage(`Version ${VERSION}: Update Liveness Kernel executed.`);
  
      // Define Transfer Live Cells Kernel
      const transferLiveCells = ti.kernel(() => {
        let idx = 0;
        for (let i of ti.range(TOTAL_CELLS)) { // Loop over 1D index
          if (liveness[i] === 1) {
            if (idx < liveCellsMax) { // Ensure we don't exceed VBO capacity
              // Center the grid around origin
              let x = (Math.floor(i / (N * N)) + 0.5) - (N / 2);
              let y = (Math.floor((i % (N * N)) / N) + 0.5) - (N / 2);
              let z = (i % N + 0.5) - (N / 2);
              VBO[idx] = [x, y, z]; // Centered position
              idx += 1;
            }
          }
        }
        liveCellCount[0] = idx; // Store the count of live cells
  
        // Assign out-of-bounds positions
        for (let j of ti.range(liveCellsMax)) { // Loop over VBO indices
          if (j >= idx) {
            VBO[j] = [32, 32, 32]; // Positions outside the grid (assuming N=16)
          }
        }
      });
      await transferLiveCells();
      logMessage(`Version ${VERSION}: Transfer Live Cells Kernel executed.`);
  
      // Initialize Renderer
      const renderer = new Renderer3DGameOfLife(htmlCanvas, N, liveCellsMax, ti);
  
      // Render the initial frame
      renderer.render();
      logMessage(`Version ${VERSION}: Initial Renderer execution complete.`);
  
      // Log the initial number of live cells
      logMessage(`Live Cells Count: ${liveCellCount[0]}`);
  
      // Define a simulation step
      const simulationStep = async () => {
        try {
          // Count Neighbors
          await countNeighbors();
          logMessage(`Version ${VERSION}: Count Neighbors Kernel executed.`);
  
          // Update Liveness
          await updateLiveness();
          logMessage(`Version ${VERSION}: Update Liveness Kernel executed.`);
  
          // Transfer Live Cells
          await transferLiveCells();
          logMessage(`Version ${VERSION}: Transfer Live Cells Kernel executed.`);
  
          // Log the current number of live cells
          logMessage(`Live Cells Count: ${liveCellCount[0]}`);
  
          // Render the frame
          renderer.render();
          logMessage(`Version ${VERSION}: Renderer executed.`);
        } catch (error) {
          logMessage(`Version ${VERSION} - Simulation Step Error: ${error.message || 'Undefined error.'}`);
          console.error("Simulation Step Error:", error);
        }
      };
  
      // Define the animation loop
      const animate = async () => {
        await simulationStep();
        requestAnimationFrame(animate);
      };
  
      // Start the animation loop
      animate();
      logMessage(`Version ${VERSION}: Animation loop started.`);
  
      // Handle Window Resize
      window.addEventListener('resize', () => {
        htmlCanvas.width = window.innerWidth;
        htmlCanvas.height = window.innerHeight - 200; // Adjust height based on log panel
        renderer.aspectRatio = htmlCanvas.width / htmlCanvas.height;
        // Note: Taichi.js may require reinitializing certain parameters if aspect ratio changes significantly
      });
  
      logMessage(`Version ${VERSION}: Completed successfully.`);
    } catch (error) {
      // Enhanced Error Logging
      if (error.message) {
        logMessage(`Version ${VERSION} - Main Error: ${error.message}`);
        console.error("Main Error:", error);
      } else {
        logMessage(`Version ${VERSION} - Main Error: Undefined error.`);
        console.error("Main Error: Undefined error.", error);
      }
    }
  };
  
  // Execute the main function once the window loads
  window.onload = main;
  