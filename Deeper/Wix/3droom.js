class GalleryElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }); // Use Shadow DOM
    }
  
    connectedCallback() {
      this.initGallery(); // Initialize the gallery when the element is added to the DOM
    }
  
    async initGallery() {
      await this.loadThreeJs(); // Load three.js if not already loaded
  
      const width = this.clientWidth;
      const height = this.clientHeight;
  
      // Set up Scene, Camera, and Renderer
      const scene = new THREE.Scene();
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
      camera.position.set(0, 1.6, 3);
  
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      this.shadowRoot.appendChild(renderer.domElement);
  
      // Add Lighting
      this.addLighting(scene);
  
      // Add Floor
      this.createCheckerboardFloor(scene);
  
      // Add Art Piece
      this.loadArtPiece(scene);
  
      // Handle Window Resize
      window.addEventListener('resize', () => this.onWindowResize(camera, renderer));
  
      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
    }
  
    async loadThreeJs() {
      if (!window.THREE) {
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
  
    addLighting(scene) {
      const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 1);
      scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);
    }
  
    createCheckerboardFloor(scene) {
      const tileSize = 1;
      const tilesPerSide = 10;
      const group = new THREE.Group();
  
      for (let x = 0; x < tilesPerSide; x++) {
        for (let z = 0; z < tilesPerSide; z++) {
          const geometry = new THREE.PlaneGeometry(tileSize, tileSize);
          const material = new THREE.MeshStandardMaterial({
            color: (x + z) % 2 === 0 ? 0x000000 : 0xffffff,
            side: THREE.DoubleSide,
          });
          const tile = new THREE.Mesh(geometry, material);
          tile.position.set((x - tilesPerSide / 2) * tileSize, 0, (z - tilesPerSide / 2) * tileSize);
          tile.rotation.x = -Math.PI / 2;
          group.add(tile);
        }
      }
      scene.add(group);
    }
  
    loadArtPiece(scene) {
      const textureLoader = new THREE.TextureLoader();
      const geometry = new THREE.PlaneGeometry(2, 2);
      const imageUrl = 'https://upload.wikimedia.org/wikipedia/commons/0/0a/The_Great_Wave_off_Kanagawa.jpg';
  
      textureLoader.load(imageUrl, (texture) => {
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const art = new THREE.Mesh(geometry, material);
        art.position.set(0, 2, -4); // Adjust position as needed
        scene.add(art);
      });
    }
  
    onWindowResize(camera, renderer) {
      camera.aspect = this.clientWidth / this.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(this.clientWidth, this.clientHeight);
    }
  }
  
  // Define the custom element with the tag name
  customElements.define('gallery-element', GalleryElement);
  