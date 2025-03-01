/**
 * Noise Generation System
 * 
 * Implements various noise algorithms (Perlin, Simplex, etc.) for procedural generation
 */
window.Game = window.Game || {};
Game.generation = Game.generation || {};
Game.generation.noise = {};

(function() {
    // Permutation table for Perlin noise
    let permTable = [];
    let initialized = false;
    
    // Initialize noise system
    Game.generation.noise.init = function(seed) {
        console.log('Initializing noise generation system');
        
        seed = seed || Math.floor(Math.random() * 1000000);
        seedNoise(seed);
        initialized = true;
        
        return Promise.resolve();
    };
    
    // Seed the noise generators
    function seedNoise(seed) {
        const random = Game.utils.math.createRandom(seed);
        
        // Build the permutation table
        permTable = Array(512);
        
        // First fill with ordered values
        for (let i = 0; i < 256; i++) {
            permTable[i] = i;
        }
        
        // Shuffle the array using Fisher-Yates
        for (let i = 255; i > 0; i--) {
            const j = Math.floor(random() * (i + 1));
            [permTable[i], permTable[j]] = [permTable[j], permTable[i]];
        }
        
        // Duplicate to avoid buffer overflow
        for (let i = 0; i < 256; i++) {
            permTable[i + 256] = permTable[i];
        }
    }
    
    // Fade function for Perlin noise
    function fade(t) {
        return t * t * t * (t * (t * 6 - 15) + 10);
    }
    
    // Linear interpolation
    function lerp(a, b, t) {
        return a + t * (b - a);
    }
    
    // Gradient function for Perlin noise
    function grad(hash, x, y, z) {
        // Convert low 4 bits of hash code into 12 gradient directions
        const h = hash & 15;
        const u = h < 8 ? x : y;
        const v = h < 4 ? y : h == 12 || h == 14 ? x : z;
        return ((h & 1) == 0 ? u : -u) + ((h & 2) == 0 ? v : -v);
    }
    
    // 2D Perlin noise implementation
    Game.generation.noise.perlin2D = function(x, y, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        } else if (seed !== undefined) {
            seedNoise(seed);
        }
        
        // Determine grid cell coordinates
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        
        // Get relative coordinates in grid cell
        x -= Math.floor(x);
        y -= Math.floor(y);
        
        // Compute fade curves
        const u = fade(x);
        const v = fade(y);
        
        // Hash coordinates of the 4 corners
        const AA = permTable[permTable[X] + Y];
        const AB = permTable[permTable[X] + Y + 1];
        const BA = permTable[permTable[X + 1] + Y];
        const BB = permTable[permTable[X + 1] + Y + 1];
        
        // Add blended results from the corners
        const result = lerp(
            lerp(grad(AA, x, y, 0), grad(BA, x - 1, y, 0), u),
            lerp(grad(AB, x, y - 1, 0), grad(BB, x - 1, y - 1, 0), u),
            v
        );
        
        // Return result in the range [-1, 1]
        return result;
    };
    
    // 3D Perlin noise implementation
    Game.generation.noise.perlin3D = function(x, y, z, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        } else if (seed !== undefined) {
            seedNoise(seed);
        }
        
        // Determine grid cell coordinates
        const X = Math.floor(x) & 255;
        const Y = Math.floor(y) & 255;
        const Z = Math.floor(z) & 255;
        
        // Get relative coordinates in grid cell
        x -= Math.floor(x);
        y -= Math.floor(y);
        z -= Math.floor(z);
        
        // Compute fade curves
        const u = fade(x);
        const v = fade(y);
        const w = fade(z);
        
        // Hash coordinates of the 8 corners
        const A = permTable[X] + Y;
        const AA = permTable[A] + Z;
        const AB = permTable[A + 1] + Z;
        const B = permTable[X + 1] + Y;
        const BA = permTable[B] + Z;
        const BB = permTable[B + 1] + Z;
        
        // Add blended results from the corners
        return lerp(
            lerp(
                lerp(grad(permTable[AA], x, y, z),
                     grad(permTable[BA], x - 1, y, z),
                     u),
                lerp(grad(permTable[AB], x, y - 1, z),
                     grad(permTable[BB], x - 1, y - 1, z),
                     u),
                v),
            lerp(
                lerp(grad(permTable[AA + 1], x, y, z - 1),
                     grad(permTable[BA + 1], x - 1, y, z - 1),
                     u),
                lerp(grad(permTable[AB + 1], x, y - 1, z - 1),
                     grad(permTable[BB + 1], x - 1, y - 1, z - 1),
                     u),
                v),
            w
        );
    };
    
    // SimplexNoise implementation
    Game.generation.noise.simplex2D = function(x, y, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        } else if (seed !== undefined) {
            seedNoise(seed);
        }
        
        // Simplex noise constants
        const F2 = 0.5 * (Math.sqrt(3) - 1);
        const G2 = (3 - Math.sqrt(3)) / 6;
        
        // Skew the input space to determine which simplex cell we're in
        const s = (x + y) * F2;
        const i = Math.floor(x + s);
        const j = Math.floor(y + s);
        
        // Unskew the cell origin back to (x,y) space
        const t = (i + j) * G2;
        const X0 = i - t;
        const Y0 = j - t;
        const x0 = x - X0;
        const y0 = y - Y0;
        
        // For the 2D case, the simplex shape is an equilateral triangle.
        // Determine which simplex we are in.
        let i1, j1; // Offsets for second (middle) corner of simplex
        if (x0 > y0) {
            // Lower triangle, XY order: (0,0)->(1,0)->(1,1)
            i1 = 1;
            j1 = 0;
        } else {
            // Upper triangle, YX order: (0,0)->(0,1)->(1,1)
            i1 = 0;
            j1 = 1;
        }
        
        // A step of (1,0) in (i,j) means a step of (1-c,-c) in (x,y), and
        // a step of (0,1) in (i,j) means a step of (-c,1-c) in (x,y), where c = (3-sqrt(3))/6
        
        const x1 = x0 - i1 + G2; // Offsets for middle corner
        const y1 = y0 - j1 + G2;
        const x2 = x0 - 1 + 2 * G2; // Offsets for last corner
        const y2 = y0 - 1 + 2 * G2;
        
        // Work out the hashed gradient indices of the three simplex corners
        const ii = i & 255;
        const jj = j & 255;
        const gi0 = permTable[ii + permTable[jj]] % 12;
        const gi1 = permTable[ii + i1 + permTable[jj + j1]] % 12;
        const gi2 = permTable[ii + 1 + permTable[jj + 1]] % 12;
        
        // Calculate the contribution from the three corners
        let n0, n1, n2;
        
        // Corner 0
        let t0 = 0.5 - x0 * x0 - y0 * y0;
        if (t0 < 0) {
            n0 = 0;
        } else {
            t0 *= t0;
            n0 = t0 * t0 * dot(grad3[gi0], x0, y0);
        }
        
        // Corner 1
        let t1 = 0.5 - x1 * x1 - y1 * y1;
        if (t1 < 0) {
            n1 = 0;
        } else {
            t1 *= t1;
            n1 = t1 * t1 * dot(grad3[gi1], x1, y1);
        }
        
        // Corner 2
        let t2 = 0.5 - x2 * x2 - y2 * y2;
        if (t2 < 0) {
            n2 = 0;
        } else {
            t2 *= t2;
            n2 = t2 * t2 * dot(grad3[gi2], x2, y2);
        }
        
        // Add contributions from each corner to get the final noise value.
        // The result is scaled to return values in the interval [-1, 1]
        return 70 * (n0 + n1 + n2);
    };
    
    // Fractional Brownian Motion using Perlin noise
    Game.generation.noise.fBm2D = function(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        }
        
        let amplitude = 1.0;
        let frequency = 1.0;
        let sum = 0.0;
        let maxValue = 0.0; // Used for normalization
        
        // Add successive octaves of noise
        for (let i = 0; i < octaves; i++) {
            sum += amplitude * Game.generation.noise.perlin2D(x * frequency, y * frequency, seed + i);
            maxValue += amplitude;
            amplitude *= gain;
            frequency *= lacunarity;
        }
        
        // Normalize the result
        return sum / maxValue;
    };
    
    // Ridged multifractal noise
    Game.generation.noise.ridgedMultifractal = function(x, y, octaves = 6, lacunarity = 2.0, gain = 0.5, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        }
        
        let amplitude = 1.0;
        let frequency = 1.0;
        let sum = 0.0;
        let maxValue = 0.0;
        
        for (let i = 0; i < octaves; i++) {
            // Get absolute value of noise
            const noise = Math.abs(Game.generation.noise.perlin2D(x * frequency, y * frequency, seed + i));
            
            // Invert and transform the noise to create ridges
            const ridge = 1.0 - noise;
            const signal = Math.pow(ridge, 2);
            
            sum += signal * amplitude;
            maxValue += amplitude;
            
            amplitude *= gain;
            frequency *= lacunarity;
        }
        
        // Normalize
        return sum / maxValue;
    };
    
    // Voronoi/cellular noise
    Game.generation.noise.voronoi = function(x, y, seed) {
        if (!initialized) {
            Game.generation.noise.init(seed);
        }
        
        const random = Game.utils.math.createRandom(seed);
        
        // Determine which cell contains this point
        const cellX = Math.floor(x);
        const cellY = Math.floor(y);
        
        let minDist = 1.0; // Initialize with maximum possible distance
        
        // Search neighboring cells for closest feature point
        for (let i = -1; i <= 1; i++) {
            for (let j = -1; j <= 1; j++) {
                const neighborX = cellX + i;
                const neighborY = cellY + j;
                
                // Generate a random point within the cell using its coordinates as seed
                const pointSeed = neighborX * 1000 + neighborY;
                const pointRandom = Game.utils.math.createRandom(pointSeed + seed);
                
                // Feature point within cell (0-1 range)
                const pointX = neighborX + pointRandom();
                const pointY = neighborY + pointRandom();
                
                // Calculate distance to feature point
                const dx = pointX - x;
                const dy = pointY - y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                
                minDist = Math.min(minDist, dist);
            }
        }
        
        return minDist;
    };
    
    // Utility helper function for simplex noise
    function dot(g, x, y) {
        return g[0] * x + g[1] * y;
    }
    
    // Gradient vectors for simplex noise
    const grad3 = [
        [1, 1], [-1, 1], [1, -1], [-1, -1],
        [1, 0], [-1, 0], [1, 0], [-1, 0],
        [0, 1], [0, -1], [0, 1], [0, -1]
    ];
})();
