document.addEventListener("DOMContentLoaded", function () {
  const world = document.querySelector("#world");
  const camera = document.querySelector("a-camera");
  const gltfModels = [
    "#gltfModel1",
    "#gltfModel2",
    // Add more model references as needed
  ];

  const chunkSize = 10;
  const numChunks = 5;
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

  camera.addEventListener("tick", function () {
    const currentPosition = camera.getAttribute("position");

    if (
      Math.floor(currentPosition.x / chunkSize) !== Math.floor(prevCameraPosition.x / chunkSize) ||
      Math.floor(currentPosition.z / chunkSize) !== Math.floor(prevCameraPosition.z / chunkSize)
    ) {
      generateWorld(currentPosition);
      prevCameraPosition = currentPosition;
    }
  });
});
