/**
 * LiteGraph Touch Support Module
 * Adds comprehensive touch support to LiteGraph canvas including:
 * - Single tap for clicks
 * - Double tap for context actions
 * - Long press for right-click/context menu
 * - Touch drag for moving nodes
 * - Multi-select gestures
 * - Hover simulation
 */

class LiteGraphTouchModule {
  constructor() {
    this.touchState = {
      longPressTimeout: null,
      indicator: null,
      startPosition: null,
      startTime: null,
      isDragging: false,
      longPressHandled: false,
      lastTapTime: 0,
      longPressReady: false,
      isMultiSelecting: false,
      virtualCursor: { x: 0, y: 0 },
      isHovering: false,
      hoverTimeout: null,
      startedOnNode: false,
      startedOnBackground: false,
      lastTapNode: null,
      isNodeMultiDrag: false,
      isBackgroundMultiSelect: false
    };

    this.LONG_PRESS_DURATION = 300; // ms
    this.MOVE_THRESHOLD = 10; // pixels
    this.DOUBLE_TAP_DELAY = 300; // ms
    
    this.canvas = null;
    this.graph = null;
  }

  /**
   * Attach touch support to a LiteGraph canvas
   * @param {LGraphCanvas} canvas - The LiteGraph canvas instance
   */
  attach(canvas) {
    if (!canvas || !canvas.canvas) {
      console.error('Invalid canvas provided to LiteGraphTouchModule');
      return;
    }

    this.canvas = canvas;
    this.graph = canvas.graph;
    
    this.addTouchStyles();
    this.bindTouchEvents();
    
    console.log('LiteGraph Touch Module attached successfully');
  }

  /**
   * Detach touch support from the canvas
   */
  detach() {
    if (!this.canvas || !this.canvas.canvas) return;
    
    this.canvas.canvas.removeEventListener("touchstart", this.boundTouchStart);
    this.canvas.canvas.removeEventListener("touchmove", this.boundTouchMove);
    this.canvas.canvas.removeEventListener("touchend", this.boundTouchEnd);
    this.canvas.canvas.removeEventListener("touchcancel", this.boundTouchCancel);
    
    this.cleanupTouchState();
    this.canvas = null;
    this.graph = null;
    
    console.log('LiteGraph Touch Module detached');
  }

  addTouchStyles() {
    // Check if styles already exist
    if (document.getElementById('litegraph-touch-styles')) return;

    const style = document.createElement('style');
    style.id = 'litegraph-touch-styles';
    style.textContent = `
      .right-click-indicator {
        position: absolute;
        border-radius: 50%;
        pointer-events: none;
        z-index: 1000;
        border: 3px solid rgba(55, 250, 55, 0.7);
        background: radial-gradient(circle, rgba(55, 250, 55, 0.9) 0%, transparent 50%);
        transform: translate(-50%, -50%);
        transition: all 0.1s ease-out;
      }
      
      @keyframes touchCountdown {
        from {
          transform: translate(-50%, -50%) scale(0.1);
          opacity: 0.1;
        }
        to {
          transform: translate(-50%, -50%) scale(1.61);
          opacity: 0.9;
        }
      }
    `;
    document.head.appendChild(style);
  }

  bindTouchEvents() {
    // Bind methods to maintain context
    this.boundTouchStart = this.handleTouchStart.bind(this);
    this.boundTouchMove = this.handleTouchMove.bind(this);
    this.boundTouchEnd = this.handleTouchEnd.bind(this);
    this.boundTouchCancel = this.handleTouchCancel.bind(this);

    this.canvas.canvas.addEventListener("touchstart", this.boundTouchStart, { passive: false });
    this.canvas.canvas.addEventListener("touchmove", this.boundTouchMove, { passive: false });
    this.canvas.canvas.addEventListener("touchend", this.boundTouchEnd, { passive: false });
    this.canvas.canvas.addEventListener("touchcancel", this.boundTouchCancel, { passive: false });
  }

  getTouchTarget(x, y) {
    const rect = this.canvas.canvas.getBoundingClientRect();
    const canvasX = x - rect.left;
    const canvasY = y - rect.top;
    
    const graphPos = this.canvas.convertCanvasToOffset([canvasX, canvasY]);
    const node = this.graph.getNodeOnPos(graphPos[0], graphPos[1]);
    
    return {
      node: node,
      isOnNode: !!node,
      graphX: graphPos[0],
      graphY: graphPos[1]
    };
  }

  updateVirtualCursor(x, y) {
    this.touchState.virtualCursor.x = x;
    this.touchState.virtualCursor.y = y;
    this.touchState.isHovering = true;
    
    if (this.touchState.hoverTimeout) {
      clearTimeout(this.touchState.hoverTimeout);
    }
    
    this.sendHoverEvent(x, y);
    
    this.touchState.hoverTimeout = setTimeout(() => {
      this.touchState.isHovering = false;
    }, 1000);
  }
  
  sendHoverEvent(x, y) {
    if (!this.touchState.isHovering) return;
    
    const fakeTouch = { clientX: x, clientY: y };
    const hoverEvent = this.createPointerEvent('mousemove', fakeTouch, { buttons: 0 });
    this.canvas.canvas.dispatchEvent(hoverEvent);
  }

  createPointerEvent(type, touch, options = {}) {
    const rect = this.canvas.canvas.getBoundingClientRect();
    const canvasX = touch.clientX - rect.left;
    const canvasY = touch.clientY - rect.top;
    
    const event = new MouseEvent(type.replace('pointer', 'mouse'), {
      clientX: touch.clientX,
      clientY: touch.clientY,
      button: options.button || 0,
      buttons: options.buttons || 0,
      bubbles: true,
      cancelable: true,
      view: window,
      ctrlKey: options.ctrlKey || false,
      shiftKey: options.shiftKey || false,
      altKey: options.altKey || false,
      metaKey: options.metaKey || false
    });
    
    // Use Object.defineProperty for read-only properties
    Object.defineProperty(event, 'layerX', { value: canvasX, writable: false });
    Object.defineProperty(event, 'layerY', { value: canvasY, writable: false });
    Object.defineProperty(event, 'offsetX', { value: canvasX, writable: false });
    Object.defineProperty(event, 'offsetY', { value: canvasY, writable: false });
    
    // These can be set normally
    event.canvasX = canvasX;
    event.canvasY = canvasY;
    
    return event;
  }

  createRightClickIndicator(x, y) {
    const indicator = document.createElement("div");
    indicator.className = "right-click-indicator";
    indicator.style.left = `${x}px`;
    indicator.style.top = `${y}px`;
    indicator.style.width = "60px";
    indicator.style.height = "60px";
    indicator.style.animation = `touchCountdown ${this.LONG_PRESS_DURATION}ms linear forwards`;
    
    document.body.appendChild(indicator);
    return indicator;
  }

  cleanupTouchState() {
    if (this.touchState.longPressTimeout) {
      clearTimeout(this.touchState.longPressTimeout);
      this.touchState.longPressTimeout = null;
    }
    if (this.touchState.indicator) {
      if (this.touchState.indicator.parentNode) {
        document.body.removeChild(this.touchState.indicator);
      }
      this.touchState.indicator = null;
    }
    
    Object.assign(this.touchState, {
      isDragging: false,
      startPosition: null,
      startTime: null,
      longPressHandled: false,
      longPressReady: false,
      isMultiSelecting: false,
      startedOnNode: false,
      startedOnBackground: false,
      isNodeMultiDrag: false,
      isBackgroundMultiSelect: false
    });
  }

  handleTouchStart(e) {
    if (e.touches.length !== 1) {
      this.cleanupTouchState();
      return;
    }
    e.preventDefault();

    const touch = e.touches[0];
    const currentTime = Date.now();
    const touchTarget = this.getTouchTarget(touch.clientX, touch.clientY);
    
    this.cleanupTouchState();

    this.touchState.startPosition = { x: touch.clientX, y: touch.clientY };
    this.touchState.startTime = currentTime;
    this.touchState.startedOnNode = touchTarget.isOnNode;
    this.touchState.startedOnBackground = !touchTarget.isOnNode;
    
    this.updateVirtualCursor(touch.clientX, touch.clientY);

    // Check for double tap
    const timeSinceLastTap = currentTime - this.touchState.lastTapTime;
    if (timeSinceLastTap < this.DOUBLE_TAP_DELAY) {
      if (touchTarget.isOnNode && this.touchState.lastTapNode === touchTarget.node) {
        // Shift+click for node multi-select
        const shiftClickEvent = this.createPointerEvent('mousedown', touch, { buttons: 1, shiftKey: true });
        this.canvas.canvas.dispatchEvent(shiftClickEvent);
        setTimeout(() => {
          const shiftClickUpEvent = this.createPointerEvent('mouseup', touch, { shiftKey: true });
          this.canvas.canvas.dispatchEvent(shiftClickUpEvent);
        }, 10);
        
        this.touchState.lastTapTime = 0;
        this.touchState.lastTapNode = null;
        return;
      } else if (!touchTarget.isOnNode) {
        // Double tap on background - open search
        const dblClickEvent = this.createPointerEvent('dblclick', touch);
        this.canvas.canvas.dispatchEvent(dblClickEvent);
        this.touchState.lastTapTime = 0;
        return;
      }
    }

    // Start long press timer
    this.touchState.indicator = this.createRightClickIndicator(touch.clientX, touch.clientY);
    
    this.touchState.longPressTimeout = setTimeout(() => {
      if (!this.touchState.isDragging) {
        this.touchState.longPressReady = true;
      }
    }, this.LONG_PRESS_DURATION);
  }

  handleTouchMove(e) {
    if (e.touches.length !== 1 || !this.touchState.startPosition || this.touchState.longPressHandled) return;
    e.preventDefault();

    const touch = e.touches[0];
    const deltaX = Math.abs(touch.clientX - this.touchState.startPosition.x);
    const deltaY = Math.abs(touch.clientY - this.touchState.startPosition.y);

    this.updateVirtualCursor(touch.clientX, touch.clientY);

    const hasMoved = deltaX > this.MOVE_THRESHOLD || deltaY > this.MOVE_THRESHOLD;

    // Handle long press + drag scenarios
    if (this.touchState.longPressReady && hasMoved) {
      if (this.touchState.startedOnBackground) {
        this.touchState.isBackgroundMultiSelect = true;
        this.touchState.isDragging = true;
        this.touchState.longPressReady = false;

        if (this.touchState.indicator && this.touchState.indicator.parentNode) {
          document.body.removeChild(this.touchState.indicator);
          this.touchState.indicator = null;
        }

        const startTouch = { clientX: this.touchState.startPosition.x, clientY: this.touchState.startPosition.y };
        const mouseDownEvent = this.createPointerEvent('mousedown', startTouch, { buttons: 1, ctrlKey: true, shiftKey: true });
        this.canvas.canvas.dispatchEvent(mouseDownEvent);
      } else if (this.touchState.startedOnNode) {
        this.touchState.isNodeMultiDrag = true;
        this.touchState.isDragging = true;
        this.touchState.longPressReady = false;

        if (this.touchState.indicator && this.touchState.indicator.parentNode) {
          document.body.removeChild(this.touchState.indicator);
          this.touchState.indicator = null;
        }

        const startTouch = { clientX: this.touchState.startPosition.x, clientY: this.touchState.startPosition.y };
        const mouseDownEvent = this.createPointerEvent('mousedown', startTouch, { buttons: 1, shiftKey: true });
        this.canvas.canvas.dispatchEvent(mouseDownEvent);
      }
    }
    else if (!this.touchState.isDragging && hasMoved) {
      this.touchState.isDragging = true;
      
      if (this.touchState.longPressTimeout) {
        clearTimeout(this.touchState.longPressTimeout);
        this.touchState.longPressTimeout = null;
      }
      if (this.touchState.indicator && this.touchState.indicator.parentNode) {
        document.body.removeChild(this.touchState.indicator);
        this.touchState.indicator = null;
      }

      const startTouch = { clientX: this.touchState.startPosition.x, clientY: this.touchState.startPosition.y };
      const mouseDownEvent = this.createPointerEvent('mousedown', startTouch, { buttons: 1 });
      this.canvas.canvas.dispatchEvent(mouseDownEvent);
    }

    if (this.touchState.isDragging) {
      let mouseMoveOptions = { buttons: 1 };
      
      if (this.touchState.isBackgroundMultiSelect) {
        mouseMoveOptions.ctrlKey = true;
        mouseMoveOptions.shiftKey = true;
      } else if (this.touchState.isNodeMultiDrag) {
        mouseMoveOptions.shiftKey = true;
      }
      
      const mouseMoveEvent = this.createPointerEvent('mousemove', touch, mouseMoveOptions);
      this.canvas.canvas.dispatchEvent(mouseMoveEvent);
    }
  }

  handleTouchEnd(e) {
    if (!this.touchState.startPosition || this.touchState.longPressHandled) {
      this.cleanupTouchState();
      return;
    }
    e.preventDefault();

    const touch = e.changedTouches[0];
    const currentTime = Date.now();
    const touchTarget = this.getTouchTarget(touch.clientX, touch.clientY);
    
    this.updateVirtualCursor(touch.clientX, touch.clientY);

    if (this.touchState.isBackgroundMultiSelect) {
      const mouseUpEvent = this.createPointerEvent('mouseup', touch, { ctrlKey: true, shiftKey: true });
      this.canvas.canvas.dispatchEvent(mouseUpEvent);
    } else if (this.touchState.isNodeMultiDrag) {
      const mouseUpEvent = this.createPointerEvent('mouseup', touch, { shiftKey: true });
      this.canvas.canvas.dispatchEvent(mouseUpEvent);
    } else if (this.touchState.isDragging) {
      const mouseUpEvent = this.createPointerEvent('mouseup', touch);
      this.canvas.canvas.dispatchEvent(mouseUpEvent);
    } else if (this.touchState.longPressReady) {
      // Long press without drag -> context menu
      const rightMouseDown = this.createPointerEvent('mousedown', touch, { button: 2, buttons: 2 });
      const rightMouseUp = this.createPointerEvent('mouseup', touch, { button: 2 });
      const contextEvent = this.createPointerEvent('contextmenu', touch, { button: 2 });
      
      this.canvas.canvas.dispatchEvent(rightMouseDown);
      setTimeout(() => {
        this.canvas.canvas.dispatchEvent(rightMouseUp);
        setTimeout(() => this.canvas.canvas.dispatchEvent(contextEvent), 10);
      }, 10);
      
      this.touchState.longPressHandled = true;
    } else {
      // Single tap
      const mouseDownEvent = this.createPointerEvent('mousedown', touch);
      const mouseUpEvent = this.createPointerEvent('mouseup', touch);
      const clickEvent = this.createPointerEvent('click', touch);
      
      this.canvas.canvas.dispatchEvent(mouseDownEvent);
      
      setTimeout(() => {
        this.canvas.canvas.dispatchEvent(mouseUpEvent);
        setTimeout(() => {
          this.canvas.canvas.dispatchEvent(clickEvent);
          setTimeout(() => {
            this.updateVirtualCursor(touch.clientX, touch.clientY);
          }, 20);
        }, 10);
      }, 10);
      
      this.touchState.lastTapTime = currentTime;
      this.touchState.lastTapNode = touchTarget.node;
    }
    
    this.cleanupTouchState();
  }

  handleTouchCancel(e) {
    if (this.touchState.isDragging) {
      const touch = e.changedTouches[0];
      let mouseUpOptions = {};

      if (this.touchState.isBackgroundMultiSelect) {
        mouseUpOptions.ctrlKey = true;
        mouseUpOptions.shiftKey = true;
      } else if (this.touchState.isNodeMultiDrag) {
        mouseUpOptions.shiftKey = true;
      }
      
      const mouseUpEvent = this.createPointerEvent('mouseup', touch, mouseUpOptions);
      this.canvas.canvas.dispatchEvent(mouseUpEvent);
    }
    
    this.cleanupTouchState();
    e.preventDefault();
  }
}

// Export for both CommonJS and ES6 modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = LiteGraphTouchModule;
}
if (typeof window !== 'undefined') {
  window.LiteGraphTouchModule = LiteGraphTouchModule;
}
