AFRAME.registerComponent("chunk-manager", {
  init: function () {
    this.el.sceneEl.addEventListener("loaded", () => {
      this.manageChunks();
    });
    this.el.sceneEl.addEventListener("componentchanged", (evt) => {
      if (evt.detail.name === "position") {
        this.manageChunks();
      }
    });
  },

  manageChunks: function () {
    const rig = document.querySelector("#rig");
    const chunks = document.querySelector("#chunks");
    const rigPosition = rig.getAttribute("position");

    // Calculate the chunk the user is in (you can customize the size of the chunks)
    const chunkSize = 10;
    const currentChunk = {
      x: Math.floor(rigPosition.x / chunkSize),
      z: Math.floor(rigPosition.z / chunkSize),
    };

    // Loop through all the chunks and load or unload them based on their distance to the current chunk
    for (let x = -1; x <= 1; x++) {
      for (let z = -1; z <= 1; z++) {
        const chunkId = `chunk-${currentChunk.x + x}-${currentChunk.z + z}`;

        if (!chunks.querySelector(`#${chunkId}`)) {
          const modelId = `chunk${Math.abs(currentChunk.x + x) % 2 + 1}`; // Replace with your own logic to determine the glTF model to use
          const chunk = document.createElement("a-entity");
          chunk.setAttribute("id", chunkId);
          chunk.setAttribute("gltf-model", `#${modelId}`);
          chunk.setAttribute("position", {
            x: (currentChunk.x + x) * chunkSize,
            y: 0,
            z: (currentChunk.z + z) * chunkSize,
          });
          chunks.appendChild(chunk);
        }
      }
    }

    // Unload the chunks that are not adjacent
    chunks.querySelectorAll("a-entity").forEach((chunk) => {
      const [_, x, z] = chunk.id.split("-").map((n) => parseInt(n));
      if (
        x < currentChunk.x - 1 ||
        x > currentChunk.x + 1 ||
        z < currentChunk.z - 1 ||
        z > currentChunk.z + 1
      ) {
        chunks.removeChild(chunk);
      }
    });
  },
});

// Add the loaded event listener to ensure the scene is fully loaded before executing the code
document.querySelector("a-scene").addEventListener("loaded", () => {
  document.querySelector("a-scene").setAttribute("chunk-manager", {});
});
