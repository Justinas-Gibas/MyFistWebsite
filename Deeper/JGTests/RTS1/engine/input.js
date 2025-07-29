class InputHandler {
    constructor(game, renderer) {
        this.game = game;
        this.renderer = renderer;
        this.isDragging = false;
        this.lastMousePos = { x: 0, y: 0 };
        this.isBoxSelecting = false;
        this.selectionStart = { x: 0, y: 0 };
        this.buildMode = null;

        this.setupEventListeners();
    }

    setupEventListeners() {
        const canvas = this.renderer.canvas;

        // Mouse controls
        canvas.addEventListener('mousedown', (e) => this.handleMouseDown(e));
        canvas.addEventListener('mousemove', (e) => this.handleMouseMove(e));
        canvas.addEventListener('mouseup', (e) => this.handleMouseUp(e));
        canvas.addEventListener('contextmenu', (e) => e.preventDefault());
        canvas.addEventListener('wheel', (e) => this.handleWheel(e));

        // Building buttons
        document.querySelectorAll('[data-building]').forEach(button => {
            button.addEventListener('click', () => {
                this.buildMode = button.dataset.building;
            });
        });

        // Unit training buttons
        document.querySelectorAll('[data-unit]').forEach(button => {
            button.addEventListener('click', () => {
                const unitType = button.dataset.unit;
                const costs = {
                    worker: { food: 10 },
                    soldier: { food: 20, stone: 10 }
                };

                if (this.game.canAfford(costs[unitType]) && 
                    this.game.resources.population < this.game.resources.maxPopulation) {
                    this.game.spendResources(costs[unitType]);
                    const barracks = this.game.buildings.find(b => b.type === 'barracks');
                    if (barracks || unitType === 'worker') {
                        const spawnPoint = barracks || this.game.buildings[0] || { x: this.game.map.width/2, y: this.game.map.height/2 };
                        this.game.createUnit(unitType, spawnPoint.x, spawnPoint.y);
                    }
                }
            });
        });

        // Keyboard controls
        window.addEventListener('keydown', (e) => {
            switch(e.key) {
                case 'Escape':
                    this.buildMode = null;
                    this.game.selectedEntities = [];
                    break;
                case 'Delete':
                    this.game.selectedEntities.forEach(entity => {
                        if (entity instanceof Unit) {
                            const index = this.game.units.indexOf(entity);
                            if (index > -1) {
                                this.game.units.splice(index, 1);
                                this.game.resources.population--;
                            }
                        }
                    });
                    this.game.selectedEntities = [];
                    break;
            }
        });
    }

    handleMouseDown(e) {
        const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
        
        if (e.button === 2) { // Right click
            this.game.handleClick(worldPos.x, worldPos.y, true);
        } else if (e.button === 0) { // Left click
            if (this.buildMode) {
                const costs = {
                    house: { wood: 10 },
                    farm: { wood: 15 },
                    mine: { wood: 20, stone: 10 },
                    barracks: { wood: 30, stone: 20 }
                };

                if (this.game.canAfford(costs[this.buildMode])) {
                    this.game.spendResources(costs[this.buildMode]);
                    this.game.createBuilding(this.buildMode, worldPos.x, worldPos.y);
                    this.buildMode = null;
                }
            } else {
                if (!e.shiftKey) {
                    this.isBoxSelecting = true;
                    this.selectionStart = worldPos;
                }
                this.game.handleClick(worldPos.x, worldPos.y, false);
            }
        } else if (e.button === 1) { // Middle click
            this.isDragging = true;
        }
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
    }

    handleMouseMove(e) {
        if (this.isDragging) {
            const dx = e.clientX - this.lastMousePos.x;
            const dy = e.clientY - this.lastMousePos.y;
            
            this.renderer.camera.x -= dx / this.renderer.camera.scale;
            this.renderer.camera.y -= dy / this.renderer.camera.scale;
        }
        
        this.lastMousePos = { x: e.clientX, y: e.clientY };
    }

    handleMouseUp(e) {
        if (this.isBoxSelecting) {
            const worldPos = this.renderer.screenToWorld(e.clientX, e.clientY);
            const minX = Math.min(this.selectionStart.x, worldPos.x);
            const maxX = Math.max(this.selectionStart.x, worldPos.x);
            const minY = Math.min(this.selectionStart.y, worldPos.y);
            const maxY = Math.max(this.selectionStart.y, worldPos.y);

            if (!e.shiftKey) {
                this.game.selectedEntities = [];
            }

            // Add units in selection box to selection
            this.game.units.forEach(unit => {
                if (unit.x >= minX && unit.x <= maxX && 
                    unit.y >= minY && unit.y <= maxY) {
                    if (!this.game.selectedEntities.includes(unit)) {
                        this.game.selectedEntities.push(unit);
                    }
                }
            });
        }

        this.isDragging = false;
        this.isBoxSelecting = false;
    }

    handleWheel(e) {
        const zoomSpeed = 0.1;
        const zoom = e.deltaY > 0 ? 1 - zoomSpeed : 1 + zoomSpeed;
        const newScale = this.renderer.camera.scale * zoom;
        
        if (newScale >= 0.5 && newScale <= 2) {
            this.renderer.camera.scale = newScale;
        }
    }
}