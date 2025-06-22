import { Neuron } from './neuron.js';
import { NEURON_RADIUS, INPUT_SPIKE_STRENGTH, INPUT_NODE_RADIUS, INPUT_NODE_SPIKE_STRENGTH } from './config.js';
import { clearCanvas, drawNeurons, drawConnections, drawSpike, updateInputNodeControls as uiUpdateInputControls } from './ui.js';

let neurons = [];
let nextNeuronId = 0;
let isRunning = false;
let animationFrameId;
let lastTime = 0;
let ctx, canvas;
let activeSpikes = []; // { sourceId, targetId, progress }

export function initSimulation(canvasContext, canvasElement) {
    ctx = canvasContext;
    canvas = canvasElement;
    refreshInputNodeControls(); // Initial call
}

export function addNeuron(type = 'regular') {
    const radius = type === 'input' ? INPUT_NODE_RADIUS : NEURON_RADIUS;
    const x = (type === 'input' ? INPUT_NODE_RADIUS + 5 + (getInputNodes().length * (INPUT_NODE_RADIUS * 2 + 10)) : Math.random() * (canvas.width - radius * 2) + radius);
    const y = (type === 'input' ? INPUT_NODE_RADIUS + 10 : Math.random() * (canvas.height - radius * 2) + radius);
    
    const newNeuron = new Neuron(x, y, nextNeuronId++, type);
    neurons.push(newNeuron);

    if (type === 'regular' && neurons.length > 1) {
        // Try to connect new regular neurons to the last added neuron (input or regular)
        const lastNeuron = neurons[neurons.length - 2];
        if (lastNeuron) {
             // If last neuron was input, new regular neuron connects FROM it.
            // If last neuron was regular, new regular neuron connects TO it.
            if (lastNeuron.type === 'input') {
                lastNeuron.addConnection(newNeuron.id);
            } else {
                 // Let's try connecting to a random existing neuron for more variety
                const connectTo = neurons.filter(n => n.id !== newNeuron.id && n.type === 'regular');
                if (connectTo.length > 0) {
                    const randomTarget = connectTo[Math.floor(Math.random() * connectTo.length)];
                    randomTarget.addConnection(newNeuron.id); // Default: new neuron receives
                } else if (lastNeuron.id !== newNeuron.id) {
                     lastNeuron.addConnection(newNeuron.id); // Fallback to last neuron
                }
            }
        }
    } else if (type === 'input') {
        refreshInputNodeControls();
    }


    redrawSimulation();
    return newNeuron;
}

export function addInputNode() {
    const inputNode = addNeuron('input');
    // Optionally, automatically connect new input nodes to some existing regular neurons
    const regularNeurons = neurons.filter(n => n.type === 'regular');
    if (regularNeurons.length > 0) {
        // Connect to the first regular neuron for simplicity, or a random one
        inputNode.addConnection(regularNeurons[0].id);
    }
    refreshInputNodeControls(); // Update UI
    return inputNode;
}

export function toggleInputNodeActiveState(nodeId, isActive) {
    const node = neurons.find(n => n.id === nodeId && n.type === 'input');
    if (node) {
        node.isActive = isActive;
        console.log(`Input node ${nodeId} active state: ${isActive}`);
        redrawSimulation(); // Redraw to show visual change if any
    }
}

function getInputNodes() {
    return neurons.filter(n => n.type === 'input');
}

function refreshInputNodeControls() {
    uiUpdateInputControls(getInputNodes(), toggleInputNodeActiveState);
}

export function getNeurons() {
    return neurons;
}

export function toggleSimulation() {
    isRunning = !isRunning;
    if (isRunning) {
        lastTime = performance.now();
        animationFrameId = requestAnimationFrame(simulationLoop);
    } else {
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
    }
    return isRunning;
}

export function resetSimulation() {
    neurons = [];
    nextNeuronId = 0;
    isRunning = false;
    activeSpikes = [];
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    clearCanvas(ctx, canvas);
    refreshInputNodeControls(); // Clear input node controls in UI
    console.log("Simulation reset.");
}

function simulationLoop(timestamp) {
    if (!isRunning) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    clearCanvas(ctx, canvas);
    drawConnections(neurons, ctx); // Draw connections first

    const newlyFiringNeurons = [];

    neurons.forEach(neuron => {
        if (neuron.update(deltaTime)) { 
            newlyFiringNeurons.push(neuron);
        }
    });

    // Propagate spikes
    newlyFiringNeurons.forEach(firingNeuron => {
        const spikeStrength = firingNeuron.type === 'input' ? INPUT_NODE_SPIKE_STRENGTH : INPUT_SPIKE_STRENGTH;
        firingNeuron.connections.forEach(targetId => {
            const targetNeuron = neurons.find(n => n.id === targetId);
            if (targetNeuron && targetNeuron.type === 'regular') { // Ensure target is regular for integration
                if(targetNeuron.integrate(spikeStrength)) {
                    activeSpikes.push({ source: firingNeuron, target: targetNeuron, life: 10 }); 
                }
            }
        });
    });
    
    // Update and draw active spikes
    activeSpikes = activeSpikes.filter(spike => {
        drawSpike(spike.source, spike.target, ctx);
        spike.life--;
        return spike.life > 0;
    });

    drawNeurons(neurons, ctx); // Draw neurons on top

    animationFrameId = requestAnimationFrame(simulationLoop);
}

export function redrawSimulation() {
    clearCanvas(ctx, canvas);
    drawConnections(neurons, ctx);
    drawNeurons(neurons, ctx);
}

// Allow manual spike for testing
export function manualSpike(neuronId, strength = INPUT_SPIKE_STRENGTH) {
    const neuron = neurons.find(n => n.id === neuronId);
    if (neuron && neuron.type === 'regular') { // Only manually spike regular neurons this way
        neuron.integrate(strength);
        console.log(`Manually spiked Neuron ${neuronId}`);
        redrawSimulation(); 
    } else if (neuron && neuron.type === 'input') {
        console.log(`Cannot manually spike input neuron ${neuronId} this way. Toggle its active state.`);
    }
}
