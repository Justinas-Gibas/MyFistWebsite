document.addEventListener("DOMContentLoaded", () => {
  const camera = document.querySelector("#mainCamera");
  const blackPlane = document.querySelector("#blackPlane");
  const whitePlane = document.querySelector("#whitePlane");

  function handlePlaneClick(event) {
    const clickedPlane = event.target;

    if (clickedPlane.id === "blackPlane") {
      localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
      localStorage.setItem("returningFromOutside", "true");
      window.location.href = "outside.html";
    } else if (clickedPlane.id === "whitePlane") {
      localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
      localStorage.setItem("returningFromOutside", "true");
      window.location.href = "outside.html";
    }
  }

  if (blackPlane) blackPlane.addEventListener("click", handlePlaneClick);
  if (whitePlane) whitePlane.addEventListener("click", handlePlaneClick);

  const returningFromOutside = localStorage.getItem("returningFromOutside");
  if (returningFromOutside === "true") {
    const userPosition = JSON.parse(localStorage.getItem("userPosition"));
    camera.setAttribute("position", userPosition);

    // Clear the localStorage flags
    localStorage.removeItem("returningFromOutside");
    localStorage.removeItem("userPosition");
}

});
