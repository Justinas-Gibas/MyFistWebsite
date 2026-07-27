import {
    SPIKE_THRESHOLD,
    LEAK_RATE,
    REFRACTORY_PERIOD,
    INPUT_SPIKE_STRENGTH
} from './config.js';

export class Neuron {
    constructor(x, y, id, type = 'regular') {
        this.id = id;
        this.x = x;
        this.y = y;
        this.type = type;
        this.potential = 0;
        this.isFiring = false;
        this.refractoryTime = 0;
        this.spikeCount = 0;
        this.lastSpikeTime = null;
        this.connections = [];
        if (type === 'input') this.isActive = false;
    }

    integrate(strength = INPUT_SPIKE_STRENGTH) {
        if (this.type === 'input' || this.refractoryTime > 0) return false;
        this.potential += strength;
        return true;
    }

    update(deltaTime) {
        if (this.type === 'input') {
            if (this.isActive && this.refractoryTime <= 0) {
                this.fire();
                return true;
            }
            this.advanceRefractory(deltaTime);
            return false;
        }

        if (this.refractoryTime > 0) {
            this.advanceRefractory(deltaTime);
            if (this.refractoryTime <= 0) this.potential = 0;
            return false;
        }

        this.potential = Math.max(
            0,
            this.potential - LEAK_RATE * this.potential * (deltaTime / 16.67)
        );
        if (this.potential < SPIKE_THRESHOLD) return false;
        this.fire();
        return true;
    }

    advanceRefractory(deltaTime) {
        if (this.refractoryTime <= 0) return;
        this.refractoryTime -= deltaTime;
        if (this.refractoryTime <= 0) this.isFiring = false;
    }

    fire() {
        this.isFiring = true;
        this.spikeCount++;
        if (this.type === 'regular') this.potential = 0;
        this.refractoryTime = REFRACTORY_PERIOD;
    }

    addConnection(targetNeuronId) {
        if (targetNeuronId !== this.id && !this.connections.includes(targetNeuronId)) {
            this.connections.push(targetNeuronId);
        }
    }
}
