/** @file Defines the Neuron class for the SNN simulation. */

import { 
    SPIKE_THRESHOLD, 
    LEAK_RATE, 
    REFRACTORY_PERIOD, 
    INPUT_SPIKE_STRENGTH, 
    NEURON_RADIUS, 
    INPUT_NODE_RADIUS, 
    INPUT_NODE_COLOR_INACTIVE, 
    INPUT_NODE_COLOR_ACTIVE 
} from './config.js';

/**
 * Represents a single neuron in the Spiking Neural Network.
 * Can be a regular neuron or an input node.
 */
export class Neuron {
    /**
     * Creates an instance of a Neuron.
     * @param {number} x - The x-coordinate of the neuron on the canvas.
     * @param {number} y - The y-coordinate of the neuron on the canvas.
     * @param {string} id - A unique identifier for the neuron (e.g., "brainId-neuronLocalId").
     * @param {('regular'|'input')} [type='regular'] - The type of neuron.
     */
    constructor(x, y, id, type = 'regular') {
        /** @type {string} Unique identifier for the neuron. */
        this.id = id;
        /** @type {number} X-coordinate on the canvas. */
        this.x = x;
        /** @type {number} Y-coordinate on the canvas. */
        this.y = y;
        /** @type {('regular'|'input')} Type of the neuron. */
        this.type = type;
        /** @type {number} Current membrane potential of the neuron. */
        this.potential = 0;
        /** @type {boolean} True if the neuron is currently firing. */
        this.isFiring = false;
        /** @type {number} Time remaining (in ms) in the refractory period. */
        this.refractoryTime = 0;
        /** @type {Array<string>} Array of IDs of neurons this neuron connects to. */
        this.connections = []; 

        if (this.type === 'input') {
            /** @type {boolean} For input nodes, true if currently active and generating spikes. */
            this.isActive = false; 
            this.potential = 0; 
        }
    }

    /**
     * Integrates an incoming spike, increasing the neuron's potential.
     * Does not apply to 'input' type neurons or if in refractory period.
     * @param {number} [inputSpikeStrength=INPUT_SPIKE_STRENGTH] - The strength of the incoming spike.
     * @returns {boolean} True if the spike was integrated, false otherwise.
     */
    integrate(inputSpikeStrength = INPUT_SPIKE_STRENGTH) {
        if (this.type === 'input' || this.refractoryTime > 0) return false;
        this.potential += inputSpikeStrength;
        return true;
    }

    /**
     * Updates the neuron's state for a given time delta.
     * Handles potential leak, firing, and refractory period.
     * For input neurons, handles firing if active.
     * @param {number} deltaTime - The time elapsed since the last update, in milliseconds.
     * @returns {boolean} True if the neuron fired during this update, false otherwise.
     */
    update(deltaTime) {
        if (this.type === 'input') {
            if (this.isActive && this.refractoryTime <= 0) {
                // Input nodes fire if active and not in refractory period
                this.fire();
                return true; // Firing
            }
            if (this.refractoryTime > 0) {
                this.refractoryTime -= deltaTime;
                 if (this.refractoryTime <= 0) {
                    this.isFiring = false;
                }
            }
            return false; // Not firing or still in refractory
        }

        // Regular neuron update logic
        if (this.refractoryTime > 0) {
            this.refractoryTime -= deltaTime;
            if (this.refractoryTime <= 0) {
                this.isFiring = false;
                this.potential = 0;
            }
            return false; // Not firing
        }

        this.potential -= LEAK_RATE * this.potential * (deltaTime / 16.67);
        if (this.potential < 0) this.potential = 0;

        if (this.potential >= SPIKE_THRESHOLD) {
            this.fire();
            return true; // Firing
        }
        return false; // Not firing
    }

    /**
     * Makes the neuron fire. Sets it to a firing state, resets potential (for regular neurons),
     * and initiates the refractory period.
     */
    fire() {
        this.isFiring = true;
        if (this.type === 'regular') {
            this.potential = 0; 
        }
        this.refractoryTime = REFRACTORY_PERIOD;
        console.log(`Neuron ${this.id} (${this.type}) at (${this.x.toFixed(0)}, ${this.y.toFixed(0)}) fired!`);
    }

    /**
     * Draws the neuron on the canvas.
     * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas.
     */
    draw(ctx) {
        const radius = this.type === 'input' ? INPUT_NODE_RADIUS : NEURON_RADIUS;
        let color;

        if (this.type === 'input') {
            color = this.isActive ? INPUT_NODE_COLOR_ACTIVE : INPUT_NODE_COLOR_INACTIVE;
            if (this.isFiring) color = 'darkred'; // Special firing color for input node
        } else {
            color = this.isFiring ? 'red' : (this.refractoryTime > 0 ? 'orange' : `rgb(0, ${Math.min(255, this.potential * 200)}, 255)`);
        }

        ctx.beginPath();
        ctx.arc(this.x, this.y, radius, 0, Math.PI * 2);
        ctx.fillStyle = color;
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath();

        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        if (this.type === 'regular') {
            ctx.fillText(this.potential.toFixed(2), this.x + radius + 2, this.y + radius / 2);
        }
        ctx.fillText(`${this.type === 'input' ? 'IN' : 'N'}-${this.id}`, this.x - radius, this.y - radius - 2);
    }

    /**
     * Adds a connection from this neuron to a target neuron.
     * Avoids duplicate connections and self-connections.
     * @param {string} targetNeuronId - The ID of the neuron to connect to.
     */
    addConnection(targetNeuronId) {
        if (!this.connections.includes(targetNeuronId) && targetNeuronId !== this.id) {
            this.connections.push(targetNeuronId);
        }
    }
}
