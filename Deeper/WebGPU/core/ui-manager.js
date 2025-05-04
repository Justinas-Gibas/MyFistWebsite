/**
 * UI Manager Module
 * 
 * This module handles user interface interactions, tab management,
 * and control binding for the WebGPU Explorer.
 */

export class UIManager {
    /**
     * @param {Object} app - The main WebGPU Explorer application instance
     */
    constructor(app) {
        this.app = app;
        this.activeTab = 'vertex';
        this.editorStates = {
            vertex: '',
            fragment: '',
            js: ''
        };
        this.controlValues = {};
        this.isFullscreen = false;
    }
    
    /**
     * Set up all event listeners for UI interactions
     */
    setupEventListeners() {
        // Tab buttons
        const tabButtons = document.querySelectorAll('.tab-button');
        tabButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.setActiveTab(button.dataset.tab);
            });
        });
        
        // Shader execution buttons
        const runVertexBtn = document.getElementById('run-vertex');
        if (runVertexBtn) {
            runVertexBtn.addEventListener('click', this.runVertexShader.bind(this));
        }
        
        const runFragmentBtn = document.getElementById('run-fragment');
        if (runFragmentBtn) {
            runFragmentBtn.addEventListener('click', this.runFragmentShader.bind(this));
        }
        
        // JavaScript execution button
        const runJsBtn = document.getElementById('run-js');
        if (runJsBtn) {
            runJsBtn.addEventListener('click', this.runJavaScript.bind(this));
        }
        
        // Lecture navigation
        const prevLectureBtn = document.getElementById('prev-lecture');
        if (prevLectureBtn) {
            prevLectureBtn.addEventListener('click', () => {
                this.app.lectureManager.loadPreviousLecture();
            });
        }
        
        const nextLectureBtn = document.getElementById('next-lecture');
        if (nextLectureBtn) {
            nextLectureBtn.addEventListener('click', () => {
                this.app.lectureManager.loadNextLecture();
            });
        }
        
        // Add event listener for the new fix-syntax button
        const fixSyntaxBtn = document.getElementById('fix-syntax');
        if (fixSyntaxBtn) {
            fixSyntaxBtn.addEventListener('click', () => {
                this.fixCommonShaderErrors();
            });
        }
        
        // Hint button
        const hintBtn = document.getElementById('hint-btn');
        if (hintBtn) {
            hintBtn.addEventListener('click', this.toggleHint.bind(this));
        }
        
        // Fullscreen button
        const fullscreenBtn = document.getElementById('full-screen');
        if (fullscreenBtn) {
            fullscreenBtn.addEventListener('click', this.toggleFullscreen.bind(this));
        }
        
        // Keyboard shortcuts
        window.addEventListener('keydown', this.handleKeyboardShortcuts.bind(this));
    }
    
    /**
     * Set the active tab
     * @param {string} tabId - The ID of the tab to activate
     */
    setActiveTab(tabId) {
        // Update active tab state
        this.activeTab = tabId;
        
        // Update tab buttons
        document.querySelectorAll('.tab-button').forEach(button => {
            if (button.dataset.tab === tabId) {
                button.classList.add('active');
            } else {
                button.classList.remove('active');
            }
        });
        
        // Update tab panes
        document.querySelectorAll('.tab-pane').forEach(pane => {
            if (pane.id === `${tabId}-tab`) {
                pane.classList.add('active');
            } else {
                pane.classList.remove('active');
            }
        });
    }
    
    /**
     * Run the current vertex shader code
     */
    async runVertexShader() {
        const editor = document.getElementById('vertex-editor');
        if (!editor) return;
        
        const vertexCode = editor.value;
        if (!vertexCode || vertexCode.trim() === '') {
            this.showNotification('Vertex shader code is empty', 'error');
            return;
        }

        // Basic validation - check if the shader contains @vertex and main function
        if (!vertexCode.includes('@vertex') || !vertexCode.includes('fn main(')) {
            this.showNotification('Shader must contain an @vertex fn main() entry point', 'error', 10000);
            return;
        }
        
        this.editorStates.vertex = vertexCode;
        
        // Get the current fragment code/module
        const currentShaders = this.app.shaderManager.getCurrentShaders();
        const fragmentCode = this.editorStates.fragment || currentShaders.fragmentCode || this.app.shaderManager.defaultFragmentShader;
        const fragmentModule = currentShaders.fragmentShaderModule; // Use existing module if possible

        try {
            console.log("Compiling vertex shader:", vertexCode.substring(0, 100) + "...");
            
            // 1. Compile the new vertex shader
            const compileResult = await this.app.shaderManager.compileShaders(
                vertexCode,
                fragmentCode, // Pass current fragment code for potential recompile if needed
                `UI_VertexUpdate`
            );

            if (compileResult.success && compileResult.vertexShaderModule) {
                // 2. Update the pipeline with the new vertex module and existing fragment module
                const pipelineUpdated = await this.app.webgpuManager.updatePipeline(
                    compileResult.vertexShaderModule,
                    compileResult.fragmentShaderModule, // Use the newly compiled fragment module
                    `UI_VertexUpdate`
                );

                if (pipelineUpdated) {
                    this.showNotification('Vertex shader updated successfully!', 'success');
                    // Check for achievements if implemented
                    if (this.app.achievementSystem?.checkShaderAchievements) {
                        this.app.achievementSystem.checkShaderAchievements(vertexCode, 'vertex');
                    }
                } else {
                    this.showNotification('Error updating pipeline with new vertex shader.', 'error');
                }
            } else {
                this.showNotification(`Vertex Shader Error: ${compileResult.error}`, 'error', 10000);
            }
        } catch (error) {
            console.error("Error in runVertexShader:", error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }
    
    /**
     * Run the current fragment shader code
     */
    async runFragmentShader() {
        const editor = document.getElementById('fragment-editor');
        if (!editor) return;
        
        const fragmentCode = editor.value;
        if (!fragmentCode || fragmentCode.trim() === '') {
            this.showNotification('Fragment shader code is empty', 'error');
            return;
        }

        // Basic validation - check if the shader contains @fragment and main function
        if (!fragmentCode.includes('@fragment') || !fragmentCode.includes('fn main(')) {
            this.showNotification('Shader must contain an @fragment fn main() entry point', 'error', 10000);
            return;
        }
        
        this.editorStates.fragment = fragmentCode;

        // Get the current vertex code/module
        const currentShaders = this.app.shaderManager.getCurrentShaders();
        const vertexCode = this.editorStates.vertex || currentShaders.vertexCode || this.app.shaderManager.defaultVertexShader;
        const vertexModule = currentShaders.vertexShaderModule; // Use existing module if possible

        try {
            console.log("Compiling fragment shader:", fragmentCode.substring(0, 100) + "...");
            
            // 1. Compile the new fragment shader with the current vertex shader
            const compileResult = await this.app.shaderManager.compileShaders(
                vertexCode, // Pass current vertex code
                fragmentCode,
                `UI_FragmentUpdate`
            );

            if (compileResult.success && compileResult.fragmentShaderModule) {
                // 2. Update the pipeline with the vertexModule from compile result and new fragmentModule
                const pipelineUpdated = await this.app.webgpuManager.updatePipeline(
                    compileResult.vertexShaderModule, // Use the newly compiled vertex module
                    compileResult.fragmentShaderModule,
                    `UI_FragmentUpdate`
                );

                if (pipelineUpdated) {
                    this.showNotification('Fragment shader updated successfully!', 'success');
                    // Check for achievements if implemented
                    if (this.app.achievementSystem?.checkShaderAchievements) {
                        this.app.achievementSystem.checkShaderAchievements(fragmentCode, 'fragment');
                    }
                } else {
                    this.showNotification('Error updating pipeline with new fragment shader.', 'error');
                }
            } else {
                this.showNotification(`Fragment Shader Error: ${compileResult.error}`, 'error', 10000);
            }
        } catch (error) {
            console.error("Error in runFragmentShader:", error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }
    
    /**
     * Run the current JavaScript code
     */
    runJavaScript() {
        const editor = document.getElementById('js-editor');
        if (!editor) return;
        
        const jsCode = editor.value;
        this.editorStates.js = jsCode;
        
        try {
            // Create a function with access to the app
            const executeCode = new Function('app', jsCode);
            executeCode(this.app);
            
            this.showNotification('JavaScript executed successfully!', 'success');
        } catch (error) {
            console.error('Error executing JavaScript:', error);
            this.showNotification(`Error: ${error.message}`, 'error');
        }
    }
    
    /**
     * Toggle hint visibility
     */
    toggleHint() {
        const hintContent = document.getElementById('hint-content');
        if (hintContent) {
            if (hintContent.style.display === 'none') {
                hintContent.style.display = 'block';
            } else {
                hintContent.style.display = 'none';
            }
        }
    }
    
    /**
     * Toggle fullscreen mode
     */
    toggleFullscreen() {
        const container = document.querySelector('.app-container');
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.mozRequestFullScreen) { // Firefox
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) { // Chrome, Safari & Opera
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) { // IE/Edge
                container.msRequestFullscreen();
            }
            this.isFullscreen = true;
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            this.isFullscreen = false;
        }
    }
    
    /**
     * Handle keyboard shortcuts
     * @param {KeyboardEvent} event - The keyboard event
     */
    handleKeyboardShortcuts(event) {
        // Ctrl+Enter - Run code in current tab
        if (event.ctrlKey && event.key === 'Enter') {
            event.preventDefault();
            
            switch (this.activeTab) {
                case 'vertex':
                    this.runVertexShader();
                    break;
                case 'fragment':
                    this.runFragmentShader();
                    break;
                case 'js':
                    this.runJavaScript();
                    break;
            }
        }
        
        // Alt+Left/Right - Previous/Next lecture
        if (event.altKey) {
            if (event.key === 'ArrowLeft') {
                event.preventDefault();
                this.app.lectureManager.loadPreviousLecture();
            } else if (event.key === 'ArrowRight') {
                event.preventDefault();
                this.app.lectureManager.loadNextLecture();
            }
        }
        
        // F - Toggle fullscreen
        if (event.key === 'f' && !event.ctrlKey && !event.altKey && !event.shiftKey) {
            event.preventDefault();
            this.toggleFullscreen();
        }
    }
    
    /**
     * Show a temporary notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type ('success', 'error', 'info')
     */
    showNotification(message, type = 'info') {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
            
            // Style the notification
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '20px';
            notification.style.padding = '10px 15px';
            notification.style.borderRadius = '4px';
            notification.style.fontSize = '14px';
            notification.style.transition = 'opacity 0.3s ease';
            notification.style.zIndex = '1000';
        }
        
        // Set notification style based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#42d392';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#ff6347';
                notification.style.color = 'white';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#4a6bdf';
                notification.style.color = 'white';
                break;
        }
        
        // Set message and show notification
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Hide after 3 seconds
        setTimeout(() => {
            notification.style.opacity = '0';
        }, 3000);
    }
    
    /**
     * Fixes common shader syntax errors in the currently active editor
     */
    fixCommonShaderErrors() {
        // Determine which editor to fix based on active tab
        let editor;
        let shaderType;
        
        switch (this.activeTab) {
            case 'vertex':
                editor = document.getElementById('vertex-editor');
                shaderType = 'vertex';
                break;
            case 'fragment':
                editor = document.getElementById('fragment-editor');
                shaderType = 'fragment';
                break;
            default:
                this.showNotification('Please select a shader tab (Vertex or Fragment) first', 'info');
                return;
        }
        
        if (!editor) return;
        
        let code = editor.value;
        if (!code || code.trim() === '') {
            this.showNotification('No code to fix', 'info');
            return;
        }
        
        // Store original code for comparison
        const originalCode = code;
        
        // Fix 1: Add missing decimal points to numbers to ensure f32 type
        code = code.replace(/\b(\d+)(?![\.|\w])/g, '$1.0');
        
        // Fix 2: Add parentheses around combined logical operators (&&, ||)
        code = code.replace(/([^\(])(.*?)&&(.*?)(\|\|)(.*?)([^\)])/g, '$1(($2&&$3)$4($5))$6');
        
        // Fix 3: Fix hex color values (#RRGGBB) 
        code = code.replace(/(vec4<f32>)\s*\(\s*#([0-9A-Fa-f]{6})\s*,/g, (match, vecType, hexColor) => {
            // Convert hex color to RGB values
            const r = parseInt(hexColor.substring(0, 2), 16) / 255;
            const g = parseInt(hexColor.substring(2, 4), 16) / 255;
            const b = parseInt(hexColor.substring(4, 6), 16) / 255;
            return `${vecType}(${r}, ${g}, ${b},`;
        });
        
        // Fix 4: Fix missing var initializers by converting let to var where needed
        code = code.replace(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, 'var $1 =');
        
        // Fix 5: Add type annotations for common numeric variables
        code = code.replace(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+\.\d+|\d+)/g, 'let $1: f32 = $2');
        
        // Fix 6: Fix vector construction without explicit types
        code = code.replace(/vec(\d)\s*\(/g, 'vec$1<f32>(');
        
        // Fix 7: Fix matrix construction without explicit types
        code = code.replace(/mat(\d)x(\d)\s*\(/g, 'mat$1x$2<f32>(');
        
        // Update the editor value if changes were made
        if (code !== originalCode) {
            editor.value = code;
            this.editorStates[shaderType] = code;
            this.showNotification('Common syntax issues fixed', 'success');
        } else {
            this.showNotification('No syntax issues found', 'info');
        }
    }
    
    /**
     * Set up controls for the lecture
     * @param {Array} controls - Array of control definitions
     */
    setupControls(controls) {
        const controlsContainer = document.getElementById('controls-grid');
        
        if (!controlsContainer) {
            console.error("Controls container element not found with ID 'controls-grid'");
            return;
        }
        
        // Clear existing controls
        controlsContainer.innerHTML = '';
        
        // Create a group for generic controls
        const genericControlsGroup = document.createElement('div');
        genericControlsGroup.className = 'generic-controls';
        
        // Add title for generic controls
        const genericTitle = document.createElement('h3');
        genericTitle.className = 'control-group-title';
        genericTitle.textContent = 'Generic Controls';
        genericControlsGroup.appendChild(genericTitle);
        
        // Create generic controls
        
        // Slider A
        this.createSliderControl({
            id: 'sliderA',
            label: 'Slider A',
            min: 0, 
            max: 1,
            step: 0.01,
            value: 0.5,
            description: 'Generic reusable control slider'
        }, genericControlsGroup);
        
        // Slider B
        this.createSliderControl({
            id: 'sliderB',
            label: 'Slider B',
            min: 0, 
            max: 1,
            step: 0.01,
            value: 0.5,
            description: 'Generic reusable control slider'
        }, genericControlsGroup);
        
        // Slider C
        this.createSliderControl({
            id: 'sliderC',
            label: 'Slider C',
            min: -1, 
            max: 1,
            step: 0.01,
            value: 0,
            description: 'Generic reusable control slider (negative to positive values)'
        }, genericControlsGroup);
        
        // Toggle A
        this.createCheckboxControl({
            id: 'toggleA',
            label: 'Toggle A',
            value: false,
            description: 'Generic reusable boolean toggle'
        }, genericControlsGroup);
        
        // Toggle B
        this.createCheckboxControl({
            id: 'toggleB',
            label: 'Toggle B',
            value: false,
            description: 'Generic reusable boolean toggle'
        }, genericControlsGroup);
        
        // Add the generic controls to the container
        controlsContainer.appendChild(genericControlsGroup);
        
        // Create a group for specific lecture controls if any
        if (controls && controls.length > 0) {
            const lectureControlsGroup = document.createElement('div');
            lectureControlsGroup.className = 'control-group';
            
            // Add title for lecture-specific controls
            const lectureTitle = document.createElement('h3');
            lectureTitle.className = 'control-group-title';
            lectureTitle.textContent = 'Lecture-specific Controls';
            lectureControlsGroup.appendChild(lectureTitle);
            
            // Loop through each control and create UI elements
            controls.forEach(control => {
                switch (control.type) {
                    case 'range':
                        this.createSliderControl(control, lectureControlsGroup);
                        break;
                    case 'checkbox':
                        this.createCheckboxControl(control, lectureControlsGroup);
                        break;
                    case 'color':
                        this.createColorControl(control, lectureControlsGroup);
                        break;
                    case 'select':
                        this.createSelectControl(control, lectureControlsGroup);
                        break;
                    // Add more control types as needed
                    default:
                        console.warn(`Unsupported control type: ${control.type}`);
                }
            });
            
            // Add the lecture controls to the container
            controlsContainer.appendChild(lectureControlsGroup);
        }
        
        // Set up real-time updates for shader rendering
        this.setupRealTimeControlUpdates();
    }
    
    /**
     * Create a slider control
     * @param {Object} control - Control configuration object
     * @param {HTMLElement} container - Container element to append the control to
     */
    createSliderControl(control, container) {
        const controlItem = document.createElement('div');
        controlItem.className = 'control-item';
        
        // Create label with value display
        const labelContainer = document.createElement('div');
        labelContainer.className = 'control-label';
        
        const label = document.createElement('label');
        label.textContent = control.label || control.id;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'control-value';
        valueDisplay.textContent = control.value.toFixed(2);
        
        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);
        
        // Add description if available
        if (control.description) {
            const descriptionElem = document.createElement('div');
            descriptionElem.className = 'control-description';
            descriptionElem.textContent = control.description;
            controlItem.appendChild(descriptionElem);
        }
        
        // Create slider input
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.min = control.min !== undefined ? control.min : 0;
        slider.max = control.max !== undefined ? control.max : 1;
        slider.step = control.step !== undefined ? control.step : 0.01;
        slider.value = control.value !== undefined ? control.value : 0.5;
        
        // Store initial control value
        this.controlValues[control.id] = parseFloat(slider.value);
        
        // Set up event listener
        slider.addEventListener('input', (e) => {
            const value = parseFloat(e.target.value);
            valueDisplay.textContent = value.toFixed(2);
            this.controlValues[control.id] = value;
            
            // Call the control's onChange function if provided
            if (control.onChange) {
                try {
                    if (typeof control.onChange === 'function') {
                        control.onChange(value, this.app);
                    } else if (typeof control.onChange === 'string') {
                        const fn = new Function('value', 'app', control.onChange);
                        fn(value, this.app);
                    }
                } catch (error) {
                    console.error(`Error in slider onChange for ${control.id}:`, error);
                }
            }
        });
        
        // Append elements to control item
        controlItem.appendChild(labelContainer);
        controlItem.appendChild(slider);
        
        // Append control item to container
        container.appendChild(controlItem);
        
        return controlItem;
    }
    
    /**
     * Create a checkbox control
     * @param {Object} control - Control configuration object
     * @param {HTMLElement} container - Container element to append the control to
     */
    createCheckboxControl(control, container) {
        const controlItem = document.createElement('div');
        controlItem.className = 'control-item';
        
        // Create label with value display
        const labelContainer = document.createElement('div');
        labelContainer.className = 'control-label';
        
        const label = document.createElement('label');
        label.textContent = control.label || control.id;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'control-value';
        valueDisplay.textContent = control.value ? 'On' : 'Off';
        
        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);
        
        // Add description if available
        if (control.description) {
            const descriptionElem = document.createElement('div');
            descriptionElem.className = 'control-description';
            descriptionElem.textContent = control.description;
            controlItem.appendChild(descriptionElem);
        }
        
        // Create checkbox input
        const checkbox = document.createElement('input');
        checkbox.type = 'checkbox';
        checkbox.checked = Boolean(control.value);
        
        // Store initial control value (as number for shader compatibility)
        this.controlValues[control.id] = checkbox.checked ? 1.0 : 0.0;
        
        // Set up event listener
        checkbox.addEventListener('change', (e) => {
            const isChecked = e.target.checked;
            valueDisplay.textContent = isChecked ? 'On' : 'Off';
            this.controlValues[control.id] = isChecked ? 1.0 : 0.0;
            
            // Call the control's onChange function if provided
            if (control.onChange) {
                try {
                    if (typeof control.onChange === 'function') {
                        control.onChange(isChecked ? 1.0 : 0.0, this.app);
                    } else if (typeof control.onChange === 'string') {
                        const fn = new Function('value', 'app', control.onChange);
                        fn(isChecked ? 1.0 : 0.0, this.app);
                    }
                } catch (error) {
                    console.error(`Error in checkbox onChange for ${control.id}:`, error);
                }
            }
        });
        
        // Append elements to control item
        controlItem.appendChild(labelContainer);
        controlItem.appendChild(checkbox);
        
        // Append control item to container
        container.appendChild(controlItem);
        
        return controlItem;
    }
    
    /**
     * Create a color picker control
     * @param {Object} control - Control configuration object
     * @param {HTMLElement} container - Container element to append the control to
     */
    createColorControl(control, container) {
        const controlItem = document.createElement('div');
        controlItem.className = 'control-item';
        
        // Create label 
        const labelContainer = document.createElement('div');
        labelContainer.className = 'control-label';
        
        const label = document.createElement('label');
        label.textContent = control.label || control.id;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'control-value';
        valueDisplay.textContent = control.value || '#FFFFFF';
        
        labelContainer.appendChild(label);
        labelContainer.appendChild(valueDisplay);
        
        // Add description if available
        if (control.description) {
            const descriptionElem = document.createElement('div');
            descriptionElem.className = 'control-description';
            descriptionElem.textContent = control.description;
            controlItem.appendChild(descriptionElem);
        }
        
        // Create color input
        const colorPicker = document.createElement('input');
        colorPicker.type = 'color';
        colorPicker.value = control.value || '#FFFFFF';
        
        // Store initial control value
        this.controlValues[control.id] = colorPicker.value;
        
        // Also store RGB components for shader use (0.0-1.0)
        const hex = colorPicker.value.replace('#', '');
        const r = parseInt(hex.substring(0, 2), 16) / 255;
        const g = parseInt(hex.substring(2, 4), 16) / 255;
        const b = parseInt(hex.substring(4, 6), 16) / 255;
        
        this.controlValues[`${control.id}R`] = r;
        this.controlValues[`${control.id}G`] = g;
        this.controlValues[`${control.id}B`] = b;
        
        // Set up event listener
        colorPicker.addEventListener('input', (e) => {
            const hexColor = e.target.value;
            valueDisplay.textContent = hexColor;
            this.controlValues[control.id] = hexColor;
            
            // Update RGB components for shader use
            const hex = hexColor.replace('#', '');
            const r = parseInt(hex.substring(0, 2), 16) / 255;
            const g = parseInt(hex.substring(2, 4), 16) / 255;
            const b = parseInt(hex.substring(4, 6), 16) / 255;
            
            this.controlValues[`${control.id}R`] = r;
            this.controlValues[`${control.id}G`] = g;
            this.controlValues[`${control.id}B`] = b;
            
            // Call the control's onChange function if provided
            if (control.onChange) {
                try {
                    if (typeof control.onChange === 'function') {
                        control.onChange(hexColor, this.app);
                    } else if (typeof control.onChange === 'string') {
                        const fn = new Function('value', 'app', control.onChange);
                        fn(hexColor, this.app);
                    }
                } catch (error) {
                    console.error(`Error in color onChange for ${control.id}:`, error);
                }
            }
        });
        
        // Append elements to control item
        controlItem.appendChild(labelContainer);
        controlItem.appendChild(colorPicker);
        
        // Append control item to container
        container.appendChild(controlItem);
        
        return controlItem;
    }
    
    /**
     * Create a select dropdown control
     * @param {Object} control - Control configuration object
     * @param {HTMLElement} container - Container element to append the control to
     */
    createSelectControl(control, container) {
        const controlItem = document.createElement('div');
        controlItem.className = 'control-item';
        
        // Create label
        const labelContainer = document.createElement('div');
        labelContainer.className = 'control-label';
        
        const label = document.createElement('label');
        label.textContent = control.label || control.id;
        
        labelContainer.appendChild(label);
        
        // Add description if available
        if (control.description) {
            const descriptionElem = document.createElement('div');
            descriptionElem.className = 'control-description';
            descriptionElem.textContent = control.description;
            controlItem.appendChild(descriptionElem);
        }
        
        // Create select input
        const select = document.createElement('select');
        
        // Add options
        if (control.options && Array.isArray(control.options)) {
            control.options.forEach(option => {
                const optionElem = document.createElement('option');
                optionElem.value = option.value !== undefined ? option.value : option;
                optionElem.textContent = option.label || option.value || option;
                
                if ((control.value !== undefined && option.value === control.value) ||
                    (control.value === undefined && optionElem.value === control.options[0])) {
                    optionElem.selected = true;
                }
                
                select.appendChild(optionElem);
            });
        }
        
        // Store initial control value
        this.controlValues[control.id] = select.value;
        
        // Set up event listener
        select.addEventListener('change', (e) => {
            const value = e.target.value;
            this.controlValues[control.id] = value;
            
            // Call the control's onChange function if provided
            if (control.onChange) {
                try {
                    if (typeof control.onChange === 'function') {
                        control.onChange(value, this.app);
                    } else if (typeof control.onChange === 'string') {
                        const fn = new Function('value', 'app', control.onChange);
                        fn(value, this.app);
                    }
                } catch (error) {
                    console.error(`Error in select onChange for ${control.id}:`, error);
                }
            }
        });
        
        // Append elements to control item
        controlItem.appendChild(labelContainer);
        controlItem.appendChild(select);
        
        // Append control item to container
        container.appendChild(controlItem);
        
        return controlItem;
    }
    
    /**
     * Format a control value for display based on its type
     * @param {any} value - The control value
     * @param {string} type - The control type
     * @returns {string} Formatted value for display
     */
    formatControlValue(value, type) {
        switch (type) {
            case 'float':
            case 'number':
            case 'range':
                return parseFloat(value).toFixed(2);
            case 'int':
            case 'integer':
                return parseInt(value, 10).toString();
            case 'bool':
            case 'checkbox':
                return Boolean(value) ? 'On' : 'Off';
            default:
                return value ? value.toString() : '';
        }
    }
    
    /**
     * Apply a specific control value to shaders in real time
     * @param {string} controlId - The ID of the control
     * @param {any} value - The new control value
     */
    applyControlToShaders(controlId, value) {
        // Get current code from editors
        const vertexCode = document.getElementById('vertex-editor')?.value || '';
        const fragmentCode = document.getElementById('fragment-editor')?.value || '';
        const jsCode = document.getElementById('js-editor')?.value || '';
        
        // Create different formats of placeholder patterns
        const patterns = [
            new RegExp(`\\$\\{${controlId}\\}`, 'g'),       // ${controlId}
            new RegExp(`\\%\\%${controlId}\\%\\%`, 'g'),    // %%controlId%%
            new RegExp(`#define\\s+${controlId}\\s+[\\d\\.]+`, 'g')  // #define controlId 0.5
        ];
        
        // Replace in vertex shader
        let updatedVertexCode = vertexCode;
        let updatedFragmentCode = fragmentCode;
        let updatedJsCode = jsCode;
        
        patterns.forEach(pattern => {
            if (pattern.source.includes('#define')) {
                // For #define replacements, use full replacement
                updatedVertexCode = updatedVertexCode.replace(pattern, `#define ${controlId} ${value}`);
                updatedFragmentCode = updatedFragmentCode.replace(pattern, `#define ${controlId} ${value}`);
            } else {
                // For placeholder replacements
                updatedVertexCode = updatedVertexCode.replace(pattern, value);
                updatedFragmentCode = updatedFragmentCode.replace(pattern, value);
            }
            
            // For JS, always use direct replacement
            updatedJsCode = updatedJsCode.replace(pattern, value);
        });
        
        // Update editor content if changes were made
        const vertexEditor = document.getElementById('vertex-editor');
        if (vertexEditor && updatedVertexCode !== vertexCode) {
            vertexEditor.value = updatedVertexCode;
            this.editorStates.vertex = updatedVertexCode;
        }
        
        const fragmentEditor = document.getElementById('fragment-editor');
        if (fragmentEditor && updatedFragmentCode !== fragmentCode) {
            fragmentEditor.value = updatedFragmentCode;
            this.editorStates.fragment = updatedFragmentCode;
        }
        
        const jsEditor = document.getElementById('js-editor');
        if (jsEditor && updatedJsCode !== jsCode) {
            jsEditor.value = updatedJsCode;
            this.editorStates.js = updatedJsCode;
        }
    }
    
    /**
     * Clear all existing controls without switching to controls tab
     * @param {boolean} switchToTab - Whether to switch to the controls tab after setup
     */
    clearControls(switchToTab = true) {
        const controlsGrid = document.getElementById('controls-grid');
        if (!controlsGrid) return;
        
        // Clear existing controls
        controlsGrid.innerHTML = '';
        
        // Reset control values
        this.controlValues = {};
        
        // Optionally switch to the controls tab
        if (switchToTab) {
            this.setActiveTab('controls');
        }
    }
    
    /**
     * Get the current value of a control
     * @param {string} id - Control ID
     * @returns {any} The current value of the control
     */
    getControlValue(id) {
        return this.controlValues[id];
    }
    
    /**
     * Update the lecture info in UI
     * @param {Object} lecture - Lecture data object
     */
    updateLectureInfo(lecture) {
        // Update lecture number display
        const lectureNumber = document.getElementById('lecture-number');
        if (lectureNumber) {
            lectureNumber.textContent = `Lecture ${lecture.number}`;
        }
        
        // Update lecture name
        const lectureName = document.getElementById('lecture-name');
        if (lectureName) {
            lectureName.textContent = lecture.title;
        }
        
        // Update lecture title in the info tab
        const lectureTitle = document.getElementById('lecture-title');
        if (lectureTitle) {
            lectureTitle.textContent = lecture.title;
        }
        
        // Update lecture description
        const lectureDescription = document.getElementById('lecture-description');
        if (lectureDescription) {
            lectureDescription.innerHTML = lecture.description;
        }
        
        // Update progress bar
        const progressBar = document.getElementById('progress-bar');
        const progressText = document.getElementById('progress-text');
        
        if (progressBar && progressText && lecture.number && lecture.totalLectures) {
            const percentage = (lecture.number / lecture.totalLectures) * 100;
            progressBar.style.width = `${percentage}%`;
            progressText.textContent = `Lecture ${lecture.number}/${lecture.totalLectures}`;
        }
        
        // Update main lecture content
        const lectureContent = document.getElementById('lecture-content');
        if (lectureContent) {
            lectureContent.innerHTML = this.convertMarkdownToHtml(lecture.content);
        }
        
        // Update code examples section in the lecture UI
        this.updateCodeExamples(lecture);
        
        // Update editor content with examples from lecture
        this.populateEditorsFromLecture(lecture);
        
        // Set up any interactive controls from the lecture
        this.setupControlsFromLecture(lecture);
        
        // Add hint content if available
        const hintContent = document.getElementById('hint-content');
        if (hintContent) {
            hintContent.innerHTML = lecture.hint || '';
            hintContent.style.display = 'none'; // Hide initially
        }
        
        // Set up code tab event listeners
        this.setupCodeTabListeners();
    }
    
    /**
     * Populate editor tabs with code from lecture
     * @param {Object} lecture - Lecture data object
     */
    populateEditorsFromLecture(lecture) {
        // Determine which code to use:
        // 1. If lecture has examples, use the first example as default
        // 2. If lecture has direct shader properties, use those
        // 3. Otherwise, keep current editor content or use default shaders
        
        let vertexCode = '';
        let fragmentCode = '';
        let jsCode = '';
        
        // Use examples if available (prioritizing lecture examples)
        if (lecture.examples && lecture.examples.length > 0) {
            const example = lecture.examples[0];
            
            // Get code from the example
            vertexCode = example.vertexShader || '';
            fragmentCode = example.fragmentShader || '';
            jsCode = example.javascript || '';
            
            // Add comment at top showing which example is loaded
            if (vertexCode) {
                vertexCode = `// Example: ${example.title}\n${vertexCode}`;
            }
            
            if (fragmentCode) {
                fragmentCode = `// Example: ${example.title}\n${fragmentCode}`;
            }
            
            if (jsCode) {
                jsCode = `// Example: ${example.title}\n${jsCode}`;
            }
        } 
        // Fallback to direct lecture properties
        else {
            vertexCode = lecture.vertexShader || '';
            fragmentCode = lecture.fragmentShader || '';
            jsCode = lecture.javascript || '';
        }
        
        // Update vertex editor
        const vertexEditor = document.getElementById('vertex-editor');
        if (vertexEditor && vertexCode) {
            vertexEditor.value = vertexCode;
            this.editorStates.vertex = vertexCode;
        }
        
        // Update fragment editor
        const fragmentEditor = document.getElementById('fragment-editor');
        if (fragmentEditor && fragmentCode) {
            fragmentEditor.value = fragmentCode;
            this.editorStates.fragment = fragmentCode;
        }
        
        // Update JavaScript editor
        const jsEditor = document.getElementById('js-editor');
        if (jsEditor && jsCode) {
            jsEditor.value = jsCode;
            this.editorStates.js = jsCode;
        }
        
        // Log to console for debugging
        console.log("Editors populated with lecture code", {
            vertex: vertexCode ? vertexCode.substring(0, 50) + "..." : "none",
            fragment: fragmentCode ? fragmentCode.substring(0, 50) + "..." : "none",
            js: jsCode ? jsCode.substring(0, 50) + "..." : "none"
        });
    }
    
    /**
     * Set up interactive controls based on lecture data
     * @param {Object} lecture - Lecture data object 
     */
    setupControlsFromLecture(lecture) {
        // Skip if lecture has no controls defined
        if (!lecture.controls || !Array.isArray(lecture.controls) || lecture.controls.length === 0) {
            // Try to extract potential controls from examples if not directly defined
            if (lecture.examples && lecture.examples.length > 0 && lecture.examples[0].controls) {
                this.setupControls(lecture.examples[0].controls);
                return;
            }
            
            // If no controls found, clear any existing ones but don't switch to the tab
            this.clearControls(false);
            return;
        }
        
        // Setup controls with the lecture's controls array
        this.setupControls(lecture.controls);
        
        // Apply the initial control values to shader code if available
        this.applyControlsToShaders(lecture.controls);
    }
    
    /**
     * Apply control values to shader code in editors by replacing placeholders
     * @param {Array} controls - Array of control definitions 
     */
    applyControlsToShaders(controls) {
        if (!controls || !Array.isArray(controls) || controls.length === 0) return;
        
        // Get current code from editors
        const vertexCode = this.editorStates.vertex || '';
        const fragmentCode = this.editorStates.fragment || '';
        const jsCode = this.editorStates.js || '';
        
        // Try to find control references in the code and apply values
        let updatedVertexCode = vertexCode;
        let updatedFragmentCode = fragmentCode;
        let updatedJsCode = jsCode;
        
        // For each control, look for placeholders like ${controlId} or %%controlId%% and replace with value
        controls.forEach(control => {
            const id = control.id;
            const value = this.controlValues[id] || control.value;
            
            // Create different formats of placeholder patterns
            const patterns = [
                new RegExp(`\\$\\{${id}\\}`, 'g'),       // ${controlId}
                new RegExp(`\\%\\%${id}\\%\\%`, 'g'),    // %%controlId%%
                new RegExp(`#define\\s+${id}\\s+[\\d\\.]+`, 'g')  // #define controlId 0.5
            ];
            
            // Replace in vertex shader
            patterns.forEach(pattern => {
                if (pattern.source.includes('#define')) {
                    // For #define replacements, use full replacement
                    updatedVertexCode = updatedVertexCode.replace(pattern, `#define ${id} ${value}`);
                    updatedFragmentCode = updatedFragmentCode.replace(pattern, `#define ${id} ${value}`);
                } else {
                    // For placeholder replacements
                    updatedVertexCode = updatedVertexCode.replace(pattern, value);
                    updatedFragmentCode = updatedFragmentCode.replace(pattern, value);
                }
                
                // For JS, always use direct replacement
                updatedJsCode = updatedJsCode.replace(pattern, value);
            });
        });
        
        // Update editor content if changes were made
        const vertexEditor = document.getElementById('vertex-editor');
        if (vertexEditor && updatedVertexCode !== vertexCode) {
            vertexEditor.value = updatedVertexCode;
            this.editorStates.vertex = updatedVertexCode;
        }
        
        const fragmentEditor = document.getElementById('fragment-editor');
        if (fragmentEditor && updatedFragmentCode !== fragmentCode) {
            fragmentEditor.value = updatedFragmentCode;
            this.editorStates.fragment = updatedFragmentCode;
        }
        
        const jsEditor = document.getElementById('js-editor');
        if (jsEditor && updatedJsCode !== jsCode) {
            jsEditor.value = updatedJsCode;
            this.editorStates.js = updatedJsCode;
        }
    }
    
    /**
     * Update code examples in the lecture UI
     * @param {Object} lecture - Lecture data object
     */
    updateCodeExamples(lecture) {
        // Get reference to code example elements
        const vertexExample = document.getElementById('vertex-example')?.querySelector('code');
        const fragmentExample = document.getElementById('fragment-example')?.querySelector('code');
        const jsExample = document.getElementById('js-example')?.querySelector('code');
        
        // Get the code examples container
        const codeExamplesContainer = document.getElementById('code-examples');
        
        // If there are examples to show, display the container
        if (lecture.examples && lecture.examples.length > 0) {
            codeExamplesContainer.style.display = 'block';
            
            // Use the first example by default
            const example = lecture.examples[0];
            
            // Update code examples
            if (vertexExample && example.vertexShader) {
                vertexExample.textContent = example.vertexShader.trim();
            }
            
            if (fragmentExample && example.fragmentShader) {
                fragmentExample.textContent = example.fragmentShader.trim();
            }
            
            if (jsExample && example.javascript) {
                jsExample.textContent = example.javascript || '';
            }
        } else {
            // Extract code examples from the lecture's own shaders if no examples
            if (vertexExample && lecture.vertexShader) {
                vertexExample.textContent = lecture.vertexShader.trim();
            }
            
            if (fragmentExample && lecture.fragmentShader) {
                fragmentExample.textContent = lecture.fragmentShader.trim();
            }
            
            if (jsExample && lecture.javascript) {
                jsExample.textContent = lecture.javascript || '';
            }
            
            // Check if we have any code to show
            const hasAnyCode = lecture.vertexShader || lecture.fragmentShader || lecture.javascript;
            codeExamplesContainer.style.display = hasAnyCode ? 'block' : 'none';
        }
    }
    
    /**
     * Set up event listeners for code tabs
     */
    setupCodeTabListeners() {
        const codeTabs = document.querySelectorAll('.code-tab');
        codeTabs.forEach(tab => {
            tab.addEventListener('click', (e) => {
                // Remove active class from all tabs
                codeTabs.forEach(t => t.classList.remove('active'));
                
                // Add active class to clicked tab
                e.target.classList.add('active');
                
                // Get the tab ID
                const tabId = e.target.getAttribute('data-code-tab');
                
                // Hide all code examples
                document.querySelectorAll('.code-example').forEach(example => {
                    example.classList.remove('active');
                });
                
                // Show the selected code example
                const selectedExample = document.getElementById(tabId);
                if (selectedExample) {
                    selectedExample.classList.add('active');
                }
            });
        });
    }
    
    /**
     * Simple Markdown to HTML converter
     * @param {string} markdown - Markdown content
     * @returns {string} HTML content
     */
    convertMarkdownToHtml(markdown) {
        if (!markdown) return '';
        
        // This is a very basic markdown converter - for more complex conversions
        // consider using a dedicated library like marked.js or showdown.js
        
        let html = markdown;
        
        // Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Lists
        html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
        html = html.replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Code blocks
        html = html.replace(/```([^`]*?)```/gs, function(match, codeContent) {
            // Extract language if specified (e.g., ```javascript)
            const firstLine = codeContent.trim().split('\n')[0];
            let language = '';
            let code = codeContent;
            
            if (firstLine && !firstLine.includes(' ') && firstLine.length < 20) {
                language = firstLine;
                code = codeContent.substring(firstLine.length).trim();
            }
            
            return `<pre><code class="language-${language}">${code}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Line breaks (multiple empty lines -> one line break)
        html = html.replace(/\n\n+/g, '\n\n');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/^(.+)$/gm, '<p>$1</p>');
        
        // Fix nested paragraphs in lists
        html = html.replace(/<\/li><\/[ou]l><p>/g, '</li></ol>');
        html = html.replace(/<\/p><[ou]l><li>/g, '<ol><li>');
        
        // Fix nested paragraphs in other elements
        html = html.replace(/<\/h(\d)><p>/g, '</h$1>');
        html = html.replace(/<\/p><h(\d)>/g, '<h$1>');
        
        return html;
    }
    
    /**
     * Set up real-time updates for shader rendering when controls change
     * This connects control changes to immediate shader recompilation
     */
    setupRealTimeControlUpdates() {
        // Debounce function to limit how often shaders are recompiled
        const debounce = (func, delay) => {
            let timeoutId;
            return (...args) => {
                clearTimeout(timeoutId);
                timeoutId = setTimeout(() => {
                    func.apply(this, args);
                }, delay);
            };
        };
        
        // Function to update shaders with current control values
        const updateShaders = debounce(async () => {
            // Get current code from editors
            const vertexEditor = document.getElementById('vertex-editor');
            const fragmentEditor = document.getElementById('fragment-editor');
            
            if (!vertexEditor || !fragmentEditor) return;
            
            const vertexCode = vertexEditor.value;
            const fragmentCode = fragmentEditor.value;
            
            if (!vertexCode || !fragmentCode) return;
            
            try {
                // Get all control values in the correct format for templating
                const controlValues = {};
                
                // Add all UI control values
                Object.keys(this.controlValues).forEach(key => {
                    controlValues[key] = this.controlValues[key];
                });
                
                // Add additional real-time values like time
                controlValues.time = this.app.webgpuManager?.elapsedTime || 0.0;
                controlValues.deltaTime = this.app.webgpuManager?.deltaTime || 0.016;
                
                // Process shaders to replace template variables with control values
                const processedVertexCode = this.app.lectureManager
                    .preprocessShaderCode(vertexCode, Object.keys(controlValues).map(id => ({
                        id, value: controlValues[id]
                    })));
                
                const processedFragmentCode = this.app.lectureManager
                    .preprocessShaderCode(fragmentCode, Object.keys(controlValues).map(id => ({
                        id, value: controlValues[id]
                    })));
                
                // Compile updated shaders and update pipeline
                const compileResult = await this.app.shaderManager.compileShaders(
                    processedVertexCode,
                    processedFragmentCode,
                    'ControlsUpdate'
                );
                
                if (compileResult.success) {
                    await this.app.webgpuManager.updatePipeline(
                        compileResult.vertexShaderModule,
                        compileResult.fragmentShaderModule,
                        'ControlsUpdate'
                    );
                }
                
            } catch (error) {
                console.error('Error updating shaders in real-time:', error);
                // Don't show error - would be too distracting during control changes
            }
        }, 100); // 100ms debounce to avoid too frequent recompiles
        
        // Set up mutation observer to watch for control value changes
        const observer = new MutationObserver((mutations) => {
            let controlChanged = false;
            
            mutations.forEach(mutation => {
                if (mutation.type === 'attributes' || 
                    (mutation.type === 'characterData' && 
                     mutation.target.parentElement?.className === 'control-value')) {
                    controlChanged = true;
                }
            });
            
            if (controlChanged) {
                updateShaders();
            }
        });
        
        // Observe the controls container for changes
        const controlsContainer = document.getElementById('controls-grid');
        if (controlsContainer) {
            observer.observe(controlsContainer, {
                attributes: true,
                childList: true,
                subtree: true,
                characterData: true
            });
        }
        
        // Also hook into direct control change event handlers
        const controlHandlers = {
            input: (event) => {
                updateShaders();
            },
            change: (event) => {
                updateShaders();
            }
        };
        
        if (controlsContainer) {
            // Add event listeners to existing controls
            controlsContainer.querySelectorAll('input, select').forEach(element => {
                element.addEventListener('input', controlHandlers.input);
                element.addEventListener('change', controlHandlers.change);
            });
        }
    }
}