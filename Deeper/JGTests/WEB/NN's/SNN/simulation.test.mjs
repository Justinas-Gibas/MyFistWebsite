import assert from 'node:assert/strict';

import { Bacteria, SENSOR_DEFINITIONS } from './bacteria.js';
import { BacteriaSim } from './bacteriaSim.js';
import { BacteriaWorld } from './bacteriaWorld.js';

const originalRandom = Math.random;
Math.random = () => 0;

try {
    const genome = {
        size: 1,
        speed: 1,
        efficiency: 1,
        color: { r: 0, g: 128, b: 255 },
        brain: { hiddenLayers: [4, 3], connectionDensity: 0.5 },
        sensors: { range: 0.5, directionalSharpness: 3, noise: 0 }
    };
    const bacteria = new Bacteria(100, 100, genome);
    const world = new BacteriaWorld(600, 400, 0);
    world.bacteria = [bacteria];

    assert.equal(bacteria.brain.getInputNodes().length, SENSOR_DEFINITIONS.length);
    assert.equal(bacteria.brain.getRegularNeurons().length, 9);
    assert.deepEqual(bacteria.genome.brain.hiddenLayers, [4, 3]);
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
        bacteria.hiddenLayers[0].some(neuron => neuron.isFiring || neuron.potential > 0),
        'sensor spikes should reach the first hidden layer'
    );
    assert.equal(bacteria.lastSensorValues.length, SENSOR_DEFINITIONS.length);
    assert.ok(bacteria.distanceTraveled > 0);

    for (let step = 0; step < 180; step++) bacteria.update(world, 16.67);
    assert.ok(bacteria.brain.neurons.some(neuron => neuron.spikeCount > 0));
    assert.ok(
        bacteria.outputNeurons.some(neuron => neuron.spikeCount > 0 || neuron.potential > 0),
        'activity should propagate through multiple hidden layers to motor neurons'
    );
    assert.ok(bacteria.trail.length > 1, 'selected-agent trajectories should retain samples');

    bacteria.x = 100;
    bacteria.y = 100;
    bacteria.heading = 0;
    world.food = [{ x: 150, y: 100, energy: 20, radius: 3 }];
    const forwardSensors = bacteria.getSensorInputs(world);
    assert.ok(forwardSensors[2] > forwardSensors[1]);
    assert.ok(forwardSensors[2] > forwardSensors[3], 'food ahead should activate the front receptor');
    assert.ok(
        !SENSOR_DEFINITIONS.some(sensor => /position|coordinate/i.test(sensor.label)),
        'agents must not receive privileged absolute coordinates'
    );
    assert.ok(bacteria.lastEnergyCosts.neurons > 0);
    assert.ok(bacteria.lastEnergyCosts.synapses > 0);
    assert.ok(bacteria.lastEnergyCosts.body > 0);
    assert.ok(bacteria.lastEnergyCosts.speedCapacity > 0);

    const sparseGenome = JSON.parse(JSON.stringify(genome));
    sparseGenome.brain.connectionDensity = 0;
    const denseGenome = JSON.parse(JSON.stringify(genome));
    denseGenome.brain.connectionDensity = 0.65;
    const sparse = new Bacteria(250, 100, sparseGenome);
    const dense = new Bacteria(350, 100, denseGenome);
    const wiringWorld = new BacteriaWorld(600, 400, 0);
    wiringWorld.bacteria = [sparse, dense];
    sparse.update(wiringWorld, 16.67);
    dense.update(wiringWorld, 16.67);
    assert.ok(
        dense.lastEnergyCosts.synapses > sparse.lastEnergyCosts.synapses * 2,
        'dense brains should pay a strongly nonlinear wiring cost'
    );

    const largeGenome = JSON.parse(JSON.stringify(genome));
    largeGenome.size = 2;
    const large = new Bacteria(400, 100, largeGenome);
    large.update(wiringWorld, 16.67);
    assert.ok(
        large.lastEnergyCosts.body > bacteria.lastEnergyCosts.body * 7,
        'body maintenance should grow cubically with size'
    );

    const reducedGenome = JSON.parse(JSON.stringify(genome));
    reducedGenome.sensors.enabled = ['energy', 'foodFront', 'wallFront'];
    reducedGenome.lifeHistory = {
        maturityAge: 1, lifespan: 100, reproductionEnergy: 90, mateCooldown: 10
    };
    const reduced = new Bacteria(200, 200, reducedGenome);
    assert.equal(reduced.brain.getInputNodes().length, 3);
    assert.deepEqual(
        reduced.sensorDefinitions.map(sensor => sensor.id),
        reducedGenome.sensors.enabled
    );

    const mate = new Bacteria(205, 200, reducedGenome);
    reduced.matingType = 'α';
    mate.matingType = 'β';
    reduced.age = mate.age = 5;
    reduced.energy = mate.energy = 140;
    const matingWorld = new BacteriaWorld(600, 400, 0);
    matingWorld.BacteriaClass = Bacteria;
    matingWorld.bacteria = [reduced, mate];
    matingWorld.handleMating();
    assert.equal(matingWorld.bacteria.length, 3, 'compatible nearby adults should reproduce');
    assert.deepEqual(matingWorld.bacteria[2].parentIds, [reduced.id, mate.id]);

    const agingGenome = JSON.parse(JSON.stringify(reducedGenome));
    agingGenome.lifeHistory.lifespan = 1;
    const aging = new Bacteria(300, 300, agingGenome);
    const agingWorld = new BacteriaWorld(600, 400, 0);
    agingWorld.bacteria = [aging];
    aging.update(agingWorld, 16.67);
    assert.equal(aging.energy, 0, 'organisms should die at their inherited lifespan');

    const emptyWorld = new BacteriaWorld(600, 400, 0);
    emptyWorld.BacteriaClass = Bacteria;
    emptyWorld.startNewGeneration();
    assert.equal(emptyWorld.bacteria.length, 20, 'extinction should seed a new population');

    const context = {
        beginPath() {}, clearRect() {}, fill() {}, fillRect() {}, fillText() {},
        lineTo() {}, moveTo() {}, arc() {}, restore() {}, save() {}, stroke() {}
    };
    const elements = new Map();
    const element = (id, extra = {}) => {
        const value = {
            id,
            value: '10',
            width: id.includes('Canvas') ? 460 : undefined,
            height: id.includes('Canvas') ? 200 : undefined,
            style: {},
            classList: { add() {}, remove() {} },
            addEventListener() {},
            getBoundingClientRect() {
                return { left: 0, top: 0, width: this.width, height: this.height };
            },
            getContext() { return context; },
            ...extra
        };
        elements.set(id, value);
        return value;
    };
    const canvas = element('bacteriaCanvas', { width: 900, height: 560 });
    element('brainVisCanvas', { width: 460, height: 290 });
    element('spikeRasterCanvas', { width: 460, height: 170 });
    element('statsGraph', { width: 460, height: 160 });
    [
        'selectedBacteriaStats', 'selectionStatus', 'brainNodeDetails',
        'mutationRateValue', 'foodSpawnRateValue', 'energyCostValue',
        'agentSelect', 'brainNeuronSelect'
    ].forEach(id => element(id));
    element('mutationRate', { value: '10' });
    element('foodSpawnRate', { value: '10' });
    element('energyCost', { value: '20' });
    element('simulationSpeed', { value: '1' });
    globalThis.document = {
        getElementById: id => elements.get(id),
        createElement: () => ({ click() {} })
    };

    const sim = new BacteriaSim(canvas, element('bacteriaStats'));
    sim.initialize(10);
    sim.selectBest();
    sim.step();
    assert.ok(sim.world.selectedBacteria);
    assert.ok(sim.brainLayout.size > 0);
    assert.match(elements.get('selectedBacteriaStats').innerHTML, /Sensor encoding/);

    sim.handleClick({ clientX: 899, clientY: 559 });
    assert.ok(sim.world.selectedBacteria, 'clicking anywhere should select the nearest agent');
    const brainNode = sim.brainLayout.values().next().value;
    sim.handleBrainClick({ clientX: brainNode.x, clientY: brainNode.y });
    assert.equal(sim.selectedNeuronId, brainNode.neuron.id);
    assert.match(elements.get('brainNodeDetails').innerHTML, /Selected/);
} finally {
    Math.random = originalRandom;
    delete globalThis.document;
}

console.log('Simulation integration tests passed.');
