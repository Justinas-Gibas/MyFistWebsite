import { Bacteria } from './bacteria.js';
import { BacteriaWorld } from './bacteriaWorld.js';

const SENSOR_NAMES = ['Energy', 'X position', 'Y position', 'Food near', 'Agent near', 'Toxic', 'Temperature'];
const MOTOR_NAMES = ['Turn left', 'Turn right'];
const COLORS = {
    background: '#081419',
    grid: '#1d333b',
    text: '#8da5aa',
    sensor: '#55d9d2',
    hidden: '#ffbe55',
    motor: '#b8ea65',
    spike: '#ffffff'
};

export class BacteriaSim {
    constructor(canvas, statsDiv) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.statsDiv = statsDiv;
        this.world = null;
        this.running = false;
        this.rafId = null;
        this.lastTime = 0;
        this.simulationSpeed = 1;
        this.metricAccumulator = 0;
        this.selectedNeuronId = null;
        this.brainLayout = new Map();
        this.spikeHistory = [];
        this.lastSpikeCounts = new Map();

        this.metrics = {
            time: [],
            avgFitness: [],
            maxFitness: [],
            population: [],
            diversity: []
        };

        this.brainVisCanvas = document.getElementById('brainVisCanvas');
        this.brainVisCtx = this.brainVisCanvas.getContext('2d');
        this.spikeRasterCanvas = document.getElementById('spikeRasterCanvas');
        this.spikeRasterCtx = this.spikeRasterCanvas.getContext('2d');
        this.statsGraph = document.getElementById('statsGraph');
        this.statsGraphCtx = this.statsGraph.getContext('2d');
        this.selectedBacteriaStats = document.getElementById('selectedBacteriaStats');
        this.selectionStatus = document.getElementById('selectionStatus');
        this.brainNodeDetails = document.getElementById('brainNodeDetails');

        this.mutationRateSlider = document.getElementById('mutationRate');
        this.foodSpawnRateSlider = document.getElementById('foodSpawnRate');
        this.energyCostSlider = document.getElementById('energyCost');
        this.speedSelect = document.getElementById('simulationSpeed');

        this.canvas.addEventListener('click', event => this.handleClick(event));
        this.canvas.addEventListener('mousemove', event => this.handlePointerMove(event));
        this.canvas.addEventListener('mouseleave', () => {
            if (this.world) this.world.hoveredBacteria = null;
            if (!this.running) this.draw();
        });
        this.brainVisCanvas.addEventListener('click', event => this.handleBrainClick(event));
        this.setupControlListeners();
        this.clearInvestigationCanvases(true);
    }

    initialize(numBacteria) {
        this.stop();
        this.world = new BacteriaWorld(this.canvas.width, this.canvas.height, numBacteria);
        this.world.initializeBacteria(Bacteria);
        this.applyExperimentControls();
        this.resetInstrumentation();
        this.updateFrame();
    }

    start() {
        if (!this.world || this.running) return;
        this.running = true;
        this.lastTime = performance.now();
        this.rafId = requestAnimationFrame(timestamp => this.loop(timestamp));
    }

    stop() {
        this.running = false;
        if (this.rafId !== null) cancelAnimationFrame(this.rafId);
        this.rafId = null;
    }

    reset(numBacteria) {
        this.initialize(numBacteria);
    }

    step() {
        if (!this.world || this.running) return;
        this.world.update(16.67 * this.simulationSpeed);
        this.captureSpikeSample();
        this.updateMetrics();
        this.updateFrame();
    }

    setupControlListeners() {
        this.mutationRateSlider.addEventListener('input', event => {
            document.getElementById('mutationRateValue').textContent = `${event.target.value}%`;
            if (this.world) this.world.mutationRate = Number(event.target.value) / 100;
        });
        this.foodSpawnRateSlider.addEventListener('input', event => {
            document.getElementById('foodSpawnRateValue').textContent = `${event.target.value}%`;
            if (this.world) this.world.foodSpawnRate = Number(event.target.value) / 1000;
        });
        this.energyCostSlider.addEventListener('input', event => {
            document.getElementById('energyCostValue').textContent = `${event.target.value}%`;
            if (this.world) this.world.energyCost = Number(event.target.value) / 100;
        });
        this.speedSelect.addEventListener('change', event => {
            this.simulationSpeed = Number(event.target.value);
        });
    }

    applyExperimentControls() {
        this.world.mutationRate = Number(this.mutationRateSlider.value) / 100;
        this.world.foodSpawnRate = Number(this.foodSpawnRateSlider.value) / 1000;
        this.world.energyCost = Number(this.energyCostSlider.value) / 100;
        this.simulationSpeed = Number(this.speedSelect.value);
    }

    resetInstrumentation() {
        Object.keys(this.metrics).forEach(key => {
            this.metrics[key] = [];
        });
        this.metricAccumulator = 0;
        this.spikeHistory = [];
        this.lastSpikeCounts.clear();
        this.selectedNeuronId = null;
        this.updateMetrics(true);
    }

    loop(timestamp) {
        if (!this.running || !this.world) return;
        const realDelta = Math.min(timestamp - this.lastTime, 50);
        this.lastTime = timestamp;
        const simulationDelta = realDelta * this.simulationSpeed;
        this.world.update(simulationDelta);
        this.metricAccumulator += simulationDelta;
        this.captureSpikeSample();
        if (this.metricAccumulator >= 250) {
            this.metricAccumulator = 0;
            this.updateMetrics();
        }
        this.updateFrame();
        this.rafId = requestAnimationFrame(nextTimestamp => this.loop(nextTimestamp));
    }

    updateFrame(forceMetrics = false) {
        this.draw();
        this.updateStats();
        this.updateSelectedBacteriaDisplay();
        if (forceMetrics) this.updateMetrics(true);
    }

    draw() {
        if (this.world) this.world.draw(this.ctx);
    }

    updateMetrics(force = false) {
        if (!this.world || this.world.bacteria.length === 0) return;
        if (!force && this.metrics.time.length > 240) {
            Object.keys(this.metrics).forEach(key => this.metrics[key].shift());
        }

        const population = this.world.bacteria.length;
        const fitness = this.world.bacteria.map(bacteria => bacteria.fitness);
        const signatures = new Set(this.world.bacteria.map(bacteria => [
            bacteria.genome.brain.numNeurons,
            bacteria.genome.brain.connectionDensity.toFixed(1),
            bacteria.genome.size.toFixed(1),
            bacteria.genome.speed.toFixed(1),
            bacteria.genome.efficiency.toFixed(1)
        ].join(':')));

        this.metrics.time.push(this.world.elapsedTime / 1000);
        this.metrics.avgFitness.push(fitness.reduce((sum, value) => sum + value, 0) / population);
        this.metrics.maxFitness.push(Math.max(...fitness));
        this.metrics.population.push(population);
        this.metrics.diversity.push(signatures.size / population);
        this.drawStatsGraph();
    }

    drawStatsGraph() {
        const { ctx, canvas } = { ctx: this.statsGraphCtx, canvas: this.statsGraph };
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        if (this.metrics.time.length < 2) return;

        const padding = { left: 28, right: 10, top: 12, bottom: 20 };
        const plotWidth = canvas.width - padding.left - padding.right;
        const plotHeight = canvas.height - padding.top - padding.bottom;
        ctx.strokeStyle = COLORS.grid;
        ctx.lineWidth = 1;
        for (let row = 0; row <= 4; row++) {
            const y = padding.top + plotHeight * row / 4;
            ctx.beginPath();
            ctx.moveTo(padding.left, y);
            ctx.lineTo(canvas.width - padding.right, y);
            ctx.stroke();
        }

        const drawSeries = (values, color) => {
            const max = Math.max(...values, 0.0001);
            const min = Math.min(...values, 0);
            const span = Math.max(max - min, 0.0001);
            ctx.beginPath();
            values.forEach((value, index) => {
                const x = padding.left + plotWidth * index / Math.max(1, values.length - 1);
                const y = padding.top + plotHeight * (1 - (value - min) / span);
                if (index === 0) ctx.moveTo(x, y);
                else ctx.lineTo(x, y);
            });
            ctx.strokeStyle = color;
            ctx.lineWidth = 1.7;
            ctx.stroke();
        };

        drawSeries(this.metrics.maxFitness, COLORS.motor);
        drawSeries(this.metrics.population, COLORS.sensor);
        drawSeries(this.metrics.diversity, COLORS.hidden);
        ctx.fillStyle = COLORS.text;
        ctx.font = '10px ui-monospace, monospace';
        ctx.fillText(`G${this.world.generation}`, 5, canvas.height - 6);
    }

    updateStats() {
        if (!this.world) return;
        const population = this.world.bacteria.length;
        const avg = property => population
            ? this.world.bacteria.reduce((sum, bacteria) => sum + property(bacteria), 0) / population
            : 0;
        const bestFitness = population ? Math.max(...this.world.bacteria.map(b => b.fitness)) : 0;
        const diversity = this.metrics.diversity.at(-1) ?? 0;

        this.statsDiv.innerHTML = `
            ${this.metricMarkup('Generation', this.world.generation)}
            ${this.metricMarkup('Population', population)}
            ${this.metricMarkup('Food', `${this.world.food.length}/${this.world.maxFood}`)}
            ${this.metricMarkup('Mean energy', avg(b => b.energy).toFixed(1))}
            ${this.metricMarkup('Best fitness', bestFitness.toFixed(1))}
            ${this.metricMarkup('Diversity', `${(diversity * 100).toFixed(0)}%`)}
        `;
    }

    metricMarkup(label, value) {
        return `<div class="metric"><span class="metric-label">${label}</span><strong class="metric-value">${value}</strong></div>`;
    }

    updateSelectedBacteriaDisplay() {
        const selected = this.world?.selectedBacteria;
        if (!selected) {
            this.selectionStatus.textContent = 'No selection';
            this.selectedBacteriaStats.innerHTML = '<div class="empty-state">Select an organism in the ecology viewport.</div>';
            this.clearInvestigationCanvases();
            return;
        }

        this.selectionStatus.textContent = `${selected.id} · live`;
        const sensors = selected.lastSensorValues.map((value, index) =>
            this.signalMarkup(SENSOR_NAMES[index], value, 'sensor')
        ).join('');
        const [left, right] = selected.outputNeurons.map(neuron =>
            neuron.isFiring ? 1 : Math.max(0, Math.min(1, neuron.potential))
        );
        const motors = [
            this.signalMarkup(MOTOR_NAMES[0], left, 'motor'),
            this.signalMarkup(MOTOR_NAMES[1], right, 'motor'),
            this.signalMarkup('Speed', selected.lastMotorCommand.speed, 'motor')
        ].join('');

        this.selectedBacteriaStats.innerHTML = `
            <div class="agent-title">
                <span class="agent-id">${selected.id}</span>
                <span class="agent-swatch" style="background:${selected.color}"></span>
            </div>
            <div class="stat-grid">
                ${this.statMarkup('Fitness', selected.fitness.toFixed(1))}
                ${this.statMarkup('Energy', selected.energy.toFixed(1))}
                ${this.statMarkup('Age', selected.age.toFixed(0))}
                ${this.statMarkup('Distance', selected.distanceTraveled.toFixed(0))}
                ${this.statMarkup('Food', selected.foodEaten)}
                ${this.statMarkup('Offspring', selected.offspring)}
                ${this.statMarkup('Hidden', selected.genome.brain.numNeurons)}
                ${this.statMarkup('Density', selected.genome.brain.connectionDensity.toFixed(2))}
                ${this.statMarkup('Parent', selected.parentId ?? 'founder')}
            </div>
            <div class="io-grid">
                <div><h4>Sensor encoding</h4>${sensors}</div>
                <div><h4>Motor decoding</h4>${motors}</div>
            </div>
        `;

        this.drawBrainVisualization(selected);
        this.drawSpikeRaster(selected);
    }

    statMarkup(label, value) {
        return `<div class="stat-cell"><span>${label}</span><strong>${value}</strong></div>`;
    }

    signalMarkup(label, rawValue, kind) {
        const value = Math.max(0, Math.min(1, Number(rawValue) || 0));
        const color = kind === 'motor' ? COLORS.motor : COLORS.sensor;
        return `
            <div class="signal">
                <span>${label}</span>
                <span class="signal-track"><span class="signal-fill" style="width:${value * 100}%;background:${color}"></span></span>
                <output>${value.toFixed(2)}</output>
            </div>
        `;
    }

    getBrainLayers(bacteria) {
        const inputs = bacteria.brain.getInputNodes();
        const outputIds = new Set(bacteria.outputNeurons.map(neuron => neuron.id));
        const hidden = bacteria.brain.getRegularNeurons().filter(neuron => !outputIds.has(neuron.id));
        return { inputs, hidden, outputs: bacteria.outputNeurons };
    }

    getLayerPositions(neurons, x, height) {
        const top = 36;
        const bottom = height - 24;
        return neurons.map((neuron, index) => ({
            neuron,
            x,
            y: neurons.length === 1 ? height / 2 : top + (bottom - top) * index / (neurons.length - 1)
        }));
    }

    drawBrainVisualization(bacteria) {
        const ctx = this.brainVisCtx;
        const canvas = this.brainVisCanvas;
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const layers = this.getBrainLayers(bacteria);
        const positioned = [
            ...this.getLayerPositions(layers.inputs, 92, canvas.height),
            ...this.getLayerPositions(layers.hidden, canvas.width / 2, canvas.height),
            ...this.getLayerPositions(layers.outputs, canvas.width - 72, canvas.height)
        ];
        this.brainLayout = new Map(positioned.map(item => [item.neuron.id, item]));

        ctx.font = '10px ui-monospace, monospace';
        ctx.fillStyle = COLORS.text;
        ctx.fillText('SENSORS', 12, 16);
        ctx.fillText('HIDDEN', canvas.width / 2 - 22, 16);
        ctx.fillText('MOTOR', canvas.width - 98, 16);

        bacteria.brain.neurons.forEach(source => {
            const from = this.brainLayout.get(source.id);
            if (!from) return;
            source.connections.forEach(targetId => {
                const to = this.brainLayout.get(targetId);
                if (!to) return;
                ctx.beginPath();
                ctx.moveTo(from.x, from.y);
                ctx.lineTo(to.x, to.y);
                ctx.strokeStyle = source.isFiring ? 'rgba(255,255,255,.75)' : 'rgba(92,132,142,.25)';
                ctx.lineWidth = source.isFiring ? 1.8 : 1;
                ctx.stroke();
            });
        });

        positioned.forEach(({ neuron, x, y }) => {
            const isOutput = layers.outputs.includes(neuron);
            const color = neuron.type === 'input' ? COLORS.sensor : isOutput ? COLORS.motor : COLORS.hidden;
            const activity = neuron.isFiring ? 1 : Math.max(0, Math.min(1, neuron.potential));
            if (neuron.isFiring) {
                ctx.beginPath();
                ctx.arc(x, y, 12, 0, Math.PI * 2);
                ctx.fillStyle = 'rgba(255,255,255,.16)';
                ctx.fill();
            }
            ctx.beginPath();
            ctx.arc(x, y, 7, 0, Math.PI * 2);
            ctx.fillStyle = color;
            ctx.globalAlpha = 0.35 + activity * 0.65;
            ctx.fill();
            ctx.globalAlpha = 1;
            ctx.strokeStyle = neuron.id === this.selectedNeuronId ? '#ffffff' : color;
            ctx.lineWidth = neuron.id === this.selectedNeuronId ? 2.5 : 1;
            ctx.stroke();

            ctx.fillStyle = COLORS.text;
            ctx.font = '9px ui-monospace, monospace';
            if (neuron.type === 'input') {
                ctx.textAlign = 'right';
                ctx.fillText(SENSOR_NAMES[layers.inputs.indexOf(neuron)] ?? neuron.id, x - 11, y + 3);
            } else {
                ctx.textAlign = 'left';
                const label = isOutput ? (MOTOR_NAMES[layers.outputs.indexOf(neuron)] ?? neuron.id) : `H${layers.hidden.indexOf(neuron)}`;
                ctx.fillText(label, x + 11, y + 3);
            }
        });
        ctx.textAlign = 'left';
        ctx.lineWidth = 1;
        this.updateBrainNodeDetails(bacteria);
    }

    updateBrainNodeDetails(bacteria) {
        const neuron = bacteria?.brain.neurons.find(candidate => candidate.id === this.selectedNeuronId);
        if (!neuron) {
            this.brainNodeDetails.textContent = 'Select a neuron in the network to inspect its state.';
            return;
        }
        this.brainNodeDetails.textContent = [
            neuron.id,
            `type=${neuron.type}`,
            `potential=${neuron.potential.toFixed(3)}`,
            `refractory=${Math.max(0, neuron.refractoryTime).toFixed(1)}ms`,
            `spikes=${neuron.spikeCount}`,
            `out=${neuron.connections.length}`,
            `last=${neuron.lastSpikeTime === null ? 'never' : `${neuron.lastSpikeTime.toFixed(0)}ms`}`
        ].join(' · ');
    }

    captureSpikeSample() {
        const selected = this.world?.selectedBacteria;
        if (!selected) return;
        const spikes = {};
        selected.brain.neurons.forEach(neuron => {
            const previous = this.lastSpikeCounts.get(neuron.id) ?? neuron.spikeCount;
            spikes[neuron.id] = neuron.spikeCount > previous;
            this.lastSpikeCounts.set(neuron.id, neuron.spikeCount);
        });
        this.spikeHistory.push(spikes);
        if (this.spikeHistory.length > 120) this.spikeHistory.shift();
    }

    drawSpikeRaster(bacteria) {
        const ctx = this.spikeRasterCtx;
        const canvas = this.spikeRasterCanvas;
        ctx.fillStyle = COLORS.background;
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        const neurons = bacteria.brain.neurons;
        const labelWidth = 48;
        const top = 12;
        const rowHeight = Math.min(14, (canvas.height - top - 8) / Math.max(1, neurons.length));
        const sampleWidth = (canvas.width - labelWidth - 8) / 120;
        const outputIds = new Set(bacteria.outputNeurons.map(neuron => neuron.id));

        neurons.forEach((neuron, row) => {
            const y = top + row * rowHeight;
            const color = neuron.type === 'input' ? COLORS.sensor : outputIds.has(neuron.id) ? COLORS.motor : COLORS.hidden;
            ctx.fillStyle = color;
            ctx.font = '8px ui-monospace, monospace';
            ctx.fillText(neuron.id.split('-').at(-1), 6, y + rowHeight * .7);
            ctx.strokeStyle = COLORS.grid;
            ctx.beginPath();
            ctx.moveTo(labelWidth, y + rowHeight);
            ctx.lineTo(canvas.width - 6, y + rowHeight);
            ctx.stroke();
            this.spikeHistory.forEach((sample, index) => {
                if (!sample[neuron.id]) return;
                const x = labelWidth + (120 - this.spikeHistory.length + index) * sampleWidth;
                ctx.fillStyle = color;
                ctx.fillRect(x, y + 1, Math.max(1, sampleWidth), Math.max(2, rowHeight - 2));
            });
        });
    }

    clearInvestigationCanvases(includeStats = false) {
        const canvases = [
            [this.brainVisCtx, this.brainVisCanvas],
            [this.spikeRasterCtx, this.spikeRasterCanvas]
        ];
        if (includeStats) canvases.push([this.statsGraphCtx, this.statsGraph]);
        canvases.forEach(([ctx, canvas]) => {
            ctx.fillStyle = COLORS.background;
            ctx.fillRect(0, 0, canvas.width, canvas.height);
        });
        this.brainNodeDetails.textContent = 'Select a neuron in the network to inspect its state.';
    }

    canvasPoint(event, canvas) {
        const rect = canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * canvas.width / rect.width,
            y: (event.clientY - rect.top) * canvas.height / rect.height
        };
    }

    findNearestBacteria(point, tolerance = 10) {
        if (!this.world) return null;
        let nearest = null;
        let nearestDistance = Infinity;
        this.world.bacteria.forEach(bacteria => {
            const distance = Math.hypot(bacteria.x - point.x, bacteria.y - point.y);
            if (distance <= bacteria.radius + tolerance && distance < nearestDistance) {
                nearest = bacteria;
                nearestDistance = distance;
            }
        });
        return nearest;
    }

    handleClick(event) {
        if (!this.world) return;
        this.setSelectedBacteria(this.findNearestBacteria(this.canvasPoint(event, this.canvas), 12));
    }

    handlePointerMove(event) {
        if (!this.world) return;
        this.world.hoveredBacteria = this.findNearestBacteria(this.canvasPoint(event, this.canvas), 8);
        this.canvas.style.cursor = this.world.hoveredBacteria ? 'pointer' : 'crosshair';
        if (!this.running) this.draw();
    }

    handleBrainClick(event) {
        const selected = this.world?.selectedBacteria;
        if (!selected) return;
        const point = this.canvasPoint(event, this.brainVisCanvas);
        let nearest = null;
        let distance = 14;
        this.brainLayout.forEach(item => {
            const candidateDistance = Math.hypot(item.x - point.x, item.y - point.y);
            if (candidateDistance < distance) {
                nearest = item.neuron;
                distance = candidateDistance;
            }
        });
        this.selectedNeuronId = nearest?.id ?? null;
        this.drawBrainVisualization(selected);
    }

    setSelectedBacteria(bacteria) {
        if (!this.world) return;
        if (this.world.selectedBacteria !== bacteria) {
            this.spikeHistory = [];
            this.lastSpikeCounts.clear();
            this.selectedNeuronId = null;
        }
        this.world.selectedBacteria = bacteria;
        if (bacteria) {
            bacteria.brain.neurons.forEach(neuron => this.lastSpikeCounts.set(neuron.id, neuron.spikeCount));
        }
        this.updateSelectedBacteriaDisplay();
        if (!this.running) this.draw();
    }

    selectBest() {
        if (!this.world?.bacteria.length) return;
        this.setSelectedBacteria(this.world.bacteria.reduce((best, bacteria) =>
            bacteria.fitness > best.fitness ? bacteria : best
        ));
    }

    selectAdjacent(direction) {
        if (!this.world?.bacteria.length) return;
        const currentIndex = this.world.bacteria.indexOf(this.world.selectedBacteria);
        const start = currentIndex < 0 ? 0 : currentIndex;
        const index = (start + direction + this.world.bacteria.length) % this.world.bacteria.length;
        this.setSelectedBacteria(this.world.bacteria[index]);
    }

    exportSnapshot() {
        if (!this.world) return;
        const snapshot = {
            schema: 'snn-evolab-experiment@1',
            exportedAt: new Date().toISOString(),
            generation: this.world.generation,
            elapsedTime: this.world.elapsedTime,
            environment: {
                width: this.world.width,
                height: this.world.height,
                mutationRate: this.world.mutationRate,
                foodSpawnRate: this.world.foodSpawnRate,
                energyCost: this.world.energyCost,
                optimalTemp: this.world.optimalTemp
            },
            metrics: this.metrics,
            population: this.world.bacteria.map(bacteria => ({
                id: bacteria.id,
                parentId: bacteria.parentId,
                position: { x: bacteria.x, y: bacteria.y },
                energy: bacteria.energy,
                age: bacteria.age,
                fitness: bacteria.fitness,
                distanceTraveled: bacteria.distanceTraveled,
                foodEaten: bacteria.foodEaten,
                offspring: bacteria.offspring,
                genome: bacteria.genome,
                neurons: bacteria.brain.neurons.map(neuron => ({
                    id: neuron.id,
                    type: neuron.type,
                    potential: neuron.potential,
                    spikeCount: neuron.spikeCount,
                    connections: [...neuron.connections]
                })),
                outputNeuronIds: bacteria.outputNeurons.map(neuron => neuron.id)
            }))
        };
        const blob = new Blob([JSON.stringify(snapshot, null, 2)], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = `snn-evolab-generation-${this.world.generation}.json`;
        link.click();
        URL.revokeObjectURL(url);
    }
}
