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
  
  // Version Label
  const VERSION = "1.3";
  
  // Main Function
  let main = async () => {
    try {
      // Initialize Taichi.js
      await ti.init();
      logMessage(`Version ${VERSION}: Taichi.js initialized.`);
  
      // Define grid dimensions
      const N = 16; // 16x16x16 grid for performance
      const liveCellsMax = 4096; // Fixed compile-time constant
  
      // Initialize HTML Canvas
      let htmlCanvas = document.getElementById('result_canvas');
      htmlCanvas.width = 800;
      htmlCanvas.height = 800;
  
      // Define fields
      const liveness = ti.field(ti.i32, [N, N, N]);
      const numNeighbors = ti.field(ti.i32, [N, N, N]);
  
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
        for (let i of ti.range(4096)) { // Fixed loop range: 4096
          IBO[i] = i;
        }
      });
      await initIBO();
      logMessage(`Version ${VERSION}: IBO Initialization complete.`);
  
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
      logMessage(`Version ${VERSION}: Grid initialization complete.`);
  
      // Define Count Neighbors Kernel without Conditions
      const countNeighbors = ti.kernel(() => {
        for (let I of ti.ndrange(16, 16, 16)) { // Fixed loop ranges: 16x16x16
          let neighbors = 0;
          for (let dx of ti.ndrange(3)) { // 0,1,2
            for (let dy of ti.ndrange(3)) { // 0,1,2
              for (let dz of ti.ndrange(3)) { // 0,1,2
                // No condition; count all neighbors including the cell itself
                let x = (I.x + dx - 1 + 16) % 16; // Wrap around edges
                let y = (I.y + dy - 1 + 16) % 16;
                let z = (I.z + dz - 1 + 16) % 16;
                neighbors += liveness[x, y, z];
              }
            }
          }
          numNeighbors[I.x, I.y, I.z] = neighbors;
        }
      });
      await countNeighbors();
      logMessage(`Version ${VERSION}: Count Neighbors Kernel executed without conditions.`);
  
      // Proceed to the next version
      logMessage(`Version ${VERSION}: Completed successfully. Proceed to Version 1.4.`);
    } catch (error) {
      logMessage(`Version ${VERSION} - Main Error: ${error.message}`);
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
    logMessage("Version 1.3: Failed to load Taichi.js script.");
    console.error("Failed to load Taichi.js script.");
  };
  // Append to the `head` element
  document.head.appendChild(script);
  