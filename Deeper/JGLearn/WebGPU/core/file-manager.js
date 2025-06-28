/**
 * File Manager
 * 
 * Handles file operations, project saving/loading, and directory structure.
 */

export class FileManager {
    /**
     * Initialize the File Manager
     * @param {Object} appContext - The application context
     */
    constructor(appContext) {
        this.app = appContext;
        this.projectsDir = 'webgpu-projects/';
        this.lecturesDir = 'lectures/';
        this.shadersDir = 'shaders/';
        this.fileSystem = null;
        
        // Default project structure
        this.defaultDirectories = [
            this.projectsDir,
            this.projectsDir + 'my-projects/',
            this.projectsDir + 'examples/',
            this.shadersDir,
            this.shadersDir + 'vertex/',
            this.shadersDir + 'fragment/'
        ];
    }
    
    /**
     * Create the application directory structure
     */
    async createAppDirectories() {
        console.log('Creating application directories...');
        
        try {
            // Use localStorage as a simple file system for now
            // In a real implementation, you might use IndexedDB or the File System Access API
            
            // Check if directory structure exists
            if (!localStorage.getItem('webgpu-explorer-initialized')) {
                // Create directories
                for (const dir of this.defaultDirectories) {
                    this.createDirectory(dir);
                }
                
                // Create some example shaders
                this.saveFile(
                    this.shadersDir + 'fragment/example.frag',
                    '// Example fragment shader\n' +
                    'void main() {\n' +
                    '    // Calculate color based on normalized coordinates\n' +
                    '    vec2 uv = gl_FragCoord.xy / vec2(800, 600);\n' +
                    '    gl_FragColor = vec4(uv.x, uv.y, 0.5, 1.0);\n' +
                    '}'
                );
                
                localStorage.setItem('webgpu-explorer-initialized', 'true');
            }
            
            console.log('Application directories created successfully');
            return true;
        } catch (error) {
            console.error('Error creating application directories:', error);
            return false;
        }
    }
    
    /**
     * Create a directory
     * @param {string} path - Directory path
     */
    createDirectory(path) {
        try {
            // In our simple storage model, we'll just keep track of directories
            const dirs = localStorage.getItem('webgpu-explorer-dirs');
            let directories = dirs ? JSON.parse(dirs) : [];
            
            if (!directories.includes(path)) {
                directories.push(path);
                localStorage.setItem('webgpu-explorer-dirs', JSON.stringify(directories));
            }
            
            return true;
        } catch (error) {
            console.error('Error creating directory:', error);
            return false;
        }
    }
    
    /**
     * List files in a directory
     * @param {string} path - Directory path
     * @returns {Array} - List of files in the directory
     */
    listFiles(path) {
        try {
            const files = [];
            
            // Get all keys in localStorage
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                
                // Check if it's a file (not a directory)
                if (key.startsWith('webgpu-explorer-file:')) {
                    const filePath = key.substring('webgpu-explorer-file:'.length);
                    
                    // Check if the file is in the requested directory
                    if (filePath.startsWith(path)) {
                        files.push(filePath);
                    }
                }
            }
            
            return files;
        } catch (error) {
            console.error('Error listing files:', error);
            return [];
        }
    }
    
    /**
     * Save a file
     * @param {string} path - File path
     * @param {string} content - File content
     * @returns {boolean} - Whether the save was successful
     */
    saveFile(path, content) {
        try {
            localStorage.setItem('webgpu-explorer-file:' + path, content);
            return true;
        } catch (error) {
            console.error('Error saving file:', error);
            return false;
        }
    }
    
    /**
     * Load a file
     * @param {string} path - File path
     * @returns {string|null} - File content or null if error
     */
    loadFile(path) {
        try {
            return localStorage.getItem('webgpu-explorer-file:' + path);
        } catch (error) {
            console.error('Error loading file:', error);
            return null;
        }
    }
    
    /**
     * Delete a file
     * @param {string} path - File path
     * @returns {boolean} - Whether the deletion was successful
     */
    deleteFile(path) {
        try {
            localStorage.removeItem('webgpu-explorer-file:' + path);
            return true;
        } catch (error) {
            console.error('Error deleting file:', error);
            return false;
        }
    }
    
    /**
     * Save a project
     * @param {string} name - Project name
     * @param {Object} projectData - Project data
     * @returns {boolean} - Whether the save was successful
     */
    saveProject(name, projectData) {
        try {
            const projectPath = this.projectsDir + 'my-projects/' + name + '.json';
            this.saveFile(projectPath, JSON.stringify(projectData));
            return true;
        } catch (error) {
            console.error('Error saving project:', error);
            return false;
        }
    }
    
    /**
     * Load a project
     * @param {string} name - Project name
     * @returns {Object|null} - Project data or null if error
     */
    loadProject(name) {
        try {
            const projectPath = this.projectsDir + 'my-projects/' + name + '.json';
            const projectData = this.loadFile(projectPath);
            return projectData ? JSON.parse(projectData) : null;
        } catch (error) {
            console.error('Error loading project:', error);
            return null;
        }
    }
    
    /**
     * Export project as a file for download
     * @param {string} name - Project name
     */
    exportProject(name) {
        try {
            const projectData = this.loadProject(name);
            if (!projectData) return false;
            
            // Create downloadable file
            const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(projectData, null, 2));
            const downloadAnchorNode = document.createElement('a');
            downloadAnchorNode.setAttribute("href", dataStr);
            downloadAnchorNode.setAttribute("download", name + ".json");
            document.body.appendChild(downloadAnchorNode);
            downloadAnchorNode.click();
            downloadAnchorNode.remove();
            
            return true;
        } catch (error) {
            console.error('Error exporting project:', error);
            return false;
        }
    }
    
    /**
     * Import a project from a file
     * @param {File} file - The file object to import
     * @returns {Promise<boolean>} - Whether the import was successful
     */
    importProject(file) {
        return new Promise((resolve, reject) => {
            try {
                const reader = new FileReader();
                
                reader.onload = (event) => {
                    try {
                        const projectData = JSON.parse(event.target.result);
                        const projectName = file.name.replace(/\.json$/, '');
                        
                        this.saveProject(projectName, projectData);
                        resolve(true);
                    } catch (error) {
                        console.error('Error parsing project file:', error);
                        resolve(false);
                    }
                };
                
                reader.onerror = () => {
                    console.error('Error reading project file');
                    resolve(false);
                };
                
                reader.readAsText(file);
            } catch (error) {
                console.error('Error importing project:', error);
                resolve(false);
            }
        });
    }
    
    /**
     * Load a lecture file
     * @param {string} id - Lecture ID
     * @returns {Promise<Object|null>} - Lecture data or null if error
     */
    async loadLectureFile(id) {
        try {
            // For lectures, we'll load them from the server
            const response = await fetch(`./lectures/${id}.json`);
            
            if (!response.ok) {
                throw new Error(`Failed to load lecture ${id}: ${response.statusText}`);
            }
            
            const lectureData = await response.json();
            return lectureData;
        } catch (error) {
            console.error(`Error loading lecture ${id}:`, error);
            return null;
        }
    }
}