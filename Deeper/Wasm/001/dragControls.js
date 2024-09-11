import { subdivideMesh, unsubdivideMesh, displaceWithSineWave } from './buttonActions.js';

// Wait for the DOM to load before initializing the drag controls
window.addEventListener('DOMContentLoaded', (event) => {
  console.log("DOM fully loaded and parsed");

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

    // Get the overlay each time inside the function
    const overlay = document.getElementById('overlay');
    
    if (!overlay) {
      console.error("Overlay element not found");
    } else {
      console.log("Overlay element found:", overlay);
    }

    // Track double-click event for future use
    button.addEventListener('dblclick', (event) => {
      event.preventDefault();
      console.log('Double-click detected on button:', button.id);
    });

    button.addEventListener('mousedown', (event) => {
      console.log("Mouse down on button:", button.id);
      isDragging = false;
      isClicked = true;
      offsetX = event.clientX - button.getBoundingClientRect().left;
      offsetY = event.clientY - button.getBoundingClientRect().top;
      startX = event.clientX;
      startY = event.clientY;

      // Activate the overlay layer for dragging
      if (overlay) {
        overlay.style.display = 'block';
        overlay.style.zIndex = 9999;  // Make sure it's on top of all buttons
        console.log("Overlay activated for dragging.");
      }
    });

    overlay.addEventListener('mousemove', (event) => {
      if (isClicked) {
        const moveX = Math.abs(event.clientX - startX);
        const moveY = Math.abs(event.clientY - startY);
        if (moveX > dragThreshold || moveY > dragThreshold) {
          isDragging = true;
          console.log("Dragging button:", button.id);
          button.style.left = `${event.clientX - offsetX}px`;
          button.style.top = `${event.clientY - offsetY}px`;
        }
      }
    });

    document.addEventListener('mouseup', (event) => {
      console.log("Mouse up detected.");
      if (!isDragging && isClicked) {
        console.log("Single-click action triggered for button:", button.id);
        singleClickAction(); // Trigger single-click action if not dragged
      }

      // Reset dragging flags and hide overlay
      isClicked = false;
      isDragging = false;
      if (overlay) {
        overlay.style.display = 'none';
        console.log("Overlay deactivated.");
      }
    });
  }
});
