const canvas = document.getElementById('snnCanvas');
const ctx = canvas.getContext('2d');

const addNeuronBtn = document.getElementById('addNeuronBtn');
const startPauseBtn = document.getElementById('startPauseBtn');
const resetBtn = document.getElementById('resetBtn');

let neurons = [];
let isRunning = false;
let animationFrameId;

const NEURON_RADIUS = 10;
const SPIKE_THRESHOLD = 1.0;
const LEAK_RATE = 0.01;
const REFRACTORY_PERIOD = 50; // ms, approx 3 frames at 60fps

class Neuron {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.potential = 0; // Membrane potential
        this.isFiring = false;
        this.refractoryTime = 0; // Time remaining in refractory period
        this.connections = []; // Array of target neuron indices
    }

    integrate(inputSpikeStrength = 0.2) {
        if (this.refractoryTime > 0) return;
        this.potential += inputSpikeStrength;
    }

    update(deltaTime) {
        if (this.refractoryTime > 0) {
            this.refractoryTime -= deltaTime;
            if (this.refractoryTime <= 0) {
                this.isFiring = false;
                this.potential = 0; // Reset potential after refractory period
            }
            return;
        }

        // Leaky integrate
        this.potential -= LEAK_RATE * this.potential * (deltaTime / 16); // Normalize leak to ~60fps
        if (this.potential < 0) this.potential = 0;

        if (this.potential >= SPIKE_THRESHOLD) {
            this.fire();
        }
    }

    fire() {
        this.isFiring = true;
        this.potential = 0; // Reset potential after firing (or set to a specific reset potential)
        this.refractoryTime = REFRACTORY_PERIOD;
        console.log(`Neuron at (${this.x}, ${this.y}) fired!`);
        // In a full simulation, propagate spike to connected neurons here
    }

    draw() {
        ctx.beginPath();
        ctx.arc(this.x, this.y, NEURON_RADIUS, 0, Math.PI * 2);
        ctx.fillStyle = this.isFiring ? 'red' : (this.refractoryTime > 0 ? 'orange' : `rgb(0, ${Math.min(255, this.potential * 200)}, 255)`);
        ctx.fill();
        ctx.strokeStyle = 'black';
        ctx.stroke();
        ctx.closePath();

        // Draw potential meter (optional)
        ctx.fillStyle = 'black';
        ctx.font = '10px Arial';
        ctx.fillText(this.potential.toFixed(2), this.x + NEURON_RADIUS + 2, this.y + NEURON_RADIUS / 2);
    }
}

function addNeuron() {
    const x = Math.random() * (canvas.width - NEURON_RADIUS * 2) + NEURON_RADIUS;
    const y = Math.random() * (canvas.height - NEURON_RADIUS * 2) + NEURON_RADIUS;
    neurons.push(new Neuron(x, y));
    drawNeurons();
}

function drawNeurons() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    neurons.forEach(neuron => neuron.draw());
}

function resetSimulation() {
    neurons = [];
    isRunning = false;
    startPauseBtn.textContent = 'Start';
    if (animationFrameId) {
        cancelAnimationFrame(animationFrameId);
    }
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    console.log("Simulation reset.");
}

let lastTime = 0;
function simulationLoop(timestamp) {
    if (!isRunning) return;

    const deltaTime = timestamp - lastTime;
    lastTime = timestamp;

    ctx.clearRect(0, 0, canvas.width, canvas.height);
    neurons.forEach(neuron => {
        neuron.update(deltaTime);
        neuron.draw();
    });

    animationFrameId = requestAnimationFrame(simulationLoop);
}

addNeuronBtn.addEventListener('click', addNeuron);

startPauseBtn.addEventListener('click', () => {
    isRunning = !isRunning;
    if (isRunning) {
        startPauseBtn.textContent = 'Pause';
        lastTime = performance.now(); // Reset lastTime when starting/resuming
        animationFrameId = requestAnimationFrame(simulationLoop);
        console.log("Simulation started.");
    } else {
        startPauseBtn.textContent = 'Start';
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        console.log("Simulation paused.");
    }
});

resetBtn.addEventListener('click', resetSimulation);

// Initial draw
drawNeurons();
console.log("SNN Playground initialized.");
