document.addEventListener("DOMContentLoaded", function () {
  const world = document.querySelector("#world");
  const gltfModels = [
    "#gltfModel1",
    "#gltfModel2",
    // Add more model references as needed
  ];

  function createChunk(x, y, z, modelIndex) {
    const chunk = document.createElement("a-entity");
    chunk.setAttribute("gltf-model", gltfModels[modelIndex]);
    chunk.setAttribute("position", { x, y, z });
    world.appendChild(chunk);
  }

  function generateWorld() {
    const chunkSize = 10;
    const numChunks = 5;

    for (let i = 0; i < numChunks; i++) {
      for (let j = 0; j < numChunks; j++) {
        const x = i * chunkSize;
        const y = 0;
        const z = j * chunkSize;
        const modelIndex = Math.floor(Math.random() * gltfModels.length);

        createChunk(x, y, z, modelIndex);
      }
    }
  }

  generateWorld();
});
