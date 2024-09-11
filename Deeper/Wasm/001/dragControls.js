import { subdivideMesh, unsubdivideMesh, displaceWithSineWave } from './buttonActions.js';

// Wait for the DOM to load before initializing the drag controls
window.addEventListener('DOMContentLoaded', (event) => {
  
  // Create an overlay to handle dragging across other elements
  const overlay = document.getElementById('overlay');

  // Make buttons draggable
  makeButtonDraggable(document.getElementById('subdivideButton'), subdivideMesh);
  makeButtonDraggable(document.getElementById('displaceButton'), displaceWithSineWave);
  makeButtonDraggable(document.getElementById('unsubdivideButton'), unsubdivideMesh);

  // Make a button draggable and assign single click functionality
  function makeButtonDraggable(button, singleClickAction) {
    let isDragging = false;
    let isClicked = false;
    let offsetX, offsetY;
    let dragThreshold = 5; // Minimum movement in pixels to qualify as a drag
    let startX, startY;

    // Track double-click event for future use
    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      console.log('Double-click detected (no action for now)');
    });

    button.addEventListener('mousedown', (event) => {
      isDragging = false;
      isClicked = true;
      offsetX = event.clientX - button.getBoundingClientRect().left;
      offsetY = event.clientY - button.getBoundingClientRect().top;
      startX = event.clientX;
      startY = event.clientY;

      // Activate the overlay layer for dragging
      overlay.style.display = 'block';
      overlay.style.zIndex = 9999;  // Make sure it's on top of all buttons
    });

    overlay.addEventListener('mousemove', (event) => {
      if (isClicked) {
        const moveX = Math.abs(event.clientX - startX);
        const moveY = Math.abs(event.clientY - startY);
        if (moveX > dragThreshold || moveY > dragThreshold) {
          isDragging = true;
          button.style.left = `${event.clientX - offsetX}px`;
          button.style.top = `${event.clientY - offsetY}px`;
        }
      }
    });

    document.addEventListener('mouseup', (event) => {
      if (!isDragging && isClicked) {
        singleClickAction(); // Trigger single-click action if not dragged
      }

      // Reset dragging flags and hide overlay
      isClicked = false;
      isDragging = false;
      overlay.style.display = 'none';
    });
  }
});
