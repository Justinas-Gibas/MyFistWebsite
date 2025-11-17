class AI {
    constructor(game) {
        this.game = game;
        this.updateInterval = 1; // Update AI every second
        this.lastUpdate = 0;
        this.resources = {
            wood: 100,
            stone: 100,
            food: 100,
            population: 0,
            maxPopulation: 10
        };
        this.units = [];
        this.buildings = [];
        this.state = 'GATHERING'; // GATHERING, BUILDING, ATTACKING
        this.pathfinder = new PathFinder(game);
    }

    update(deltaTime) {
        this.lastUpdate += deltaTime;
        if (this.lastUpdate < this.updateInterval) return;
        this.lastUpdate = 0;

        switch (this.state) {
            case 'GATHERING':
                this.gatherResources();
                if (this.resources.wood >= 30 && this.resources.stone >= 20) {
                    this.state = 'BUILDING';
                }
                break;
            case 'BUILDING':
                this.buildStructures();
                if (this.buildings.length >= 3 && this.resources.food >= 50) {
                    this.state = 'ATTACKING';
                }
                break;
            case 'ATTACKING':
                this.attackPlayer();
                if (this.units.length < 3) {
                    this.state = 'GATHERING';
                }
                break;
        }

        // Update AI units and buildings
        this.units.forEach(unit => unit.update(deltaTime, this));
        this.buildings.forEach(building => building.update(deltaTime, this));
    }

    gatherResources() {
        // Create workers if we can afford them
        if (this.resources.food >= 10 && this.units.length < 5) {
            const spawnPoint = this.buildings[0] || { x: this.game.map.width - 100, y: this.game.map.height - 100 };
            this.createUnit('worker', spawnPoint.x, spawnPoint.y);
        }

        // Assign workers to nearest resources
        this.units.forEach(unit => {
            if (unit.type === 'worker' && !unit.resourceTarget) {
                const nearestResource = this.findNearestResource(unit);
                if (nearestResource) {
                    unit.resourceTarget = nearestResource;
                    unit.setTarget(nearestResource.x, nearestResource.y);
                }
            }
        });
    }

    buildStructures() {
        if (this.buildings.length < 5) {
            const buildingTypes = ['house', 'farm', 'mine', 'barracks'];
            const type = buildingTypes[Math.floor(Math.random() * buildingTypes.length)];
            const x = this.game.map.width - 200 + Math.random() * 100;
            const y = this.game.map.height - 200 + Math.random() * 100;
            
            const costs = {
                house: { wood: 10 },
                farm: { wood: 15 },
                mine: { wood: 20, stone: 10 },
                barracks: { wood: 30, stone: 20 }
            };

            if (this.canAfford(costs[type])) {
                this.spendResources(costs[type]);
                this.createBuilding(type, x, y);
            }
        }
    }

    attackPlayer() {
        // Create soldiers if we can afford them
        if (this.resources.food >= 20 && this.resources.stone >= 10) {
            const barracks = this.buildings.find(b => b.type === 'barracks');
            if (barracks) {
                this.createUnit('soldier', barracks.x, barracks.y);
            }
        }

        // Command soldiers to attack
        this.units.forEach(unit => {
            if (unit.type === 'soldier') {
                const target = this.findNearestPlayerUnit(unit);
                if (target) {
                    unit.setTarget(target.x, target.y);
                }
            }
        });
    }

    findNearestResource(unit) {
        let nearest = null;
        let minDistance = Infinity;

        this.game.map.resources.forEach(resource => {
            if (resource.amount > 0) {
                const distance = this.getDistance(unit, resource);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = resource;
                }
            }
        });

        return nearest;
    }

    findNearestPlayerUnit(unit) {
        let nearest = null;
        let minDistance = Infinity;

        this.game.units.forEach(playerUnit => {
            const distance = this.getDistance(unit, playerUnit);
            if (distance < minDistance) {
                minDistance = distance;
                nearest = playerUnit;
            }
        });

        return nearest;
    }

    getDistance(a, b) {
        const dx = a.x - b.x;
        const dy = a.y - b.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    createUnit(type, x, y) {
        const unit = new Unit(type, x, y, true); // Pass true for isAI flag
        this.units.push(unit);
        if (type === 'worker' || type === 'soldier') {
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