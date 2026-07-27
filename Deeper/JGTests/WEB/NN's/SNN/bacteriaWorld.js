export class Food {
    constructor(x, y) {
        this.x = x;
        this.y = y;
        this.energy = 20 + Math.random() * 20;
        this.radius = 3 + (this.energy / 10);
    }

    draw(ctx) {
        ctx.beginPath();
        ctx.arc(this.x, this.y, this.radius, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(0,255,0,${this.energy/40})`;
        ctx.fill();
    }
}

const cloneData = value => JSON.parse(JSON.stringify(value));

export class BacteriaWorld {
    constructor(width, height, numBacteria) {
        this.width = width;
        this.height = height;
        this.bacteria = [];
        this.food = [];
        this.generation = 1;
        this.totalBirths = 0;
        this.totalDeaths = 0;
        this.epochBirths = 0;
        this.epochDeaths = 0;
        this.totalFoodEnergySpawned = 0;
        this.totalFoodEnergyConsumed = 0;
        this.epochFoodEnergySpawned = 0;
        this.epochFoodEnergyConsumed = 0;
        this.eliteLimit = 5;
        this.eliteArchive = [];
        this.hallOfFame = [];
        this.generationSummaries = [];
        this.scoreDefinition = 'elite-v1:150*offspring+30*food+25*survival+0.1*energy-0.1*neuralCost';
        this.elapsedTime = 0;
        this.targetPopulation = Math.max(5, numBacteria || 20);
        this.BacteriaClass = null; // Store the Bacteria class reference
        
        // Evolution parameters
        this.mutationRate = 0.1;      // Base mutation rate
        this.foodSpawnRate = 0.01;    // Food spawn probability per frame
        this.energyCost = 0.2;        // Base energy cost per frame
        this.maxFood = 50;            // Maximum food items in world
        this.selectedBacteria = null; // Currently selected bacteria for inspection
        this.hoveredBacteria = null;
        
        // Environmental zones
        this.toxicZones = [
            { x: this.width * 0.2, y: this.height * 0.2, r: 60 },
            { x: this.width * 0.7, y: this.height * 0.7, r: 50 }
        ];
        this.tempZones = [
            { x: this.width * 0.5, y: this.height * 0.5, r: 80, temp: 40 }, // hot zone
            { x: this.width * 0.8, y: this.height * 0.3, r: 40, temp: 10 }  // cold zone
        ];
        this.optimalTemp = 25;
        // Species tracking
        this.speciesCounts = {};
        
        // Initialize bacteria positions
        for (let i = 0; i < numBacteria; i++) {
            const x = Math.random() * width;
            const y = Math.random() * height;
            this.bacteria.push({ x, y });
        }
    }

    initializeBacteria(BacteriaClass) {
        this.BacteriaClass = BacteriaClass; // Store the reference to the Bacteria class
        this.bacteria = this.bacteria.map(b => {
            const bacteria = new BacteriaClass(b.x, b.y);
            bacteria.birthEpoch = this.generation;
            return bacteria;
        });
        this.seedFood(Math.min(this.maxFood, this.targetPopulation));
    }

    update(deltaTime = 16.67) {
        this.elapsedTime += deltaTime;
        const frameScale = Math.min(deltaTime, 50) / 16.67;
        // Spawn new food
        if (Math.random() < this.foodSpawnRate * frameScale && this.food.length < this.maxFood) {
            this.addFood(new Food(
                Math.random() * this.width,
                Math.random() * this.height
            ));
        }

        // Update all bacteria
        for (const b of [...this.bacteria]) {
            b.update(this, deltaTime);
            this.considerElite(b, b.energy > 0 ? 'living' : 'finalized');
        }

        // Remove dead bacteria
        const dead = this.bacteria.filter(b => b.energy <= 0);
        dead.forEach(bacteria => {
            bacteria.deathCause ??= 'energy';
            this.totalDeaths++;
            this.epochDeaths++;
            this.considerElite(bacteria, 'finalized');
        });
        this.bacteria = this.bacteria.filter(b => b.energy > 0);
        if (this.selectedBacteria && !this.bacteria.includes(this.selectedBacteria)) {
            this.selectedBacteria = null;
        }
        if (this.hoveredBacteria && !this.bacteria.includes(this.hoveredBacteria)) {
            this.hoveredBacteria = null;
        }

        this.handleMating();

        // Natural reproduction may fail; reseeding happens only after extinction.
        if (this.bacteria.length === 0) {
            console.warn('[BacteriaWorld.update] Population extinct; reseeding founders.');
            this.startNewGeneration();
        }
    }

    draw(ctx) {
        ctx.fillStyle = '#061115';
        ctx.fillRect(0, 0, this.width, this.height);

        // Environmental fields sit behind agents so spatial context stays legible.
        for (const zone of this.toxicZones) {
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
            ctx.fillStyle = 'rgba(205, 75, 224, 0.13)';
            ctx.fill();
            ctx.strokeStyle = 'rgba(205, 75, 224, 0.34)';
            ctx.stroke();
        }
        for (const zone of this.tempZones) {
            ctx.beginPath();
            ctx.arc(zone.x, zone.y, zone.r, 0, Math.PI * 2);
            ctx.fillStyle = zone.temp > this.optimalTemp
                ? 'rgba(255, 126, 52, 0.11)'
                : 'rgba(50, 145, 255, 0.11)';
            ctx.fill();
            ctx.strokeStyle = zone.temp > this.optimalTemp
                ? 'rgba(255, 126, 52, 0.28)'
                : 'rgba(50, 145, 255, 0.28)';
            ctx.stroke();
        }

        // Draw food
        for (const food of this.food) {
            food.draw(ctx);
        }

        if (this.selectedBacteria?.trail.length > 1) {
            ctx.beginPath();
            this.selectedBacteria.trail.forEach((point, index) => {
                if (index === 0) ctx.moveTo(point.x, point.y);
                else ctx.lineTo(point.x, point.y);
            });
            ctx.strokeStyle = 'rgba(184, 234, 101, 0.55)';
            ctx.lineWidth = 1.5;
            ctx.stroke();
            ctx.lineWidth = 1;
        }

        // Draw bacteria
        for (const b of this.bacteria) {
            b.draw(ctx, this);
        }

        if (this.hoveredBacteria && this.hoveredBacteria !== this.selectedBacteria) {
            ctx.beginPath();
            ctx.arc(
                this.hoveredBacteria.x,
                this.hoveredBacteria.y,
                this.hoveredBacteria.radius + 4,
                0,
                Math.PI * 2
            );
            ctx.strokeStyle = 'rgba(85, 217, 210, 0.8)';
            ctx.stroke();
        }
    }

    updateSpeciesCounts() {
        this.speciesCounts = {};
        for (const b of this.bacteria) {
            const key = b.species;
            this.speciesCounts[key] = (this.speciesCounts[key] || 0) + 1;
        }
    }

    addFood(food) {
        this.food.push(food);
        this.totalFoodEnergySpawned += food.energy;
        this.epochFoodEnergySpawned += food.energy;
    }

    removeFood(food) {
        const index = this.food.indexOf(food);
        if (index !== -1) {
            this.food.splice(index, 1);
            this.totalFoodEnergyConsumed += food.energy;
            this.epochFoodEnergyConsumed += food.energy;
        }
    }

    seedFood(count) {
        for (let index = 0; index < count && this.food.length < this.maxFood; index++) {
            this.addFood(new Food(
                Math.random() * this.width,
                Math.random() * this.height
            ));
        }
    }

    considerElite(bacteria, status = 'living') {
        const record = {
            id: bacteria.id,
            score: bacteria.calculateEliteScore(),
            scoreDefinition: this.scoreDefinition,
            status,
            deathCause: bacteria.deathCause,
            familyId: bacteria.genome.familyId,
            parentIds: [...bacteria.parentIds],
            birthEpoch: bacteria.birthEpoch,
            lineageDepth: bacteria.lineageDepth,
            age: bacteria.age,
            energy: bacteria.energy,
            foodEaten: bacteria.foodEaten,
            energyHarvested: bacteria.energyHarvested,
            offspring: bacteria.offspring,
            neurons: bacteria.brain.neurons.length,
            connections: bacteria.brain.neurons.reduce(
                (sum, neuron) => sum + neuron.connections.length, 0
            ),
            spikes: bacteria.brain.neurons.reduce(
                (sum, neuron) => sum + neuron.spikeCount, 0
            ),
            transmissions: bacteria.brain.totalStats?.transmissions ?? 0,
            cumulativeEnergyCosts: cloneData(bacteria.cumulativeEnergyCosts),
            genome: cloneData(bacteria.genome),
            source: bacteria
        };
        const existingIndex = this.eliteArchive.findIndex(elite => elite.id === record.id);
        if (existingIndex >= 0) this.eliteArchive.splice(existingIndex, 1);
        this.eliteArchive.push(record);
        this.eliteArchive.sort((a, b) =>
            b.score - a.score || a.id.localeCompare(b.id, undefined, { numeric: true })
        );
        this.eliteArchive = this.eliteArchive.slice(0, this.eliteLimit);
    }

    publicEliteRecord(record) {
        const { source, ...publicRecord } = record;
        return cloneData(publicRecord);
    }

    addBacteria(bacteria) {
        this.bacteria.push(bacteria);
    }

    findNearbyFood(x, y, radius) {
        return this.food.find(f => {
            const dx = f.x - x;
            const dy = f.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius + (f.radius ?? 0);
        });
    }

    handleMating() {
        if (this.bacteria.length >= this.targetPopulation * 2) return;
        const paired = new Set();
        for (const candidate of this.bacteria) {
            if (paired.has(candidate) || !candidate.canMate()) continue;
            let nearest = null;
            let nearestDistance = Infinity;
            for (const partner of this.bacteria) {
                if (partner === candidate || paired.has(partner) || !partner.canMate() ||
                    partner.matingType === candidate.matingType) continue;
                const distance = Math.hypot(partner.x - candidate.x, partner.y - candidate.y);
                const matingDistance = candidate.radius + partner.radius + 14;
                if (distance <= matingDistance && distance < nearestDistance) {
                    nearest = partner;
                    nearestDistance = distance;
                }
            }
            if (!nearest) continue;
            if (candidate.reproduceWith(nearest, this)) {
                paired.add(candidate);
                paired.add(nearest);
                this.totalBirths++;
                this.epochBirths++;
            }
        }
    }

    startNewGeneration() {
        const BacteriaConstructor = this.BacteriaClass;
        
        if (!BacteriaConstructor) {
            console.error('[BacteriaWorld.startNewGeneration] ERROR: No Bacteria class reference available');
            return; // Prevent error if no constructor is available
        }
        
        const parents = [...this.eliteArchive];
        const completedEpoch = this.generation;
        const publicElites = parents.map(record => this.publicEliteRecord(record));
        this.generationSummaries.push({
            epoch: completedEpoch,
            endedAt: this.elapsedTime,
            populationSize: this.targetPopulation,
            births: this.epochBirths,
            deaths: this.epochDeaths,
            foodEnergySpawned: this.epochFoodEnergySpawned,
            foodEnergyConsumed: this.epochFoodEnergyConsumed,
            scoreDefinition: this.scoreDefinition,
            elites: publicElites
        });
        this.hallOfFame.push(...publicElites);
        this.hallOfFame.sort((a, b) =>
            b.score - a.score || a.id.localeCompare(b.id, undefined, { numeric: true })
        );
        this.hallOfFame = this.hallOfFame.slice(0, this.eliteLimit);
        this.generation++;

        const newPopulation = Array.from({ length: this.targetPopulation }, (_, index) => {
            let genome = null;
            let parentIds = [];
            let lineageDepth = 0;
            if (parents.length) {
                const primary = parents[index % parents.length];
                const secondary = parents[(index + 1) % parents.length];
                genome = parents.length > 1
                    ? primary.source.crossoverGenome(secondary.source, this.mutationRate)
                    : primary.source.mutateGenome(this.mutationRate, primary.genome);
                parentIds = [...new Set([primary.id, secondary.id])];
                lineageDepth = Math.max(primary.lineageDepth, secondary.lineageDepth) + 1;
            }
            const child = new BacteriaConstructor(
                Math.random() * this.width,
                Math.random() * this.height,
                genome
            );
            child.parentIds = parentIds;
            child.birthEpoch = this.generation;
            child.lineageDepth = lineageDepth;
            child.matingType = index % 2 === 0 ? 'α' : 'β';
            return child;
        });
        
        this.bacteria = newPopulation;
        this.eliteArchive = [];
        this.food = [];
        this.epochBirths = 0;
        this.epochDeaths = 0;
        this.epochFoodEnergySpawned = 0;
        this.epochFoodEnergyConsumed = 0;
        this.seedFood(Math.min(this.maxFood, this.targetPopulation));
        this.selectedBacteria = null;
        this.hoveredBacteria = null;
    }
}
