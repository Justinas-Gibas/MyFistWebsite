class ImageLabelingTool {
    constructor() {
        this.currentImage = null;
        this.currentImageName = 'annotated_image.json';
        this.labelClasses = ['default_label'];
        this.activeLabel = this.labelClasses[0];
        this.annotations = [];
        this.selectedAnnotationIndex = -1;
        this.activeTool = 'rectangle';
        this.isDrawing = false;
        this.currentPolygonPoints = [];
        this.canvasScale = 1;
        this.canvasOffset = { x: 0, y: 0 };
        
        // Touch/mouse position tracking
        this.startPos = { x: 0, y: 0 };
        this.currentPos = { x: 0, y: 0 };
        
        this.initializeElements();
        this.bindUIEvents();
        this.updateUI();
    }

    // New unified binding for UI events
    bindUIEvents() {
        this.bindImageEvents();
        this.bindToolEvents();
        this.bindCanvasEvents();
        this.bindPanelEvents();
        this.bindKeyboardEvents();
        // ...any additional UI event hooks...
    }

    // Group image import and drag/drop events
    bindImageEvents() {
        // Trigger file selection via helper method
        this.importBtn.addEventListener('click', () => this.triggerImageLoader());
        this.imageLoader.addEventListener('change', (e) => this.handleImageLoad(e));
        
        // Drag and drop listeners
        this.dropZone.addEventListener('dragenter', this.preventDefaults, false);
        this.dropZone.addEventListener('dragover', this.preventDefaults, false);
        this.dropZone.addEventListener('dragleave', this.preventDefaults, false);
        this.dropZone.addEventListener('drop', (e) => {
            this.preventDefaults(e);
            this.dropZone.classList.remove('drag-over');
            const files = e.dataTransfer.files;
            if (files.length > 0) {
                this.loadImageFile(files[0]);
            }
        }, false);
        // Visual cue for drag-over
        this.dropZone.addEventListener('dragenter', () => this.dropZone.classList.add('drag-over'), false);
        this.dropZone.addEventListener('dragleave', () => this.dropZone.classList.remove('drag-over'), false);
    }

    triggerImageLoader() {
        // Clean helper to trigger the file input
        this.imageLoader.click();
    }

    // Group tool selection listeners via delegation
    bindToolEvents() {
        document.querySelectorAll('.toolbar-tab').forEach(tab => {
            tab.addEventListener('click', (e) => this.handleToolSwitch(e));
        });

        this.addLabelBtn.addEventListener('click', () => this.addLabel());
        this.newLabelInput.addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addLabel();
        });
    }

    handleToolSwitch(e) {
        const tool = e.currentTarget.getAttribute('data-tool');
        switch (tool) {
            case 'export':
                this.exportAnnotations();
                break;
            case 'import':
                this.triggerImageLoader();
                break;
            case 'box':
                this.setActiveTool('rectangle');
                break;
            case 'polygon':
                this.setActiveTool('polygon');
                break;
            default:
                // For other toolbar options (select, label, settings)
                this.switchToolPanel(tool);
                break;
        }
    }

    switchToolPanel(tool) {
        // Refactored logic to open/hide various side panels based on tool
        // ...existing code for panel switching...
        this.updateStatus(`Switched to ${tool} panel.`);
    }

    // Group canvas events (mouse and touch) together
    bindCanvasEvents() {
        // Mouse events
        this.canvas.addEventListener('mousedown', (e) => this.handlePointerStart(e));
        this.canvas.addEventListener('mousemove', (e) => this.handlePointerMove(e));
        this.canvas.addEventListener('mouseup', (e) => this.handlePointerEnd(e));
        this.canvas.addEventListener('dblclick', (e) => this.handleDoubleClick(e));
        
        // Touch events – passing essential coordinates
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerStart({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        
        this.canvas.addEventListener('touchmove', (e) => {
            e.preventDefault();
            const touch = e.touches[0];
            this.handlePointerMove({ clientX: touch.clientX, clientY: touch.clientY });
        }, { passive: false });
        
        this.canvas.addEventListener('touchend', (e) => {
            e.preventDefault();
            this.handlePointerEnd(e);
        }, { passive: false });
    }

    // Group panel and mobile FAB related listeners
    bindPanelEvents() {
        document.querySelectorAll('.panel-close').forEach(btn => {
            btn.addEventListener('click', () => this.closePanels());
        });
        
        this.toggleToolsBtn.addEventListener('click', () => this.togglePanel('tools'));
        this.toggleAnnotationsBtn.addEventListener('click', () => this.togglePanel('annotations'));
        
        // Mobile FAB events
        this.mainFab.addEventListener('click', () => {
            this.fabMenu.classList.toggle('open');
        });
        document.querySelectorAll('.fab-item').forEach(item => {
            item.addEventListener('click', (e) => {
                const action = e.currentTarget.dataset.action;
                this.handleFabAction(action);
                this.fabMenu.classList.remove('open');
            });
        });
        document.addEventListener('click', (e) => {
            if (!e.target.closest('.fab-container')) {
                this.fabMenu.classList.remove('open');
            }
        });
    }

    // Group keyboard shortcuts
    bindKeyboardEvents() {
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Enter' && this.activeTool === 'polygon' && this.currentPolygonPoints.length >= 3) {
                e.preventDefault();
                this.finishPolygon(true);
            }
            if (e.key === 'Escape') {
                this.closePanels();
                if (this.activeTool === 'polygon') {
                    this.cancelPolygon();
                }
            }
        });
    }

    initializeElements() {
        // Core elements
        this.canvas = document.getElementById('annotationCanvas');
        this.ctx = this.canvas.getContext('2d');
        this.imageLoader = document.getElementById('imageLoader');
        
        // Panels and sections
        this.imageImportSection = document.getElementById('imageImportSection');
        this.canvasContainer = document.getElementById('canvasContainer');
        this.toolsPanel = document.getElementById('toolsPanel');
        this.annotationsPanel = document.getElementById('annotationsPanel');
        
        // Controls
        this.importBtn = document.getElementById('importBtn');
        this.dropZone = document.getElementById('dropZone');
        this.newLabelInput = document.getElementById('newLabelInput');
        this.addLabelBtn = document.getElementById('addLabelBtn');
        this.labelList = document.getElementById('labelList');
        this.activeLabelDisplay = document.getElementById('activeLabelDisplay');
        this.annotationList = document.getElementById('annotationList');
        this.deleteAnnotationBtn = document.getElementById('deleteAnnotationBtn');
        this.clearAllBtn = document.getElementById('clearAllBtn');
        this.exportBtn = document.getElementById('exportBtn');
        this.finishPolygonBtn = document.getElementById('finishPolygonBtn');
        
        // Status and indicators
        this.statusMessages = document.getElementById('status-messages');
        this.annotationCount = document.getElementById('annotationCount');
        this.imageIndicator = document.getElementById('imageIndicator');
        this.labelIndicator = document.getElementById('labelIndicator');
        this.annotationIndicator = document.getElementById('annotationIndicator');
        
        // Mobile controls
        this.toggleToolsBtn = document.getElementById('toggleToolsBtn');
        this.toggleAnnotationsBtn = document.getElementById('toggleAnnotationsBtn');
        this.mainFab = document.getElementById('mainFab');
        this.fabMenu = document.getElementById('fabMenu');
    }

    preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    handleImageLoad(event) {
        const files = event.target.files;
        if (files && files[0]) {
            this.loadImageFile(files[0]);
        }
    }

    loadImageFile(file) {
        if (!file.type.startsWith('image/')) {
            this.updateStatus('Please select a valid image file.');
            return;
        }

        this.currentImageName = file.name.split('.')[0] + '_annotations.json';
        const reader = new FileReader();

        reader.onload = (e) => {
            this.currentImage = new Image();
            this.currentImage.onload = () => {
                this.setupCanvas();
                this.resetAnnotations();
                this.updateStatus(`Image "${file.name}" loaded successfully.`);
                this.updateUI();
            };
            this.currentImage.onerror = () => {
                this.updateStatus('Error loading image. Please try a different file.');
                this.resetState();
            };
            this.currentImage.src = e.target.result;
        };

        reader.onerror = () => {
            this.updateStatus('Error reading file. Please try again.');
        };

        reader.readAsDataURL(file);
    }

    setupCanvas() {
        // Calculate optimal canvas size
        const containerRect = this.canvasContainer.getBoundingClientRect();
        const maxWidth = containerRect.width - 40;
        const maxHeight = containerRect.height - 40;
        
        const imageAspect = this.currentImage.width / this.currentImage.height;
        const containerAspect = maxWidth / maxHeight;
        
        let canvasWidth, canvasHeight;
        
        if (imageAspect > containerAspect) {
            canvasWidth = Math.min(maxWidth, this.currentImage.width);
            canvasHeight = canvasWidth / imageAspect;
        } else {
            canvasHeight = Math.min(maxHeight, this.currentImage.height);
            canvasWidth = canvasHeight * imageAspect;
        }
        
        this.canvas.width = canvasWidth;
        this.canvas.height = canvasHeight;
        this.canvasScale = canvasWidth / this.currentImage.width;
        
        // Show canvas, hide import section
        this.imageImportSection.style.display = 'none';
        this.canvasContainer.style.display = 'flex';
        
        this.redrawCanvas();
    }

    resetAnnotations() {
        this.annotations = [];
        this.selectedAnnotationIndex = -1;
        this.currentPolygonPoints = [];
        this.isDrawing = false;
    }

    resetState() {
        this.currentImage = null;
        this.currentImageName = 'annotated_image.json';
        this.resetAnnotations();
        this.canvasContainer.style.display = 'none';
        this.imageImportSection.style.display = 'flex';
        this.imageLoader.value = '';
        this.updateUI();
    }

    getCanvasCoordinates(event) {
        const rect = this.canvas.getBoundingClientRect();
        return {
            x: (event.clientX - rect.left) * (this.canvas.width / rect.width),
            y: (event.clientY - rect.top) * (this.canvas.height / rect.height)
        };
    }

    handlePointerStart(event) {
        if (!this.currentImage || !this.activeLabel) {
            this.updateStatus(this.currentImage ? 'Please select a label first.' : 'Please load an image first.');
            return;
        }

        const coords = this.getCanvasCoordinates(event);
        this.startPos = coords;
        this.currentPos = coords;

        if (this.activeTool === 'rectangle') {
            this.isDrawing = true;
        } else if (this.activeTool === 'polygon') {
            this.isDrawing = true;
            this.currentPolygonPoints.push(coords);
            this.updateStatus(`Polygon point ${this.currentPolygonPoints.length} added. Tap 'Finish Polygon' when done.`);
            this.redrawCanvas();
        }
    }

    handlePointerMove(event) {
        if (!this.isDrawing || !this.currentImage) return;
        
        this.currentPos = this.getCanvasCoordinates(event);
        this.redrawCanvas();
    }

    handlePointerEnd(event) {
        if (!this.currentImage) return;

        if (this.activeTool === 'rectangle' && this.isDrawing) {
            this.isDrawing = false;
            this.createRectangleAnnotation();
        }
    }

    handleDoubleClick(event) {
        if (this.activeTool === 'polygon' && this.currentPolygonPoints.length >= 3) {
            this.finishPolygon(true);
        }
    }

    createRectangleAnnotation() {
        const x = Math.min(this.startPos.x, this.currentPos.x);
        const y = Math.min(this.startPos.y, this.currentPos.y);
        const width = Math.abs(this.currentPos.x - this.startPos.x);
        const height = Math.abs(this.currentPos.y - this.startPos.y);

        if (width > 5 && height > 5) {
            this.annotations.push({
                type: 'rectangle',
                x, y, width, height,
                label: this.activeLabel
            });
            this.updateStatus(`Rectangle annotation added for label: ${this.activeLabel}.`);
            this.selectAnnotation(this.annotations.length - 1);
        } else {
            this.updateStatus('Rectangle too small, not added.');
        }
        this.redrawCanvas();
    }

    finishPolygon(save) {
        if (this.activeTool === 'polygon' && this.currentPolygonPoints.length >= 3 && save) {
            this.annotations.push({
                type: 'polygon',
                points: [...this.currentPolygonPoints],
                label: this.activeLabel
            });
            this.updateStatus(`Polygon annotation added with ${this.currentPolygonPoints.length} points.`);
            this.selectAnnotation(this.annotations.length - 1);
        } else if (save && this.currentPolygonPoints.length < 3) {
            this.updateStatus('Polygon needs at least 3 points.');
            return;
        }
        
        this.cancelPolygon();
    }

    cancelPolygon() {
        this.currentPolygonPoints = [];
        this.isDrawing = false;
        this.redrawCanvas();
    }

    setActiveTool(tool) {
        this.activeTool = tool;
        this.cancelPolygon();
        
        // Update UI
        document.querySelectorAll('.tool-option').forEach(option => {
            option.classList.remove('active');
        });
        document.querySelector(`input[value="${tool}"]`).closest('.tool-option').classList.add('active');
        
        this.finishPolygonBtn.style.display = tool === 'polygon' ? 'block' : 'none';
        this.updateStatus(`Tool changed to: ${tool === 'rectangle' ? 'Bounding Box' : 'Polygon'}`);
    }

    addLabel() {
        const newLabel = this.newLabelInput.value.trim();
        if (newLabel && !this.labelClasses.includes(newLabel)) {
            this.labelClasses.push(newLabel);
            if (!this.activeLabel) {
                this.activeLabel = newLabel;
            }
            this.renderLabels();
            this.newLabelInput.value = '';
            this.updateStatus(`Added label: ${newLabel}`);
        } else if (this.labelClasses.includes(newLabel)) {
            this.updateStatus('Label already exists.');
        } else {
            this.updateStatus('Please enter a valid label name.');
        }
    }

    renderLabels() {
        this.labelList.innerHTML = '';
        this.labelClasses.forEach(label => {
            const listItem = document.createElement('li');
            listItem.textContent = label;
            listItem.addEventListener('click', () => this.selectLabel(label));
            if (label === this.activeLabel) {
                listItem.classList.add('active');
            }
            this.labelList.appendChild(listItem);
        });
        this.updateUI();
    }

    selectLabel(label) {
        this.activeLabel = label;
        this.renderLabels();
        this.updateStatus(`Active label set to: ${label}`);
    }

    selectAnnotation(index) {
        this.selectedAnnotationIndex = (index >= 0 && index < this.annotations.length) ? index : -1;
        this.renderAnnotationList();
        this.redrawCanvas();
        if (this.selectedAnnotationIndex !== -1) {
            this.updateStatus(`Selected annotation ${index + 1}`);
        }
    }

    renderAnnotationList() {
        this.annotationList.innerHTML = '';
        
        if (this.annotations.length === 0) {
            const listItem = document.createElement('li');
            listItem.textContent = 'No annotations yet.';
            listItem.style.opacity = '0.5';
            this.annotationList.appendChild(listItem);
        } else {
            this.annotations.forEach((ann, index) => {
                const listItem = document.createElement('li');
                let text = `[${index + 1}] ${ann.label}: `;
                if (ann.type === 'rectangle') {
                    text += `Box (${Math.round(ann.width)}×${Math.round(ann.height)})`;
                } else if (ann.type === 'polygon') {
                    text += `Polygon (${ann.points.length} points)`;
                }
                listItem.textContent = text;
                listItem.addEventListener('click', () => this.selectAnnotation(index));
                if (index === this.selectedAnnotationIndex) {
                    listItem.classList.add('selected');
                }
                this.annotationList.appendChild(listItem);
            });
        }
        this.updateUI();
    }

    deleteSelectedAnnotation() {
        if (this.selectedAnnotationIndex !== -1) {
            const deleted = this.annotations.splice(this.selectedAnnotationIndex, 1)[0];
            this.updateStatus(`Deleted annotation '${deleted.label}'.`);
            this.selectedAnnotationIndex = -1;
            this.renderAnnotationList();
            this.redrawCanvas();
        } else {
            this.updateStatus('No annotation selected to delete.');
        }
    }

    clearAllAnnotations() {
        if (this.annotations.length === 0) {
            this.updateStatus('No annotations to clear.');
            return;
        }
        
        if (confirm('Are you sure you want to delete all annotations?')) {
            this.annotations = [];
            this.selectedAnnotationIndex = -1;
            this.renderAnnotationList();
            this.redrawCanvas();
            this.updateStatus('All annotations cleared.');
        }
    }

    redrawCanvas() {
        if (!this.currentImage) {
            this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            return;
        }

        // Clear and draw image
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        this.ctx.drawImage(this.currentImage, 0, 0, this.canvas.width, this.canvas.height);

        // Draw annotations
        this.annotations.forEach((ann, index) => {
            const isSelected = index === this.selectedAnnotationIndex;
            this.drawAnnotation(ann, isSelected);
        });

        // Draw current drawing
        if (this.isDrawing && this.activeTool === 'rectangle') {
            this.drawCurrentRectangle();
        }

        if (this.activeTool === 'polygon' && this.currentPolygonPoints.length > 0) {
            this.drawCurrentPolygon();
        }
    }

    drawAnnotation(annotation, isSelected) {
        this.ctx.strokeStyle = isSelected ? '#fbbf24' : '#ef4444';
        this.ctx.lineWidth = isSelected ? 3 : 2;
        this.ctx.fillStyle = isSelected ? '#fbbf24' : '#ef4444';
        this.ctx.font = `${Math.max(12, this.canvas.width / 50)}px Arial`;

        if (annotation.type === 'rectangle') {
            this.ctx.strokeRect(annotation.x, annotation.y, annotation.width, annotation.height);
            const textY = annotation.y > 20 ? annotation.y - 5 : annotation.y + annotation.height + 15;
            this.ctx.fillText(annotation.label, annotation.x, textY);
        } else if (annotation.type === 'polygon' && annotation.points.length > 0) {
            this.ctx.beginPath();
            this.ctx.moveTo(annotation.points[0].x, annotation.points[0].y);
            annotation.points.forEach(point => this.ctx.lineTo(point.x, point.y));
            this.ctx.closePath();
            this.ctx.stroke();
            this.ctx.fillText(annotation.label, annotation.points[0].x, annotation.points[0].y - 5);
        }
    }

    drawCurrentRectangle() {
        this.ctx.strokeStyle = '#3b82f6';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.strokeRect(
            this.startPos.x,
            this.startPos.y,
            this.currentPos.x - this.startPos.x,
            this.currentPos.y - this.startPos.y
        );
        this.ctx.setLineDash([]);
    }

    drawCurrentPolygon() {
        // Draw lines
        this.ctx.strokeStyle = '#10b981';
        this.ctx.lineWidth = 2;
        this.ctx.setLineDash([5, 5]);
        this.ctx.beginPath();
        this.ctx.moveTo(this.currentPolygonPoints[0].x, this.currentPolygonPoints[0].y);
        this.currentPolygonPoints.forEach(point => this.ctx.lineTo(point.x, point.y));
        if (this.isDrawing) {
            this.ctx.lineTo(this.currentPos.x, this.currentPos.y);
        }
        this.ctx.stroke();
        this.ctx.setLineDash([]);

        // Draw points
        this.ctx.fillStyle = '#10b981';
        this.currentPolygonPoints.forEach(point => {
            this.ctx.beginPath();
            this.ctx.arc(point.x, point.y, 4, 0, 2 * Math.PI);
            this.ctx.fill();
        });
    }

    exportAnnotations() {
        if (!this.currentImage || this.annotations.length === 0) {
            this.updateStatus('No annotations to export.');
            return;
        }

        const exportData = {
            imageName: this.currentImageName.replace('_annotations.json', ''),
            imageWidth: this.currentImage.width,
            imageHeight: this.currentImage.height,
            annotations: this.annotations,
            labelClasses: this.labelClasses
        };

        const jsonString = JSON.stringify(exportData, null, 2);
        const blob = new Blob([jsonString], { type: 'application/json' });
        
        try {
            saveAs(blob, this.currentImageName);
            this.updateStatus(`Annotations exported as ${this.currentImageName}.`);
        } catch (error) {
            this.updateStatus('Error exporting annotations.');
            console.error('Export error:', error);
        }
    }

    updateStatus(message) {
        this.statusMessages.textContent = message;
        console.log('Status:', message);
    }

    updateUI() {
        // Update indicators
        this.imageIndicator.classList.toggle('active', !!this.currentImage);
        this.labelIndicator.classList.toggle('active', !!this.activeLabel);
        this.annotationIndicator.classList.toggle('active', this.annotations.length > 0);
        
        // Update displays
        this.activeLabelDisplay.textContent = this.activeLabel || 'None';
        this.annotationCount.textContent = `${this.annotations.length} annotation${this.annotations.length !== 1 ? 's' : ''}`;
        
        // Update button states
        this.deleteAnnotationBtn.disabled = this.selectedAnnotationIndex === -1;
        this.exportBtn.disabled = this.annotations.length === 0;
        this.clearAllBtn.disabled = this.annotations.length === 0;
    }
}

// Initialize the application
document.addEventListener('DOMContentLoaded', () => {
    window.labelingTool = new ImageLabelingTool();
});
