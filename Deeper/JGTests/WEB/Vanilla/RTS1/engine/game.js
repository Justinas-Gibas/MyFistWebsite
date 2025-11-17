class Game {
    constructor() {
        this.resources = {
            wood: 50,
            stone: 30,
            food: 100,
            population: 0,
            maxPopulation: 5
        };
        this.units = [];
        this.buildings = [];
        this.selectedEntities = [];
        this.map = {
            width: 2000,
            height: 2000,
            resources: []
        };
        this.ai = new AI(this);
        this.initialize();
    }

    initialize() {
        // Generate initial resource nodes
        for (let i = 0; i < 20; i++) {
            this.map.resources.push({
                type: Math.random() < 0.5 ? 'wood' : 'stone',
                x: Math.random() * this.map.width,
                y: Math.random() * this.map.height,
                amount: 100
            });
        }

        // Create initial worker
        this.createUnit('worker', this.map.width / 2, this.map.height / 2);
        this.updateResources();
    }

    createUnit(type, x, y, isAI = false) {
        const unit = new Unit(type, x, y, isAI);
        if (isAI) {
            this.ai.units.push(unit);
            this.ai.resources.population++;
        } else {
            this.units.push(unit);
            this.resources.population++;
        }
        return unit;
    }

    createBuilding(type, x, y) {
        const building = new Building(type, x, y);
        this.buildings.push(building);
        if (type === 'house') {
            this.resources.maxPopulation += 5;
        }
        return building;
    }

    update(deltaTime) {
        // Update all units
        this.units.forEach(unit => unit.update(deltaTime, this));

        // Update all buildings
        this.buildings.forEach(building => building.update(deltaTime, this));

        // Resource generation from buildings
        this.buildings.forEach(building => {
            if (building.type === 'farm' && building.isComplete) {
                this.resources.food += 0.1 * deltaTime;
            }
            if (building.type === 'mine' && building.isComplete) {
                this.resources.stone += 0.05 * deltaTime;
            }
        });

        // Update AI
        this.ai.update(deltaTime);

        this.updateResources();
    }

    updateResources() {
        // Update UI
        Object.keys(this.resources).forEach(resource => {
            const element = document.querySelector(`#${resource} span`);
            if (element) {
                element.textContent = Math.floor(this.resources[resource]);
            }
        });

        // Update button states based on resources
        this.updateButtonStates();
    }

    updateButtonStates() {
        const costs = {
            house: { wood: 10 },
            farm: { wood: 15 },
            mine: { wood: 20, stone: 10 },
            barracks: { wood: 30, stone: 20 },
            worker: { food: 10 },
            soldier: { food: 20, stone: 10 }
        };

        // Update building buttons
        Object.keys(costs).forEach(type => {
            const button = document.querySelector(`[data-building="${type}"], [data-unit="${type}"]`);
            if (button) {
                const canAfford = Object.entries(costs[type]).every(
                    ([resource, cost]) => this.resources[resource] >= cost
                );
                const hasPopulationSpace = type === 'worker' || type === 'soldier' ? 
                    this.resources.population < this.resources.maxPopulation : true;
                button.disabled = !canAfford || !hasPopulationSpace;
            }
        });
    }

    handleClick(x, y, isRightClick) {
        if (isRightClick && this.selectedEntities.length > 0) {
            // Move selected units
            this.selectedEntities.forEach(entity => {
                if (entity instanceof Unit) {
                    entity.setTarget(x, y);
                }
            });
        } else {
            // Select units/buildings
            this.selectedEntities = [...this.units, ...this.buildings].filter(
                entity => entity.isPointInside(x, y)
            );
        }
    }

    canAfford(costs) {
        return Object.entries(costs).every(
            ([resource, cost]) => this.resources[resource] >= cost
        );
    }

    spendResources(costs) {
        Object.entries(costs).forEach(([resource, cost]) => {
            this.resources[resource] -= cost;
        });
    }
}