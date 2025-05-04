/**
 * UI Utilities Module
 * 
 * This module provides common UI utility functions for the WebGPU Explorer.
 * These functions are used by the UIManager but separated for better organization.
 */

export class UI {
    /**
     * Show a temporary notification
     * @param {string} message - Message to display
     * @param {string} type - Notification type ('success', 'error', 'info')
     * @param {number} duration - Duration in milliseconds to show the notification (default: 3000ms)
     */
    static showNotification(message, type = 'info', duration = 3000) {
        // Create notification element if it doesn't exist
        let notification = document.getElementById('notification');
        if (!notification) {
            notification = document.createElement('div');
            notification.id = 'notification';
            document.body.appendChild(notification);
            
            // Style the notification
            notification.style.position = 'fixed';
            notification.style.bottom = '20px';
            notification.style.left = '20px';
            notification.style.padding = '10px 15px';
            notification.style.borderRadius = '4px';
            notification.style.fontSize = '14px';
            notification.style.transition = 'opacity 0.3s ease';
            notification.style.zIndex = '1000';
        }
        
        // Set notification style based on type
        switch (type) {
            case 'success':
                notification.style.backgroundColor = '#42d392';
                notification.style.color = 'white';
                break;
            case 'error':
                notification.style.backgroundColor = '#ff6347';
                notification.style.color = 'white';
                break;
            case 'info':
            default:
                notification.style.backgroundColor = '#4a6bdf';
                notification.style.color = 'white';
                break;
        }
        
        // Set message and show notification
        notification.textContent = message;
        notification.style.opacity = '1';
        
        // Hide after specified duration
        setTimeout(() => {
            notification.style.opacity = '0';
        }, duration);
    }
    
    /**
     * Toggle fullscreen mode
     * @param {HTMLElement} container - The element to make fullscreen
     * @returns {boolean} New fullscreen state
     */
    static toggleFullscreen(container) {
        if (!container) {
            container = document.querySelector('.app-container');
        }
        
        let isFullscreen = false;
        
        if (!document.fullscreenElement) {
            // Enter fullscreen
            if (container.requestFullscreen) {
                container.requestFullscreen();
            } else if (container.mozRequestFullScreen) { // Firefox
                container.mozRequestFullScreen();
            } else if (container.webkitRequestFullscreen) { // Chrome, Safari & Opera
                container.webkitRequestFullscreen();
            } else if (container.msRequestFullscreen) { // IE/Edge
                container.msRequestFullscreen();
            }
            isFullscreen = true;
        } else {
            // Exit fullscreen
            if (document.exitFullscreen) {
                document.exitFullscreen();
            } else if (document.mozCancelFullScreen) {
                document.mozCancelFullScreen();
            } else if (document.webkitExitFullscreen) {
                document.webkitExitFullscreen();
            } else if (document.msExitFullscreen) {
                document.msExitFullscreen();
            }
            isFullscreen = false;
        }
        
        return isFullscreen;
    }
    
    /**
     * Toggle an element's visibility
     * @param {HTMLElement|string} element - The element or element ID to toggle
     * @param {boolean} show - Force show/hide (optional)
     * @returns {boolean} New visibility state
     */
    static toggleElement(element, show) {
        // If element is a string, assume it's an element ID
        if (typeof element === 'string') {
            element = document.getElementById(element);
        }
        
        if (!element) return false;
        
        // If show is explicitly set, use that value
        if (show !== undefined) {
            element.style.display = show ? 'block' : 'none';
            return show;
        }
        
        // Otherwise toggle current state
        const isVisible = element.style.display !== 'none' && element.offsetParent !== null;
        element.style.display = isVisible ? 'none' : 'block';
        
        return !isVisible;
    }
    
    /**
     * Format a control value for display based on its type
     * @param {any} value - The control value
     * @param {string} type - The control type
     * @returns {string} Formatted value for display
     */
    static formatControlValue(value, type) {
        switch (type) {
            case 'float':
            case 'number':
            case 'range':
                return parseFloat(value).toFixed(2);
            case 'int':
            case 'integer':
                return parseInt(value, 10).toString();
            case 'bool':
            case 'checkbox':
                return Boolean(value) ? 'On' : 'Off';
            default:
                return value ? value.toString() : '';
        }
    }
    
    /**
     * Simple Markdown to HTML converter
     * @param {string} markdown - Markdown content
     * @returns {string} HTML content
     */
    static convertMarkdownToHtml(markdown) {
        if (!markdown) return '';
        
        // This is a very basic markdown converter - for more complex conversions
        // consider using a dedicated library like marked.js or showdown.js
        
        let html = markdown;
        
        // Headers
        html = html.replace(/^# (.*$)/gm, '<h1>$1</h1>');
        html = html.replace(/^## (.*$)/gm, '<h2>$1</h2>');
        html = html.replace(/^### (.*$)/gm, '<h3>$1</h3>');
        
        // Bold and italic
        html = html.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
        html = html.replace(/\*(.*?)\*/g, '<em>$1</em>');
        
        // Lists
        html = html.replace(/^\d+\. (.*$)/gm, '<ol><li>$1</li></ol>');
        html = html.replace(/^- (.*$)/gm, '<ul><li>$1</li></ul>');
        
        // Links
        html = html.replace(/\[([^\]]+)\]\(([^)]+)\)/g, '<a href="$2" target="_blank">$1</a>');
        
        // Code blocks
        html = html.replace(/```([^`]*?)```/gs, function(match, codeContent) {
            // Extract language if specified (e.g., ```javascript)
            const firstLine = codeContent.trim().split('\n')[0];
            let language = '';
            let code = codeContent;
            
            if (firstLine && !firstLine.includes(' ') && firstLine.length < 20) {
                language = firstLine;
                code = codeContent.substring(firstLine.length).trim();
            }
            
            return `<pre><code class="language-${language}">${code}</code></pre>`;
        });
        
        // Inline code
        html = html.replace(/`([^`]+)`/g, '<code>$1</code>');
        
        // Line breaks (multiple empty lines -> one line break)
        html = html.replace(/\n\n+/g, '\n\n');
        
        // Paragraphs
        html = html.replace(/\n\n/g, '</p><p>');
        html = html.replace(/^(.+)$/gm, '<p>$1</p>');
        
        // Fix nested paragraphs in lists
        html = html.replace(/<\/li><\/[ou]l><p>/g, '</li></ol>');
        html = html.replace(/<\/p><[ou]l><li>/g, '<ol><li>');
        
        // Fix nested paragraphs in other elements
        html = html.replace(/<\/h(\d)><p>/g, '</h$1>');
        html = html.replace(/<\/p><h(\d)>/g, '<h$1>');
        
        return html;
    }
    
    /**
     * Utility function to create a debounced version of a function
     * @param {Function} func - The function to debounce
     * @param {number} delay - The delay in milliseconds
     * @returns {Function} The debounced function
     */
    static debounce(func, delay) {
        let timeoutId;
        return (...args) => {
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => {
                func.apply(null, args);
            }, delay);
        };
    }
    
    /**
     * Fixes common shader syntax errors in WGSL code
     * @param {string} code - The shader code to fix
     * @returns {object} Object containing the fixed code and a boolean indicating if changes were made
     */
    static fixShaderSyntax(code) {
        if (!code || code.trim() === '') {
            return { code, changed: false };
        }
        
        // Store original code for comparison
        const originalCode = code;
        
        // Fix 1: Add missing decimal points to numbers to ensure f32 type
        code = code.replace(/\b(\d+)(?![\.|\w])/g, '$1.0');
        
        // Fix 2: Add parentheses around combined logical operators (&&, ||)
        code = code.replace(/([^\(])(.*?)&&(.*?)(\|\|)(.*?)([^\)])/g, '$1(($2&&$3)$4($5))$6');
        
        // Fix 3: Fix hex color values (#RRGGBB) 
        code = code.replace(/(vec4<f32>)\s*\(\s*#([0-9A-Fa-f]{6})\s*,/g, (match, vecType, hexColor) => {
            // Convert hex color to RGB values
            const r = parseInt(hexColor.substring(0, 2), 16) / 255;
            const g = parseInt(hexColor.substring(2, 4), 16) / 255;
            const b = parseInt(hexColor.substring(4, 6), 16) / 255;
            return `${vecType}(${r}, ${g}, ${b},`;
        });
        
        // Fix 4: Fix missing var initializers by converting let to var where needed
        code = code.replace(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=/g, 'var $1 =');
        
        // Fix 5: Add type annotations for common numeric variables
        code = code.replace(/let\s+([a-zA-Z_][a-zA-Z0-9_]*)\s*=\s*(\d+\.\d+|\d+)/g, 'let $1: f32 = $2');
        
        // Fix 6: Fix vector construction without explicit types
        code = code.replace(/vec(\d)\s*\(/g, 'vec$1<f32>(');
        
        // Fix 7: Fix matrix construction without explicit types
        code = code.replace(/mat(\d)x(\d)\s*\(/g, 'mat$1x$2<f32>(');
        
        return { 
            code, 
            changed: code !== originalCode 
        };
    }
    
    /**
     * Creates and sets up a tab interface
     * @param {string} tabContainerId - ID of the tab container element
     * @param {string} contentContainerId - ID of the content container element
     * @param {Function} callback - Optional callback when tab changes
     */
    static setupTabs(tabContainerId, contentContainerId, callback) {
        const tabContainer = document.getElementById(tabContainerId);
        if (!tabContainer) return;
        
        const contentContainer = document.getElementById(contentContainerId);
        if (!contentContainer) return;
        
        const tabs = tabContainer.querySelectorAll('[data-tab]');
        tabs.forEach(tab => {
            tab.addEventListener('click', () => {
                const tabId = tab.dataset.tab;
                
                // Update active tab state
                tabs.forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                
                // Update content panes
                const panes = contentContainer.querySelectorAll('.tab-pane');
                panes.forEach(pane => {
                    if (pane.id === `${tabId}-tab`) {
                        pane.classList.add('active');
                    } else {
                        pane.classList.remove('active');
                    }
                });
                
                // Call callback if provided
                if (callback && typeof callback === 'function') {
                    callback(tabId);
                }
            });
        });
    }
}