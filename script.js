document.addEventListener("DOMContentLoaded", () => {
  const camera = document.querySelector("#mainCamera");
  const blackPlane = document.querySelector("#blackPlane");
  const whitePlane = document.querySelector("#whitePlane");
  const clickSound = document.querySelector("#click-sound");

  function playSound() {
    if (clickSound) {
      clickSound.currentTime = 0;
      clickSound.play();
    }
  }

  function handlePlaneClick(event) {
    const clickedPlane = event.target;

    if (clickedPlane.id === "blackPlane") {
      localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
      localStorage.setItem("userRotation", JSON.stringify(camera.getAttribute("rotation")));
      localStorage.setItem("returningFromOutside", "true");
      playSound();
      window.location.href = "outside.html";
    } else if (clickedPlane.id === "whitePlane") {
      localStorage.setItem("userPosition", JSON.stringify(camera.getAttribute("position")));
      localStorage.setItem("userRotation", JSON.stringify(camera.getAttribute"rotation")));
      localStorage.setItem("returningFromOutside", "true");
      playSound();
      window.location.href = "index.html";
    }
  }

  if (blackPlane) blackPlane.addEventListener("click", handlePlaneClick);
  if (whitePlane) whitePlane.addEventListener("click", handlePlaneClick);

  const returningFromOutside = localStorage.getItem("returningFromOutside");
  if (returningFromOutside === "true") {
  const userPosition = JSON.parse(localStorage.getItem("userPosition"));
  const userRotation = JSON.parse(localStorage.getItem("userRotation"));
  camera.setAttribute("position", userPosition);
  camera.setAttribute("rotation", userRotation);
  // Clear the localStorage flags
  localStorage.removeItem("returningFromOutside");
  localStorage.removeItem("userPosition");
  localStorage.removeItem("userRotation");
}
});
