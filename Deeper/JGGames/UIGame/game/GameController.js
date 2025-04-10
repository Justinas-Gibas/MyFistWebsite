import { EventBus } from '../core/EventBus.js';

export class GameController {
    constructor() {
        this.score = 0;
        this.achievements = new Set();
        this.windowCount = 0;
        this.setupListeners();
    }

    setupListeners() {
        EventBus.subscribe('window.mounted', () => this.onWindowCreated());
        EventBus.subscribe('window.moved', () => this.onWindowMoved());
        EventBus.subscribe('window.resized', () => this.onWindowResized());
    }

    onWindowCreated() {
        this.windowCount++;
        this.addScore(10, 'Window created');
        if (this.windowCount === 10) {
            this.unlockAchievement('🏆 Window Master');
        }
    }

    onWindowMoved() {
        this.addScore(5, 'Window moved');
    }

    onWindowResized() {
        this.addScore(5, 'Window resized');
    }

    addScore(points, reason) {
        this.score += points;
        EventBus.emit('score.updated', { score: this.score, reason });
    }

    unlockAchievement(achievement) {
        if (!this.achievements.has(achievement)) {
            this.achievements.add(achievement);
            EventBus.emit('achievement.unlocked', achievement);
        }
    }
}
