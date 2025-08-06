// Micro-Engine.js - A distilled version of microgl.js

// 1. Global Math Helpers (from microgl.js)
var maths=Object.getOwnPropertyNames(Math);
for(var i in maths) window[maths[i].toUpperCase()]=Math[maths[i]];
const D2R = 0.0174532925;

// Core Types
const F32 = Float32Array;
const M4 = (v) => new F32(v || [1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1]);
const V3 = (v) => new F32(v || 3);

// 2. High-Performance Matrix Ops using DOMMatrix (from microgl.js)
const MULTMAT4 = (out, a, b) => { out.set((new DOMMatrix(a)).multiply(new DOMMatrix(b)).toFloat32Array()); return out; };

// Compute Shader Matrix Multiplication
const MULTMAT4_COMPUTE_SHADER = `
layout(local_size_x = 4, local_size_y = 4) in;

layout(std430, binding = 0) readonly buffer MatrixA {
    float matA[16];
};

layout(std430, binding = 1) readonly buffer MatrixB {
    float matB[16];
};

layout(std430, binding = 2) writeonly buffer Result {
    float result[16];
};

void main() {
    uint row = gl_LocalInvocationID.x;
    uint col = gl_LocalInvocationID.y;
    
    if (row >= 4u || col >= 4u) return;
    
    float sum = 0.0;
    for (uint k = 0u; k < 4u; k++) {
        sum += matA[row * 4u + k] * matB[k * 4u + col];
    }
    
    result[row * 4u + col] = sum;
}
`;

let _computeProgram = null;
let _bufferA = null;
let _bufferB = null;
let _bufferResult = null;

const MULTMAT4_COMPUTE = (engine, out, a, b) => {
    const gl = engine.gl;
    
    // Initialize compute program and buffers if needed
    if (!_computeProgram) {
        _computeProgram = engine.createComputeProgram(MULTMAT4_COMPUTE_SHADER);
        _bufferA = engine.createBuffer(new Float32Array(16));
        _bufferB = engine.createBuffer(new Float32Array(16));
        _bufferResult = engine.createBuffer(new Float32Array(16));
    }
    
    // Upload matrix data
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, _bufferA);
    gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, a);
    
    gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, _bufferB);
    gl.bufferSubData(gl.SHADER_STORAGE_BUFFER, 0, b);
    
    // Bind buffers
    engine.bindBuffer(_bufferA, 0);
    engine.bindBuffer(_bufferB, 1);
    engine.bindBuffer(_bufferResult, 2);
    
    // Dispatch compute shader (1 workgroup of 4x4 threads)
    engine.dispatch(_computeProgram, 1, 1, 1);
    
    // Read result
    const result = engine.readBuffer(_bufferResult, 16);
    out.set(result);
    
    return out;
};

const LOOKAT = (out, eye, center, up) => {
    let z0 = eye[0] - center[0], z1 = eye[1] - center[1], z2 = eye[2] - center[2];
    let len = 1 / SQRT(z0 * z0 + z1 * z1 + z2 * z2);
    z0 *= len; z1 *= len; z2 *= len;
    let x0 = up[1] * z2 - up[2] * z1, x1 = up[2] * z0 - up[0] * z2, x2 = up[0] * z1 - up[1] * z0;
    len = 1 / SQRT(x0 * x0 + x1 * x1 + x2 * x2);
    x0 *= len; x1 *= len; x2 *= len;
    let y0 = z1 * x2 - z2 * x1, y1 = z2 * x0 - z0 * x2, y2 = z0 * x1 - z1 * x0;
    out.set([
        x0, y0, z0, 0,
        x1, y1, z1, 0,
        x2, y2, z2, 0,
        -(x0 * eye[0] + x1 * eye[1] + x2 * eye[2]), -(y0 * eye[0] + y1 * eye[1] + y2 * eye[2]), -(z0 * eye[0] + z1 * eye[1] + z2 * eye[2]), 1
    ]);
    return out;
};
const PERSP = (out, fov, aspect, near, far) => {
    const f = 1.0 / TAN(fov * D2R / 2);
    out.set([
        f / aspect, 0, 0, 0,
        0, f, 0, 0,
        0, 0, (near + far) / (near - far), -1,
        0, 0, (2 * far * near) / (near - far), 0
    ]);
    return out;
};
const APPLYROT = (m, n, a, v) => {var r=M4(); RMAT4(r,a,v); return MULTMAT4(m||r,n,r)};
const RMAT4=(t,n,r)=>{var e=r[0],u=r[1],o=r[2],i=SQRT(e*e+u*u+o*o),s=0,c=0,f=0;if(i<0.0001)return null;return e*=i=1/i,u*=i,o*=i,s=SIN(n),c=COS(n),f=1-c,t[0]=e*e*f+c,t[1]=u*e*f+o*s,t[2]=o*e*f-u*s,t[3]=0,t[4]=e*u*f-o*s,t[5]=u*u*f+c,t[6]=o*u*f+e*s,t[7]=0,t[8]=e*o*f+u*s,t[9]=u*o*f-e*s,t[10]=o*o*f+c,t[11]=0,t[12]=0,t[13]=0,t[14]=0,t[15]=1,t}


class MicroEngine {
    constructor(canvas) {
        this.gl = canvas.getContext("webgl2", {});
        this.gl.clearColor(0.1, 0.1, 0.1, 1);
        this.gl.enable(this.gl.DEPTH_TEST);
        this.gl.enable(this.gl.CULL_FACE);
    }

    // 3. Automatic Shader Program (inspired by microgl.js)
    createProgram(vsSource, fsSource) {
        const gl = this.gl;
        const vs = this._createShader(gl.VERTEX_SHADER, vsSource);
        const fs = this._createShader(gl.FRAGMENT_SHADER, fsSource);
        const p = gl.createProgram();
        gl.attachShader(p, vs);
        gl.attachShader(p, fs);
        gl.linkProgram(p);

        if (!gl.getProgramParameter(p, gl.LINK_STATUS)) {
            throw new Error(`Could not link program: ${gl.getProgramInfoLog(p)}`);
        }

        p.uniforms = {};
        const numUniforms = gl.getProgramParameter(p, gl.ACTIVE_UNIFORMS);
        const UNIFUNCS = { 5124: "1i", 5125: "1ui", 5126: "1f", 35664: "2fv", 35665: "3fv", 35666: "4fv", 35676: "Matrix4fv", 35678: "1i" };
        for (let i = 0; i < numUniforms; ++i) {
            const info = gl.getActiveUniform(p, i);
            const loc = gl.getUniformLocation(p, info.name);
            const setter = (v) => {
                const funcName = UNIFUNCS[info.type];
                if (funcName.includes("Matrix")) {
                    gl[`uniform${funcName}`](loc, false, v);
                } else {
                    gl[`uniform${funcName}`](loc, v);
                }
            };
            p.uniforms[info.name] = setter;
        }
        return p;
    }

    _createShader(type, source) {
        const gl = this.gl;
        const sh = gl.createShader(type);
        const header = `#version 300 es\nprecision highp float;\n`;
        gl.shaderSource(sh, header + source);
        gl.compileShader(sh);
        if (!gl.getShaderParameter(sh, gl.COMPILE_STATUS)) {
            throw new Error(`Could not compile shader: ${gl.getShaderInfoLog(sh)}`);
        }
        return sh;
    }

    // 4. Convention-based Mesh creation (inspired by microgl.js)
    createMesh(data) {
        const gl = this.gl;
        const mesh = {
            draw: (program, mode = gl.TRIANGLES) => {
                gl.useProgram(program);
                gl.bindVertexArray(mesh.vao);
                if (mesh.indices) {
                    gl.drawElements(mode, mesh.numElements, gl.UNSIGNED_SHORT, 0);
                } else {
                    gl.drawArrays(mode, 0, mesh.numElements);
                }
                gl.bindVertexArray(null);
            }
        };

        mesh.vao = gl.createVertexArray();
        gl.bindVertexArray(mesh.vao);

        for (const name in data) {
            const bufferData = data[name];
            const buffer = gl.createBuffer();
            if (name === 'indices') {
                mesh.indices = buffer;
                mesh.numElements = bufferData.length;
                gl.bindBuffer(gl.ELEMENT_ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ELEMENT_ARRAY_BUFFER, new Uint16Array(bufferData), gl.STATIC_DRAW);
            } else {
                const loc = gl.getAttribLocation(this.currentProgram, name);
                if (loc === -1) continue;
                const numComponents = name.length; // pos: 3, uv: 2, color: 5 (oops, need better way)
                let inferredNum = 3;
                if(name === 'uv') inferredNum = 2;
                if(name === 'color') inferredNum = 4;

                gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
                gl.bufferData(gl.ARRAY_BUFFER, new Float32Array(bufferData), gl.STATIC_DRAW);
                gl.enableVertexAttribArray(loc);
                gl.vertexAttribPointer(loc, inferredNum, gl.FLOAT, false, 0, 0);
                if(!mesh.numElements) {
                    mesh.numElements = bufferData.length / inferredNum;
                }
            }
        }
        gl.bindVertexArray(null);
        return mesh;
    }
    
    clear() {
        this.gl.clear(this.gl.COLOR_BUFFER_BIT | this.gl.DEPTH_BUFFER_BIT);
    }
    
    useProgram(p) {
        this.gl.useProgram(p);
        this.currentProgram = p;
    }
    
    // 5. Compute Shader Support
    createComputeProgram(source) {
        const gl = this.gl;
        const computeShader = this._createShader(gl.COMPUTE_SHADER, source);
        const program = gl.createProgram();
        gl.attachShader(program, computeShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            throw new Error(`Could not link compute program: ${gl.getProgramInfoLog(program)}`);
        }
        
        return program;
    }
    
    createBuffer(data, usage = this.gl.STATIC_DRAW) {
        const gl = this.gl;
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        gl.bufferData(gl.SHADER_STORAGE_BUFFER, data, usage);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
        return buffer;
    }
    
    bindBuffer(buffer, binding) {
        const gl = this.gl;
        gl.bindBufferBase(gl.SHADER_STORAGE_BUFFER, binding, buffer);
    }
    
    dispatch(program, x, y = 1, z = 1) {
        const gl = this.gl;
        gl.useProgram(program);
        gl.dispatchCompute(x, y, z);
        gl.memoryBarrier(gl.SHADER_STORAGE_BARRIER_BIT);
    }
    
    readBuffer(buffer, size) {
        const gl = this.gl;
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, buffer);
        const result = new Float32Array(size);
        gl.getBufferSubData(gl.SHADER_STORAGE_BUFFER, 0, result);
        gl.bindBuffer(gl.SHADER_STORAGE_BUFFER, null);
        return result;
    }
}
