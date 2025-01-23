// script.js

// Function to log messages to the log div
function logMessage(message) {
    const logDiv = document.getElementById('log');
    const p = document.createElement('p');
    p.textContent = message;
    logDiv.appendChild(p);
    // Auto-scroll to the bottom
    logDiv.scrollTop = logDiv.scrollHeight;
  }
  
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
        let center = [gridSize / 2, gridSize / 2, gridSize / 2];
        let up = [0.0, 1.0, 0.0];
  
        // Compute view and projection matrices
        let view = ti.lookAt(eye, center, up);
        let proj = ti.perspective(60.0, aspectRatio, 0.1, 1000.0);
        let mvp = proj.matmul(view);
  
        // Clear the canvas and depth buffer
        ti.clearColor(canvasTexture, [0.0, 0.0, 0.0, 1.0]);
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
        logMessage(`Render Error: ${error.message}`);
        console.error("Render Error:", error);
      }
    }
  }
  
  // Main Function
  let main = async () => {
    try {
      // Initialize Taichi.js
      await ti.init();
      logMessage("Taichi.js initialized.");
  
      // Define grid dimensions
      const N = 16; // 16x16x16 grid for performance
      const liveCellsMax = 4096; // Fixed compile-time constant
  
      // Initialize HTML Canvas
      let htmlCanvas = document.getElementById('result_canvas');
      htmlCanvas.width = 800;
      htmlCanvas.height = 800;
  
      // Define 3D fields for liveness and neighbor count
      const liveness = ti.field(ti.i32, [N, N, N]);
      const numNeighbors = ti.field(ti.i32, [N, N, N]);
  
      // Define VBO and IBO for rendering
      const VBO = ti.Vector.field(3, ti.f32, [liveCellsMax]); // Positions of live cells
      const IBO = ti.field(ti.i32, [liveCellsMax]); // Indices for live cells
  
      // Define liveCellCount field for logging
      const liveCellCount = ti.field(ti.i32, [1]); // Initialize with size 1
      ti.addToKernelScope({ liveCellCount }); // Add to kernel scope
  
      // Add fields to kernel scope
      ti.addToKernelScope({
        N,
        liveness,
        numNeighbors,
        VBO,
        IBO,
        liveCellsMax,
        liveCellCount, // Add liveCellCount to kernel scope
      });
  
      // Initialize IBO with indices 0 to liveCellsMax-1
      const initIBO = ti.kernel(() => {
        for (let i of ti.range(liveCellsMax)) { // Use ti.range for 1D loop
          IBO[i] = i;
        }
      });
      await initIBO();
      logMessage("IBO Initialization complete.");
  
      // Kernel to initialize the grid with random live cells
      const init = ti.kernel(() => {
        for (let I of ti.ndrange(N, N, N)) {
          liveness[I.x, I.y, I.z] = 0;
          let f = ti.random();
          if (f < 0.2) { // 20% chance to be alive
            liveness[I.x, I.y, I.z] = 1;
          }
        }
      });
      await init();
      logMessage("Grid initialization complete.");
  
      // Initialize Renderer after liveness is added to kernel scope
      let renderer = new Renderer3DGameOfLife(htmlCanvas, N, liveCellsMax, ti);
  
      // Kernel to transfer live cell positions to VBO
      const transferLiveCells = ti.kernel(() => {
        let idx = 0;
        for (let I of ti.ndrange(N, N, N)) {
          if (liveness[I.x, I.y, I.z] === 1) {
            if (idx < liveCellsMax) {
              VBO[idx] = [I.x + 0.5, I.y + 0.5, I.z + 0.5]; // Center of the cell
              idx += 1;
            }
          }
        }
        liveCellCount[0] = idx; // Store the count of live cells
  
        // Assign out-of-bounds positions
        for (let i of ti.range(liveCellsMax)) { // Fixed loop range
          if (i >= idx) {
            VBO[i] = [N * 2, N * 2, N * 2]; // Positions outside the grid
          }
        }
      });
  
      // Kernel to count the number of live neighbors for each cell
      const countNeighbors = ti.kernel(() => {
        for (let I of ti.ndrange(N, N, N)) {
          let neighbors = 0;
          for (let dx of ti.ndrange(3)) {
            for (let dy of ti.ndrange(3)) {
              for (let dz of ti.ndrange(3)) {
                if (dx === 1 && dy === 1 && dz === 1) continue; // Skip the cell itself
                let x = (I.x + dx - 1 + N) % N;
                let y = (I.y + dy - 1 + N) % N;
                let z = (I.z + dz - 1 + N) % N;
                neighbors += liveness[x, y, z];
              }
            }
          }
          numNeighbors[I.x, I.y, I.z] = neighbors;
        }
      });
  
      // Kernel to update the liveness of each cell based on Game of Life rules
      const updateLiveness = ti.kernel(() => {
        for (let I of ti.ndrange(N, N, N)) {
          let neighbors = numNeighbors[I.x, I.y, I.z];
          if (liveness[I.x, I.y, I.z] === 1) {
            if (neighbors < 4 || neighbors > 5) { // Survival condition adjusted for 26 neighbors
              liveness[I.x, I.y, I.z] = 0;
            }
          } else {
            if (neighbors === 5) { // Birth condition
              liveness[I.x, I.y, I.z] = 1;
            }
          }
        }
      });
  
      // Animation loop
      let frameCount = 0;
      async function frame() {
        try {
          await countNeighbors();
          await updateLiveness();
          await transferLiveCells();
          renderer.render();
  
          frameCount++;
  
          // Retrieve and log the live cell count
          const liveCellCountArray = await liveCellCount.toArray();
          logMessage(`Frame ${frameCount}: Live cell count = ${liveCellCountArray[0]}`);
  
          // Update camera angles for rotation
          renderer.updateCamera(0.01, 0.01); // Rotate slightly each frame
  
          requestAnimationFrame(frame);
        } catch (frameError) {
          logMessage(`Frame Error: ${frameError.message}`);
          console.error("Frame Error:", frameError);
        }
      }
  
      // Start the animation loop
      requestAnimationFrame(frame);
      logMessage("Animation loop started.");
  
    } catch (error) {
      logMessage(`Main Error: ${error.message}`);
      console.error("Main Error:", error);
    }
  };
  
  // Load Taichi.js and execute the main function
  const script = document.createElement('script');
  script.addEventListener('load', function () {
    main();
  });
  script.src = 'https://unpkg.com/taichi.js/dist/taichi.umd.js';
  script.onerror = function () {
    logMessage("Failed to load Taichi.js script.");
    console.error("Failed to load Taichi.js script.");
  };
  document.head.appendChild(script);
  