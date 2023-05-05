document.addEventListener("DOMContentLoaded", function () {
  const scene = document.querySelector("a-scene");
  const world = document.querySelector("#world");
  const camera = document.querySelector("a-camera");
  const assets = document.querySelector("a-assets");
  const loadGltfButton = document.querySelector("#loadGltf");

  const gltfModels = [
    "#gltfModel1",
    "#gltfModel2",
  ];

  const chunkSize = 100;
  const worldRadius = 1;
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

  let prevCameraPosition = { x: 0, y: 0, z: 0 };

function onCameraTick() {
  const currentPosition = camera.getAttribute("position");
  const currentChunkCoords = getChunkCoords(currentPosition);
  const prevChunkCoords = getChunkCoords(prevCameraPosition);

  if (
    currentChunkCoords.x !== prevChunkCoords.x ||
    currentChunkCoords.z !== prevChunkCoords.z
  ) {
    generateWorld(currentPosition);
    prevCameraPosition = currentPosition;
  }
}

  assets.addEventListener("loaded", function () {
   camera.tick = onCameraTick;
    loadGltfButton.addEventListener("click", function () {
      const currentPosition = camera.getAttribute("position");
      generateWorld(currentPosition);
    });
  });
});
