/** @file Main entry point for the SNN Playground. Initializes the environment and sets up UI event listeners. */

import { getCanvasContext, updateInputNodeControls } from './ui.js';
import { Environment } from './environment.js';
import { BacteriaSim } from './bacteriaSim.js';
import { INPUT_NODE_RADIUS, NEURON_RADIUS, SPIKE_THRESHOLD } from './config.js'; // Import for click interaction logic

/**
 * Initializes the SNN environment and attaches event listeners to UI controls
 * once the DOM is fully loaded.
 * @listens DOMContentLoaded
 */
document.addEventListener('DOMContentLoaded', () => {
    const { canvas, ctx } = getCanvasContext();
    const environment = new Environment(canvas, ctx);

    const numBrainsInput = /** @type {HTMLInputElement} */ (document.getElementById('numBrains'));
    const initEnvironmentBtn = /** @type {HTMLButtonElement} */ (document.getElementById('initEnvironmentBtn'));
    
    const addNeuronBtn = /** @type {HTMLButtonElement} */ (document.getElementById('addNeuronBtn'));
    const startPauseBtn = /** @type {HTMLButtonElement} */ (document.getElementById('startPauseBtn'));
    const resetBtn = /** @type {HTMLButtonElement} */ (document.getElementById('resetBtn'));
    const addInputNodeBtn = /** @type {HTMLButtonElement} */ (document.getElementById('addInputNodeBtn'));

    // --- Bacteria Evolution Simulator setup ---
    const bacteriaCanvas = document.getElementById('bacteriaCanvas');
    const bacteriaStats = document.getElementById('bacteriaStats');
    const numBacteriaInput = document.getElementById('numBacteria');
    const initBacteriaSimBtn = document.getElementById('initBacteriaSimBtn');
    const startBacteriaSimBtn = document.getElementById('startBacteriaSimBtn');
    const stepBacteriaSimBtn = document.getElementById('stepBacteriaSimBtn');
    const resetBacteriaSimBtn = document.getElementById('resetBacteriaSimBtn');
    const selectBestBtn = document.getElementById('selectBestBtn');
    const selectPrevBtn = document.getElementById('selectPrevBtn');
    const selectNextBtn = document.getElementById('selectNextBtn');
    const exportExperimentBtn = document.getElementById('exportExperimentBtn');

    let bacteriaSim = new BacteriaSim(bacteriaCanvas, bacteriaStats);

    /**
     * Enables or disables the main simulation control buttons.
     * @param {boolean} enabled - True to enable controls, false to disable.
     */
    function enableControls(enabled) {
        addNeuronBtn.disabled = !enabled;
        startPauseBtn.disabled = !enabled;
        resetBtn.disabled = !enabled;
        addInputNodeBtn.disabled = !enabled;
    }
    enableControls(false); // Initially disabled

    /** 
     * Event listener for the "Initialize Environment" button.
     * Initializes the environment with the specified number of brains.
     * @listens click
     */
    initEnvironmentBtn.addEventListener('click', () => {
        const numBrains = parseInt(numBrainsInput.value, 10);
        environment.initializeBrains(numBrains);
        enableControls(true);
        startPauseBtn.textContent = 'Start All';
        updateInputControls(); // Update input controls for the new set of brains
        console.log(`Environment initialized with ${numBrains} brain(s).`);
    });

    /**
     * Event listener for the "Start All / Pause All" button.
     * Toggles the running state of the environment simulation.
     * @listens click
     */
    startPauseBtn.addEventListener('click', () => {
        if (environment.brains.length === 0) return;
        if (environment.isRunning) {
            environment.pauseAll();
            startPauseBtn.textContent = 'Start All';
            console.log("Environment paused.");
        } else {
            environment.startAll();
            startPauseBtn.textContent = 'Pause All';
            console.log("Environment started.");
        }
    });

    /**
     * Event listener for the "Reset All" button.
     * Resets the entire environment and all brains.
     * @listens click
     */
    resetBtn.addEventListener('click', () => {
        if (environment.brains.length === 0) return;
        environment.resetAll();
        startPauseBtn.textContent = 'Start All';
        updateInputControls();
        console.log("Environment reset.");
    });

    /**
     * Event listener for the "Add Neuron" button.
     * Adds a new regular neuron to each brain in the environment.
     * @listens click
     */
    addNeuronBtn.addEventListener('click', () => {
        if (environment.brains.length > 0) {
            environment.brains.forEach(brain => brain.addNeuron('regular', true));
            environment.drawAll(); // Redraw after adding
            console.log("Added a regular neuron to each brain.");
        }
    });

    /**
     * Event listener for the "Add Input Node" button.
     * Adds a new input node to each brain in the environment.
     * @listens click
     */
    addInputNodeBtn.addEventListener('click', () => {
         if (environment.brains.length > 0) {
            environment.brains.forEach(brain => brain.addNeuron('input', true));
            environment.drawAll(); // Redraw
            updateInputControls(); // Inputs changed, so update controls
            console.log("Added an input node to each brain.");
        }
    });
    
    /**
     * Callback function to handle toggling the active state of an input node.
     * Called from the UI controls generated by `updateInputNodeControls`.
     * @param {string|number} brainId - The ID of the brain containing the input node.
     * @param {string} neuronLocalId - The local ID of the neuron within its brain.
     * @param {boolean} isActive - The new active state of the input node.
     */
    function handleToggleInputNode(brainId, neuronLocalId, isActive) {
        const brain = environment.getBrain(brainId);
        if (brain) {
            brain.toggleInputNodeActiveState(neuronLocalId, isActive);
            if (!environment.isRunning) brain.drawNeurons(); // Redraw specific brain if paused
        }
    }

    /**
     * Refreshes the input node control panel in the UI based on the current brains.
     */
    function updateInputControls() {
        updateInputNodeControls(environment.brains, handleToggleInputNode);
    }
    
    // Initial call to set up input panel correctly (will show "initialize" message)
    updateInputControls();

    /**
     * Event listener for click events on the main canvas.
     * If a neuron is clicked within a brain's region:
     * - Regular neurons: Manually spikes them.
     * - Input neurons: Toggles their active state.
     * This interaction only occurs if the environment is running.
     * @listens click
     * @param {MouseEvent} event - The mouse click event.
     */
    canvas.addEventListener('click', (event) => {
        if (environment.brains.length === 0 || !environment.isRunning) return; // Only interact if running

        const rect = canvas.getBoundingClientRect();
        const clickX = event.clientX - rect.left;
        const clickY = event.clientY - rect.top;

        environment.brains.forEach(brain => {
            // Check if click is within this brain's region
            if (clickX >= brain.canvasRegion.x && clickX <= brain.canvasRegion.x + brain.canvasRegion.width &&
                clickY >= brain.canvasRegion.y && clickY <= brain.canvasRegion.y + brain.canvasRegion.height) {

                let clickedNeuron = null;
                let minDistSq = Infinity;

                brain.neurons.forEach(neuron => {
                    const radius = neuron.type === 'input' ? INPUT_NODE_RADIUS : NEURON_RADIUS;
                    const distSq = (neuron.x - clickX)**2 + (neuron.y - clickY)**2;
                    // Check within ~1.5x radius, ensure it's the closest
                    if (distSq < minDistSq && distSq < (radius * 1.5)**2) {
                        minDistSq = distSq;
                        clickedNeuron = neuron;
                    }
                });

                if (clickedNeuron) {
                    if (clickedNeuron.type === 'regular') {
                        console.log(`Manually spiking ${clickedNeuron.id} in Brain ${brain.id}`);
                        clickedNeuron.integrate(SPIKE_THRESHOLD); // Guarantee a spike on the next update
                        if (!brain.isRunning) brain.drawNeurons(); // Redraw if paused
                    } else if (clickedNeuron.type === 'input') {
                        console.log(`Toggling input ${clickedNeuron.id} in Brain ${brain.id}`);
                        clickedNeuron.isActive = !clickedNeuron.isActive;
                        // Update the checkbox in the UI
                        const localId = clickedNeuron.id.split('-').pop();
                        const checkbox = document.getElementById(`input-toggle-brain${brain.id}-node${localId}`);
                        if(checkbox) checkbox.checked = clickedNeuron.isActive;

                        if (!brain.isRunning) brain.drawNeurons(); // Redraw if paused
                    }
                }
            }
        });
    });

    // --- Bacteria Evolution Simulator controls ---
    /**
     * Enables or disables the bacteria simulation control buttons.
     * @param {boolean} enabled - True to enable controls, false to disable.
     */
    function enableBacteriaControls(enabled) {
        startBacteriaSimBtn.disabled = !enabled;
        stepBacteriaSimBtn.disabled = !enabled;
        resetBacteriaSimBtn.disabled = !enabled;
        selectBestBtn.disabled = !enabled;
        selectPrevBtn.disabled = !enabled;
        selectNextBtn.disabled = !enabled;
        exportExperimentBtn.disabled = !enabled;
    }
    enableBacteriaControls(false); // Initially disabled

    /** 
     * Event listener for the "Initialize Bacteria Simulation" button.
     * Initializes the bacteria simulation with the specified number of bacteria.
     * @listens click
     */
    initBacteriaSimBtn.addEventListener('click', () => {
        const num = parseInt(numBacteriaInput.value, 10);
        bacteriaSim.initialize(num);
        enableBacteriaControls(true); // Ensure controls are enabled after init
        startBacteriaSimBtn.textContent = 'Run';
        bacteriaSim.selectBest();
        console.log(`Bacteria simulation initialized with ${num} bacterium.`);
    });

    /**
     * Event listener for the "Start / Pause" button in Bacteria Simulation.
     * Toggles the running state of the bacteria simulation.
     * @listens click
     */
    startBacteriaSimBtn.addEventListener('click', () => {
        if (bacteriaSim.running) {
            bacteriaSim.stop();
            startBacteriaSimBtn.textContent = 'Run';
            stepBacteriaSimBtn.disabled = false;
            console.log("Bacteria simulation paused.");
        } else {
            bacteriaSim.start();
            startBacteriaSimBtn.textContent = 'Pause';
            stepBacteriaSimBtn.disabled = true;
            console.log("Bacteria simulation started.");
        }
    });

    stepBacteriaSimBtn.addEventListener('click', () => bacteriaSim.step());
    selectBestBtn.addEventListener('click', () => bacteriaSim.selectBest());
    selectPrevBtn.addEventListener('click', () => bacteriaSim.selectAdjacent(-1));
    selectNextBtn.addEventListener('click', () => bacteriaSim.selectAdjacent(1));
    exportExperimentBtn.addEventListener('click', () => bacteriaSim.exportSnapshot());

    /**
     * Event listener for the "Reset" button in Bacteria Simulation.
     * Resets the bacteria simulation and re-initializes with the current number of bacteria.
     * @listens click
     */
    resetBacteriaSimBtn.addEventListener('click', () => {
        const numBacteria = parseInt(numBacteriaInput.value, 10);
        bacteriaSim.reset(numBacteria);
        startBacteriaSimBtn.textContent = 'Run';
        stepBacteriaSimBtn.disabled = false;
        bacteriaSim.selectBest();
        console.log("Bacteria simulation reset.");
    });

    document.addEventListener('keydown', event => {
        if (!bacteriaSim.world || ['INPUT', 'SELECT', 'TEXTAREA'].includes(document.activeElement?.tagName)) return;
        if (event.key === 'ArrowLeft') bacteriaSim.selectAdjacent(-1);
        if (event.key === 'ArrowRight') bacteriaSim.selectAdjacent(1);
    });

    console.log("SNN Environment system initialized.");
});
