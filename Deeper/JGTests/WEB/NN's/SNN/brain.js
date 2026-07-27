import { Neuron } from './neuron.js';
import { INPUT_SPIKE_STRENGTH, INPUT_NODE_SPIKE_STRENGTH } from './config.js';

/**
 * Event-driven spiking controller owned by one embodied agent.
 * Rendering and evolutionary topology construction live outside this class.
 */
export class Brain {
    constructor(id, canvasRegion = { x: 0, y: 0, width: 100, height: 100 }) {
        this.id = id;
        this.canvasRegion = canvasRegion;
        this.neurons = [];
        this.nextNeuronId = 0;
        this.isRunning = false;
        this.activeSpikes = [];
        this.fitness = 0;
        this.simulationTime = 0;
    }

    addNeuron(type = 'regular') {
        const x = this.canvasRegion.x + Math.random() * this.canvasRegion.width;
        const y = this.canvasRegion.y + Math.random() * this.canvasRegion.height;
        const neuron = new Neuron(x, y, `${this.id}-${this.nextNeuronId++}`, type);
        this.neurons.push(neuron);
        return neuron;
    }

    getInputNodes() {
        return this.neurons.filter(neuron => neuron.type === 'input');
    }

    getRegularNeurons() {
        return this.neurons.filter(neuron => neuron.type === 'regular');
    }

    start() {
        this.isRunning = true;
    }

    pause() {
        this.isRunning = false;
    }

    update(deltaTime) {
        if (!this.isRunning) return;

        this.simulationTime += deltaTime;
        const newlyFiring = [];
        this.neurons.forEach(neuron => {
            if (!neuron.update(deltaTime)) return;
            neuron.lastSpikeTime = this.simulationTime;
            newlyFiring.push(neuron);
            if (neuron.type === 'regular') this.fitness += 0.1;
        });

        newlyFiring.forEach(source => {
            const strength = source.type === 'input'
                ? INPUT_NODE_SPIKE_STRENGTH
                : INPUT_SPIKE_STRENGTH;
            source.connections.forEach(targetId => {
                const target = this.neurons.find(neuron => neuron.id === targetId);
                if (!target || target.type !== 'regular') return;
                if (target.integrate(strength)) {
                    this.activeSpikes.push({ source, target, life: 10 });
                    this.fitness += 0.05;
                }
            });
        });

        this.activeSpikes = this.activeSpikes.filter(spike => --spike.life > 0);
    }
}
