/**
 * @fileoverview Initialization Script for JGMusic
 * @description Handles initialization and development mode switching
 * @author Justinas Gibas
 * @since 2025-07-16
 * @requires DOM manipulation
 * @requires fileDelivery functions
 * @requires listManager functions
 * @requires viewController functions
 * @requires audioPlayer functions
 * 
 */

if (window.location.hostname === "127.0.0.1") {
  // Set development mode globally before other scripts load
  window.DEV_MODE = true;
}

//  when DOM is ready
document.addEventListener('DOMContentLoaded', () => {

});

