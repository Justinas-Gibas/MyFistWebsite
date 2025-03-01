/**
 * Level 1: Window Basics
 * Simple introduction to window manipulation
 * 
 * Progression Requirements:
 * 1. Create any window
 * 2. Move any window
 * 3. Resize any window
 */

import { BaseLevel } from './BaseLevel.js';
import { Window } from '../components/Window.js';

export default class Level1 extends BaseLevel {
    constructor() {
        super(1, 'Window Basics');
        this.init();
    }

    init() {
        const createWindowBtn = new Button('Create Window', () => {
            this.createWindow();
            this.checkCondition('create_window');
        });
        createWindowBtn.mount(document.getElementById('app'));

        this.setupEventListeners();
    }

    setupEventListeners() {
        EventBus.subscribe('window.moved', () => this.checkCondition('move_window'));
        EventBus.subscribe('window.resized', () => this.checkCondition('resize_window'));
    }

    createWindow() {
        const window = new Window({
            title: 'Test Window',
            content: 'Try moving and resizing me!'
        });
        window.mount(document.getElementById('app'));
    }
}
