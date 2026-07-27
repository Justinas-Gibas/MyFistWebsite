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

export class BacteriaWorld {
    constructor(width, height, numBacteria) {
        this.width = width;
        this.height = height;
        this.bacteria = [];
        this.food = [];
        this.generation = 1;
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
        this.bacteria = this.bacteria.map(b => new BacteriaClass(b.x, b.y));
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
        }

        // Remove dead bacteria
        this.bacteria = this.bacteria.filter(b => b.energy > 0);
        if (this.selectedBacteria && !this.bacteria.includes(this.selectedBacteria)) {
            this.selectedBacteria = null;
        }
        if (this.hoveredBacteria && !this.bacteria.includes(this.hoveredBacteria)) {
            this.hoveredBacteria = null;
        }

        // If population is too low, start new generation from survivors
        if (this.bacteria.length < 5) {
            console.warn(`[BacteriaWorld.update] Population low (${this.bacteria.length}), starting new generation.`);
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
            const key = b.color;
            this.speciesCounts[key] = (this.speciesCounts[key] || 0) + 1;
        }
    }

    addFood(food) {
        this.food.push(food);
    }

    removeFood(food) {
        const index = this.food.indexOf(food);
        if (index !== -1) {
            this.food.splice(index, 1);
        }
    }

    addBacteria(bacteria) {
        this.bacteria.push(bacteria);
    }

    findNearbyFood(x, y, radius) {
        return this.food.find(f => {
            const dx = f.x - x;
            const dy = f.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        });
    }

    startNewGeneration() {
        // Sort by fitness
        this.bacteria.sort((a, b) => b.fitness - a.fitness);
        
        // Keep top performers
        const survivors = this.bacteria.slice(0, Math.max(2, Math.floor(this.bacteria.length * 0.2)));
          // Use the stored BacteriaClass or get constructor from an existing bacteria instance 
        const BacteriaConstructor = this.BacteriaClass || (survivors[0] && survivors[0].constructor);
        
        if (!BacteriaConstructor) {
            console.error('[BacteriaWorld.startNewGeneration] ERROR: No Bacteria class reference available');
            return; // Prevent error if no constructor is available
        }
        
        // Create new population
        const newPopulation = [];
        while (newPopulation.length < this.targetPopulation) {
            const parent = survivors[Math.floor(Math.random() * survivors.length)];
            const child = new BacteriaConstructor(
                Math.random() * this.width,
                Math.random() * this.height,
                parent ? parent.mutateGenome(this.mutationRate) : null
            );
            child.parentId = parent?.id ?? null;
            newPopulation.push(child);
        }
        
        this.bacteria = newPopulation;
        this.selectedBacteria = null;
        this.hoveredBacteria = null;
        this.generation++;
    }
}
