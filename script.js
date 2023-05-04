window.addEventListener("DOMContentLoaded", () => {
  const box = document.querySelector("#box");
  const changeColorButton = document.querySelector("#changeColor");

  changeColorButton.addEventListener("click", () => {
    const randomColor = `#${Math.floor(Math.random() * 16777215).toString(16)}`;
    box.setAttribute("color", randomColor);
  });
});
