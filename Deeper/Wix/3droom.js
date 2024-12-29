class GalleryElement extends HTMLElement {
    constructor() {
      super();
      this.attachShadow({ mode: 'open' }); // Use Shadow DOM
    }
  
    connectedCallback() {
      this.loadThreeJs().then(() => this.initGallery());
    }
  
    async loadThreeJs() {
      if (!window.THREE) {
        // Load three.js
        await new Promise((resolve, reject) => {
          const script = document.createElement('script');
          script.src = 'https://cdnjs.cloudflare.com/ajax/libs/three.js/r128/three.min.js';
          script.onload = resolve;
          script.onerror = reject;
          document.head.appendChild(script);
        });
      }
    }
  
    initGallery() {
      const width = this.clientWidth;
      const height = this.clientHeight;
  
      // Set up Scene
      const scene = new THREE.Scene();
  
      // Set up Camera
      const camera = new THREE.PerspectiveCamera(75, width / height, 0.1, 50);
      camera.position.set(0, 1.6, 3);
  
      // Set up Renderer
      const renderer = new THREE.WebGLRenderer({ antialias: true });
      renderer.setSize(width, height);
      this.shadowRoot.appendChild(renderer.domElement);
  
      // Lighting
      const ambientLight = new THREE.HemisphereLight(0xddeeff, 0x202020, 1);
      scene.add(ambientLight);
  
      const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
      directionalLight.position.set(5, 10, 7.5);
      scene.add(directionalLight);
  
      // Floor
      this.createCheckerboardFloor(scene);
  
      // Art Piece
      this.loadArtPieces(scene);
  
      // Resize Handling
      window.addEventListener('resize', () => this.onWindowResize(camera, renderer), false);
  
      // Animation Loop
      const animate = () => {
        requestAnimationFrame(animate);
        renderer.render(scene, camera);
      };
      animate();
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
          tile.position.x = (x - tilesPerSide / 2) * tileSize;
          tile.position.z = (z - tilesPerSide / 2) * tileSize;
          tile.rotation.x = -Math.PI / 2;
          group.add(tile);
        }
      }
      scene.add(group);
    }
  
    loadArtPieces(scene) {
      const textureLoader = new THREE.TextureLoader();
      const geometry = new THREE.PlaneGeometry(2, 2);
      textureLoader.load('https://example.com/art-piece.png', (texture) => {
        const material = new THREE.MeshStandardMaterial({ map: texture });
        const art = new THREE.Mesh(geometry, material);
        art.position.set(0, 2, -4);
        scene.add(art);
      });
    }
  
    onWindowResize(camera, renderer) {
      camera.aspect = this.clientWidth / this.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(this.clientWidth, this.clientHeight);
    }
  }
  
  customElements.define('gallery-element', GalleryElement);
  