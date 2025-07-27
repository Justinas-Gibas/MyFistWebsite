import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';

class Model3D extends HTMLElement {
    constructor() {
        super();
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loader = new GLTFLoader();
        this.isRendering = false;
    }

    connectedCallback() {
        // Get attributes (like img src attribute)
        const src = this.getAttribute('src');
        const width = this.getAttribute('width') || '100%';
        const height = this.getAttribute('height') || '400px';
        const controls = this.hasAttribute('controls');
        const autoRotate = this.hasAttribute('auto-rotate');

        if (!src) {
            console.error('model-3d: src attribute is required');
            return;
        }

        // Set up the element
        this.style.display = 'block';
        this.style.width = width;
        this.style.height = height;
        this.style.position = 'relative';
        this.style.overflow = 'hidden';
        

        this.init(src, { controls, autoRotate });
    }

    init(modelPath, options) {
        // Create scene
        this.scene = new THREE.Scene();
        
        // Create camera
        const rect = this.getBoundingClientRect();
        this.camera = new THREE.PerspectiveCamera(75, rect.width / rect.height, 0.1, 1000);
        this.camera.position.set(0, 1, 5);

        // Create renderer
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setSize(rect.width, rect.height);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.setClearColor(0x000000, 0.4); // Set clear color
        // Add canvas to this element
        this.appendChild(this.renderer.domElement);

        // Add lights
        const ambientLight = new THREE.AmbientLight(0xffffff, 0.6);
        this.scene.add(ambientLight);
        
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1);
        directionalLight.position.set(5, 5, 5);
        this.scene.add(directionalLight);

        // Add controls if requested
        if (options.controls) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.autoRotate = options.autoRotate;
        }

        // Load model
        this.loadModel(modelPath);

        // Handle resize
        this.setupResize();
    }

    loadModel(modelPath) {
        this.loader.load(
            modelPath,
            (gltf) => {
                this.scene.add(gltf.scene);
                this.startRendering();
                
                // Dispatch loaded event
                this.dispatchEvent(new CustomEvent('model-loaded', { 
                    detail: { gltf } 
                }));
            },
            (progress) => {
                const percent = (progress.loaded / progress.total) * 100;
                this.dispatchEvent(new CustomEvent('model-progress', { 
                    detail: { progress: percent } 
                }));
            },
            (error) => {
                console.error('Model loading error:', error);
                this.innerHTML = '<p style="color: red; text-align: center; padding: 20px;">Failed to load 3D model</p>';
            }
        );
    }

    startRendering() {
        if (this.isRendering) return;
        this.isRendering = true;

        const animate = () => {
            if (!this.isRendering) return;
            requestAnimationFrame(animate);
            
            if (this.controls) {
                this.controls.update();
            }
            
            this.renderer.render(this.scene, this.camera);
        };
        
        animate();
    }

    setupResize() {
        const resizeObserver = new ResizeObserver(() => {
            const rect = this.getBoundingClientRect();
            this.camera.aspect = rect.width / rect.height;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(rect.width, rect.height);
        });
        resizeObserver.observe(this);
    }

    disconnectedCallback() {
        this.isRendering = false;
        if (this.renderer) {
            this.renderer.dispose();
        }
        if (this.controls) {
            this.controls.dispose();
        }
    }
}

// Register the custom element
customElements.define('model-3d', Model3D);
