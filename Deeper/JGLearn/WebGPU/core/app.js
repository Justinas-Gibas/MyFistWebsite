/**
 * WebGPU Explorer - Main Application
 * 
 * This is the main entry point for the WebGPU Explorer application.
 * It initializes all modules and orchestrates the application flow.
 */

import { WebGPUManager } from './webgpu-manager.js';
import { ShaderManager } from './shader-manager.js';
import { UIManager } from './ui-manager.js';
import { LectureManager } from './lecture-manager.js';
import { AchievementSystem } from './achievement-system.js';
import { FileManager } from './file-manager.js';

class WebGPUExplorer {
    constructor() {
        this.canvas = document.getElementById('main-canvas');
        
        // Initialize non-WebGPU subsystems first
        this.achievementSystem = new AchievementSystem();
        this.fileManager = new FileManager(this);
        this.uiManager = new UIManager(this);
        
        // Initialize WebGPU first, then create ShaderManager after
        // This ensures ShaderManager has access to the initialized WebGPU device
        this.webgpuManager = new WebGPUManager(this, this.canvas);
        this.shaderManager = null; // Will be initialized after WebGPU
        this.lectureManager = null; // Will be initialized last

        // App state
        this.frameCount = 0;
        this.lastFrameTime = 0;
        this.fps = 0;
        this.isRunning = true;
        
        // Bind methods
        this.animate = this.animate.bind(this);
        this.handleResize = this.handleResize.bind(this);
        
        // Initialize app
        this.init();
    }
    
    /**
     * Initialize the application
     */
    async init() {
        try {
            console.log('Initializing WebGPU Explorer');
            
            // Check if WebGPU is supported
            if (!navigator.gpu) {
                this.showErrorMessage('WebGPU is not supported in your browser. Please use Chrome, Edge, or Firefox Nightly.');
                return;
            }
            
            // First initialize WebGPU
            await this.webgpuManager.initialize();
            
            if (!this.webgpuManager.isInitialized) {
                this.showErrorMessage('Failed to initialize WebGPU. Your browser might not support WebGPU or it might be disabled.');
                return;
            }
            
            // Now initialize ShaderManager with the initialized WebGPU device
            this.shaderManager = new ShaderManager(this);
            
            // Wait for default shaders to initialize, but don't try to use them yet
            await this.shaderManager.initializeDefaultShaders();
            
            // Now that ShaderManager is initialized, set up the default pipeline
            await this.webgpuManager.initializeShaders();
            
            // Create directory structure
            await this.fileManager.createAppDirectories();
            
            // Initialize lecture manager after other systems are ready
            this.lectureManager = new LectureManager(this);
            
            // Set up UI
            this.uiManager.setupEventListeners();
            
            // Unlock the first achievement
            this.achievementSystem.unlockAchievement('explorer_awakened');
            
            // Load the first lecture
            await this.lectureManager.loadLecture('aa001');
            
            // Set up resize handler
            window.addEventListener('resize', this.handleResize);
            
            // Start animation loop
            this.animate();
            
            console.log('WebGPU Explorer initialized successfully');
        } catch (error) {
            console.error('Error initializing WebGPU Explorer:', error);
            this.showErrorMessage(`Failed to initialize: ${error.message}`);
        }
    }
    
    /**
     * Animation loop
     * @param {number} timestamp - The current timestamp
     */
    animate(timestamp) {
        if (!this.isRunning) return;
        
        // Request next frame
        requestAnimationFrame(this.animate);
        
        // Calculate FPS
        if (!this.lastFrameTime) {
            this.lastFrameTime = timestamp;
        }
        
        const deltaTime = timestamp - this.lastFrameTime;
        this.frameCount++;
        
        // Update FPS counter once per second
        if (deltaTime >= 1000) {
            this.fps = Math.round((this.frameCount * 1000) / deltaTime);
            
            const fpsCounter = document.getElementById('fps-counter');
            if (fpsCounter) {
                fpsCounter.textContent = `FPS: ${this.fps}`;
            }
            
            this.frameCount = 0;
            this.lastFrameTime = timestamp;
        }
        
        // Render frames
        if (this.webgpuManager && this.webgpuManager.isInitialized) {
            this.webgpuManager.render();
        }
        
        // Also allow shader manager to render if it exists
        if (this.shaderManager && this.shaderManager.pipeline) {
            // Calculate time in seconds and deltaTime in seconds
            const timeSeconds = timestamp / 1000;
            const deltaTimeSeconds = deltaTime / 1000;
            this.shaderManager.render(deltaTimeSeconds, timeSeconds);
        }
    }
    
    /**
     * Handle window resize events
     */
    handleResize() {
        if (this.webgpuManager && this.webgpuManager.isInitialized) {
            this.webgpuManager.resize();
        }
    }
    
    /**
     * Show error message to the user
     * @param {string} message - The error message to display
     */
    showErrorMessage(message) {
        // Create error container
        const errorContainer = document.createElement('div');
        errorContainer.style.position = 'absolute';
        errorContainer.style.top = '50%';
        errorContainer.style.left = '50%';
        errorContainer.style.transform = 'translate(-50%, -50%)';
        errorContainer.style.backgroundColor = 'rgba(255, 50, 50, 0.9)';
        errorContainer.style.color = 'white';
        errorContainer.style.padding = '20px';
        errorContainer.style.borderRadius = '8px';
        errorContainer.style.maxWidth = '80%';
        errorContainer.style.textAlign = 'center';
        errorContainer.style.zIndex = '1000';
        errorContainer.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.5)';
        
        // Error heading
        const heading = document.createElement('h3');
        heading.textContent = 'WebGPU Error';
        heading.style.marginBottom = '10px';
        
        // Error message
        const messageElement = document.createElement('p');
        messageElement.textContent = message;
        
        // Add elements to container
        errorContainer.appendChild(heading);
        errorContainer.appendChild(messageElement);
        
        // Add container to canvas container
        const canvasContainer = document.querySelector('.canvas-container');
        if (canvasContainer) {
            canvasContainer.appendChild(errorContainer);
        } else {
            document.body.appendChild(errorContainer);
        }
    }
    
    /**
     * Stop the animation loop
     */
    stop() {
        this.isRunning = false;
    }
    
    /**
     * Resume the animation loop
     */
    resume() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastFrameTime = 0;
            this.animate();
        }
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.webgpuExplorer = new WebGPUExplorer();
});