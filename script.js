document.addEventListener("DOMContentLoaded", function () {
  const scene = document.querySelector("a-scene");
  const world = document.querySelector("#world");
  const camera = document.querySelector("a-camera");
  const assets = document.querySelector("a-assets");
  const chunkInfo = document.querySelector("#chunk-info");
  const loadGltfButton = document.querySelector("#loadGltf");

  const gltfModels = [
    "#gltfModel1",
    "#gltfModel2",
  ];

  const chunkSize = 100;
  const worldRadius = 2;
  const loadedChunks = new Set();

  function getChunkCoords(position) {
    const x = Math.floor(position.x / chunkSize) * chunkSize;
    const z = Math.floor(position.z / chunkSize) * chunkSize;
    return { x, z };
  }

  function createChunk(x, z, modelIndex) {
    const chunk = document.createElement("a-entity");
    chunk.setAttribute("gltf-model", gltfModels[modelIndex]);
    chunk.setAttribute("position", { x, y: 0, z });
    chunk.setAttribute("id", `chunk-${x}-${z}`);
    world.appendChild(chunk);
    loadedChunks.add(`chunk-${x}-${z}`);
  }

  function generateWorld(position) {
    const { x, z } = getChunkCoords(position);

    // Update chunk-info element content
    chunkInfo.innerHTML = `Current Chunk: x: ${x}, z: ${z}`;

    for (let i = -worldRadius; i <= worldRadius; i++) {
      for (let j = -worldRadius; j <= worldRadius; j++) {
        const xPos = x + i * chunkSize;
        const zPos = z + j * chunkSize;
        const chunkId = `chunk-${xPos}-${zPos}`;

        if (!loadedChunks.has(chunkId)) {
          const modelIndex = Math.floor(Math.random() * gltfModels.length);
          createChunk(xPos, zPos, modelIndex);
        }
      }
    }
  }

  let prevCameraPosition = null;

function onCameraTick() {
  const currentPosition = camera.getAttribute("position");
  const currentChunkCoords = getChunkCoords(currentPosition);
  const prevChunkCoords = prevCameraPosition ? getChunkCoords(prevCameraPosition) : null;

  if (
    !prevChunkCoords ||
    currentChunkCoords.x !== prevChunkCoords.x ||
    currentChunkCoords.z !== prevChunkCoords.z
  ) {
    generateWorld(currentPosition);
    prevCameraPosition = currentPosition;

    // Update chunk-info element content
    chunkInfo.innerHTML = `Current Chunk: x: ${currentChunkCoords.x}, z: ${currentChunkCoords.z}`;
  }
}

  assets.addEventListener("loaded", function () {
    camera.tick = onCameraTick; // Add the tick function
    const currentPosition = camera.getAttribute("position");
    generateWorld(currentPosition); // Call generateWorld initially
    loadGltfButton.addEventListener("click", function () {
      const currentPosition = camera.getAttribute("position");
      generateWorld(currentPosition);
    });
  });
});
