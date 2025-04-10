import { Window } from './Window.js';
import { EventBus } from '../core/EventBus.js';

export class QuestWindow extends Window {
    constructor() {
        super({
            title: 'Level Progress',
            width: 300,
            height: 300,
            content: '<div class="quest-container"></div>',
            closeable: false  // Add this parameter
        });
        
        // Make quest window stay on top
        Object.assign(this.element.style, {
            zIndex: 9999
        });

        this.levels = {
            level1: {
                title: "Learn Windows",
                conditions: [
                    { id: 'create_window', text: 'Create a window', required: 1, progress: 0 },
                    { id: 'move_window', text: 'Move any window', required: 1, progress: 0 },
                    { id: 'resize_window', text: 'Resize any window', required: 1, progress: 0 }
                ],
                nextLevel: "Level 2: Controls"
            },
            level2: {
                title: "Try Controls",
                conditions: [
                    { id: 'use_slider', text: 'Move any slider', required: 1, progress: 0 },
                    { id: 'use_toggle', text: 'Use any toggle', required: 1, progress: 0 }
                ],
                nextLevel: "Level 3: Advanced"
            }
        };
        
        this.initQuestLog();
        this.setupEventListeners();
    }

    initQuestLog() {
        const container = this.element.querySelector('.quest-container');
        container.innerHTML = this.renderQuests();
        this.applyQuestStyles(container);
    }

    renderQuests() {
        return Object.entries(this.levels).map(([level, info]) => `
            <div class="quest-section" data-level="${level}">
                <h3>${info.title}</h3>
                <div class="conditions">
                    ${info.conditions.map(condition => `
                        <div class="condition" data-condition-id="${condition.id}">
                            <div class="progress-bar">
                                <div class="progress" style="width: ${(condition.progress/condition.required)*100}%"></div>
                            </div>
                            ✦ ${condition.text}
                        </div>
                    `).join('')}
                </div>
                <div class="next-level">→ ${info.nextLevel}</div>
            </div>
        `).join('');
    }

    applyQuestStyles(container) {
        const style = document.createElement('style');
        style.textContent = `
            .quest-section { 
                margin-bottom: 15px; 
                background: #f5f5f5;
                padding: 10px;
                border-radius: 5px;
            }
            .condition { 
                margin: 5px 0;
                color: #666;
            }
            .progress-bar {
                height: 3px;
                background: #ddd;
                margin: 3px 0;
            }
            .progress {
                height: 100%;
                background: #4CAF50;
                transition: width 0.3s;
            }
            .next-level {
                margin-top: 8px;
                color: #4CAF50;
                font-weight: bold;
            }
        `;
        document.head.appendChild(style);
    }

    updateProgress(levelId, conditionId) {
        const level = this.levels[levelId];
        const condition = level.conditions.find(c => c.id === conditionId);
        if (condition && condition.progress < condition.required) {
            condition.progress++;
            this.initQuestLog();
            this.checkLevelCompletion(levelId);
        }
    }

    checkLevelCompletion(levelId) {
        const level = this.levels[levelId];
        const completed = level.conditions.every(condition => condition.progress >= condition.required);
        if (completed) {
            EventBus.emit('level.completed', { level: levelId });
            
            // If level1 is completed, update the quest display for level2
            if (levelId === 'level1') {
                const level1Section = this.element.querySelector('[data-level="level1"]');
                if (level1Section) {
                    level1Section.style.display = 'none';
                }
                const level2Section = this.element.querySelector('[data-level="level2"]');
                if (level2Section) {
                    level2Section.style.display = 'block';
                }
            }
        }
    }

    setupEventListeners() {
        EventBus.subscribe('window.mounted', () => this.updateProgress('level1', 'create_window'));
        EventBus.subscribe('window.moved', () => this.updateProgress('level1', 'move_window'));
        EventBus.subscribe('window.resized', () => this.updateProgress('level1', 'resize_window'));
    }
}
