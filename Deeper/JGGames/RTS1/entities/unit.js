class Unit {
    constructor(type, x, y, isAI = false) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.targetX = x;
        this.targetY = y;
        this.speed = type === 'worker' ? 2 : 1.5;
        this.health = 100;
        this.damage = type === 'worker' ? 5 : 20;
        this.attackRange = type === 'worker' ? 30 : 100;
        this.attackCooldown = 0;
        this.carryingResources = false;
        this.resourceTarget = null;
        this.isAI = isAI; // To identify if unit belongs to AI or player
    }

    update(deltaTime, game) {
        // Movement
        const dx = this.targetX - this.x;
        const dy = this.targetY - this.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance > 5) {
            this.x += (dx / distance) * this.speed;
            this.y += (dy / distance) * this.speed;
        }

        // Worker behavior
        if (this.type === 'worker') {
            this.handleAutomaticResourceGathering(game);
        }

        // Combat
        if (this.type === 'soldier') {
            this.handleCombat(game);
        }

        // Attack cooldown
        if (this.attackCooldown > 0) {
            this.attackCooldown -= deltaTime;
        }
    }

    handleAutomaticResourceGathering(game) {
        if (!this.carryingResources && !this.resourceTarget) {
            // Find nearest resource
            let nearestResource = null;
            let nearestDistance = Infinity;

            game.map.resources.forEach(resource => {
                if (resource.amount > 0) {
                    const dx = resource.x - this.x;
                    const dy = resource.y - this.y;
                    const distance = Math.sqrt(dx * dx + dy * dy);

                    if (distance < nearestDistance) {
                        nearestDistance = distance;
                        nearestResource = resource;
                    }
                }
            });

            if (nearestResource && nearestDistance < 500) { // Increased detection range
                this.resourceTarget = nearestResource;
                this.setTarget(nearestResource.x, nearestResource.y);
            }
        }

        if (this.resourceTarget) {
            const dx = this.resourceTarget.x - this.x;
            const dy = this.resourceTarget.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            if (distance < 30) {
                if (!this.carryingResources && this.resourceTarget.amount > 0) {
                    this.carryingResources = true;
                    this.resourceTarget.amount -= 10;
                    
                    // Find nearest dropoff point (any building)
                    let nearestBuilding = null;
                    let nearestDistance = Infinity;

                    const buildings = this.isAI ? game.ai.buildings : game.buildings;
                    buildings.forEach(building => {
                        if (building.isComplete) {
                            const dx = building.x - this.x;
                            const dy = building.y - this.y;
                            const distance = Math.sqrt(dx * dx + dy * dy);

                            if (distance < nearestDistance) {
                                nearestDistance = distance;
                                nearestBuilding = building;
                            }
                        }
                    });

                    if (nearestBuilding) {
                        this.setTarget(nearestBuilding.x, nearestBuilding.y);
                    }
                } else if (this.carryingResources) {
                    // Deposit resources
                    if (this.isAI) {
                        game.ai.resources[this.resourceTarget.type] += 10;
                    } else {
                        game.resources[this.resourceTarget.type] += 10;
                    }
                    this.carryingResources = false;
                    
                    // Go back to the same resource if it still has resources
                    if (this.resourceTarget.amount > 0) {
                        this.setTarget(this.resourceTarget.x, this.resourceTarget.y);
                    } else {
                        this.resourceTarget = null; // Find new resource
                    }
                }
            }
        }
    }

    handleCombat(game) {
        if (this.attackCooldown <= 0) {
            // Find nearest enemy unit
            let nearestEnemy = null;
            let nearestDistance = Infinity;

            // Get the correct list of units to attack
            const enemyUnits = this.isAI ? game.units : game.ai.units;

            enemyUnits.forEach(unit => {
                const dx = unit.x - this.x;
                const dy = unit.y - this.y;
                const distance = Math.sqrt(dx * dx + dy * dy);

                if (distance < this.attackRange && distance < nearestDistance) {
                    nearestDistance = distance;
                    nearestEnemy = unit;
                }
            });

            if (nearestEnemy) {
                nearestEnemy.health -= this.damage;
                this.attackCooldown = 1; // 1 second cooldown

                if (nearestEnemy.health <= 0) {
                    const unitList = this.isAI ? game.units : game.ai.units;
                    const index = unitList.indexOf(nearestEnemy);
                    if (index > -1) {
                        unitList.splice(index, 1);
                        if (this.isAI) {
                            game.resources.population--;
                        } else {
                            game.ai.resources.population--;
                        }
                    }
                }
            }
        }
    }

    setTarget(x, y) {
        this.targetX = x;
        this.targetY = y;
    }

    isPointInside(x, y) {
        const dx = x - this.x;
        const dy = y - this.y;
        return Math.sqrt(dx * dx + dy * dy) < 15;
    }
}