import { BacteriaSim } from './bacteriaSim.js';

document.addEventListener('DOMContentLoaded', () => {
    const canvas = document.getElementById('bacteriaCanvas');
    const stats = document.getElementById('bacteriaStats');
    const populationInput = document.getElementById('numBacteria');
    const initializeButton = document.getElementById('initBacteriaSimBtn');
    const runButton = document.getElementById('startBacteriaSimBtn');
    const stepButton = document.getElementById('stepBacteriaSimBtn');
    const resetButton = document.getElementById('resetBacteriaSimBtn');
    const bestButton = document.getElementById('selectBestBtn');
    const previousButton = document.getElementById('selectPrevBtn');
    const nextButton = document.getElementById('selectNextBtn');
    const exportButton = document.getElementById('exportExperimentBtn');

    const simulation = new BacteriaSim(canvas, stats);
    const experimentButtons = [
        runButton,
        stepButton,
        resetButton,
        bestButton,
        previousButton,
        nextButton,
        exportButton
    ];

    const enableExperiment = enabled => {
        experimentButtons.forEach(button => {
            button.disabled = !enabled;
        });
    };

    const populationSize = () => Math.max(1, Number.parseInt(populationInput.value, 10) || 1);

    initializeButton.addEventListener('click', () => {
        simulation.initialize(populationSize());
        enableExperiment(true);
        runButton.textContent = 'Run';
        simulation.selectBest();
    });

    runButton.addEventListener('click', () => {
        if (simulation.running) {
            simulation.stop();
            runButton.textContent = 'Run';
            stepButton.disabled = false;
        } else {
            simulation.start();
            runButton.textContent = 'Pause';
            stepButton.disabled = true;
        }
    });

    stepButton.addEventListener('click', () => simulation.step());
    bestButton.addEventListener('click', () => simulation.selectBest());
    previousButton.addEventListener('click', () => simulation.selectAdjacent(-1));
    nextButton.addEventListener('click', () => simulation.selectAdjacent(1));
    exportButton.addEventListener('click', () => simulation.exportSnapshot());

    resetButton.addEventListener('click', () => {
        simulation.reset(populationSize());
        runButton.textContent = 'Run';
        stepButton.disabled = false;
        simulation.selectBest();
    });

    document.addEventListener('keydown', event => {
        if (!simulation.world || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (event.key === 'ArrowLeft') simulation.selectAdjacent(-1);
        if (event.key === 'ArrowRight') simulation.selectAdjacent(1);
    });

    enableExperiment(false);
});
