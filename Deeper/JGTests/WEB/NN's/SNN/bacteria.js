import { Brain } from './brain.js';

export const SENSOR_DEFINITIONS = [
    { id: 'energy', label: 'Energy reserve', family: 'internal' },
    { id: 'foodLeft', label: 'Food · left', family: 'food' },
    { id: 'foodFront', label: 'Food · front', family: 'food' },
    { id: 'foodRight', label: 'Food · right', family: 'food' },
    { id: 'wallLeft', label: 'Wall · left', family: 'wall' },
    { id: 'wallFront', label: 'Wall · front', family: 'wall' },
    { id: 'wallRight', label: 'Wall · right', family: 'wall' },
    { id: 'dangerLeft', label: 'Hazard · left', family: 'danger' },
    { id: 'dangerFront', label: 'Hazard · front', family: 'danger' },
    { id: 'dangerRight', label: 'Hazard · right', family: 'danger' },
    { id: 'socialLeft', label: 'Agent · left', family: 'social' },
    { id: 'socialFront', label: 'Agent · front', family: 'social' },
    { id: 'socialRight', label: 'Agent · right', family: 'social' },
    { id: 'heat', label: 'Heat', family: 'temperature' },
    { id: 'cold', label: 'Cold', family: 'temperature' }
];

// Static ID counter for unique bacteria IDs
let nextBacteriaId = 1;

export class Bacteria {
    constructor(x, y, genome = null) {
        this.id = `b${nextBacteriaId++}`; // Assign unique ID
        this.x = x;
        this.y = y;
        this.genome = genome || this.createGenome();
        this.genome.sensors ??= {
            range: 0.45,
            directionalSharpness: 3,
            noise: 0.02
        };
        const legacyHiddenCount = this.genome.brain.numNeurons;
        this.genome.brain.hiddenLayers = (
            this.genome.brain.hiddenLayers ?? [legacyHiddenCount ?? 4]
        ).slice(0, 3).map(size => Math.max(2, Math.min(12, Math.round(size))));
        delete this.genome.brain.numNeurons;
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
        this.lastSensorValues = new Array(SENSOR_DEFINITIONS.length).fill(0);
        this.lastMotorCommand = { turn: 0, speed: 0 };
        this.color = `rgba(${this.genome.color.r},${this.genome.color.g},${this.genome.color.b},0.8)`;
        this.species = this.color; // Color as species key
        
        // Initialize brain with genome parameters
        const brainConfig = {
            numInputs: SENSOR_DEFINITIONS.length,
            numOutputs: 2, // movement (angle, speed)
            ...this.genome.brain
        };
        this.brain = new Brain(this.id, {
            x: 0,
            y: 0,
            width: 100,
            height: 100
        });

        const inputs = Array.from(
            { length: brainConfig.numInputs },
            () => this.brain.addNeuron('input')
        );
        this.hiddenLayers = brainConfig.hiddenLayers.map(layerSize =>
            Array.from({ length: layerSize }, () => this.brain.addNeuron('regular'))
        );
        this.outputNeurons = Array.from(
            { length: brainConfig.numOutputs },
            () => this.brain.addNeuron('regular')
        );

        // Always provide a path from every sensor to the motor layer. The genome's
        // density controls additional paths instead of risking a disconnected brain.
        const connectLayers = (sourceLayer, targetLayer) => {
            sourceLayer.forEach((neuron, index) => {
                neuron.addConnection(targetLayer[index % targetLayer.length].id);
                targetLayer.forEach(target => {
                    if (Math.random() < brainConfig.connectionDensity) {
                        neuron.addConnection(target.id);
                    }
                });
            });
        };

        connectLayers(inputs, this.hiddenLayers[0]);
        this.hiddenLayers.forEach((layer, layerIndex) => {
            const nextLayer = this.hiddenLayers[layerIndex + 1] ?? this.outputNeurons;
            connectLayers(layer, nextLayer);
            layer.forEach(neuron => {
                layer.forEach(target => {
                    if (target !== neuron && Math.random() < brainConfig.connectionDensity) {
                        neuron.addConnection(target.id);
                    }
                });
            });
        });
        this.brain.start();
    }

    createGenome() {
        const hiddenLayers = [4 + Math.floor(Math.random() * 3)];
        if (Math.random() < 0.3) hiddenLayers.push(2 + Math.floor(Math.random() * 4));
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
                hiddenLayers,
                connectionDensity: 0.3 + Math.random() * 0.4
            },
            sensors: {
                range: 0.35 + Math.random() * 0.25,
                directionalSharpness: 2 + Math.random() * 2,
                noise: Math.random() * 0.04
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
            const neuralCost = this.brain.neurons.length * 0.002;
            const sensoryCost = this.genome.sensors.range * 0.03;
            this.energy -= (world.energyCost + neuralCost + sensoryCost) *
                frameScale * (1 / this.genome.efficiency);

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
        const sensorRange = Math.hypot(world.width, world.height) * this.genome.sensors.range;
        const nearestFood = this.findNearestTarget(world.food);
        const nearestAgent = this.findNearestTarget(world.bacteria.filter(agent => agent !== this));
        const nearestHazard = this.findNearestHazard(world.toxicZones);

        const foodSignals = this.directionalSignals(nearestFood, sensorRange);
        const wallSignals = [-Math.PI / 3, 0, Math.PI / 3].map(offset => {
            const distance = this.rayDistanceToWall(world, this.heading + offset);
            return 1 - Math.min(1, distance / sensorRange);
        });
        const dangerSignals = this.directionalSignals(nearestHazard, sensorRange);
        const socialSignals = this.directionalSignals(nearestAgent, sensorRange);

        let temperatureDelta = 0;
        for (const zone of world.tempZones) {
            if (Math.hypot(this.x - zone.x, this.y - zone.y) < zone.r) {
                temperatureDelta = (zone.temp - world.optimalTemp) / 25;
            }
        }

        const raw = [
            Math.max(0, Math.min(1, this.energy / 100)),
            ...foodSignals,
            ...wallSignals,
            ...dangerSignals,
            ...socialSignals,
            Math.max(0, Math.min(1, temperatureDelta)),
            Math.max(0, Math.min(1, -temperatureDelta))
        ];
        const noise = this.genome.sensors.noise;
        return raw.map(value => Math.max(0, Math.min(1, value + (Math.random() * 2 - 1) * noise)));
    }

    findNearestTarget(targets) {
        let nearest = null;
        let nearestDistance = Infinity;
        targets.forEach(target => {
            const distance = Math.hypot(target.x - this.x, target.y - this.y);
            if (distance < nearestDistance) {
                nearest = target;
                nearestDistance = distance;
            }
        });
        return nearest ? { x: nearest.x, y: nearest.y, distance: nearestDistance } : null;
    }

    findNearestHazard(zones) {
        let nearest = null;
        let nearestDistance = Infinity;
        zones.forEach(zone => {
            const centerDistance = Math.hypot(zone.x - this.x, zone.y - this.y);
            const edgeDistance = Math.max(0, centerDistance - zone.r);
            if (edgeDistance < nearestDistance) {
                nearest = { x: zone.x, y: zone.y, distance: edgeDistance };
                nearestDistance = edgeDistance;
            }
        });
        return nearest;
    }

    directionalSignals(target, sensorRange) {
        if (!target || target.distance > sensorRange) return [0, 0, 0];
        const bearing = this.normalizeAngle(Math.atan2(target.y - this.y, target.x - this.x) - this.heading);
        const proximity = 1 - target.distance / sensorRange;
        const sharpness = this.genome.sensors.directionalSharpness;
        return [-Math.PI / 3, 0, Math.PI / 3].map(direction =>
            proximity * Math.max(0, Math.cos(this.normalizeAngle(bearing - direction))) ** sharpness
        );
    }

    rayDistanceToWall(world, angle) {
        const dx = Math.cos(angle);
        const dy = Math.sin(angle);
        const distances = [];
        if (dx > 0) distances.push(Math.max(0, (world.width - this.radius - this.x) / dx));
        if (dx < 0) distances.push(Math.max(0, (this.radius - this.x) / dx));
        if (dy > 0) distances.push(Math.max(0, (world.height - this.radius - this.y) / dy));
        if (dy < 0) distances.push(Math.max(0, (this.radius - this.y) / dy));
        return Math.min(...distances);
    }

    normalizeAngle(angle) {
        return Math.atan2(Math.sin(angle), Math.cos(angle));
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
            const layerIndex = Math.floor(Math.random() * mutatedGenome.brain.hiddenLayers.length);
            mutatedGenome.brain.hiddenLayers[layerIndex] = Math.max(2, Math.min(12,
                mutatedGenome.brain.hiddenLayers[layerIndex] + (Math.random() < 0.5 ? -1 : 1)
            ));
        }
        if (Math.random() < mutationRate * 0.25) {
            if (mutatedGenome.brain.hiddenLayers.length < 3 && Math.random() < 0.6) {
                const insertAt = Math.floor(Math.random() * (mutatedGenome.brain.hiddenLayers.length + 1));
                mutatedGenome.brain.hiddenLayers.splice(insertAt, 0, 2 + Math.floor(Math.random() * 4));
            } else if (mutatedGenome.brain.hiddenLayers.length > 1) {
                mutatedGenome.brain.hiddenLayers.splice(
                    Math.floor(Math.random() * mutatedGenome.brain.hiddenLayers.length),
                    1
                );
            }
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.brain.connectionDensity = Math.max(0.1, Math.min(0.9,
                mutatedGenome.brain.connectionDensity + (Math.random() * 0.2 - 0.1)
            ));
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.sensors.range = Math.max(0.15, Math.min(0.9,
                mutatedGenome.sensors.range + (Math.random() * 0.12 - 0.06)
            ));
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.sensors.directionalSharpness = Math.max(1, Math.min(8,
                mutatedGenome.sensors.directionalSharpness + (Math.random() * 0.8 - 0.4)
            ));
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.sensors.noise = Math.max(0, Math.min(0.2,
                mutatedGenome.sensors.noise + (Math.random() * 0.03 - 0.015)
            ));
        }
        
        return mutatedGenome;
    }

}
