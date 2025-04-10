/**
 * Base Level System
 * 
 * Levels Structure:
 * - Level 0: Start Screen
 *   Simple start button to begin the game
 * 
 * - Level 1: Window Basics
 *   Tasks:
 *   - Create windows (+10 points)
 *   - Move windows (+5 points)
 *   - Resize windows (+5 points)
 *   Achievements:
 *   - 🏆 Window Master: Create 10 windows
 *   - 🎯 Perfect Layout: Arrange windows in grid
 * 
 * - Level 2: Control Panel
 *   Components:
 *   - RGB Sliders
 *   - Theme Toggle
 *   - Click Counter
 *   Tasks:
 *   - Adjust RGB sliders (+5 points)
 *   - Toggle themes (+10 points)
 *   - Match target colors (+20 points)
 *   Achievements:
 *   - 🎨 Color Master: Match all target colors
 *   - ⚡ Quick Learner: Complete in 30 seconds
 * 
 * - Level 3: Advanced Windows
 *   Features:
 *   - Tab System
 *   - Split Panels
 *   - Window Groups
 *   Tasks:
 *   - Create tab groups (+15 points)
 *   - Manage split layouts (+20 points)
 *   - Window snapping (+10 points)
 *   Achievements:
 *   - 📐 Layout Master: Perfect window arrangement
 *   - 🔄 Tab Master: Manage 10 tabs
 */

import { EventBus } from '../core/EventBus.js';

export class BaseLevel {
    constructor(levelNumber, title) {
        this.levelNumber = levelNumber;
        this.title = title;
        this.completed = false;
    }

    init() {
        // Override in child classes
    }

    checkCondition(conditionId) {
        EventBus.emit('condition.met', { 
            level: this.levelNumber,
            conditionId
        });
    }

    complete() {
        if (!this.completed) {
            this.completed = true;
            EventBus.emit('level.completed', {
                level: this.levelNumber,
                nextLevel: this.levelNumber + 1
            });
        }
    }
}
