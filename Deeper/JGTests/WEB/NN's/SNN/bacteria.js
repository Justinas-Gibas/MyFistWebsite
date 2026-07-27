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
        this.heading = Math.random() * Math.PI * 2;
        this.distanceTraveled = 0;
        this.foodEaten = 0;
        this.offspring = 0;
        this.parentId = null;
        this.trail = [{ x, y }];
        this.lastTrailSampleAge = 0;
        this.lastSensorValues = new Array(7).fill(0);
        this.lastMotorCommand = { turn: 0, speed: 0 };
        this.color = `rgba(${this.genome.color.r},${this.genome.color.g},${this.genome.color.b},0.8)`;
        this.species = this.color; // Color as species key
        
        // Initialize brain with genome parameters
        const brainConfig = {
            numInputs: 7,  // distance to food, wall sensors, energy level, toxic, temp, other bacteria
            numOutputs: 2, // movement (angle, speed)
            ...this.genome.brain
        };
        this.brain = new Brain(this.id, null, {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        });

        // Brain creates playground defaults in its constructor; bacteria need a
        // purpose-built sensor -> hidden -> motor network instead.
        this.brain.neurons = [];
        this.brain.nextNeuronId = 0;
        this.brain.activeSpikes = [];

        const inputs = Array.from(
            { length: brainConfig.numInputs },
            () => this.brain.addNeuron('input')
        );
        const hidden = Array.from(
            { length: brainConfig.numNeurons },
            () => this.brain.addNeuron('regular')
        );
        this.outputNeurons = Array.from(
            { length: brainConfig.numOutputs },
            () => this.brain.addNeuron('regular')
        );

        // Always provide a path from every sensor to the motor layer. The genome's
        // density controls additional paths instead of risking a disconnected brain.
        inputs.forEach((input, index) => {
            const hiddenTarget = hidden[index % hidden.length];
            input.addConnection(hiddenTarget.id);
            if (Math.random() < brainConfig.connectionDensity) {
                input.addConnection(this.outputNeurons[index % this.outputNeurons.length].id);
            }
        });
        hidden.forEach((neuron, index) => {
            neuron.addConnection(this.outputNeurons[index % this.outputNeurons.length].id);
            hidden.forEach(target => {
                if (target !== neuron && Math.random() < brainConfig.connectionDensity) {
                    neuron.addConnection(target.id);
                }
            });
        });
        this.brain.start();
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
    }

    update(world, deltaTime = 16.67) {
        try {
            const sensorValues = this.getSensorInputs(world);
            this.lastSensorValues = sensorValues;

            // Encode continuous sensor values as spike rates. Higher values cause
            // input neurons to be active on more simulation steps.
            this.brain.getInputNodes().forEach((neuron, index) => {
                const value = Math.max(0, Math.min(1, sensorValues[index] ?? 0));
                neuron.isActive = Math.random() < value;
            });
            this.brain.update(deltaTime);

            // Get movement commands from brain outputs
            const [turn, speed] = this.getBrainOutputs();
            this.lastMotorCommand = { turn, speed };

            // Move based on brain outputs
            const frameScale = Math.min(deltaTime, 50) / 16.67;
            const previousX = this.x;
            const previousY = this.y;
            this.heading += turn * 0.25 * frameScale;
            this.x += Math.cos(this.heading) * speed * this.genome.speed * 3 * frameScale;
            this.y += Math.sin(this.heading) * speed * this.genome.speed * 3 * frameScale;
            this.distanceTraveled += Math.hypot(this.x - previousX, this.y - previousY);
            if (this.age - this.lastTrailSampleAge >= 4) {
                this.trail.push({ x: this.x, y: this.y });
                this.lastTrailSampleAge = this.age;
                if (this.trail.length > 80) this.trail.shift();
            }

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
            this.age += frameScale;
            this.energy -= world.energyCost * frameScale * (1 / this.genome.efficiency);

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
        
        // The brain is rendered in the dedicated inspector canvas.
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
            // Add environmental sensors
            const inToxic = world.toxicZones.some(z => Math.hypot(this.x - z.x, this.y - z.y) < z.r) ? 1 : 0;
            let tempDelta = 0;
            for (const zone of world.tempZones) {
                if (Math.hypot(this.x - zone.x, this.y - zone.y) < zone.r) {
                    tempDelta = (zone.temp - world.optimalTemp) / 50;
                }
            }
            const worldDiagonal = Math.hypot(world.width, world.height);
            const foodProximity = 1 - Math.min(
                1,
                this.getNearestFoodDistance(world) / worldDiagonal
            );
            const bacteriaProximity = 1 - Math.min(
                1,
                this.getNearestBacteriaDistance(world) / worldDiagonal
            );
            const result = [
                this.energy / 100,
                this.x / world.width,
                this.y / world.height,
                foodProximity,
                bacteriaProximity,
                inToxic,
                Math.max(0, Math.min(1, 0.5 + tempDelta))
            ];
            return result;
        } catch (err) {
            console.error(`[Bacteria.getSensorInputs] ERROR id: ${this.id || 'n/a'}:`, err);
            throw err;
        }
    }

    getBrainOutputs() {
        const activity = neuron => neuron.isFiring
            ? 1
            : Math.max(0, Math.min(1, neuron.potential));
        const left = activity(this.outputNeurons[0]);
        const right = activity(this.outputNeurons[1]);
        const turn = right - left;
        // A small basal speed keeps agents exploring while motor spikes accelerate them.
        const speed = 0.15 + 0.85 * Math.max(left, right);
        return [turn, speed];
    }

    consumeNearbyFood(world) {
        const food = world.findNearbyFood(this.x, this.y, this.radius * 2);
        if (food) {
            this.energy += food.energy;
            this.foodEaten++;
            world.removeFood(food);
        }
    }

    reproduce(world) {
        const childGenome = this.mutateGenome(world.mutationRate);
        const angle = Math.random() * Math.PI * 2;
        const distance = this.radius * 3;
        const childX = this.x + Math.cos(angle) * distance;
        const childY = this.y + Math.sin(angle) * distance;
        
        if (childX > 0 && childX < world.width && childY > 0 && childY < world.height) {
            const child = new Bacteria(childX, childY, childGenome);
            child.parentId = this.id;
            world.addBacteria(child);
            this.offspring++;
            this.energy *= 0.6; // Energy cost of reproduction
        }
    }

    mutateGenome(mutationRate = 0.1) {
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
        if (!world.food || world.food.length === 0) return Math.hypot(world.width, world.height);
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
        if (!otherBacteria || otherBacteria.length === 0) return Math.hypot(world.width, world.height);
        
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
