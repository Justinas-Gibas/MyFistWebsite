import { Brain } from './brain.js';

// Static ID counter for unique bacteria IDs
let nextBacteriaId = 1;

export class Bacteria {
    constructor(x, y, genome = null) {
        this.id = `b${nextBacteriaId++}`; // Assign unique ID
        this.x = x;
        this.y = y;
        this.genome = genome || this.createGenome();
        this.radius = this.genome.size * 5;
        this.energy = 100;
        this.age = 0;
        this.fitness = 0;
        this.color = `rgba(${this.genome.color.r},${this.genome.color.g},${this.genome.color.b},0.8)`;
        this.species = this.color; // Color as species key
        
        // Initialize brain with genome parameters
        const brainConfig = {
            numInputs: 7,  // distance to food, wall sensors, energy level, toxic, temp, other bacteria
            numOutputs: 2, // movement (angle, speed)
            ...this.genome.brain
        };
        this.brain = new Brain(this.id, null, {
            x: this.x - 50,
            y: this.y - 50,
            width: 100,
            height: 100
        });
        this.brain.initializeNeurons(brainConfig.numInputs, 3); // 3 regular neurons initially
    }

    createGenome() {
        return {
            size: 0.8 + Math.random() * 0.4,
            speed: 0.8 + Math.random() * 0.4,
            efficiency: 0.8 + Math.random() * 0.4,
            color: {
                r: Math.floor(Math.random() * 255),
                g: Math.floor(Math.random() * 255),
                b: Math.floor(Math.random() * 255)
            },
            brain: {
                numNeurons: 3 + Math.floor(Math.random() * 3),
                connectionDensity: 0.3 + Math.random() * 0.4
            }
        };
    }    update(world) {
        try {
            console.log(`[Bacteria.update] id: ${this.id}, pos: (${this.x.toFixed(2)},${this.y.toFixed(2)}), energy: ${this.energy.toFixed(2)}, age: ${this.age}`);
            // Get sensor inputs
            const inputs = this.getSensorInputs(world);
            console.log(`[Bacteria.update] id: ${this.id} sensor inputs:`, inputs);

            // Update brain with inputs
            this.brain.neurons.forEach(n => n.update(16)); // deltaTime = 16ms

            // Get movement commands from brain outputs
            const outputs = this.getBrainOutputs();
            const [angle, speed] = outputs;
            console.log(`[Bacteria.update] id: ${this.id} outputs: angle=${angle}, speed=${speed}`);

            // Move based on brain outputs
            this.x += Math.cos(angle * Math.PI * 2) * speed * this.genome.speed * 3;
            this.y += Math.sin(angle * Math.PI * 2) * speed * this.genome.speed * 3;

            // Environmental effects
            let toxicPenalty = 0;
            for (const zone of world.toxicZones) {
                const dx = this.x - zone.x;
                const dy = this.y - zone.y;
                if (Math.sqrt(dx * dx + dy * dy) < zone.r) toxicPenalty += 0.5;
            }
            let tempPenalty = 0;
            for (const zone of world.tempZones) {
                const dx = this.x - zone.x;
                const dy = this.y - zone.y;
                if (Math.sqrt(dx * dx + dy * dy) < zone.r) {
                    tempPenalty += Math.abs(zone.temp - world.optimalTemp) * 0.02;
                }
            }
            this.energy -= toxicPenalty + tempPenalty;

            // Update state
            this.age++;
            this.energy -= 0.1 * (1 / this.genome.efficiency);

            // Find and consume nearby food
            this.consumeNearbyFood(world);

            // Potentially reproduce
            if (this.energy > 150) {
                this.reproduce(world);
            }

            // Clamp to world bounds
            this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y));

            // Update fitness
            this.fitness = this.age + (this.energy * 0.1);
        } catch (err) {
            console.error(`[Bacteria.update] ERROR id: ${this.id || 'n/a'}:`, err);
            throw err;
        }
    }

    draw(ctx, world) {
        // Draw body
        ctx.save();
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, 2 * Math.PI);
        ctx.fillStyle = this.color;
        ctx.fill();
        ctx.strokeStyle = 'rgba(0,0,0,0.3)';
        ctx.stroke();
        // Draw energy indicator
        const energyRatio = this.energy / 100;
        const barWidth = this.radius * 2;
        const barHeight = 3;
        ctx.fillStyle = `rgb(${255 * (1-energyRatio)},${255 * energyRatio},0)`;
        ctx.fillRect(this.x - barWidth/2, this.y - this.radius - barHeight - 2, 
                    barWidth * (this.energy/100), barHeight);
        // Highlight if selected
        if (world && world.selectedBacteria === this) {
            ctx.lineWidth = 3;
            ctx.strokeStyle = '#FFD700';
            ctx.beginPath();
            ctx.arc(this.x, this.y, this.radius + 3, 0, 2 * Math.PI);
            ctx.stroke();
        }
        ctx.restore();
        
        // Draw brain if selected
        if (world && world.selectedBacteria === this) {
            this.brain.draw(ctx);
        }
    }

    getSensorInputs(world) {
        try {
            // Normalized sensor inputs for the brain
            if (typeof this.getNearestFoodDistance !== 'function') {
                console.error('[Bacteria.getSensorInputs] getNearestFoodDistance is not a function!', this);
            }
            if (typeof this.getNearestBacteriaDistance !== 'function') {
                console.error('[Bacteria.getSensorInputs] getNearestBacteriaDistance is not a function!', this);
            }
            const inputs = [
                this.energy / 100, // Current energy level
                this.x / world.width, // X position
                this.y / world.height, // Y position
                (typeof this.getNearestFoodDistance === 'function' ? this.getNearestFoodDistance(world) : 1) / Math.sqrt(world.width * world.height), // Distance to nearest food
                (typeof this.getNearestBacteriaDistance === 'function' ? this.getNearestBacteriaDistance(world) : 1) / Math.sqrt(world.width * world.height) // Distance to nearest bacteria
            ];
            // Add environmental sensors
            const inToxic = world.toxicZones.some(z => Math.hypot(this.x - z.x, this.y - z.y) < z.r) ? 1 : 0;
            let tempDelta = 0;
            for (const zone of world.tempZones) {
                if (Math.hypot(this.x - zone.x, this.y - zone.y) < zone.r) {
                    tempDelta = (zone.temp - world.optimalTemp) / 50;
                }
            }            // Sense nearby bacteria (social sensor) - refactor to use the new method
            const nearestOtherDist = this.getNearestBacteriaDistance(world) / Math.sqrt(world.width * world.height);
            const result = [
                this.energy / 100,
                this.x / world.width,
                this.y / world.height,
                (typeof this.getNearestFoodDistance === 'function' ? this.getNearestFoodDistance(world) : 1) / Math.sqrt(world.width * world.height),
                nearestOtherDist,
                inToxic,
                tempDelta
            ];
            console.log(`[Bacteria.getSensorInputs] id: ${this.id || 'n/a'} result:`, result);
            return result;
        } catch (err) {
            console.error(`[Bacteria.getSensorInputs] ERROR id: ${this.id || 'n/a'}:`, err);
            throw err;
        }
    }

    getBrainOutputs() {
        // Get active neurons and convert to movement commands
        const activeNeurons = this.brain.neurons.filter(n => n.isActive);
        const angle = activeNeurons.length > 0 ? 
            activeNeurons.reduce((sum, n) => sum + Math.atan2(n.y, n.x), 0) / activeNeurons.length / (Math.PI * 2) :
            Math.random();
        const speed = activeNeurons.length / this.brain.neurons.length;
        return [angle, speed];
    }

    consumeNearbyFood(world) {
        const food = world.findNearbyFood(this.x, this.y, this.radius * 2);
        if (food) {
            this.energy += food.energy;
            world.removeFood(food);
        }
    }

    reproduce(world) {
        const childGenome = this.mutateGenome();
        const angle = Math.random() * Math.PI * 2;
        const distance = this.radius * 3;
        const childX = this.x + Math.cos(angle) * distance;
        const childY = this.y + Math.sin(angle) * distance;
        
        if (childX > 0 && childX < world.width && childY > 0 && childY < world.height) {
            world.addBacteria(new Bacteria(childX, childY, childGenome));
            this.energy *= 0.6; // Energy cost of reproduction
        }
    }

    mutateGenome() {
        const mutationRate = 0.1;
        const mutatedGenome = JSON.parse(JSON.stringify(this.genome));
        
        // Mutate numeric properties
        for (const key of ['size', 'speed', 'efficiency']) {
            if (Math.random() < mutationRate) {
                mutatedGenome[key] *= 0.8 + Math.random() * 0.4;
            }
        }
        
        // Mutate color slightly
        for (const component of ['r', 'g', 'b']) {
            if (Math.random() < mutationRate) {
                mutatedGenome.color[component] = Math.max(0, Math.min(255,
                    mutatedGenome.color[component] + Math.floor(Math.random() * 40 - 20)
                ));
            }
        }
        
        // Mutate brain parameters
        if (Math.random() < mutationRate) {
            mutatedGenome.brain.numNeurons = Math.max(3,
                mutatedGenome.brain.numNeurons + Math.floor(Math.random() * 3 - 1)
            );
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.brain.connectionDensity = Math.max(0.1, Math.min(0.9,
                mutatedGenome.brain.connectionDensity + (Math.random() * 0.2 - 0.1)
            ));
        }
        
        return mutatedGenome;
    }

    getNearestFoodDistance(world) {
        if (!world.food || world.food.length === 0) return Math.sqrt(world.width * world.height);
        let minDist = Infinity;
        for (const food of world.food) {
            const dx = this.x - food.x;
            const dy = this.y - food.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    }

    getNearestBacteriaDistance(world) {
        const otherBacteria = world.bacteria.filter(b => b !== this);
        if (!otherBacteria || otherBacteria.length === 0) return Math.sqrt(world.width * world.height);
        
        let minDist = Infinity;
        for (const bacteria of otherBacteria) {
            const dx = this.x - bacteria.x;
            const dy = this.y - bacteria.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist < minDist) minDist = dist;
        }
        return minDist;
    }
}
