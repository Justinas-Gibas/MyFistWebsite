document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('gameCanvas');
    const game = new Game();
    const renderer = new Renderer(canvas);
    const input = new InputHandler(game, renderer);
    
    let lastTime = 0;

    function gameLoop(timestamp) {
        const deltaTime = (timestamp - lastTime) / 1000;
        lastTime = timestamp;

        // Update game state
        game.update(deltaTime);
        
        // Render the game
        renderer.render(game);

        requestAnimationFrame(gameLoop);
    }

    // Start the game loop
    requestAnimationFrame(gameLoop);
});