/**
 * Math Utilities
 * 
 * Provides mathematical functions, random number generation, and
 * other math-related utilities for the game.
 */
window.Game = window.Game || {};
Game.utils = Game.utils || {};
Game.utils.math = {};

(function() {
    // Initialize math utilities
    Game.utils.math.init = function() {
        console.log('Initializing math utilities');
        return Promise.resolve();
    };
    
    // Create a deterministic random number generator from a seed
    Game.utils.math.createRandom = function(seed) {
        // Simple seeded random function
        let s = seed || 1;
        return function() {
            s = Math.sin(s) * 10000;
            return s - Math.floor(s);
        };
    };
    
    // Linear interpolation
    Game.utils.math.lerp = function(a, b, t) {
        return a + (b - a) * t;
    };
    
    // Clamp a value between min and max
    Game.utils.math.clamp = function(value, min, max) {
        return Math.min(Math.max(value, min), max);
    };
    
    // Get a random integer between min and max (inclusive)
    Game.utils.math.randomInt = function(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    };
    
    // Calculate distance between two points
    Game.utils.math.distance = function(x1, y1, x2, y2) {
        return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
    };
    
    // Calculate 3D distance between points
    Game.utils.math.distance3D = function(p1, p2) {
        return Math.sqrt(
            Math.pow(p2.x - p1.x, 2) + 
            Math.pow(p2.y - p1.y, 2) + 
            Math.pow(p2.z - p1.z, 2)
        );
    };
    
    // Convert degrees to radians
    Game.utils.math.degToRad = function(degrees) {
        return degrees * Math.PI / 180;
    };
    
    // Convert radians to degrees
    Game.utils.math.radToDeg = function(radians) {
        return radians * 180 / Math.PI;
    };
    
    // Check if a point is inside a polygon
    Game.utils.math.pointInPolygon = function(point, polygon) {
        // Implementation of point-in-polygon algorithm
        let inside = false;
        for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
            const xi = polygon[i].x, yi = polygon[i].y;
            const xj = polygon[j].x, yj = polygon[j].y;
            
            const intersect = ((yi > point.y) != (yj > point.y))
                && (point.x < (xj - xi) * (point.y - yi) / (yj - yi) + xi);
            if (intersect) inside = !inside;
        }
        return inside;
    };
    
    // Vector 3D operations
    Game.utils.math.vec3 = {
        // Create a new vector
        create: function(x = 0, y = 0, z = 0) {
            return { x, y, z };
        },
        
        // Add two vectors
        add: function(v1, v2) {
            return {
                x: v1.x + v2.x,
                y: v1.y + v2.y,
                z: v1.z + v2.z
            };
        },
        
        // Subtract v2 from v1
        subtract: function(v1, v2) {
            return {
                x: v1.x - v2.x,
                y: v1.y - v2.y,
                z: v1.z - v2.z
            };
        },
        
        // Multiply vector by scalar
        multiply: function(v, scalar) {
            return {
                x: v.x * scalar,
                y: v.y * scalar,
                z: v.z * scalar
            };
        },
        
        // Calculate vector magnitude (length)
        magnitude: function(v) {
            return Math.sqrt(v.x * v.x + v.y * v.y + v.z * v.z);
        },
        
        // Normalize vector (make unit length)
        normalize: function(v) {
            const mag = this.magnitude(v);
            if (mag === 0) return { x: 0, y: 0, z: 0 };
            return {
                x: v.x / mag,
                y: v.y / mag,
                z: v.z / mag
            };
        },
        
        // Dot product of two vectors
        dot: function(v1, v2) {
            return v1.x * v2.x + v1.y * v2.y + v1.z * v2.z;
        },
        
        // Cross product of two vectors
        cross: function(v1, v2) {
            return {
                x: v1.y * v2.z - v1.z * v2.y,
                y: v1.z * v2.x - v1.x * v2.z,
                z: v1.x * v2.y - v1.y * v2.x
            };
        },
        
        // Linear interpolation between vectors
        lerp: function(v1, v2, t) {
            return {
                x: v1.x + (v2.x - v1.x) * t,
                y: v1.y + (v2.y - v1.y) * t,
                z: v1.z + (v2.z - v1.z) * t
            };
        },
        
        // Calculate distance between two vectors
        distance: function(v1, v2) {
            return Math.sqrt(
                Math.pow(v2.x - v1.x, 2) +
                Math.pow(v2.y - v1.y, 2) +
                Math.pow(v2.z - v1.z, 2)
            );
        },
        
        // Calculate angle between two vectors (in radians)
        angle: function(v1, v2) {
            const dot = this.dot(v1, v2);
            const magProduct = this.magnitude(v1) * this.magnitude(v2);
            return Math.acos(dot / magProduct);
        },
        
        // Reflect vector v around normal n
        reflect: function(v, n) {
            const normalizedN = this.normalize(n);
            const dot = this.dot(v, normalizedN);
            return this.subtract(v, this.multiply(normalizedN, 2 * dot));
        }
    };
    
    // More advanced random number generation with improved seeding
    Game.utils.math.random = {
        // Implementation of xorshift128+ algorithm for better randomness
        createGenerator: function(seed = Date.now()) {
            let s0 = seed >>> 0;
            let s1 = (seed * 369) >>> 0;
            
            // Quick check to ensure non-zero seed state
            if (s0 === 0) s0 = 1;
            if (s1 === 0) s1 = 2;
            
            return function(min = 0, max = 1) {
                // XORShift128+ algorithm
                let x = s0;
                const y = s1;
                s0 = y;
                x ^= x << 23;
                s1 = x ^ y ^ (x >> 17) ^ (y >> 26);
                
                // Get value between 0 and 1
                const value = (s1 + y) >>> 0;
                const result = value / 4294967296;
                
                // Map to requested range if supplied
                if (min === 0 && max === 1) {
                    return result;
                }
                
                if (Number.isInteger(min) && Number.isInteger(max)) {
                    // Integer range
                    return Math.floor(result * (max - min + 1)) + min;
                }
                
                // Float range
                return result * (max - min) + min;
            };
        },
        
        // Generate deterministic random based on position (for world gen)
        forPosition: function(x, y, z = 0, seed = 0) {
            const combinedSeed = (x * 73856093) ^ (y * 19349663) ^ (z * 83492791) ^ seed;
            return this.createGenerator(combinedSeed);
        },
        
        // Generate noise value at position using a stable seed for a specific feature
        noise: function(x, y, z = 0, feature = '', seed = 0) {
            // Convert feature string to numeric hash
            let featureHash = 0;
            for (let i = 0; i < feature.length; i++) {
                featureHash = feature.charCodeAt(i) + ((featureHash << 5) - featureHash);
            }
            
            const generator = this.forPosition(x, y, z, seed ^ featureHash);
            return generator();
        }
    };
    
    // Easing functions for animations and transitions
    Game.utils.math.easing = {
        linear: function(t) {
            return t;
        },
        easeInQuad: function(t) {
            return t * t;
        },
        easeOutQuad: function(t) {
            return t * (2 - t);
        },
        easeInOutQuad: function(t) {
            return t < 0.5 ? 2 * t * t : -1 + (4 - 2 * t) * t;
        },
        easeInCubic: function(t) {
            return t * t * t;
        },
        easeOutCubic: function(t) {
            return (--t) * t * t + 1;
        },
        easeInOutCubic: function(t) {
            return t < 0.5 ? 4 * t * t * t : (t - 1) * (2 * t - 2) * (2 * t - 2) + 1;
        },
        easeInElastic: function(t) {
            return t === 0 ? 0 : t === 1 ? 1 : -Math.pow(2, 10 * t - 10) * Math.sin((t * 10 - 10.75) * ((2 * Math.PI) / 3));
        },
        easeOutElastic: function(t) {
            return t === 0 ? 0 : t === 1 ? 1 : Math.pow(2, -10 * t) * Math.sin((t * 10 - 0.75) * ((2 * Math.PI) / 3)) + 1;
        }
    };
    
    // Color utility functions
    Game.utils.math.color = {
        // Lerp between colors (hex format)
        lerpHex: function(color1, color2, t) {
            // Convert hex to rgb
            const rgb1 = this.hexToRgb(color1);
            const rgb2 = this.hexToRgb(color2);
            
            // Interpolate each channel
            const r = Math.round(Game.utils.math.lerp(rgb1.r, rgb2.r, t));
            const g = Math.round(Game.utils.math.lerp(rgb1.g, rgb2.g, t));
            const b = Math.round(Game.utils.math.lerp(rgb1.b, rgb2.b, t));
            
            // Convert back to hex
            return this.rgbToHex(r, g, b);
        },
        
        // Convert hex color to rgb
        hexToRgb: function(hex) {
            // Expand shorthand form (e.g. "03F") to full form (e.g. "0033FF")
            const shorthandRegex = /^#?([a-f\d])([a-f\d])([a-f\d])$/i;
            hex = hex.replace(shorthandRegex, function(m, r, g, b) {
                return r + r + g + g + b + b;
            });
            
            const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
            return result ? {
                r: parseInt(result[1], 16),
                g: parseInt(result[2], 16),
                b: parseInt(result[3], 16)
            } : null;
        },
        
        // Convert rgb to hex color
        rgbToHex: function(r, g, b) {
            const componentToHex = (c) => {
                const hex = c.toString(16);
                return hex.length === 1 ? '0' + hex : hex;
            };
            
            return '#' + componentToHex(r) + componentToHex(g) + componentToHex(b);
        }
    };
})();
