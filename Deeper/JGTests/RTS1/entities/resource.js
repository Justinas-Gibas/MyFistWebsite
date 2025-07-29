class Resource {
    constructor(type, x, y, amount = 100) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.amount = amount;
        this.workerAssigned = null;
        this.linkedToNexus = false;
    }

    update(game) {
        if (!this.linkedToNexus) {
            // Check if there's a path to nexus
            const nearestNexus = this.findNearestNexus(game);
            if (nearestNexus && this.getDistance(nearestNexus) < 500) {
                this.linkedToNexus = true;
                console.log(`Resource node of ${this.type} linked to nexus at (${this.x}, ${this.y})`);
            }
        }
    }

    findNearestNexus(game) {
        let nearest = null;
        let minDistance = Infinity;
        
        const allBuildings = [...game.buildings, ...game.ai.buildings];
        allBuildings.forEach(building => {
            if (building.type === 'nexus' && building.isComplete) {
                const distance = this.getDistance(building);
                if (distance < minDistance) {
                    minDistance = distance;
                    nearest = building;
                }
            }
        });
        
        return nearest;
    }

    getDistance(entity) {
        const dx = this.x - entity.x;
        const dy = this.y - entity.y;
        return Math.sqrt(dx * dx + dy * dy);
    }

    isPointInside(x, y, radius = 30) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < radius;
    }
}