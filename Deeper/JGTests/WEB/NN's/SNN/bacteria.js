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
const SENSOR_BY_ID = new Map(SENSOR_DEFINITIONS.map(sensor => [sensor.id, sensor]));
const STARTER_SENSORS = ['energy', 'foodLeft', 'foodFront', 'foodRight', 'wallFront'];

// Static ID counter for unique bacteria IDs
let nextBacteriaId = 1;
let nextFamilyId = 1;

function hueToRgb(hue) {
    const h = ((hue % 360) + 360) % 360;
    const c = 0.72;
    const x = c * (1 - Math.abs((h / 60) % 2 - 1));
    const m = 0.18;
    const sectors = [
        [c, x, 0], [x, c, 0], [0, c, x],
        [0, x, c], [x, 0, c], [c, 0, x]
    ];
    const [r, g, b] = sectors[Math.floor(h / 60) % 6];
    return {
        r: Math.round((r + m) * 255),
        g: Math.round((g + m) * 255),
        b: Math.round((b + m) * 255)
    };
}

function rgbToHue({ r, g, b }) {
    const [red, green, blue] = [r, g, b].map(value => value / 255);
    const max = Math.max(red, green, blue);
    const min = Math.min(red, green, blue);
    const delta = max - min;
    if (delta === 0) return 0;
    if (max === red) return 60 * (((green - blue) / delta) % 6);
    if (max === green) return 60 * ((blue - red) / delta + 2);
    return 60 * ((red - green) / delta + 4);
}

export class Bacteria {
    constructor(x, y, genome = null) {
        this.id = `b${nextBacteriaId++}`; // Assign unique ID
        this.x = x;
        this.y = y;
        this.genome = genome || this.createGenome();
        this.genome.familyId ??= `f${nextFamilyId++}`;
        this.genome.familyHue ??= rgbToHue(this.genome.color);
        this.genome.color = hueToRgb(this.genome.familyHue);
        this.genome.sensors ??= {
            range: 0.45,
            directionalSharpness: 3,
            noise: 0.02
        };
        this.genome.sensors.enabled ??= SENSOR_DEFINITIONS.map(sensor => sensor.id);
        this.genome.sensors.enabled = [...new Set(this.genome.sensors.enabled)]
            .filter(id => SENSOR_BY_ID.has(id));
        if (this.genome.sensors.enabled.length < 2) {
            this.genome.sensors.enabled = [...STARTER_SENSORS];
        }
        this.genome.lifeHistory ??= {
            maturityAge: 180,
            lifespan: 2200,
            reproductionEnergy: 95,
            mateCooldown: 240
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
        this.energyHarvested = 0;
        this.offspring = 0;
        this.parentIds = [];
        this.birthEpoch = 1;
        this.lineageDepth = 0;
        this.origin = 'founder';
        this.deathCause = null;
        this.matingType = Math.random() < 0.5 ? 'α' : 'β';
        this.reproductiveCooldown = 0;
        this.sensorDefinitions = this.genome.sensors.enabled.map(id => SENSOR_BY_ID.get(id));
        this.trail = [{ x, y }];
        this.lastTrailSampleAge = 0;
        this.lastSensorValues = new Array(this.sensorDefinitions.length).fill(0);
        this.lastMotorCommand = { turn: 0, speed: 0 };
        this.lastEnergyCosts = {};
        this.cumulativeEnergyCosts = {};
        this.color = `rgba(${this.genome.color.r},${this.genome.color.g},${this.genome.color.b},0.9)`;
        this.species = this.genome.familyId;
        
        // Initialize brain with genome parameters
        const brainConfig = {
            numInputs: this.sensorDefinitions.length,
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

        const inheritedConnections = Array.isArray(brainConfig.connections)
            ? brainConfig.connections
            : null;
        if (inheritedConnections) {
            inheritedConnections.forEach(([sourceIndex, targetIndex]) => {
                const source = this.brain.neurons[sourceIndex];
                const target = this.brain.neurons[targetIndex];
                if (source && target && target.type === 'regular') {
                    source.addConnection(target.id);
                }
            });
        } else {
            // Founders get a minimally connected graph plus optional extra edges.
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
        }
        this.genome.brain.connections = this.serializeBrainConnections();
        this.brain.start();
    }

    serializeBrainConnections() {
        const indexById = new Map(this.brain.neurons.map((neuron, index) => [neuron.id, index]));
        return this.brain.neurons.flatMap((source, sourceIndex) =>
            source.connections
                .map(targetId => [sourceIndex, indexById.get(targetId)])
                .filter(([, targetIndex]) => Number.isInteger(targetIndex))
        );
    }

    createGenome() {
        const hiddenLayers = [4 + Math.floor(Math.random() * 3)];
        if (Math.random() < 0.3) hiddenLayers.push(2 + Math.floor(Math.random() * 4));
        const enabled = SENSOR_DEFINITIONS
            .filter(sensor => sensor.id === 'energy' || Math.random() < 0.4)
            .map(sensor => sensor.id);
        STARTER_SENSORS.forEach(id => {
            if (enabled.length < 4 && !enabled.includes(id)) enabled.push(id);
        });
        return {
            size: 0.8 + Math.random() * 0.4,
            speed: 0.8 + Math.random() * 0.4,
            efficiency: 0.8 + Math.random() * 0.4,
            familyId: `f${nextFamilyId++}`,
            familyHue: Math.random() * 360,
            color: { r: 255, g: 255, b: 255 },
            brain: {
                hiddenLayers,
                connectionDensity: 0.05 + Math.random() * 0.2
            },
            sensors: {
                range: 0.35 + Math.random() * 0.25,
                directionalSharpness: 2 + Math.random() * 2,
                noise: Math.random() * 0.04,
                enabled
            },
            lifeHistory: {
                maturityAge: 140 + Math.random() * 100,
                lifespan: 1700 + Math.random() * 1000,
                reproductionEnergy: 90 + Math.random() * 20,
                mateCooldown: 180 + Math.random() * 140
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
            // Update state
            this.age += frameScale;
            this.reproductiveCooldown = Math.max(0, this.reproductiveCooldown - frameScale);
            const history = this.genome.lifeHistory;
            const senescenceStart = history.lifespan * 0.7;
            const senescence = Math.max(0, Math.min(1,
                (this.age - senescenceStart) / (history.lifespan - senescenceStart)
            ));
            const connections = this.brain.neurons.reduce(
                (sum, neuron) => sum + neuron.connections.length, 0
            );
            const fanoutLoad = this.brain.neurons.reduce(
                (sum, neuron) => sum + neuron.connections.length ** 2, 0
            );
            const scale = frameScale * world.energyCost / this.genome.efficiency;
            this.lastEnergyCosts = {
                basal: 0.0025 * scale,
                body: 0.0025 * this.genome.size ** 3 * scale,
                speedCapacity: 0.001 * this.genome.speed ** 2 *
                    this.genome.size * scale,
                movement: 0.001 * speed ** 2 * this.genome.speed ** 2 *
                    this.genome.size ** 2 * scale,
                receptors: (
                    0.000125 * this.sensorDefinitions.length +
                    0.0009 * this.genome.sensors.range
                ) * scale,
                neurons: 0.00006 * this.brain.neurons.length * scale,
                synapses: (0.000025 * connections + 0.000002 * fanoutLoad) * scale,
                spikes: 0.0002 * this.brain.lastStepStats.spikes *
                    world.energyCost / this.genome.efficiency,
                transmissions: 0.00006 * this.brain.lastStepStats.transmissions *
                    world.energyCost / this.genome.efficiency,
                senescence: 0.004 * senescence ** 2 * scale,
                environment: (toxicPenalty + tempPenalty) * frameScale *
                    world.environmentSeverity
            };
            const totalCost = Object.values(this.lastEnergyCosts)
                .reduce((sum, cost) => sum + cost, 0);
            this.energy -= totalCost;
            Object.entries(this.lastEnergyCosts).forEach(([key, cost]) => {
                this.cumulativeEnergyCosts[key] = (this.cumulativeEnergyCosts[key] ?? 0) + cost;
            });
            if (this.age >= history.lifespan) {
                this.deathCause = 'lifespan';
                this.energy = 0;
            }

            // Lifespan death is terminal; nearby food cannot revive the organism.
            if (!this.deathCause) this.consumeNearbyFood(world);

            // Clamp to world bounds
            this.x = Math.max(this.radius, Math.min(world.width - this.radius, this.x));
            this.y = Math.max(this.radius, Math.min(world.height - this.radius, this.y));

            // Versioned outcome score used for elite ordering. Raw components are
            // archived alongside it so experiments need not rely on one scalar.
            this.fitness = this.calculateEliteScore();
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

        const values = new Map([
            ['energy', Math.max(0, Math.min(1, this.energy / 100))],
            ['foodLeft', foodSignals[0]], ['foodFront', foodSignals[1]], ['foodRight', foodSignals[2]],
            ['wallLeft', wallSignals[0]], ['wallFront', wallSignals[1]], ['wallRight', wallSignals[2]],
            ['dangerLeft', dangerSignals[0]], ['dangerFront', dangerSignals[1]], ['dangerRight', dangerSignals[2]],
            ['socialLeft', socialSignals[0]], ['socialFront', socialSignals[1]], ['socialRight', socialSignals[2]],
            ['heat', Math.max(0, Math.min(1, temperatureDelta))],
            ['cold', Math.max(0, Math.min(1, -temperatureDelta))]
        ]);
        const noise = this.genome.sensors.noise;
        return this.sensorDefinitions.map(sensor => Math.max(0, Math.min(1,
            (values.get(sensor.id) ?? 0) + (Math.random() * 2 - 1) * noise
        )));
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
        // Tiny basal drift prevents a silent founder from being permanently stuck;
        // almost all useful speed must come from motor-neuron activity.
        const speed = 0.03 + 0.97 * Math.max(left, right);
        return [turn, speed];
    }

    consumeNearbyFood(world) {
        const food = world.findNearbyFood(this.x, this.y, this.radius);
        if (food) {
            this.energy += food.energy;
            this.foodEaten++;
            this.energyHarvested += food.energy;
            world.removeFood(food);
        }
    }

    calculateEliteScore() {
        const survivalFraction = Math.min(1, this.age / this.genome.lifeHistory.lifespan);
        const neuralCost = (this.cumulativeEnergyCosts.neurons ?? 0) +
            (this.cumulativeEnergyCosts.synapses ?? 0) +
            (this.cumulativeEnergyCosts.spikes ?? 0) +
            (this.cumulativeEnergyCosts.transmissions ?? 0);
        return this.offspring * 150 +
            this.foodEaten * 30 +
            survivalFraction * 25 +
            Math.max(0, this.energy) * 0.1 -
            neuralCost * 0.1;
    }

    canMate() {
        const history = this.genome.lifeHistory;
        return this.age >= history.maturityAge &&
            this.age < history.lifespan &&
            this.reproductiveCooldown <= 0 &&
            this.energy >= history.reproductionEnergy;
    }

    reproduceWith(partner, world) {
        if (!this.canMate() || !partner.canMate() || this.matingType === partner.matingType) {
            return null;
        }
        const childGenome = this.crossoverGenome(partner, world.mutationRate);
        const angle = Math.random() * Math.PI * 2;
        const distance = Math.max(this.radius, partner.radius) * 2.5;
        const childX = (this.x + partner.x) / 2 + Math.cos(angle) * distance;
        const childY = (this.y + partner.y) / 2 + Math.sin(angle) * distance;
        
        if (childX > 0 && childX < world.width && childY > 0 && childY < world.height) {
            const child = new Bacteria(childX, childY, childGenome);
            child.parentIds = [this.id, partner.id];
            child.birthEpoch = world.generation;
            child.lineageDepth = Math.max(this.lineageDepth, partner.lineageDepth) + 1;
            child.origin = 'natural-offspring';
            child.energy = 64;
            world.addBacteria(child);
            this.offspring++;
            partner.offspring++;
            this.energy -= 32;
            partner.energy -= 32;
            this.reproductiveCooldown = this.genome.lifeHistory.mateCooldown;
            partner.reproductiveCooldown = partner.genome.lifeHistory.mateCooldown;
            return child;
        }
        return null;
    }

    crossoverGenome(partner, mutationRate) {
        const source = Math.random() < 0.5 ? this.genome : partner.genome;
        const crossed = JSON.parse(JSON.stringify(source));
        for (const key of ['size', 'speed', 'efficiency']) {
            crossed[key] = Math.random() < 0.5 ? this.genome[key] : partner.genome[key];
        }
        for (const key of ['brain', 'sensors', 'lifeHistory']) {
            crossed[key] = JSON.parse(JSON.stringify(
                Math.random() < 0.5 ? this.genome[key] : partner.genome[key]
            ));
        }
        return this.mutateGenome(mutationRate, crossed);
    }

    mutateGenome(mutationRate = 0.1, sourceGenome = this.genome) {
        const mutatedGenome = JSON.parse(JSON.stringify(sourceGenome));
        
        // Additive mutations avoid compounding body size and speed exponentially.
        if (Math.random() < mutationRate) {
            mutatedGenome.size += (Math.random() * 2 - 1) * 0.14;
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.speed += (Math.random() * 2 - 1) * 0.16;
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.efficiency *= 0.94 + Math.random() * 0.12;
        }

        // Most children retain a clearly recognizable family color. Rare lineage
        // splits make a large hue jump and receive a new family identifier.
        if (Math.random() < mutationRate * 0.15) {
            const direction = Math.random() < 0.5 ? -1 : 1;
            mutatedGenome.familyHue += direction * (45 + Math.random() * 75);
            mutatedGenome.familyId = `f${nextFamilyId++}`;
        } else if (Math.random() < mutationRate) {
            mutatedGenome.familyHue += Math.random() * 12 - 6;
        }
        mutatedGenome.color = hueToRgb(mutatedGenome.familyHue);
        
        // Mutate brain parameters. Structural changes rebuild the edge blueprint;
        // otherwise evolution adds or removes individual inherited synapses.
        let topologyChanged = false;
        if (Math.random() < mutationRate) {
            const layerIndex = Math.floor(Math.random() * mutatedGenome.brain.hiddenLayers.length);
            mutatedGenome.brain.hiddenLayers[layerIndex] = Math.max(2, Math.min(12,
                mutatedGenome.brain.hiddenLayers[layerIndex] + (Math.random() < 0.5 ? -1 : 1)
            ));
            topologyChanged = true;
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
            topologyChanged = true;
        }
        if (Math.random() < mutationRate) {
            mutatedGenome.brain.connectionDensity = Math.max(0, Math.min(0.65,
                mutatedGenome.brain.connectionDensity + (Math.random() * 0.12 - 0.06)
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
        if (Math.random() < mutationRate) {
            const enabled = mutatedGenome.sensors.enabled;
            const missing = SENSOR_DEFINITIONS.map(sensor => sensor.id)
                .filter(id => !enabled.includes(id));
            if (enabled.length > 2 && (missing.length === 0 || Math.random() < 0.5)) {
                enabled.splice(Math.floor(Math.random() * enabled.length), 1);
            } else if (missing.length) {
                enabled.push(missing[Math.floor(Math.random() * missing.length)]);
            }
            topologyChanged = true;
        }
        for (const key of ['maturityAge', 'lifespan', 'reproductionEnergy', 'mateCooldown']) {
            if (Math.random() < mutationRate) {
                mutatedGenome.lifeHistory[key] *= 0.9 + Math.random() * 0.2;
            }
        }
        mutatedGenome.size = Math.max(0.35, Math.min(2, mutatedGenome.size));
        mutatedGenome.speed = Math.max(0.25, Math.min(3, mutatedGenome.speed));
        mutatedGenome.efficiency = Math.max(0.45, Math.min(1.8, mutatedGenome.efficiency));
        mutatedGenome.lifeHistory.lifespan = Math.max(
            600, Math.min(5000, mutatedGenome.lifeHistory.lifespan)
        );
        mutatedGenome.lifeHistory.maturityAge = Math.max(80, Math.min(
            mutatedGenome.lifeHistory.lifespan * 0.6,
            mutatedGenome.lifeHistory.maturityAge
        ));
        mutatedGenome.lifeHistory.reproductionEnergy = Math.max(
            75, Math.min(150, mutatedGenome.lifeHistory.reproductionEnergy)
        );
        mutatedGenome.lifeHistory.mateCooldown = Math.max(
            80, Math.min(600, mutatedGenome.lifeHistory.mateCooldown)
        );
        if (topologyChanged) {
            delete mutatedGenome.brain.connections;
        } else if (Array.isArray(mutatedGenome.brain.connections) &&
            Math.random() < mutationRate) {
            const edges = mutatedGenome.brain.connections;
            const inputCount = mutatedGenome.sensors.enabled.length;
            const neuronCount = inputCount +
                mutatedGenome.brain.hiddenLayers.reduce((sum, size) => sum + size, 0) + 2;
            if (edges.length > 1 && Math.random() < 0.5) {
                edges.splice(Math.floor(Math.random() * edges.length), 1);
            } else {
                const sourceIndex = Math.floor(Math.random() * Math.max(1, neuronCount - 2));
                const targetIndex = inputCount +
                    Math.floor(Math.random() * Math.max(1, neuronCount - inputCount));
                if (sourceIndex !== targetIndex &&
                    !edges.some(([source, target]) =>
                        source === sourceIndex && target === targetIndex)) {
                    edges.push([sourceIndex, targetIndex]);
                }
            }
        }
        
        return mutatedGenome;
    }

}
