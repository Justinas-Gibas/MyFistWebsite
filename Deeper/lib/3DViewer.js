import * as THREE from './three.module.js';
import { OrbitControls } from './controls/OrbitControls.js';
import { GLTFLoader } from './loaders/GLTFLoader.js';
import { RGBELoader } from './loaders/RGBELoader.js';

export class ThreeDViewer {
    constructor(containerId, modelPath, options = {}) {
        this.containerId = containerId;
        this.modelPath = modelPath;
        this.options = {
            // Default options
            width: '256px',
            height: '256px',
            // Default background image, can be overridden
            background: './Deeper/lib/images/potw2046a360.hdr',
            controls: true,
            autoRotate: false,
            ambientLightColor: 0xffffff,
            pointLightColor: 0xffffff,
            cameraPosition: { x: 0, y: 1, z: 5 },
            ...options
        };
        
        this.container = null;
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.controls = null;
        this.loader = new GLTFLoader();
        this.isRendering = false;
        
        this.init();
    }
    
    init() {
        // Get container element
        this.container = document.getElementById(this.containerId);
        if (!this.container) {
            console.error(`Container with ID '${this.containerId}' not found`);
            return;
        }
        
        // Setup Three.js scene
        this.setupScene();
        this.setupCamera();
        this.setupRenderer();
        this.setupLights();
        this.setupBackground();
        this.setupControls();
        this.setupResize();
        
        // Load model
        this.loadModel();
    }
    
    setupScene() {
        this.scene = new THREE.Scene();
    }
    
    setupCamera() {
        const containerRect = this.container.getBoundingClientRect();
        const aspect = containerRect.width / containerRect.height;
        this.camera = new THREE.PerspectiveCamera(75, aspect, 0.1, 1000);
        this.camera.position.set(
            this.options.cameraPosition.x,
            this.options.cameraPosition.y,
            this.options.cameraPosition.z
        );
    }
    
    setupRenderer() {
        this.renderer = new THREE.WebGLRenderer({ antialias: true });
        this.renderer.setPixelRatio(window.devicePixelRatio);
        
        // Size based on container
        const containerRect = this.container.getBoundingClientRect();
        this.renderer.setSize(containerRect.width, containerRect.height);
        
        // Set container styles
        this.container.style.width = this.options.width;
        this.container.style.height = this.options.height;
        this.container.style.position = 'relative';
        this.container.style.overflow = 'hidden';
        
        // Append canvas to container
        this.container.appendChild(this.renderer.domElement);
    }
    
    setupLights() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(this.options.ambientLightColor, 0.6);
        this.scene.add(ambientLight);
        
        // Point light
        const pointLight = new THREE.PointLight(this.options.pointLightColor, 1, 100);
        pointLight.position.set(0, 10, 10);
        this.scene.add(pointLight);
    }
    
    setupBackground() {
        if (this.options.background) {
            const backgroundLoader = new RGBELoader();
            backgroundLoader.load(this.options.background, (texture) => {
                texture.mapping = THREE.EquirectangularReflectionMapping;
                this.scene.background = texture;
                this.scene.environment = texture;
            }, undefined, (error) => {
                console.warn('Background texture failed to load:', error);
            });
        }
    }
    
    setupControls() {
        if (this.options.controls) {
            this.controls = new OrbitControls(this.camera, this.renderer.domElement);
            this.controls.enableDamping = true;
            this.controls.dampingFactor = 0.05;
            this.controls.autoRotate = this.options.autoRotate;
        }
    }
    
    setupResize() {
        const resizeObserver = new ResizeObserver((entries) => {
            for (let entry of entries) {
                const { width, height } = entry.contentRect;
                this.camera.aspect = width / height;
                this.camera.updateProjectionMatrix();
                this.renderer.setSize(width, height);
            }
        });
        resizeObserver.observe(this.container);
    }
    
    loadModel() {
        this.loader.load(
            this.modelPath,
            (gltf) => {
                this.scene.add(gltf.scene);
                this.startRendering();
                
                // Dispatch custom event
                this.container.dispatchEvent(new CustomEvent('modelLoaded', { 
                    detail: { gltf, viewer: this } 
                }));
            },
            (progress) => {
                const percentComplete = (progress.loaded / progress.total) * 100;
                console.log(`Loading progress: ${percentComplete.toFixed(2)}%`);
                
                // Dispatch progress event
                this.container.dispatchEvent(new CustomEvent('modelProgress', { 
                    detail: { progress: percentComplete } 
                }));
            },
            (error) => {
                console.error('Model loading error:', error);
                this.container.dispatchEvent(new CustomEvent('modelError', { 
                    detail: { error } 
                }));
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
    
    stopRendering() {
        this.isRendering = false;
    }
    
    dispose() {
        this.stopRendering();
        
        if (this.renderer) {
            this.container.removeChild(this.renderer.domElement);
            this.renderer.dispose();
        }
        
        if (this.controls) {
            this.controls.dispose();
        }
    }
}

// Convenience function for quick setup
export function create3DViewer(containerId, modelPath, options = {}) {
    return new ThreeDViewer(containerId, modelPath, options);
}
