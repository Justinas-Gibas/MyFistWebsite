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
        for (let i of ti.range(4096)) { // Fixed loop range: 4096
          IBO[i] = i;
        }
      });
      await initIBO();
      logMessage("IBO Initialization complete.");
  
      // Kernel to initialize the grid with random live cells
      const init = ti.kernel(() => {
        for (let I of ti.ndrange(16, 16, 16)) { // Fixed loop ranges: 16x16x16
          liveness[I.x, I.y, I.z] = 0;
          let f = ti.random();
          if (f < 0.2) { // 20% chance to be alive
            liveness[I.x, I.y, I.z] = 1;
          }
        }
      });
      await init();
      logMessage("Grid initialization complete.");
  
      // Kernel to transfer live cell positions to VBO
      const transferLiveCells = ti.kernel(() => {
        let idx = 0;
        for (let I of ti.ndrange(16, 16, 16)) { // Fixed loop ranges: 16x16x16
          if (liveness[I.x, I.y, I.z] === 1) {
            if (idx < 4096) { // liveCellsMax = 4096
              VBO[idx] = [I.x + 0.5, I.y + 0.5, I.z + 0.5]; // Center of the cell
              idx += 1;
            }
          }
        }
        liveCellCount[0] = idx; // Store the count of live cells
  
        // Assign out-of-bounds positions
        for (let i of ti.range(4096)) { // Fixed loop range: 4096
          if (i >= idx) {
            VBO[i] = [32, 32, 32]; // Positions outside the grid (assuming N=16)
          }
        }
      });
  
      // Execute the transferLiveCells kernel
      await transferLiveCells();
      logMessage("Live cells transferred.");
  
      // Retrieve and log the live cell count
      const liveCellCountArray = await liveCellCount.toArray();
      logMessage(`Live cell count: ${liveCellCountArray[0]}`);
  
      // Further kernels are not executed in this minimal example
      logMessage("Minimal example completed successfully.");
  
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
  // Append to the `head` element
  document.head.appendChild(script);
  