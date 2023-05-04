document.addEventListener("DOMContentLoaded", () => {
  const sceneEl = document.querySelector("a-scene");
  const camera = document.querySelector("#mainCamera");

  if (sceneEl) {
    // Create a cursor and add a raycaster component
    const cursor = document.createElement("a-entity");
    cursor.setAttribute("cursor", "rayOrigin: mouse");
    cursor.setAttribute("raycaster", "objects: .clickable");
    camera.appendChild(cursor);

    sceneEl.addEventListener("raycaster-intersection", (event) => {
      const clickedPlane = event.detail.els[0];

      if (clickedPlane) {
        if (clickedPlane.id === "blackPlane") {
          localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
          window.location.href = "outside.html";
        } else if (clickedPlane.id === "whitePlane") {
          localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
          window.location.href = "outside.html";
        }
      }
    });

    const returningFromOutside = localStorage.getItem("returningFromOutside");
    if (returningFromOutside === "true") {
      const userPosition = JSON.parse(localStorage.getItem("userPosition"));
      camera.setAttribute("position", userPosition);

      // Clear the localStorage flags
      localStorage.removeItem("returningFromOutside");
      localStorage.removeItem("userPosition");
    }
  }
});
