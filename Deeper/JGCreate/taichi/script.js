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
  
      // Define a simple field
      const simpleField = ti.field(ti.i32, [16]);
  
      // Add field to kernel scope
      ti.addToKernelScope({ simpleField });
  
      // Define a simple kernel that assigns each element to its index
      const simpleKernel = ti.kernel(() => {
        for (let i of ti.range(16)) { // Fixed loop range: 16
          simpleField[i] = i;
        }
      });
  
      // Execute the kernel
      await simpleKernel();
      logMessage("Simple kernel executed.");
  
      // Retrieve and log the field values
      const simpleFieldArray = await simpleField.toArray();
      logMessage(`simpleField: [${simpleFieldArray.join(', ')}]`);
  
      // Indicate success
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
  