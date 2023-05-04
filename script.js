const rotationSlider = document.querySelector('#rotation-slider');
const box = document.querySelector('a-box');

rotationSlider.addEventListener('input', function() {
  box.setAttribute('rotation', `0 ${rotationSlider.value} 0`);
});
