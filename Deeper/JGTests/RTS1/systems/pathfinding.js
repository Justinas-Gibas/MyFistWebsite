class PathFinder {
    constructor(game) {
        this.game = game;
        this.gridSize = 40;
        this.nodeRadius = 20;
    }

    findPath(startX, startY, endX, endY) {
        // Convert world coordinates to grid coordinates
        const startNode = this.worldToGrid(startX, startY);
        const endNode = this.worldToGrid(endX, endY);
        
        const openSet = [startNode];
        const closedSet = new Set();
        const cameFrom = new Map();
        
        const gScore = new Map();
        const fScore = new Map();
        
        gScore.set(this.nodeKey(startNode), 0);
        fScore.set(this.nodeKey(startNode), this.heuristic(startNode, endNode));

        while (openSet.length > 0) {
            const current = this.getLowestFScore(openSet, fScore);
            
            if (this.nodeKey(current) === this.nodeKey(endNode)) {
                return this.reconstructPath(cameFrom, current);
            }

            openSet.splice(openSet.indexOf(current), 1);
            closedSet.add(this.nodeKey(current));

            for (const neighbor of this.getNeighbors(current)) {
                if (closedSet.has(this.nodeKey(neighbor))) {
                    continue;
                }

                const tentativeGScore = gScore.get(this.nodeKey(current)) + 1;

                if (!openSet.some(node => this.nodeKey(node) === this.nodeKey(neighbor))) {
                    openSet.push(neighbor);
                } else if (tentativeGScore >= gScore.get(this.nodeKey(neighbor))) {
                    continue;
                }

                cameFrom.set(this.nodeKey(neighbor), current);
                gScore.set(this.nodeKey(neighbor), tentativeGScore);
                fScore.set(this.nodeKey(neighbor), gScore.get(this.nodeKey(neighbor)) + 
                    this.heuristic(neighbor, endNode));
            }
        }

        return null; // No path found
    }

    worldToGrid(x, y) {
        return {
            x: Math.floor(x / this.gridSize),
            y: Math.floor(y / this.gridSize)
        };
    }

    gridToWorld(gridX, gridY) {
        return {
            x: gridX * this.gridSize + this.gridSize / 2,
            y: gridY * this.gridSize + this.gridSize / 2
        };
    }

    nodeKey(node) {
        return `${node.x},${node.y}`;
    }

    heuristic(a, b) {
        return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
    }

    getLowestFScore(nodes, fScore) {
        return nodes.reduce((lowest, node) => {
            if (!lowest || fScore.get(this.nodeKey(node)) < fScore.get(this.nodeKey(lowest))) {
                return node;
            }
            return lowest;
        });
    }

    getNeighbors(node) {
        const neighbors = [];
        const directions = [
            { x: -1, y: 0 }, { x: 1, y: 0 },
            { x: 0, y: -1 }, { x: 0, y: 1 }
        ];

        for (const dir of directions) {
            const neighbor = {
                x: node.x + dir.x,
                y: node.y + dir.y
            };

            // Check if the neighbor is walkable (not blocked by buildings)
            if (this.isWalkable(neighbor)) {
                neighbors.push(neighbor);
            }
        }

        return neighbors;
    }

    isWalkable(node) {
        const worldPos = this.gridToWorld(node.x, node.y);
        
        // Check if any building blocks this node
        for (const building of this.game.buildings) {
            if (Math.abs(building.x - worldPos.x) < this.nodeRadius &&
                Math.abs(building.y - worldPos.y) < this.nodeRadius) {
                return false;
            }
        }

        return true;
    }

    reconstructPath(cameFrom, current) {
        const path = [current];
        while (cameFrom.has(this.nodeKey(current))) {
            current = cameFrom.get(this.nodeKey(current));
            path.unshift(current);
        }
        
        // Convert grid coordinates back to world coordinates
        return path.map(node => this.gridToWorld(node.x, node.y));
    }
}