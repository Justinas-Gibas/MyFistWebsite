/**
 * Achievement System Module
 * 
 * This module handles the gamification layer of the WebGPU Explorer,
 * including achievements, progress tracking, and rewards.
 */

export class AchievementSystem {
    constructor() {
        // List of all available achievements
        this.achievements = [
            {
                id: 'explorer_awakened',
                name: 'Explorer Awakened',
                description: 'Start your WebGPU journey',
                icon: 'rocket',
                unlocked: false
            },
            {
                id: 'first_shader',
                name: 'Shader Apprentice',
                description: 'Successfully compile your first shader',
                icon: 'code',
                unlocked: false
            },
            {
                id: 'color_wizard',
                name: 'Color Wizard',
                description: 'Create a shader with at least 3 colors',
                icon: 'palette',
                unlocked: false
            },
            {
                id: 'math_genius',
                name: 'Math Genius',
                description: 'Use trigonometric functions in a shader',
                icon: 'calculator',
                unlocked: false
            },
            {
                id: 'animation_master',
                name: 'Animation Master',
                description: 'Create an animated shader using time',
                icon: 'clock',
                unlocked: false
            },
            {
                id: 'texture_tamer',
                name: 'Texture Tamer',
                description: 'Successfully use a texture in your shader',
                icon: 'image',
                unlocked: false
            },
            {
                id: 'compute_commander',
                name: 'Compute Commander',
                description: 'Run your first compute shader',
                icon: 'microchip',
                unlocked: false
            },
            {
                id: 'persistence',
                name: 'Persistence',
                description: 'Complete 5 lectures',
                icon: 'trophy',
                unlocked: false
            },
            {
                id: 'explorer_graduate',
                name: 'WebGPU Graduate',
                description: 'Complete all lectures',
                icon: 'graduation-cap',
                unlocked: false
            },
            {
                id: 'creative_genius',
                name: 'Creative Genius',
                description: 'Create something unique and amazing',
                icon: 'star',
                unlocked: false
            }
        ];
        
        // Load saved achievements from localStorage
        this.loadAchievements();
        
        // Initialize the UI
        this.initUI();
    }
    
    /**
     * Initialize the achievements UI
     */
    initUI() {
        // Populate the achievements list
        const achievementsList = document.getElementById('achievements-list');
        if (achievementsList) {
            achievementsList.innerHTML = '';
            
            this.achievements.forEach(achievement => {
                const achievementItem = document.createElement('div');
                achievementItem.className = `achievement-item ${achievement.unlocked ? 'unlocked' : 'locked'}`;
                achievementItem.id = `achievement-${achievement.id}`;
                
                achievementItem.innerHTML = `
                    <div class="achievement-icon">
                        <i class="fas fa-${achievement.icon}"></i>
                    </div>
                    <div class="achievement-details">
                        <div class="achievement-name">${achievement.name}</div>
                        <div class="achievement-desc">${achievement.description}</div>
                    </div>
                `;
                
                achievementsList.appendChild(achievementItem);
            });
        }
        
        // Update achievements count
        this.updateAchievementCount();
        
        // Set up toggle for achievements panel
        const achievementsToggle = document.createElement('div');
        achievementsToggle.className = 'achievements-toggle';
        achievementsToggle.innerHTML = '<i class="fas fa-trophy"></i>';
        document.body.appendChild(achievementsToggle);
        
        achievementsToggle.addEventListener('click', () => {
            const panel = document.getElementById('achievements-panel');
            if (panel) {
                panel.classList.toggle('show');
            }
        });
    }
    
    /**
     * Update the achievement count display
     */
    updateAchievementCount() {
        const achievementsCount = document.getElementById('achievements-count');
        if (achievementsCount) {
            const unlockedCount = this.achievements.filter(a => a.unlocked).length;
            const totalCount = this.achievements.length;
            achievementsCount.textContent = `${unlockedCount}/${totalCount}`;
        }
    }
    
    /**
     * Unlock an achievement by ID
     * @param {string} id - The achievement ID to unlock
     * @returns {boolean} - Whether the achievement was successfully unlocked
     */
    unlockAchievement(id) {
        const achievement = this.achievements.find(a => a.id === id);
        
        if (!achievement || achievement.unlocked) {
            return false;
        }
        
        // Unlock the achievement
        achievement.unlocked = true;
        
        // Save to localStorage
        this.saveAchievements();
        
        // Update the UI
        const achievementItem = document.getElementById(`achievement-${id}`);
        if (achievementItem) {
            achievementItem.classList.remove('locked');
            achievementItem.classList.add('unlocked');
            achievementItem.classList.add('pulse');
            
            // Remove animation class after animation completes
            setTimeout(() => {
                achievementItem.classList.remove('pulse');
            }, 1000);
        }
        
        // Show achievement popup
        this.showAchievementPopup(achievement);
        
        // Update achievement count
        this.updateAchievementCount();
        
        return true;
    }
    
    /**
     * Show an achievement popup notification
     * @param {Object} achievement - The achievement to display
     */
    showAchievementPopup(achievement) {
        const popup = document.getElementById('achievement-popup');
        const popupText = document.getElementById('achievement-text');
        
        if (popup && popupText) {
            popupText.textContent = `Achievement Unlocked: ${achievement.name}`;
            popup.classList.add('show');
            
            // Hide popup after 3 seconds
            setTimeout(() => {
                popup.classList.remove('show');
            }, 3000);
        }
    }
    
    /**
     * Load achievements from localStorage
     */
    loadAchievements() {
        try {
            const savedAchievements = localStorage.getItem('webgpu_achievements');
            if (savedAchievements) {
                const unlockedIds = JSON.parse(savedAchievements);
                
                // Mark achievements as unlocked
                unlockedIds.forEach(id => {
                    const achievement = this.achievements.find(a => a.id === id);
                    if (achievement) {
                        achievement.unlocked = true;
                    }
                });
            }
        } catch (error) {
            console.error('Error loading achievements:', error);
        }
    }
    
    /**
     * Save achievements to localStorage
     */
    saveAchievements() {
        try {
            const unlockedIds = this.achievements
                .filter(a => a.unlocked)
                .map(a => a.id);
                
            localStorage.setItem('webgpu_achievements', JSON.stringify(unlockedIds));
        } catch (error) {
            console.error('Error saving achievements:', error);
        }
    }
    
    /**
     * Reset all achievements
     */
    resetAchievements() {
        // Mark all achievements as locked
        this.achievements.forEach(achievement => {
            achievement.unlocked = false;
        });
        
        // Clear localStorage
        localStorage.removeItem('webgpu_achievements');
        
        // Update UI
        this.initUI();
    }
    
    /**
     * Check if shader code contains patterns that would unlock achievements
     * @param {string} code - The shader code to check
     * @param {string} type - The type of shader ('vertex' or 'fragment')
     */
    checkShaderAchievements(code, type) {
        // Unlock "First Shader" if it's not already unlocked
        if (!this.achievements.find(a => a.id === 'first_shader').unlocked) {
            this.unlockAchievement('first_shader');
        }
        
        // Check for multiple colors in fragment shader
        if (type === 'fragment' && !this.achievements.find(a => a.id === 'color_wizard').unlocked) {
            // Count unique color definitions
            const colorCount = (code.match(/vec[34]<f32>\s*\([^)]*\)/g) || []).length;
            if (colorCount >= 3) {
                this.unlockAchievement('color_wizard');
            }
        }
        
        // Check for math functions
        if (!this.achievements.find(a => a.id === 'math_genius').unlocked) {
            const hasTrigFunctions = /\b(sin|cos|tan|atan)\b/.test(code);
            if (hasTrigFunctions) {
                this.unlockAchievement('math_genius');
            }
        }
        
        // Check for animation (time usage)
        if (!this.achievements.find(a => a.id === 'animation_master').unlocked) {
            const hasTimeVariable = /\b(time|t)\b/.test(code);
            if (hasTimeVariable) {
                this.unlockAchievement('animation_master');
            }
        }
        
        // Check for texture usage
        if (!this.achievements.find(a => a.id === 'texture_tamer').unlocked) {
            const hasTextureSampling = /\b(texture|textureSample)\b/.test(code);
            if (hasTextureSampling) {
                this.unlockAchievement('texture_tamer');
            }
        }
    }
    
    /**
     * Check if compute shader is used
     */
    checkComputeShaderAchievement() {
        if (!this.achievements.find(a => a.id === 'compute_commander').unlocked) {
            this.unlockAchievement('compute_commander');
        }
    }
    
    /**
     * Check for lecture completion achievements
     * @param {number} completedLectures - The number of completed lectures
     * @param {number} totalLectures - The total number of lectures
     */
    checkLectureAchievements(completedLectures, totalLectures) {
        // Check for persistence (5 lectures)
        if (completedLectures >= 5 && !this.achievements.find(a => a.id === 'persistence').unlocked) {
            this.unlockAchievement('persistence');
        }
        
        // Check for completion of all lectures
        if (completedLectures === totalLectures && !this.achievements.find(a => a.id === 'explorer_graduate').unlocked) {
            this.unlockAchievement('explorer_graduate');
        }
    }
}