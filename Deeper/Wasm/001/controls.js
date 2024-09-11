import { scene, plane, renderer, initialWidthSegments, initialHeightSegments } from './scene.js';

// Make buttons draggable
makeButtonDraggable(document.getElementById('subdivideButton'));
makeButtonDraggable(document.getElementById('displaceButton'));
makeButtonDraggable(document.getElementById('unsubdivideButton'));

// Subdivide button click event
document.getElementById('subdivideButton').addEventListener('click', subdivideMesh);

// Unsubdivide button click event
document.getElementById('unsubdivideButton').addEventListener('click', unsubdivideMesh);

// Displace button click event
document.getElementById('displaceButton').addEventListener('click', displaceWithSineWave);

// Subdivide the plane by adding more segments
function subdivideMesh() {
  const width = plane.geometry.parameters.width;
  const height = plane.geometry.parameters.height;
  const widthSegments = plane.geometry.parameters.widthSegments * 2;
  const heightSegments = plane.geometry.parameters.heightSegments * 2;

  const newGeometry = new THREE.PlaneGeometry(width, height, widthSegments, heightSegments);
  plane.geometry.dispose();
  plane.geometry = newGeometry;

  console.log('Plane subdivided:', widthSegments, heightSegments);
}

// Unsubdivide the plane by resetting to initial segments
function unsubdivideMesh() {
  const width = plane.geometry.parameters.width;
  const height = plane.geometry.parameters.height;

  const newGeometry = new THREE.PlaneGeometry(width, height, initialWidthSegments, initialHeightSegments);
  plane.geometry.dispose();
  plane.geometry = newGeometry;

  console.log('Plane unsubdivided:', initialWidthSegments, initialHeightSegments);
}

// WebGPU logic for sine wave displacement
async function displaceWithSineWave() {
  if (!navigator.gpu) {
    console.error('WebGPU not supported on this browser.');
    return;
  }

  const adapter = await navigator.gpu.requestAdapter();
  if (!adapter) {
    console.error('Failed to get GPU adapter.');
    return;
  }

  const device = await adapter.requestDevice();

  // Compute shader code for sine wave displacement
  const shaderCode = `
    @group(0) @binding(0) var<storage, read_write> positions : array<vec3<f32>>;

    @compute @workgroup_size(1) fn main(@builtin(global_invocation_id) id : vec3<u32>) {
      let index = id.x;
      let amplitude = 0.5;
      let frequency = 0.2;

      let x = positions[index].x;
      let y = positions[index].y;

      positions[index].z = sin((x + y) * frequency) * amplitude;
    }
  `;

  // Create shader module
  const shaderModule = device.createShaderModule({
    code: shaderCode,
  });

  // Get positions from geometry and create a buffer
  const positions = plane.geometry.attributes.position.array;
  const positionBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.STORAGE | GPUBufferUsage.COPY_DST | GPUBufferUsage.COPY_SRC,
    mappedAtCreation: true,
  });

  new Float32Array(positionBuffer.getMappedRange()).set(positions);
  positionBuffer.unmap();

  // Create bind group layout and bind group
  const bindGroupLayout = device.createBindGroupLayout({
    entries: [
      {
        binding: 0,
        visibility: GPUShaderStage.COMPUTE,
        buffer: {
          type: 'storage',
        },
      },
    ],
  });

  const pipelineLayout = device.createPipelineLayout({
    bindGroupLayouts: [bindGroupLayout],
  });

  const bindGroup = device.createBindGroup({
    layout: bindGroupLayout,
    entries: [
      {
        binding: 0,
        resource: {
          buffer: positionBuffer,
        },
      },
    ],
  });

  // Create compute pipeline
  const pipeline = device.createComputePipeline({
    layout: pipelineLayout,
    compute: {
      module: shaderModule,
      entryPoint: 'main',
    },
  });

  // Command encoder and pass
  const commandEncoder = device.createCommandEncoder();
  const passEncoder = commandEncoder.beginComputePass();
  passEncoder.setPipeline(pipeline);
  passEncoder.setBindGroup(0, bindGroup);
  passEncoder.dispatchWorkgroups(plane.geometry.attributes.position.count / 3);
  passEncoder.end();

  device.queue.submit([commandEncoder.finish()]);

  // Copy back updated positions
  const gpuReadBuffer = device.createBuffer({
    size: positions.byteLength,
    usage: GPUBufferUsage.COPY_DST | GPUBufferUsage.MAP_READ,
  });

  commandEncoder.copyBufferToBuffer(positionBuffer, 0, gpuReadBuffer, 0, positions.byteLength);
  await gpuReadBuffer.mapAsync(GPUMapMode.READ);
  const copiedArrayBuffer = gpuReadBuffer.getMappedRange();
  const updatedPositions = new Float32Array(copiedArrayBuffer);

  // Update geometry with new positions
  plane.geometry.attributes.position.array.set(updatedPositions);
  plane.geometry.attributes.position.needsUpdate = true;

  gpuReadBuffer.unmap();

  console.log('Applied sine wave displacement via WebGPU.');
}

// Make a button draggable
function makeButtonDraggable(button) {
  let isDragging = false;
  let offsetX, offsetY;

  button.addEventListener('mousedown', (event) => {
    isDragging = true;
    offsetX = event.clientX - button.getBoundingClientRect().left;
    offsetY = event.clientY - button.getBoundingClientRect().top;
  });

  document.addEventListener('mousemove', (event) => {
    if (isDragging) {
      button.style.left = `${event.clientX - offsetX}px`;
      button.style.top = `${event.clientY - offsetY}px`;
    }
  });

  document.addEventListener('mouseup', () => {
    isDragging = false;
  });
}
