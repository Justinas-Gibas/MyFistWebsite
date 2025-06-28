/** @file Defines the Environment class, which manages multiple Brain instances and the overall simulation loop. */

import { Brain } from './brain.js';
import { clearCanvas } from './ui.js';
import { BRAIN_CANVAS_PADDING } from './config.js';

/**
 * Manages a collection of Brain instances, orchestrates their simulation,
 * and handles the main animation loop for the SNN environment.
 */
export class Environment {
    /**
     * Creates an instance of an Environment.
     * @param {HTMLCanvasElement} canvas - The main HTML canvas element for drawing.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the main canvas.
     */
    constructor(canvas, ctx) {
        /** @type {HTMLCanvasElement} The main HTML canvas element. */
        this.canvas = canvas;
        /** @type {CanvasRenderingContext2D} The 2D rendering context of the main canvas. */
        this.ctx = ctx;
        /** @type {Array<Brain>} Array of Brain instances managed by this environment. */
        this.brains = [];
        /** @type {boolean} True if the environment simulation is currently running. */
        this.isRunning = false;
        /** @type {?number} ID of the current animation frame request. Null if not running. */
        this.animationFrameId = null;
        /** @type {number} Timestamp of the last animation loop, used for calculating deltaTime. */
        this.lastTime = 0;
        /** @type {number} Counter for generating unique brain IDs. */
        this.nextBrainId = 0;
    }

    /**
     * Initializes or re-initializes the environment with a specified number of brains.
     * Clears existing brains and creates new ones, distributing them on the canvas.
     * @param {number} numBrains - The number of brains to create.
     */
    initializeBrains(numBrains) {
        this.brains = [];
        this.nextBrainId = 0;
        const brainsPerRow = Math.ceil(Math.sqrt(numBrains));
        const brainWidth = (this.canvas.width - (brainsPerRow + 1) * BRAIN_CANVAS_PADDING) / brainsPerRow;
        const brainHeight = (this.canvas.height - (brainsPerRow + 1) * BRAIN_CANVAS_PADDING) / brainsPerRow; // Assuming square-ish allocation

        for (let i = 0; i < numBrains; i++) {
            const row = Math.floor(i / brainsPerRow);
            const col = i % brainsPerRow;
            const regionX = BRAIN_CANVAS_PADDING + col * (brainWidth + BRAIN_CANVAS_PADDING);
            const regionY = BRAIN_CANVAS_PADDING + row * (brainHeight + BRAIN_CANVAS_PADDING);
            
            const brain = new Brain(this.nextBrainId++, this.ctx, { x: regionX, y: regionY, width: brainWidth, height: brainHeight });
            this.brains.push(brain);
        }
        this.drawAll();
    }

    /**
     * Starts the simulation for all brains in the environment.
     * Initiates the main animation loop if not already running.
     */
    startAll() {
        if (this.brains.length === 0) {
            console.warn("No brains to start. Initialize the environment first.");
            return;
        }
        this.isRunning = true;
        this.brains.forEach(brain => brain.start());
        this.lastTime = performance.now();
        if (!this.animationFrameId) {
            this.loop();
        }
    }

    /**
     * Pauses the simulation for all brains in the environment.
     * Stops the main animation loop.
     */
    pauseAll() {
        this.isRunning = false;
        this.brains.forEach(brain => brain.pause());
        if (this.animationFrameId) {
            cancelAnimationFrame(this.animationFrameId);
            this.animationFrameId = null;
        }
    }

    /**
     * Resets all brains in the environment to their initial states and pauses the simulation.
     * Redraws the environment.
     */
    resetAll() {
        this.pauseAll();
        this.brains.forEach(brain => brain.reset());
        this.drawAll();
    }

    /**
     * The main simulation loop. Called recursively via requestAnimationFrame.
     * Calculates deltaTime, updates all running brains, and redraws them.
     * @private
     */
    loop() {
        if (!this.isRunning) return;

        const currentTime = performance.now();
        const deltaTime = currentTime - this.lastTime;
        this.lastTime = currentTime;

        clearCanvas(this.ctx, this.canvas);

        this.brains.forEach(brain => {
            brain.update(deltaTime);
            brain.drawBoundary();
            brain.drawConnections();
            brain.drawActiveSpikes(); // Draw spikes before neurons so neurons are on top
            brain.drawNeurons();
        });

        this.animationFrameId = requestAnimationFrame(() => this.loop());
    }

    /**
     * Clears the canvas and redraws all brains (boundaries, connections, neurons).
     * Typically used when the simulation is paused or after a reset.
     */
    drawAll() {
        clearCanvas(this.ctx, this.canvas);
        this.brains.forEach(brain => {
            brain.drawBoundary();
            brain.drawConnections();
            brain.drawNeurons();
            // brain.drawActiveSpikes(); // Spikes are dynamic, usually only drawn in loop
        });
    }

    /**
     * Retrieves a specific brain by its ID.
     * @param {number|string} id - The ID of the brain to retrieve.
     * @returns {Brain|undefined} The brain instance if found, otherwise undefined.
     */
    getBrain(id) {
        return this.brains.find(b => b.id === id);
    }

    /**
     * Placeholder for the evolution process.
     * Currently logs the fitness of each brain.
     * Future implementation: selection, reproduction, mutation, culling.
     */
    evolve() {
        console.log("Evolution cycle triggered (placeholder)...");
        // 1. Evaluate fitness (already happening in brain.update)
        // 2. Selection
        // 3. Reproduction (cloning, mutation)
        // 4. Culling
        // For now, just log fitness
        this.brains.forEach(brain => console.log(`Brain ${brain.id} fitness: ${brain.fitness.toFixed(2)}`));
    }
}
