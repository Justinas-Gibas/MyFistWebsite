AFRAME.registerComponent('update-position', {
  tick: function () {
    var position = document.querySelector('#position').getAttribute('position');
    document.querySelector('#x').innerHTML = position.x.toFixed(2);
    document.querySelector('#y').innerHTML = position.y.toFixed(2);
    document.querySelector('#z').innerHTML = position.z.toFixed(2);
  }
});

document.querySelector('a-camera').addEventListener('componentinitialized', function (e) {
  if (e.detail.name !== 'position') { return; }
  e.target.setAttribute('update-position', '');
});
