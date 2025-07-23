/** @file Defines the Brain class, representing an individual Spiking Neural Network. */

import { Neuron } from './neuron.js';
import { 
    NEURON_RADIUS, 
    INPUT_SPIKE_STRENGTH, 
    INPUT_NODE_RADIUS, 
    INPUT_NODE_SPIKE_STRENGTH, 
    DEFAULT_NUM_NEURONS_PER_BRAIN, 
    DEFAULT_NUM_INPUT_NODES_PER_BRAIN 
} from './config.js';

/**
 * @typedef {Object} CanvasRegion
 * @property {number} x - The top-left x-coordinate of the region.
 * @property {number} y - The top-left y-coordinate of the region.
 * @property {number} width - The width of the region.
 * @property {number} height - The height of the region.
 */

/**
 * Represents an individual Spiking Neural Network (SNN), or "Brain".
 * Manages its own set of neurons, simulation state, and drawing within a defined canvas region.
 */
export class Brain {
    /**
     * Creates an instance of a Brain.
     * @param {number|string} id - A unique identifier for this brain.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the main canvas.
     * @param {CanvasRegion} canvasRegion - An object defining the rectangular area on the canvas where this brain can draw.
     */
    constructor(id, ctx, canvasRegion) {
        /** @type {number|string} Unique identifier for the brain. */
        this.id = id;
        /** @type {CanvasRenderingContext2D} The 2D rendering context. */
        this.ctx = ctx;
        /** @type {CanvasRegion} The region on the canvas allocated to this brain. */
        this.canvasRegion = canvasRegion;
        /** @type {Array<Neuron>} Array of neurons belonging to this brain. */
        this.neurons = [];
        /** @type {number} Counter for generating unique neuron IDs within this brain. */
        this.nextNeuronId = 0;
        /** @type {boolean} True if the brain's simulation is currently running. */
        this.isRunning = false;
        /** @type {number} Timestamp of the last update, used for calculating deltaTime. */
        this.lastTime = 0;
        /** @type {Array<Object>} Array of active spikes for visualization. Each object: { source: Neuron, target: Neuron, life: number }. */
        this.activeSpikes = [];
        /** @type {number} Current fitness score of the brain, used for evolution. */
        this.fitness = 0;

        this.initializeNeurons();
    }

    /**
     * Initializes the brain with a default set of regular and input neurons.
     * @param {number} [numRegular=DEFAULT_NUM_NEURONS_PER_BRAIN] - Number of regular neurons to create.
     * @param {number} [numInputs=DEFAULT_NUM_INPUT_NODES_PER_BRAIN] - Number of input neurons to create.
     */
    initializeNeurons(numRegular = DEFAULT_NUM_NEURONS_PER_BRAIN, numInputs = DEFAULT_NUM_INPUT_NODES_PER_BRAIN) {
        for (let i = 0; i < numInputs; i++) {
            this.addNeuron('input', true); // autoConnect = true for inputs initially
        }
        for (let i = 0; i < numRegular; i++) {
            this.addNeuron('regular', true); // autoConnect = true
        }
    }

    /**
     * Adds a new neuron to the brain.
     * Positions the neuron randomly within the brain's allocated canvas region.
     * @param {('regular'|'input')} [type='regular'] - The type of neuron to add.
     * @param {boolean} [autoConnect=false] - If true, attempts to automatically connect the new neuron.
     * @returns {Neuron} The newly created neuron.
     */
    addNeuron(type = 'regular', autoConnect = false) {
        const radius = type === 'input' ? INPUT_NODE_RADIUS : NEURON_RADIUS;
        // Position neurons within this brain's allocated canvas region
        const x = this.canvasRegion.x + radius + Math.random() * (this.canvasRegion.width - radius * 2);
        const y = this.canvasRegion.y + radius + Math.random() * (this.canvasRegion.height - radius * 2);
        
        const newNeuron = new Neuron(x, y, `${this.id}-${this.nextNeuronId++}`, type);
        this.neurons.push(newNeuron);

        if (autoConnect) {
            if (type === 'regular' && this.neurons.length > 1) {
                const potentialTargets = this.neurons.filter(n => n.id !== newNeuron.id);
                if (potentialTargets.length > 0) {
                    const targetNeuron = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
                    if (targetNeuron.type === 'input') { // input connects to new regular
                        targetNeuron.addConnection(newNeuron.id);
                    } else if (newNeuron.type === 'regular') { // regular connects to other regular
                        const coinFlip = Math.random() > 0.5;
                        if (coinFlip) {
                           targetNeuron.addConnection(newNeuron.id);
                        } else {
                           newNeuron.addConnection(targetNeuron.id);
                        }
                    }
                }
            } else if (type === 'input') { // Connect new input to a random existing regular neuron
                const regularNeurons = this.neurons.filter(n => n.type === 'regular');
                if (regularNeurons.length > 0) {
                    const targetNeuron = regularNeurons[Math.floor(Math.random() * regularNeurons.length)];
                    newNeuron.addConnection(targetNeuron.id);
                }
            }
        }
        return newNeuron;
    }
    
    /**
     * Gets all input nodes in this brain.
     * @returns {Array<Neuron>} An array of input neurons.
     */
    getInputNodes() {
        return this.neurons.filter(n => n.type === 'input');
    }

    /**
     * Gets all regular neurons in this brain.
     * @returns {Array<Neuron>} An array of regular neurons.
     */
    getRegularNeurons() {
        return this.neurons.filter(n => n.type === 'regular');
    }
    
    /**
     * Toggles the active state of a specific input node within this brain.
     * @param {string} neuronLocalId - The local part of the neuron's ID (after "brainId-").
     * @param {boolean} isActive - The new active state for the input node.
     */
    toggleInputNodeActiveState(neuronLocalId, isActive) { // neuronLocalId is the part after "brainId-"
        const fullId = `${this.id}-${neuronLocalId}`;
        const node = this.neurons.find(n => n.id === fullId && n.type === 'input');
        if (node) {
            node.isActive = isActive;
        }
    }

    /**
     * Starts or resumes the simulation for this brain.
     */
    start() {
        if (!this.isRunning) {
            this.isRunning = true;
            this.lastTime = performance.now();
        }
    }

    /**
     * Pauses the simulation for this brain.
     */
    pause() {
        this.isRunning = false;
    }

    /**
     * Resets the brain to its initial state: clears neurons, active spikes, fitness,
     * and re-initializes with default neurons. Stops the simulation.
     */
    reset() {
        this.neurons = [];
        this.nextNeuronId = 0;
        this.activeSpikes = [];
        this.isRunning = false;
        this.initializeNeurons(); // Re-initialize with default neurons
        this.fitness = 0;
    }

    /**
     * Updates the state of all neurons in the brain for a given time delta.
     * Handles neuron updates, spike propagation, and updates active spike visualizations.
     * Also updates the brain's fitness score based on activity.
     * @param {number} deltaTime - The time elapsed since the last update, in milliseconds.
     */
    update(deltaTime) {
        if (!this.isRunning) return;

        const newlyFiringNeurons = [];
        this.neurons.forEach(neuron => {
            if (neuron.update(deltaTime)) {
                newlyFiringNeurons.push(neuron);
                if (neuron.type === 'regular') this.fitness += 0.1; // Simple fitness increment
            }
        });

        newlyFiringNeurons.forEach(firingNeuron => {
            const spikeStrength = firingNeuron.type === 'input' ? INPUT_NODE_SPIKE_STRENGTH : INPUT_SPIKE_STRENGTH;
            firingNeuron.connections.forEach(targetId => {
                const targetNeuron = this.neurons.find(n => n.id === targetId);
                if (targetNeuron && targetNeuron.type === 'regular') {
                    if (targetNeuron.integrate(spikeStrength)) {
                        this.activeSpikes.push({ source: firingNeuron, target: targetNeuron, life: 10 });
                        this.fitness += 0.05; // Fitness for successful propagation
                    }
                }
            });
        });

        this.activeSpikes = this.activeSpikes.filter(spike => {
            spike.life--;
            return spike.life > 0;
        });
    }

    /**
     * Draws all connections between neurons in this brain.
     * Uses the brain's `ctx` and draws within its `canvasRegion`.
     */
    drawConnections() {
        this.ctx.strokeStyle = `rgba(50, 50, 50, 0.2)`; // Slightly different color for brain connections
        this.ctx.lineWidth = 0.5;
        this.neurons.forEach(neuron => {
            neuron.connections.forEach(targetId => {
                const targetNeuron = this.neurons.find(n => n.id === targetId);
                if (targetNeuron) {
                    this.ctx.beginPath();
                    this.ctx.moveTo(neuron.x, neuron.y);
                    this.ctx.lineTo(targetNeuron.x, targetNeuron.y);
                    this.ctx.stroke();
                }
            });
        });
    }

    drawNeurons() {
        this.neurons.forEach(neuron => neuron.draw(this.ctx));
    }

    drawActiveSpikes() {
        this.activeSpikes.forEach(spike => {
            if (!spike.source || !spike.target) return;
            this.ctx.beginPath();
            this.ctx.moveTo(spike.source.x, spike.source.y);
            this.ctx.lineTo(spike.target.x, spike.target.y);
            this.ctx.strokeStyle = 'rgba(255, 255, 0, 0.7)'; // Spike color
            this.ctx.lineWidth = 2;
            this.ctx.stroke();
        });
        this.ctx.lineWidth = 1; // Reset line width
    }
    
    drawBoundary() {
        this.ctx.strokeStyle = 'rgba(100,100,100,0.5)';
        this.ctx.strokeRect(this.canvasRegion.x, this.canvasRegion.y, this.canvasRegion.width, this.canvasRegion.height);
        this.ctx.fillStyle = 'black';
        this.ctx.fillText(`Brain ${this.id} (Fit: ${this.fitness.toFixed(2)})`, this.canvasRegion.x + 5, this.canvasRegion.y + 15);
    }
}
