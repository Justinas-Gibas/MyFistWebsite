// Bacteria simulation controller (Phase 1 stub)
import { Bacteria } from './bacteria.js';
import { BacteriaWorld } from './bacteriaWorld.js';

export class BacteriaSim {
    constructor(canvas, statsDiv) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.statsDiv = statsDiv;
        this.world = null;
        this.running = false;
        this.rafId = null;

        // Evolution metrics tracking
        this.metrics = {
            generations: [],
            avgFitness: [],
            maxFitness: [],
            population: []
        };

        // Get additional UI elements
        this.brainVisCanvas = document.getElementById('brainVisCanvas');
        this.brainVisCtx = this.brainVisCanvas.getContext('2d');
        this.statsGraph = document.getElementById('statsGraph');
        this.statsGraphCtx = this.statsGraph.getContext('2d');
        this.selectedBacteriaStats = document.getElementById('selectedBacteriaStats');

        // Evolution controls
        this.mutationRateSlider = document.getElementById('mutationRate');
        this.foodSpawnRateSlider = document.getElementById('foodSpawnRate');
        this.energyCostSlider = document.getElementById('energyCost');

        // Add UI event listeners
        this.canvas.addEventListener('click', (e) => this.handleClick(e));
        this.setupControlListeners();
    }

    initialize(numBacteria) {
        this.world = new BacteriaWorld(this.canvas.width, this.canvas.height, numBacteria);
        this.world.initializeBacteria(Bacteria);
        this.running = false;
        this.updateStats();
        this.draw();
    }

    start() {
        if (!this.running) {
            console.log('[BacteriaSim] Simulation started');
            this.running = true;
            this.loop();
        }
    }

    stop() {
        this.running = false;
        if (this.rafId) cancelAnimationFrame(this.rafId);
        console.log('[BacteriaSim] Simulation stopped');
    }

    reset(numBacteria) {
        this.initialize(numBacteria);
    }

    setupControlListeners() {
        // Update mutation rate
        this.mutationRateSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('mutationRateValue').textContent = `${value}%`;
            if (this.world) {
                this.world.mutationRate = value / 100;
            }
        });

        // Update food spawn rate
        this.foodSpawnRateSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('foodSpawnRateValue').textContent = `${value}%`;
            if (this.world) {
                this.world.foodSpawnRate = value / 1000;
            }
        });

        // Update energy cost
        this.energyCostSlider.addEventListener('input', (e) => {
            const value = e.target.value;
            document.getElementById('energyCostValue').textContent = `${value}%`;
            if (this.world) {
                this.world.energyCost = value / 100;
            }
        });
    }

    updateMetrics() {
        if (!this.world || this.world.bacteria.length === 0) return;

        const generation = this.world.generation;
        const avgFitness = this.world.bacteria.reduce((sum, b) => sum + b.fitness, 0) / this.world.bacteria.length;
        const maxFitness = Math.max(...this.world.bacteria.map(b => b.fitness));
        const population = this.world.bacteria.length;

        this.metrics.generations.push(generation);
        this.metrics.avgFitness.push(avgFitness);
        this.metrics.maxFitness.push(maxFitness);
        this.metrics.population.push(population);

        // Keep only last 50 data points
        if (this.metrics.generations.length > 50) {
            this.metrics.generations.shift();
            this.metrics.avgFitness.shift();
            this.metrics.maxFitness.shift();
            this.metrics.population.shift();
        }

        this.drawStatsGraph();
    }

    drawStatsGraph() {
        const ctx = this.statsGraphCtx;
        const canvas = this.statsGraph;
        const width = canvas.width;
        const height = canvas.height;
        const padding = 20;

        // Clear canvas
        ctx.clearRect(0, 0, width, height);

        if (this.metrics.generations.length < 2) return;

        // Find max values
        const maxFit = Math.max(...this.metrics.maxFitness);
        const maxPop = Math.max(...this.metrics.population);

        // Draw fitness line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,255,0,0.8)';
        this.metrics.maxFitness.forEach((fit, i) => {
            const x = padding + (width - 2 * padding) * (i / (this.metrics.maxFitness.length - 1));
            const y = height - padding - (height - 2 * padding) * (fit / maxFit);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();

        // Draw population line
        ctx.beginPath();
        ctx.strokeStyle = 'rgba(0,0,255,0.8)';
        this.metrics.population.forEach((pop, i) => {
            const x = padding + (width - 2 * padding) * (i / (this.metrics.population.length - 1));
            const y = height - padding - (height - 2 * padding) * (pop / maxPop);
            if (i === 0) ctx.moveTo(x, y);
            else ctx.lineTo(x, y);
        });
        ctx.stroke();
    }

    updateSelectedBacteriaDisplay() {
        const selected = this.world.selectedBacteria;
        if (!selected) {
            this.selectedBacteriaStats.innerHTML = '<i>No bacteria selected</i>';
            this.brainVisCtx.clearRect(0, 0, this.brainVisCanvas.width, this.brainVisCanvas.height);
            return;
        }

        // Update stats
        this.selectedBacteriaStats.innerHTML = `
            Energy: ${selected.energy.toFixed(1)}<br>
            Age: ${selected.age}<br>
            Fitness: ${selected.fitness.toFixed(1)}<br>
            Size: ${selected.genome.size.toFixed(2)}<br>
            Speed: ${selected.genome.speed.toFixed(2)}<br>
            Efficiency: ${selected.genome.efficiency.toFixed(2)}<br>
            Neurons: ${selected.brain.neurons.length}
        `;

        // Draw brain visualization
        this.drawBrainVisualization(selected);
    }

    drawBrainVisualization(bacteria) {
        const ctx = this.brainVisCtx;
        const canvas = this.brainVisCanvas;
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        // Draw neurons
        bacteria.brain.neurons.forEach(neuron => {
            ctx.beginPath();
            const x = (neuron.x / bacteria.brain.canvasRegion.width) * canvas.width;
            const y = (neuron.y / bacteria.brain.canvasRegion.height) * canvas.height;
            ctx.arc(x, y, neuron.type === 'input' ? 4 : 6, 0, Math.PI * 2);
            ctx.fillStyle = neuron.isActive ? 'rgba(255,255,0,0.8)' : 'rgba(100,100,100,0.5)';
            ctx.fill();
        });

        // Draw connections
        ctx.strokeStyle = 'rgba(100,100,100,0.3)';
        bacteria.brain.neurons.forEach(neuron => {
            neuron.connections.forEach(targetId => {
                const target = bacteria.brain.neurons.find(n => n.id === targetId);
                if (target) {
                    ctx.beginPath();
                    const x1 = (neuron.x / bacteria.brain.canvasRegion.width) * canvas.width;
                    const y1 = (neuron.y / bacteria.brain.canvasRegion.height) * canvas.height;
                    const x2 = (target.x / bacteria.brain.canvasRegion.width) * canvas.width;
                    const y2 = (target.y / bacteria.brain.canvasRegion.height) * canvas.height;
                    ctx.moveTo(x1, y1);
                    ctx.lineTo(x2, y2);
                    ctx.stroke();
                }
            });
        });
    }

    loop() {
        if (!this.running) return;
        console.log(`[BacteriaSim.loop] Frame, generation: ${this.world ? this.world.generation : 'n/a'}`);
        this.world.update();
        this.draw();
        this.updateStats();
        this.updateSelectedBacteriaDisplay();
        this.updateMetrics();
        this.rafId = requestAnimationFrame(() => this.loop());
    }

    draw() {
        this.world.draw(this.ctx);
    }    updateStats() {
        if (!this.world) return;

        // Calculate statistics
        const alive = this.world.bacteria.filter(b => b.energy > 0).length;
        const avgEnergy = this.world.bacteria.reduce((sum, b) => sum + b.energy, 0) / this.world.bacteria.length;
        const avgFitness = this.world.bacteria.reduce((sum, b) => sum + b.fitness, 0) / this.world.bacteria.length;
        const bestFitness = Math.max(...this.world.bacteria.map(b => b.fitness));

        // Update stats display
        this.statsDiv.innerHTML = `
            Generation: ${this.world.generation}<br>
            Alive: ${alive} / ${this.world.bacteria.length}<br>
            Food: ${this.world.food.length} / ${this.world.maxFood}<br>
            Avg Energy: ${avgEnergy.toFixed(1)}<br>
            Avg Fitness: ${avgFitness.toFixed(1)}<br>
            Best Fitness: ${bestFitness.toFixed(1)}
        `;
    }

    handleClick(event) {
        const rect = this.canvas.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        // Find clicked bacteria
        this.world.selectedBacteria = this.world.bacteria.find(b => {
            const dx = b.x - x;
            const dy = b.y - y;
            return Math.sqrt(dx * dx + dy * dy) < b.radius;
        });
    }
}
