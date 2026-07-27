import assert from 'node:assert/strict';

import { Bacteria } from './bacteria.js';
import { BacteriaWorld } from './bacteriaWorld.js';

const originalRandom = Math.random;
Math.random = () => 0;

try {
    const genome = {
        size: 1,
        speed: 1,
        efficiency: 1,
        color: { r: 0, g: 128, b: 255 },
        brain: { numNeurons: 3, connectionDensity: 0.5 }
    };
    const bacteria = new Bacteria(100, 100, genome);
    const world = new BacteriaWorld(600, 400, 0);
    world.bacteria = [bacteria];

    assert.equal(bacteria.brain.getInputNodes().length, 7);
    assert.equal(bacteria.brain.getRegularNeurons().length, 5);
    assert.equal(bacteria.outputNeurons.length, 2);
    assert.equal(bacteria.brain.isRunning, true);

    const start = { x: bacteria.x, y: bacteria.y };
    bacteria.update(world, 16.67);
    assert.notDeepEqual(
        { x: bacteria.x, y: bacteria.y },
        start,
        'a bacteria should move on every simulation step'
    );

    bacteria.update(world, 16.67);
    assert.ok(
        bacteria.outputNeurons.some(neuron => neuron.isFiring || neuron.potential > 0),
        'sensor spikes should reach the motor neurons'
    );
    assert.ok(bacteria.getBrainOutputs()[1] > 0.15, 'motor activity should affect speed');

    const emptyWorld = new BacteriaWorld(600, 400, 0);
    emptyWorld.BacteriaClass = Bacteria;
    emptyWorld.startNewGeneration();
    assert.equal(emptyWorld.bacteria.length, 20, 'extinction should seed a new population');
} finally {
    Math.random = originalRandom;
}

console.log('Simulation integration tests passed.');
