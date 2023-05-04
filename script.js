// Constants
const chunkSize = 50; // Adjust this according to the size of your chunks.
const allChunks = [
  { x: 0, z: 0 },
  { x: 0, z: 1 },
  { x: 1, z: 0 },
  { x: 1, z: 1 },
  // Add more chunks as necessary
];

// Helper functions
function getPlayerChunk(playerPosition, chunkSize) {
  const chunkX = Math.floor(playerPosition.x / chunkSize);
  const chunkZ = Math.floor(playerPosition.z / chunkSize);

  return { x: chunkX, z: chunkZ };
}

function loadChunk(chunk) {
  const entity = document.querySelector(`#chunk-${chunk.x}-${chunk.z}`);

  if (!entity) {
    // If the chunk entity doesn't exist yet, create a new entity and set the appropriate glTF model.
    const newEntity = document.createElement("a-entity");
    newEntity.setAttribute("id", `chunk-${chunk.x}-${chunk.z}`);
    newEntity.setAttribute("gltf-model", `#chunk-model-${chunk.x}-${chunk.z}`);
    newEntity.setAttribute("visible", true);

    const scene = document.querySelector("a-scene");
    scene.appendChild(newEntity);
  }
}

function unloadChunk(chunk) {
  const entity = document.querySelector(`#chunk-${chunk.x}-${chunk.z}`);

  if (entity) {
    // If the chunk entity exists, remove it from the scene.
    const scene = document.querySelector("a-scene");
    scene.removeChild(entity);
  }
}

function updateChunks() {
  const player = document.querySelector("#camera"); // Assuming you have an entity with ID 'camera' representing the player.
  const playerPosition = player.getAttribute("position");
  const currentChunk = getPlayerChunk(playerPosition, chunkSize);

  // Define the coordinates for the surrounding chunks.
  const surroundingChunks = [
    { x: currentChunk.x - 1, z: currentChunk.z },
    { x: currentChunk.x + 1, z: currentChunk.z },
    { x: currentChunk.x, z: currentChunk.z - 1 },
    { x: currentChunk.x, z: currentChunk.z + 1 },
    // Include the current chunk as well
    currentChunk
  ];

  // Loop through all chunks and determine if they should be loaded or unloaded.
  for (const chunk of allChunks) {
    const shouldBeLoaded = surroundingChunks.some(surroundingChunk => {
      return chunk.x === surroundingChunk.x && chunk.z === surroundingChunk.z;
    });

    if (shouldBeLoaded) {
      // Load the chunk if it's a surrounding chunk.
      loadChunk(chunk);
    } else {
      // Unload the chunk if it's not a surrounding chunk.
      unloadChunk(chunk);
    }
  }
}

// A-Frame component
AFRAME.registerComponent("level-streaming", {
  tick: function () {
    updateChunks();
  },
});
