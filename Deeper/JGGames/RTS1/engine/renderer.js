class Renderer {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.camera = { x: 0, y: 0, scale: 1 };
        this.resizeCanvas();
        window.addEventListener('resize', () => this.resizeCanvas());
    }

    resizeCanvas() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
    }

    clear() {
        this.ctx.fillStyle = '#2a4d3e';  // Dark green background
        this.ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
    }

    worldToScreen(x, y) {
        return {
            x: (x - this.camera.x) * this.camera.scale + this.canvas.width / 2,
            y: (y - this.camera.y) * this.camera.scale + this.canvas.height / 2
        };
    }

    screenToWorld(x, y) {
        return {
            x: (x - this.canvas.width / 2) / this.camera.scale + this.camera.x,
            y: (y - this.canvas.height / 2) / this.camera.scale + this.camera.y
        };
    }

    render(game) {
        this.clear();

        // Draw grid
        this.drawGrid();

        // Draw resources
        game.map.resources.forEach(resource => this.drawResource(resource));

        // Draw buildings
        game.buildings.forEach(building => this.drawBuilding(building));

        // Draw units
        game.units.forEach(unit => this.drawUnit(unit));

        // Draw selection boxes
        game.selectedEntities.forEach(entity => this.drawSelectionBox(entity));
    }

    drawGrid() {
        const gridSize = 100;
        const startX = Math.floor(this.camera.x / gridSize) * gridSize;
        const startY = Math.floor(this.camera.y / gridSize) * gridSize;
        
        this.ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
        this.ctx.lineWidth = 1;

        for (let x = startX - gridSize * 10; x < startX + gridSize * 10; x += gridSize) {
            const screenX = this.worldToScreen(x, 0).x;
            this.ctx.beginPath();
            this.ctx.moveTo(screenX, 0);
            this.ctx.lineTo(screenX, this.canvas.height);
            this.ctx.stroke();
        }

        for (let y = startY - gridSize * 10; y < startY + gridSize * 10; y += gridSize) {
            const screenY = this.worldToScreen(0, y).y;
            this.ctx.beginPath();
            this.ctx.moveTo(0, screenY);
            this.ctx.lineTo(this.canvas.width, screenY);
            this.ctx.stroke();
        }
    }

    drawResource(resource) {
        const { x, y } = this.worldToScreen(resource.x, resource.y);
        this.ctx.fillStyle = resource.type === 'wood' ? '#5d4037' : '#757575';
        this.ctx.beginPath();
        this.ctx.arc(x, y, 10 * this.camera.scale, 0, Math.PI * 2);
        this.ctx.fill();
    }

    drawBuilding(building) {
        const { x, y } = this.worldToScreen(building.x, building.y);
        const size = 40 * this.camera.scale;

        // Draw building
        this.ctx.fillStyle = this.getBuildingColor(building.type);
        this.ctx.fillRect(x - size/2, y - size/2, size, size);

        // Draw progress bar if under construction
        if (!building.isComplete) {
            this.drawProgressBar(x, y + size/2 + 5, size, 5, building.progress);
        }
    }

    drawUnit(unit) {
        const { x, y } = this.worldToScreen(unit.x, unit.y);
        const radius = 15 * this.camera.scale;

        // Draw unit body
        this.ctx.fillStyle = unit.type === 'worker' ? '#4CAF50' : '#F44336';
        this.ctx.beginPath();
        this.ctx.arc(x, y, radius, 0, Math.PI * 2);
        this.ctx.fill();

        // Draw health bar
        this.drawProgressBar(x, y + radius + 5, radius * 2, 4, unit.health / 100);
    }

    drawProgressBar(x, y, width, height, progress) {
        const screenScale = this.camera.scale;
        this.ctx.fillStyle = '#333';
        this.ctx.fillRect(x - width/2, y, width, height * screenScale);
        this.ctx.fillStyle = '#4CAF50';
        this.ctx.fillRect(x - width/2, y, width * progress, height * screenScale);
    }

    drawSelectionBox(entity) {
        const { x, y } = this.worldToScreen(entity.x, entity.y);
        const size = entity instanceof Unit ? 30 : 40;
        const scaledSize = size * this.camera.scale;

        this.ctx.strokeStyle = '#fff';
        this.ctx.lineWidth = 2;
        if (entity instanceof Unit) {
            this.ctx.beginPath();
            this.ctx.arc(x, y, scaledSize/2, 0, Math.PI * 2);
            this.ctx.stroke();
        } else {
            this.ctx.strokeRect(x - scaledSize/2, y - scaledSize/2, scaledSize, scaledSize);
        }
    }

    getBuildingColor(type) {
        const colors = {
            house: '#795548',
            farm: '#8BC34A',
            mine: '#607D8B',
            barracks: '#C62828'
        };
        return colors[type] || '#666';
    }
}