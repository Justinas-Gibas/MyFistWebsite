/**
 * Lecture Manager Module
 * 
 * This module handles loading lectures, tracking progress,
 * and managing the lecture sequence.
 */

export class LectureManager {
    /**
     * @param {Object} app - The main WebGPU Explorer application instance
     */
    constructor(app) {
        this.app = app;
        this.currentLecture = null;
        this.currentLectureId = null;
        this.completedLectures = new Set();
        
        // Load completed lectures from localStorage
        this.loadCompletedLectures();
        
        // Lecture sequence - defines the order and grouping of lectures
        this.lectureSequence = [
            'aa000', // Introduction to the UI
            'aa001', // First Triangle
            'aa002', // Shader Basics
            'aa003', // Working with Colors
            'ab001', // Uniforms and Animation
            'ab002', // Vertex Attributes
            'ab003', // Transformations
            'ac001', // Textures Introduction
            'ac002', // Advanced Texture Mapping
            'ad001', // Compute Shaders
            'ad002', // Particle Systems
            'ad003', // Creative Showcase
        ];
        
        // Lecture metadata - store information about each lecture
        // soon we want load this from:
        // dynamically discover it from the lecture files
        this.lectureMetadata = {
            'aa000': {
                title: 'Welcome to WebGPU Explorer',
                category: 'introduction',
                difficulty: 'beginner'
            },
            'aa001': {
                title: 'Your First Triangle',
                category: 'basics',
                difficulty: 'beginner'
            },
            'aa002': {
                title: 'Shader Basics',
                category: 'basics',
                difficulty: 'beginner'
            },
            'aa003': {
                title: 'Working with Colors',
                category: 'basics',
                difficulty: 'beginner'
            },
            'ab001': {
                title: 'Uniforms and Animation',
                category: 'intermediate',
                difficulty: 'intermediate'
            },
            'ab002': {
                title: 'Vertex Attributes',
                category: 'intermediate',
                difficulty: 'intermediate'
            },
            'ab003': {
                title: 'Transformations',
                category: 'intermediate',
                difficulty: 'intermediate'
            },
            'ac001': {
                title: 'Textures Introduction',
                category: 'textures',
                difficulty: 'intermediate'
            },
            'ac002': {
                title: 'Advanced Texture Mapping',
                category: 'textures',
                difficulty: 'advanced'
            },
            'ad001': {
                title: 'Compute Shaders',
                category: 'compute',
                difficulty: 'advanced'
            },
            'ad002': {
                title: 'Particle Systems',
                category: 'compute',
                difficulty: 'advanced'
            },
            'ad003': {
                title: 'Creative Showcase',
                category: 'projects',
                difficulty: 'advanced'
            }
        };

        console.log('[Lecture] LectureManager initialized');
        console.log(`[Lecture] Loaded ${this.completedLectures.size} completed lectures from storage.`);
        console.log(`[Lecture] Lecture sequence loaded with ${this.lectureSequence.length} lectures.`);
    }
    
    /**
     * Load completed lectures from localStorage
     */
    loadCompletedLectures() {
        try {
            const completed = localStorage.getItem('webgpu_completed_lectures');
            if (completed) {
                const completedArray = JSON.parse(completed);
                this.completedLectures = new Set(completedArray);
            }
        } catch (error) {
            console.error('Error loading completed lectures:', error);
        }
    }
    
    /**
     * Save completed lectures to localStorage
     */
    saveCompletedLectures() {
        try {
            const completedArray = Array.from(this.completedLectures);
            localStorage.setItem('webgpu_completed_lectures', JSON.stringify(completedArray));
        } catch (error) {
            console.error('Error saving completed lectures:', error);
        }
    }
    
    /**
     * Mark the current lecture as completed
     */
    markCurrentLectureCompleted() {
        if (this.currentLectureId) {
            if (!this.completedLectures.has(this.currentLectureId)) {
                this.completedLectures.add(this.currentLectureId);
                this.saveCompletedLectures();
                console.log(`[Lecture] Marked lecture as completed: ${this.currentLectureId}`);
                
                // Check for achievements
                this.app.achievementSystem.checkLectureAchievements(
                    this.completedLectures.size,
                    this.lectureSequence.length
                );
            } else {
                console.log(`[Lecture] Lecture already completed: ${this.currentLectureId}`);
            }
        } else {
            console.warn('[Lecture] Cannot mark lecture completed: No current lecture ID.');
        }
    }
    
    /**
     * Get the number of completed lectures
     * @returns {number} The count of completed lectures
     */
    getCompletedCount() {
        return this.completedLectures.size;
    }
    
    /**
     * Check if a lecture is completed
     * @param {string} lectureId - The ID of the lecture to check
     * @returns {boolean} Whether the lecture is completed
     */
    isLectureCompleted(lectureId) {
        return this.completedLectures.has(lectureId);
    }
    
    /**
     * Get the current lecture index in the sequence
     * @returns {number} The index of the current lecture
     */
    getCurrentLectureIndex() {
        if (!this.currentLectureId) return -1;
        return this.lectureSequence.indexOf(this.currentLectureId);
    }
    
    /**
     * Get the next lecture ID in the sequence
     * @returns {string|null} The next lecture ID or null if at the end
     */
    getNextLectureId() {
        const currentIndex = this.getCurrentLectureIndex();
        if (currentIndex < 0 || currentIndex >= this.lectureSequence.length - 1) {
            return null;
        }
        return this.lectureSequence[currentIndex + 1];
    }
    
    /**
     * Get the previous lecture ID in the sequence
     * @returns {string|null} The previous lecture ID or null if at the beginning
     */
    getPreviousLectureId() {
        const currentIndex = this.getCurrentLectureIndex();
        if (currentIndex <= 0) {
            return null;
        }
        return this.lectureSequence[currentIndex - 1];
    }
    
    /**
     * Load the next lecture in the sequence
     * @returns {Promise<boolean>} Whether the operation succeeded
     */
    async loadNextLecture() {
        const nextLectureId = this.getNextLectureId();
        if (nextLectureId) {
            console.log(`[Lecture] Loading next lecture: ${nextLectureId}`);
            return this.loadLecture(nextLectureId);
        }
        console.log('[Lecture] Already at the last lecture.');
        return false;
    }
    
    /**
     * Load the previous lecture in the sequence
     * @returns {Promise<boolean>} Whether the operation succeeded
     */
    async loadPreviousLecture() {
        const prevLectureId = this.getPreviousLectureId();
        if (prevLectureId) {
            console.log(`[Lecture] Loading previous lecture: ${prevLectureId}`);
            return this.loadLecture(prevLectureId);
        }
        console.log('[Lecture] Already at the first lecture.');
        return false;
    }
    
    /**
     * Preprocess shader code to replace template variables with control values
     * should we move this to webgpu related files?
     * @param {string} shaderCode - The shader code with template variables
     * @param {Array} controls - Array of control objects
     * @returns {string} - Processed shader code
     */
    preprocessShaderCode(shaderCode, controls) {
        if (!shaderCode) return shaderCode;
        
        // Add debug logging
        console.log("preprocessShaderCode started with shader code length:", shaderCode.length);
        
        let processedCode = shaderCode;
        
        // Create a mapping of control IDs to their values
        const controlValues = {};
        
        // Add global scope for commonly used variables
        if (typeof window.globalShaderVariables === 'undefined') {
            window.globalShaderVariables = {};
        }
        
        // Add generic reusable controls with default values
        // maybe lets move them to WebGPU related files?
        // to keep concerns separated
        // These can be referenced in any lecture
        const defaultValues = {
            sliderA: 0.5,        // Generic slider A (0.0-1.0)
            sliderB: 0.5,        // Generic slider B (0.0-1.0)
            sliderC: 0.5,        // Generic slider C (0.0-1.0)
            toggleA: 0.0,        // Generic toggle/checkbox A
            toggleB: 0.0,        // Generic toggle/checkbox B
            enableAnimation: 0.0,// Disable animation by default
            animationSpeed: 1.0, // Default animation speed
            animationAmount: 0.1,// Default animation amount
            time: 0.0,           // Time starts at 0
            deltaTime: 0.016,    // ~60fps default delta time
            colorR: 1.0,         // Default color values
            colorG: 0.0,
            colorB: 0.0,
            rotationSpeed: 1.0,  // Default rotation speed
            bgColor1R: 0.1,      // Background color components
            bgColor1G: 0.1,
            bgColor1B: 0.2,
            bgColor2R: 0.0,
            bgColor2G: 0.0,
            bgColor2B: 0.1,
            borderWidth: 0.1,    // Default border width
            triangleScale: 0.8,  // Default triangle scale
            pulseSpeed: 1.0,     // Default pulse speed
            pulseAmount: 0.2,    // Default pulse amount
            rotationAngle: 0.0,  // Default rotation angle
            zoom: 1.0,           // Default zoom level
            oscillateSpeed: 1.0, // Default oscillation speed
            shapeSize: 0.5,      // Default shape size
            aspectRatio: 1.0,    // Default aspect ratio
            cornerRadius: 0.1,   // Default corner radius
            distortion: 0.0,     // Default distortion amount
            blurAmount: 0.0,     // Default blur amount
            noiseScale: 5.0,     // Default noise scale
            noiseAmount: 0.1,    // Default noise amount
            waveFrequency: 5.0,  // Default wave frequency
            waveAmplitude: 0.1,  // Default wave amplitude
            messageColor: '#FFFFFF',  // Default message color (white)
            messageColorR: 1.0,  // RGB components of message color
            messageColorG: 1.0,
            messageColorB: 1.0,
            colorIntensity: 1.0, // Default color intensity
            patternFrequency: 10.0, // Default pattern frequency
            uiScale: 1.0,        // Scale of UI elements
            uiOpacity: 0.8,      // Opacity of UI elements
            uiBorderRadius: 5.0, // Border radius of UI elements
            textSize: 16.0,      // Text size
            lineHeight: 1.4,     // Line height for text
            padding: 10.0,       // Padding for UI elements
            margin: 5.0,         // Margin for UI elements
            glowAmount: 0.2,     // Default glow amount
            glowColor: '#00FFFF',// Default glow color (cyan)
            glowColorR: 0.0,     // RGB components of glow color
            glowColorG: 1.0,
            glowColorB: 1.0,
            shadowIntensity: 0.5,// Default shadow intensity
            shadowBlur: 10.0,    // Default shadow blur
            messageWidth: 0.8,   // Default message width
            messageHeight: 0.2,  // Default message height
            messageOpacity: 0.9, // Default message opacity
            patternScale: 20.0,  // Default pattern scale
            patternOffset: 0.0,  // Default pattern offset
            patternRotation: 0.0,// Default pattern rotation
            patternIntensity: 0.7,// Default pattern intensity
        };

        // Add default vertex colors
        for (let i = 1; i <= 3; i++) {
            defaultValues[`vertex${i}R`] = 1.0;
            defaultValues[`vertex${i}G`] = 1.0;
            defaultValues[`vertex${i}B`] = 1.0;
        }

        // Create controlValues from defaultValues
        Object.assign(controlValues, defaultValues);
        
        // Make all these variables available globally
        for (const [key, value] of Object.entries(controlValues)) {
            window.globalShaderVariables[key] = value;
            window[key] = value;
        }
        
        // Process controls if available
        if (controls && Array.isArray(controls)) {
            controls.forEach(control => {
                if (!control || !control.id) {
                    console.warn("Skipping invalid control:", control);
                    return;
                }
                
                // For checkbox controls, convert boolean to numeric value (0.0 or 1.0)
                if (control.type === 'checkbox') {
                    controlValues[control.id] = control.value ? 1.0 : 0.0;
                }
                // For color controls, parse the hex value and convert to RGB components
                else if (control.type === 'color' && typeof control.value === 'string') {
                    const hex = control.value.replace('#', '');
                    const r = parseInt(hex.substring(0, 2), 16) / 255;
                    const g = parseInt(hex.substring(2, 4), 16) / 255;
                    const b = parseInt(hex.substring(4, 6), 16) / 255;
                    controlValues[control.id] = control.value; // Keep original hex string
                    controlValues[`${control.id}R`] = r;
                    controlValues[`${control.id}G`] = g;
                    controlValues[`${control.id}B`] = b;
                }
                // For all other controls, ensure numeric values
                else {
                    const numValue = typeof control.value === 'number' ? 
                                    control.value : parseFloat(control.value);
                    controlValues[control.id] = isNaN(numValue) ? control.value : numValue;
                }
                
                // Update global variables for each control
                window.globalShaderVariables[control.id] = controlValues[control.id];
                window[control.id] = controlValues[control.id];
                
                // For color controls, also update their RGB components
                if (control.type === 'color') {
                    window.globalShaderVariables[`${control.id}R`] = controlValues[`${control.id}R`];
                    window.globalShaderVariables[`${control.id}G`] = controlValues[`${control.id}G`];
                    window.globalShaderVariables[`${control.id}B`] = controlValues[`${control.id}B`];
                    
                    window[`${control.id}R`] = controlValues[`${control.id}R`];
                    window[`${control.id}G`] = controlValues[`${control.id}G`];
                    window[`${control.id}B`] = controlValues[`${control.id}B`];
                }
            });
        }
        
        // Find all template variables in the shader code
        const templateVarRegex = /\$\{([^}]+)\}/g;
        let match;
        
        // Collect all variables that need to be replaced
        const varsToReplace = new Set();
        while ((match = templateVarRegex.exec(processedCode)) !== null) {
            varsToReplace.add(match[1]);
        }
        
        // Make sure all template variables have values
        varsToReplace.forEach(varName => {
            if (controlValues[varName] === undefined) {
                console.warn(`Template variable ${varName} not found in controls, using default value 0.0`);
                controlValues[varName] = 0.0;
                window.globalShaderVariables[varName] = 0.0;
                window[varName] = 0.0;
            }
        });
        
        // Keep track of string values that shouldn't be converted to floats
        const stringValues = {};
        for (const key in controlValues) {
            if (typeof controlValues[key] === 'string') {
                // Only keep strings for known color variables
                if (key.includes('Color') || key.endsWith('Hex')) {
                    stringValues[key] = controlValues[key];
                }
            }
        }
        
        // Replace all template variables in the shader code
        for (const varName of varsToReplace) {
            const value = controlValues[varName];
            const regex = new RegExp(`\\$\\{${varName}\\}`, 'g');
            
            // Use string values for color variables, otherwise ensure it's a float
            if (stringValues[varName]) {
                processedCode = processedCode.replace(regex, stringValues[varName]);
            } else {
                // Make sure numeric values in WGSL have decimal points to be treated as f32
                const numValue = typeof value === 'number' ? value : parseFloat(value);
                const formattedValue = isNaN(numValue) ? value : 
                    // Force decimal point for integer values to make them f32
                    (Number.isInteger(numValue) ? numValue + '.0' : numValue.toString());
                processedCode = processedCode.replace(regex, formattedValue);
            }
        }
        
        // Final check for any remaining template variables
        const remainingTemplateVars = processedCode.match(templateVarRegex);
        if (remainingTemplateVars) {
            console.warn("[Lecture] Some template variables were not replaced:", remainingTemplateVars);
            // Replace any remaining template variables with 0.0
            processedCode = processedCode.replace(templateVarRegex, "0.0");
        }
        
        return processedCode;
    }
    
    /**
     * Load a lecture by ID
     * @param {string} lectureId - The ID of the lecture to load
     * @returns {Promise<boolean>} Whether the operation succeeded
     */
    async loadLecture(lectureId) {
        console.log(`[Lecture] Attempting to load lecture: ${lectureId}`);
        try {
            // Get lecture metadata
            const metadata = this.lectureMetadata[lectureId];
            if (!metadata) {
                console.error(`Lecture with ID ${lectureId} not found`);
                return false;
            }
            
            // Calculate lecture number and total number of lectures
            const lectureIndex = this.lectureSequence.indexOf(lectureId);
            const lectureNumber = lectureIndex + 1;
            const totalLectures = this.lectureSequence.length;
            
            // Load the lecture module dynamically
            console.log(`[Lecture] Importing module for ${lectureId}...`);
            const lectureModule = await import(`../lectures/${lectureId}.js`);
            
            if (!lectureModule.default && !lectureModule.lesson) { // Check for both export patterns
                console.error(`[Lecture] Lecture module ${lectureId} does not have a default or 'lesson' export`);
                this.app.uiManager.showNotification(`Failed to load lecture module: ${lectureId}`, 'error');
                return false;
            }
            
            // Store the current lecture (handle both export patterns)
            this.currentLecture = lectureModule.default || lectureModule.lesson; 
            this.currentLectureId = lectureId;
            console.log(`[Lecture] Successfully imported module for ${lectureId}`);

            // Prepare lecture data for UI
            const lectureData = {
                ...this.currentLecture,
                id: lectureId,
                number: lectureNumber,
                totalLectures: totalLectures,
                ...metadata,
                completed: this.isLectureCompleted(lectureId)
            };
            
            // Update UI
            this.app.uiManager.updateLectureInfo(lectureData);
            this.app.uiManager.populateEditorsFromLecture(lectureData); // Populate editors
            
            // Load lecture content into the dedicated element (assuming it exists)
            const lectureContentElement = document.getElementById('lecture-content-area'); // Adjust ID if needed
            if (lectureContentElement && lectureData.content) {
                 lectureContentElement.innerHTML = this.app.uiManager.convertMarkdownToHtml(lectureData.content);
                 console.log(`[Lecture] Rendered markdown content for ${lectureId}`);
            } else if (lectureContentElement) {
                 lectureContentElement.innerHTML = '<p>No content available for this lecture.</p>';
                 console.warn(`[Lecture] No content found for lecture ${lectureId}`);
            } else {
                 console.error('[Lecture] Lecture content area element not found.');
            }

            // Set up controls if specified
            if (lectureData.controls && lectureData.controls.length > 0) {
                console.log(`[Lecture] Setting up ${lectureData.controls.length} controls for ${lectureId}`);
                this.app.uiManager.setupControlsFromLecture(lectureData); // Use dedicated function
            } else {
                console.log(`[Lecture] No controls defined for ${lectureId}. Clearing controls.`);
                this.app.uiManager.clearControls(false); // Clear controls but don't switch tab
            }
            
            // Compile and set shaders if provided by the lecture
            await this.updateShadersForCurrentLecture(); // Use helper function

            // Call the lecture's init function if provided
            if (lectureData.init) {
                const initFunction = new Function('app', lectureData.init);
                initFunction(this.app);
            }
            
            console.log(`[Lecture] Successfully loaded lecture: ${lectureId}`);
            return true;
        } catch (error) {
            console.error(`[Lecture] Error loading lecture ${lectureId}:`, error);
            this.app.uiManager.showNotification(`Error loading lecture ${lectureId}: ${error.message}`, 'error');
            return false;
        }
    }

    /**
     * Helper function to compile and update shaders for the current lecture
     */
    async updateShadersForCurrentLecture() {
        if (!this.currentLecture || !this.currentLectureId) {
            console.warn('[Lecture] Cannot update shaders: No current lecture.');
            return;
        }

        const lectureData = this.currentLecture;
        const lectureId = this.currentLectureId;
        let example = null;

        if (lectureData.examples && lectureData.examples.length > 0) {
            example = lectureData.examples[0]; // Use the first example by default
        }

        const vertexShaderSource = example?.vertexShader || lectureData.vertexShader;
        const fragmentShaderSource = example?.fragmentShader || lectureData.fragmentShader;
        const controls = lectureData.controls || [];

        if (vertexShaderSource && fragmentShaderSource) {
            console.log(`[Lecture] Processing and compiling shaders for ${lectureId}...`);
            
            const processedVertexShader = this.preprocessShaderCode(vertexShaderSource, controls);
            const processedFragmentShader = this.preprocessShaderCode(fragmentShaderSource, controls);
            
            const compileResult = await this.app.shaderManager.compileShaders(
                processedVertexShader,
                processedFragmentShader,
                `Lecture_${lectureId}`
            );
            
            if (compileResult.success) {
                console.log(`[Lecture] Shaders compiled successfully for ${lectureId}. Updating pipeline...`);
                await this.app.webgpuManager.updatePipeline(compileResult.pipeline);
            } else {
                console.error(`[Lecture] Shader compilation failed for ${lectureId}:`, compileResult.error);
                this.app.uiManager.showNotification(`Shader compilation failed for ${lectureId}. Check console.`, 'error');
                // Optionally fall back to default shaders or show an error state
                // await this.app.webgpuManager.createDefaultPipeline(); 
            }
        } else {
            console.log(`[Lecture] No specific shaders provided for ${lectureId}. Ensuring default pipeline is active.`);
            await this.app.webgpuManager.createDefaultPipeline(); // Ensure default is active if no lecture shaders
        }
    }
    
    /**
     * Check if a user has completed a challenge
     * @param {Function} condition - Function that checks whether the challenge is completed
     * @param {string} achievementId - Optional achievement to unlock on completion
     * @returns {boolean} Whether the challenge was completed
     */
    checkChallenge(condition, achievementId = null) {
        console.log(`[Lecture] Checking challenge condition for lecture ${this.currentLectureId}`);
        try {
            const completed = condition(this.app);
            
            if (completed) {
                console.log(`[Lecture] Challenge completed for lecture ${this.currentLectureId}`);
                // Mark current lecture as completed if not already
                if (!this.isLectureCompleted(this.currentLectureId)) {
                    this.markCurrentLectureCompleted();
                    
                    // Show success message
                    this.app.uiManager.showNotification('Challenge completed!', 'success');
                }
                
                // Unlock achievement if specified
                if (achievementId && this.app.achievementSystem) {
                    this.app.achievementSystem.unlockAchievement(achievementId);
                }
                
                return true;
            } else {
                console.log(`[Lecture] Challenge condition not met for lecture ${this.currentLectureId}`);
            }
        } catch (error) {
            console.error('[Lecture] Error checking challenge:', error);
        }
        
        return false;
    }
}