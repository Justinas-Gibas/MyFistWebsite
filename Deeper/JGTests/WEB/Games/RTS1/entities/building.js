class Building {
    constructor(type, x, y) {
        this.type = type;
        this.x = x;
        this.y = y;
        this.health = 100;
        this.progress = 0;
        this.isComplete = false;
        this.constructionSpeed = 0.1; // 10 seconds to complete
    }

    update(deltaTime, game) {
        if (!this.isComplete) {
            this.progress += this.constructionSpeed * deltaTime;
            if (this.progress >= 1) {
                this.progress = 1;
                this.isComplete = true;
            }
        }

        // Special building effects
        if (this.isComplete) {
            switch (this.type) {
                case 'farm':
                    game.resources.food += 0.05 * deltaTime; // Food production
                    break;
                case 'mine':
                    game.resources.stone += 0.03 * deltaTime; // Stone production
                    break;
            }
        }
    }

    isPointInside(x, y) {
        return Math.abs(x - this.x) < 20 && Math.abs(y - this.y) < 20;
    }
}