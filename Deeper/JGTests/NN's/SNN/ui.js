/** @file UI utility functions for the SNN Playground. */

/**
 * Gets the main canvas element and its 2D rendering context.
 * @returns {{canvas: HTMLCanvasElement, ctx: CanvasRenderingContext2D}} An object containing the canvas and its context.
 */
export function getCanvasContext() {
    const canvas = document.getElementById('snnCanvas');
    return { canvas, ctx: canvas.getContext('2d') };
}

/**
 * Clears the entire specified canvas.
 * @param {CanvasRenderingContext2D} ctx - The 2D rendering context of the canvas to clear.
 * @param {HTMLCanvasElement} canvas - The HTML canvas element to clear.
 */
export function clearCanvas(ctx, canvas) {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
}

/**
 * Updates the input node control panel in the UI.
 * Creates checkboxes for toggling the active state of input nodes for each brain.
 * @param {Array<import('./brain.js').Brain>} brains - An array of Brain instances.
 * @param {function(string, string, boolean): void} onToggleCallback - Callback function triggered when an input node's state is changed.
 * It receives `brainId`, `neuronLocalId`, and `isActive` (boolean).
 */
export function updateInputNodeControls(brains, onToggleCallback) {
    const container = document.getElementById('inputNodeControlsContainer');
    if (!container) return;
    container.innerHTML = ''; // Clear existing controls

    if (!brains || brains.length === 0) {
        container.textContent = 'Initialize environment to see brain-specific controls.';
        return;
    }

    brains.forEach(brain => {
        const brainInputNodes = brain.getInputNodes();
        if (brainInputNodes.length > 0) {
            const brainHeader = document.createElement('h4');
            brainHeader.textContent = `Brain ${brain.id} Inputs:`;
            container.appendChild(brainHeader);

            brainInputNodes.forEach(node => {
                const controlDiv = document.createElement('div');
                controlDiv.className = 'input-node-control';

                const checkbox = document.createElement('input');
                checkbox.type = 'checkbox';
                // ID needs to be unique across all brains if global panel
                const checkboxId = `input-toggle-brain${brain.id}-node${node.id.split('-').pop()}`;
                checkbox.id = checkboxId;
                checkbox.checked = node.isActive;
                checkbox.addEventListener('change', () => {
                    // Pass brainId and the local neuron id (part after "brainId-")
                    onToggleCallback(brain.id, node.id.split('-').pop(), checkbox.checked);
                });

                const label = document.createElement('label');
                label.htmlFor = checkboxId;
                label.textContent = `Input ${node.id.split('-').pop()}`;

                controlDiv.appendChild(checkbox);
                controlDiv.appendChild(label);
                container.appendChild(controlDiv);
            });
        }
    });
     if (container.innerHTML === '') {
        container.textContent = 'Selected brain(s) have no input nodes or no brains initialized.';
    }
}
