new Vue({
    el: '#app',
    data: {
        currentTool: 'line', // Default tool
        showAnnotations: true, // Annotations are visible by default
        shapes: [], // Store all shapes drawn
        isDrawing: false, // Track if the user is currently drawing
        startX: 0, // Starting X position of a shape
        startY: 0, // Starting Y position of a shape
        selectedShape: null, // Track the currently selected shape
        isDragging: false, // Track if the user is dragging a shape
        isResizing: false, // Track if the user is resizing a shape
        resizeHandle: null // Track which resize handle is being dragged
    },
    methods: {
        setTool(tool) {
            this.currentTool = tool;
            this.selectedShape = null; // Deselect any shape when switching tools
            this.redrawCanvas();
            console.log('Selected tool:', tool);
        },
        toggleAnnotations() {
            this.showAnnotations = !this.showAnnotations;
            this.redrawCanvas();
            console.log('Annotations:', this.showAnnotations ? 'Visible' : 'Hidden');
        },
        saveDrawing() {
            localStorage.setItem('buildingPlannerShapes', JSON.stringify(this.shapes));
            console.log('Drawing saved!');
        },
        loadDrawing() {
            const savedShapes = localStorage.getItem('buildingPlannerShapes');
            if (savedShapes) {
                this.shapes = JSON.parse(savedShapes);
                this.redrawCanvas();
                console.log('Drawing loaded!');
            }
        },
        clearCanvas() {
            this.shapes = [];
            this.selectedShape = null;
            localStorage.removeItem('buildingPlannerShapes');
            this.redrawCanvas();
            console.log('Canvas cleared!');
        },
        startDrawing(event) {
            const canvas = document.getElementById('drawingCanvas');
            const rect = canvas.getBoundingClientRect();
            const x = event.clientX - rect.left;
            const y = event.clientY - rect.top;

            if (this.currentTool === 'select') {
                this.selectedShape = this.shapes.find(shape => this.isPointInShape(x, y, shape));
                if (this.selectedShape) {
                    this.resizeHandle = this.getResizeHandle(x, y, this.selectedShape);
                    if (this.resizeHandle) {
                        this.isResizing = true;
                    } else {
                        this.isDragging = true;
                    }
                    this.startX = x;
                    this.startY = y;
                }
                this.redrawCanvas();
                return;
            }

            this.startX = x;
            this.startY = y;
            this.isDrawing = true;
        },
        draw(event) {
            if (this.currentTool === 'select' && (this.isDragging || this.isResizing)) {
                const canvas = document.getElementById('drawingCanvas');
                const rect = canvas.getBoundingClientRect();
                const x = event.clientX - rect.left;
                const y = event.clientY - rect.top;

                if (this.isDragging) {
                    const dx = x - this.startX;
                    const dy = y - this.startY;
                    if (this.selectedShape.type === 'line') {
                        this.selectedShape.x1 += dx;
                        this.selectedShape.y1 += dy;
                        this.selectedShape.x2 += dx;
                        this.selectedShape.y2 += dy;
                    } else if (this.selectedShape.type === 'rectangle') {
                        this.selectedShape.x += dx;
                        this.selectedShape.y += dy;
                    } else if (this.selectedShape.type === 'circle') {
                        this.selectedShape.x += dx;
                        this.selectedShape.y += dy;
                    }
                    this.startX = x;
                    this.startY = y;
                } else if (this.isResizing) {
                    if (this.selectedShape.type === 'rectangle') {
                        if (this.resizeHandle === 'bottom-right') {
                            this.selectedShape.width = x - this.selectedShape.x;
                            this.selectedShape.height = y - this.selectedShape.y;
                        }
                    } else if (this.selectedShape.type === 'circle') {
                        const radius = Math.sqrt(Math.pow(x - this.selectedShape.x, 2) + Math.pow(y - this.selectedShape.y, 2));
                        this.selectedShape.radius = radius;
                    }
                }
                this.redrawCanvas();
                return;
            }

            if (!this.isDrawing) return;
            const canvas = document.getElementById('drawingCanvas');
            const ctx = canvas.getContext('2d');
            const rect = canvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;

            this.redrawCanvas();

            ctx.beginPath();
            if (this.currentTool === 'line') {
                ctx.moveTo(this.startX, this.startY);
                ctx.lineTo(endX, endY);
                ctx.stroke();
            } else if (this.currentTool === 'rectangle') {
                const width = endX - this.startX;
                const height = endY - this.startY;
                ctx.strokeRect(this.startX, this.startY, width, height);
            } else if (this.currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
                ctx.arc(this.startX, this.startY, radius, 0, 2 * Math.PI);
                ctx.stroke();
            }
        },
        stopDrawing(event) {
            if (this.currentTool === 'select') {
                this.isDragging = false;
                this.isResizing = false;
                this.resizeHandle = null;
                return;
            }

            if (!this.isDrawing) return;
            const canvas = document.getElementById('drawingCanvas');
            const rect = canvas.getBoundingClientRect();
            const endX = event.clientX - rect.left;
            const endY = event.clientY - rect.top;

            if (this.currentTool === 'line') {
                this.shapes.push({ type: 'line', x1: this.startX, y1: this.startY, x2: endX, y2: endY });
            } else if (this.currentTool === 'rectangle') {
                const width = endX - this.startX;
                const height = endY - this.startY;
                this.shapes.push({ type: 'rectangle', x: this.startX, y: this.startY, width: width, height: height });
            } else if (this.currentTool === 'circle') {
                const radius = Math.sqrt(Math.pow(endX - this.startX, 2) + Math.pow(endY - this.startY, 2));
                this.shapes.push({ type: 'circle', x: this.startX, y: this.startY, radius: radius });
            }

            this.isDrawing = false;
            this.redrawCanvas();
        },
        redrawCanvas() {
            const canvas = document.getElementById('drawingCanvas');
            const ctx = canvas.getContext('2d');
            ctx.clearRect(0, 0, canvas.width, canvas.height);

            this.shapes.forEach(shape => {
                ctx.beginPath();
                if (this.selectedShape === shape) {
                    ctx.strokeStyle = 'red';
                } else {
                    ctx.strokeStyle = 'black';
                }
                if (shape.type === 'line') {
                    ctx.moveTo(shape.x1, shape.y1);
                    ctx.lineTo(shape.x2, shape.y2);
                    ctx.stroke();
                    if (this.showAnnotations) {
                        const length = Math.sqrt(Math.pow(shape.x2 - shape.x1, 2) + Math.pow(shape.y2 - shape.y1, 2)).toFixed(0);
                        const midX = (shape.x1 + shape.x2) / 2;
                        const midY = (shape.y1 + shape.y2) / 2;
                        ctx.fillStyle = 'black';
                        ctx.font = '12px Arial';
                        ctx.fillText(`Length: ${length}px`, midX + 20, midY);
                    }
                } else if (shape.type === 'rectangle') {
                    ctx.strokeRect(shape.x, shape.y, shape.width, shape.height);
                    if (this.showAnnotations) {
                        ctx.fillStyle = 'black';
                        ctx.font = '12px Arial';
                        ctx.fillText(`W: ${Math.abs(shape.width).toFixed(0)}px, H: ${Math.abs(shape.height).toFixed(0)}px`, shape.x + 10, shape.y - 10);
                    }
                    if (this.selectedShape === shape) {
                        const handleSize = 8;
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(shape.x + shape.width - handleSize / 2, shape.y + shape.height - handleSize / 2, handleSize, handleSize);
                    }
                } else if (shape.type === 'circle') {
                    ctx.arc(shape.x, shape.y, shape.radius, 0, 2 * Math.PI);
                    ctx.stroke();
                    if (this.showAnnotations) {
                        ctx.fillStyle = 'black';
                        ctx.font = '12px Arial';
                        ctx.fillText(`R: ${shape.radius.toFixed(0)}px`, shape.x + shape.radius + 20, shape.y);
                    }
                    if (this.selectedShape === shape) {
                        const handleSize = 8;
                        ctx.fillStyle = 'blue';
                        ctx.fillRect(shape.x + shape.radius - handleSize / 2, shape.y - handleSize / 2, handleSize, handleSize);
                    }
                }
            });
        },
        isPointInShape(x, y, shape) {
            if (shape.type === 'line') {
                const dist = this.pointToLineDistance(x, y, shape.x1, shape.y1, shape.x2, shape.y2);
                return dist < 5;
            } else if (shape.type === 'rectangle') {
                return x >= shape.x && x <= shape.x + shape.width && y >= shape.y && y <= shape.y + shape.height;
            } else if (shape.type === 'circle') {
                const dist = Math.sqrt(Math.pow(x - shape.x, 2) + Math.pow(y - shape.y, 2));
                return dist <= shape.radius;
            }
            return false;
        },
        pointToLineDistance(px, py, x1, y1, x2, y2) {
            const A = px - x1;
            const B = py - y1;
            const C = x2 - x1;
            const D = y2 - y1;
            const dot = A * C + B * D;
            const lenSq = C * C + D * D;
            let param = -1;
            if (lenSq !== 0) param = dot / lenSq;
            let xx, yy;
            if (param < 0) {
                xx = x1;
                yy = y1;
            } else if (param > 1) {
                xx = x2;
                yy = y2;
            } else {
                xx = x1 + param * C;
                yy = y1 + param * D;
            }
            const dx = px - xx;
            const dy = py - yy;
            return Math.sqrt(dx * dx + dy * dy);
        },
        getResizeHandle(x, y, shape) {
            const handleSize = 8;
            if (shape.type === 'rectangle') {
                const handleX = shape.x + shape.width;
                const handleY = shape.y + shape.height;
                if (Math.abs(x - handleX) < handleSize / 2 && Math.abs(y - handleY) < handleSize / 2) {
                    return 'bottom-right';
                }
            } else if (shape.type === 'circle') {
                const handleX = shape.x + shape.radius;
                const handleY = shape.y;
                if (Math.abs(x - handleX) < handleSize / 2 && Math.abs(y - handleY) < handleSize / 2) {
                    return 'edge';
                }
            }
            return null;
        },
        deleteSelectedShape() {
            if (this.selectedShape) {
                this.shapes = this.shapes.filter(shape => shape !== this.selectedShape);
                this.selectedShape = null;
                this.redrawCanvas();
            }
        }
    },
    mounted() {
        const canvas = document.getElementById('drawingCanvas');
        canvas.addEventListener('mousedown', this.startDrawing);
        canvas.addEventListener('mousemove', this.draw);
        canvas.addEventListener('mouseup', this.stopDrawing);
        canvas.addEventListener('mouseout', this.stopDrawing);
        document.addEventListener('keydown', (event) => {
            if (event.key === 'Delete' && this.selectedShape) {
                this.deleteSelectedShape();
            }
        });
        // Load saved drawing when the app starts
        this.loadDrawing();
    }
});