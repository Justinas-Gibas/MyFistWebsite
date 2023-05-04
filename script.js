document.addEventListener("DOMContentLoaded", function () {
  const button = document.querySelector(".animated-button");

  button.addEventListener("mouseenter", function () {
    button.classList.add("animate");
  });

  button.addEventListener("animationend", function () {
    button.classList.remove("animate");
  });
});
