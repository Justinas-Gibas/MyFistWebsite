/**
 * @fileoverview View Controller for JGMusic
 * @description Handles view switching between grid, list, and horizontal layouts
 * @author Justinas Gibas
 * @since 2025-07-17
 */


/**
 * View controller class
 */
class ViewController {
  constructor() {
    this.currentView = 'grid';
    this.viewContainer = document.getElementById('view-container');
    this.viewButtons = document.querySelectorAll('.view-btn');
    
    this.init();
  }

  /**
   * Initialize view controller
   */
  init() {
    console.log('[ViewController] Initializing view controller');
    
    // Add event listeners to view buttons
    this.viewButtons.forEach(btn => {
      btn.addEventListener('click', (e) => {
        const view = e.currentTarget.dataset.view;
        this.switchView(view);
      });
    });
  }

  /**
   * Switch to a different view
   * @param {string} view - The view to switch to ('grid', 'list', 'horizontal')
   */
  switchView(view) {
    console.log(`[ViewController] Switching to ${view} view`);
    
    // Update current view
    this.currentView = view;
    
    // Remove all view classes
    this.viewContainer.className = '';
    
    // Add new view class
    this.viewContainer.classList.add(`${view}-view`);
    
    // Update active button
    this.viewButtons.forEach(btn => {
      btn.classList.remove('active');
      if (btn.dataset.view === view) {
        btn.classList.add('active');
      }
    });
    
    // Store preference in localStorage
    localStorage.setItem('jgmusic-view', view);
    
    console.log(`[ViewController] Switched to ${view} view`);
  }

  /**
   * Get current view
   * @returns {string} Current view name
   */
  getCurrentView() {
    return this.currentView;
  }

  /**
   * Load saved view preference
   */
  loadSavedView() {
    const savedView = localStorage.getItem('jgmusic-view');
    if (savedView && ['grid', 'list', 'horizontal'].includes(savedView)) {
      this.switchView(savedView);
    }
  }
}

// Initialize view controller when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
  console.log('[ViewController] DOM loaded, creating view controller');
  window.viewController = new ViewController();
  
  // Load saved view preference
  window.viewController.loadSavedView();
});

