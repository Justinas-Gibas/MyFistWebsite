// Example: myThreeTaichiElement.js
// Load this file as a "Custom Element" script in Wix Developer Tools.

// --- Utilities to load external scripts on demand ---
function loadScript(src) {
    return new Promise((resolve, reject) => {
      // If script already present, skip loading
      if (document.querySelector(`script[src="${src}"]`)) {
        resolve();
        return;
      }
      const s = document.createElement('script');
      s.src = src;
      s.onload = () => resolve();
      s.onerror = () => reject(new Error(`Failed to load script: ${src}`));
      document.head.appendChild(s);
    });
  }
  
  // --- Define a new custom element ---
  class WixThreeTaichiElement extends HTMLElement {
    constructor() {
      super();
      console.log('WixThreeTaichiElement constructor called.');
    }
  
    connectedCallback() {
      console.log('WixThreeTaichiElement added to page. Loading scripts...');
      // 1. Load Three.js, then Taichi.js
      loadScript('https://cdn.jsdelivr.net/npm/three@latest/build/three.min.js')
        .then(() => loadScript('https://cdn.jsdelivr.net/npm/taichi.js@latest/dist/taichi.js'))
        .then(() => {
          console.log('Scripts loaded. Initializing scene and Taichi...');
          this.initElement();
        })
        .catch(err => console.error(err));
    }
  
    initElement() {
      // --- Create Style ---
      const styleEl = document.createElement('style');
      styleEl.textContent = `
        wix-three-taichi-element {
          display: block;
          width: 100%;
          height: 300px; /* Adjust as needed */
          position: relative;
          overflow: hidden;
          background-color: #f0f4f7;
        }
        .wtt-canvas-container {
          width: 100%;
          height: 100%;
        }
      `;
      this.appendChild(styleEl);
  
      // --- Create Container for the Scene ---
      const container = document.createElement('div');
      container.classList.add('wtt-canvas-container');
      this.appendChild(container);
  
      // --- Initialize Taichi.js ---
      taichi.init().then(() => {
        console.log('Taichi initialized.');
  
        // Example kernel (just logs; expand for real computations)
        const kernel = taichi.kernel(() => {
          // Taichi logic here
        });
        kernel();
      });
  
      // --- Initialize Three.js ---
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(
        75,
        container.clientWidth / container.clientHeight,
        0.1, 
        1000
      );
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(container.clientWidth, container.clientHeight);
      container.appendChild(renderer.domElement);
  
      // Create a rotating cube
      const geometry = new THREE.BoxGeometry();
      const material = new THREE.MeshNormalMaterial();
      const cube = new THREE.Mesh(geometry, material);
      scene.add(cube);
  
      camera.position.z = 3;
  
      const animate = () => {
        requestAnimationFrame(animate);
        cube.rotation.x += 0.01;
        cube.rotation.y += 0.01;
        renderer.render(scene, camera);
      };
      animate();
  
      // Resize handling
      window.addEventListener('resize', () => {
        const w = container.clientWidth;
        const h = container.clientHeight;
        camera.aspect = w / h;
        camera.updateProjectionMatrix();
        renderer.setSize(w, h);
      });
    }
  }
  
  // --- Register Custom Element ---
  customElements.define('wix-three-taichi-element', WixThreeTaichiElement);
  