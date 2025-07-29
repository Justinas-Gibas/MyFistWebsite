import * as THREE from 'three/webgpu';
import { FontLoader, RoomEnvironment, TextGeometry } from 'three/examples/jsm/Addons.js';
import {
  storage,
  uniform,
  Fn,
  instanceIndex,
  vec3,
  float,
  color,
  uv,
  time,
  mx_noise_vec3,
  mx_noise_float,
  length,
  step,
  mix,
  rotate,
  hue,
  smoothstep,
  normalView,
  output,
  pass,
  mrt,
} from 'three/tsl';
import { bloom } from 'three/examples/jsm/tsl/display/BloomNode.js';
import { ao } from 'three/examples/jsm/tsl/display/GTAONode.js';
import { denoise } from 'three/examples/jsm/tsl/display/DenoiseNode.js';

const Resources = {
  font: undefined,
};

function preload() {
  const _font_loader = new FontLoader();
  _font_loader.load('./assets/Times New Roman_Regular.json', (font) => {
    Resources.font = font;
    init();
  });
}

async function init() {
  document.body.classList.remove('loading');
  
  // Scene setup
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  };

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(60, sizes.width / sizes.height, 0.1, 100);
  
  // WebGPU Renderer setup
  const renderer = new THREE.WebGPURenderer({ 
    antialias: true, 
    canvas: document.getElementById('canvas'),
    powerPreference: 'high-performance'
  });
  
  renderer.toneMapping = THREE.CineonToneMapping;
  renderer.toneMappingExposure = 0.5;
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setSize(sizes.width, sizes.height);
  
  // Initialize WebGPU backend
  await renderer.init();
  
  if (!document.getElementById('canvas')) {
    document.body.appendChild(renderer.domElement);
  }
  
  camera.position.z = 5.0;
  scene.add(camera);

  // Environment setup
  scene.fog = new THREE.Fog(new THREE.Color('#41444c'), 0.0, 8.5);
  scene.background = scene.fog.color;

  const environment = new RoomEnvironment();
  const pmremGenerator = new THREE.PMREMGenerator(renderer);
  
  try {
    const envTexture = await pmremGenerator.fromSceneAsync(environment);
    scene.environment = envTexture.texture;
    scene.environmentIntensity = 0.8;
  } catch (error) {
    console.warn('Environment texture failed, using basic lighting');
  }

  const light = new THREE.DirectionalLight('#e7e2ca', 5);
  light.position.set(0.0, 1.2, 3.86);
  scene.add(light);

  // Text geometry creation
  const text_geo = new TextGeometry('TSL', {
    font: Resources.font,
    size: 1.0,
    depth: 0.2,
    bevelEnabled: true,
    bevelThickness: 0.1,
    bevelSize: 0.01,
    bevelOffset: 0,
    bevelSegments: 1,
  });

  // Center the text geometry
  text_geo.computeBoundingBox();
  const centerOffset = -0.5 * (text_geo.boundingBox.max.x - text_geo.boundingBox.min.x);
  const centerOffsety = -0.5 * (text_geo.boundingBox.max.y - text_geo.boundingBox.min.y);
  text_geo.translate(centerOffset, centerOffsety, 0);

  const mesh = new THREE.Mesh(
    text_geo,
    new THREE.MeshStandardMaterial({
      color: '#656565',
      metalness: 0.4,
      roughness: 0.3,
    })
  );

  scene.add(mesh);

  // Interaction uniforms
  const u_input_pos = uniform(new THREE.Vector3(0, 0, 0));
  const u_input_pos_press = uniform(0.0);

  // Parameters for effects
  const parameters = {
    noise_amp: 1.6,
    text_color: '#212121',
    emissive_color: '#0066ff',
    spring: 0.05,
    friction: 0.9,
    emissive_boost: 5.0,
    explode_amp: 1.5,
    glitch_intensity: 0.8,
    bloom_strength: 1.2,
  };

  // Create GUI controls (simplified inline controls)
  createSimpleControls(parameters);

  // TSL Uniforms
  const u_noise_amp = uniform(parameters.noise_amp);
  const u_spring = uniform(parameters.spring);
  const u_friction = uniform(parameters.friction);
  const u_explode_amp = uniform(parameters.explode_amp);
  const emissive_color = uniform(new THREE.Color(parameters.emissive_color));
  const emissive_boost = uniform(parameters.emissive_boost);
  const u_glitch_intensity = uniform(parameters.glitch_intensity);
  const u_bloom_strength = uniform(parameters.bloom_strength);

  // Storage buffers for compute shaders
  const count = text_geo.attributes.position.count;
  const initial_position = storage(text_geo.attributes.position, 'vec3', count);
  const normal_at = storage(text_geo.attributes.normal, 'vec3', count);
  const position_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), 'vec3', count);
  const velocity_storage_at = storage(new THREE.StorageBufferAttribute(count, 3), 'vec3', count);

  // Initialize compute shader
  const compute_init = Fn(() => {
    position_storage_at.element(instanceIndex).assign(initial_position.element(instanceIndex));
    velocity_storage_at.element(instanceIndex).assign(vec3(0.0, 0.0, 0.0));
  })().compute(count);

  await renderer.computeAsync(compute_init);

  // Main compute shader with advanced effects
  const compute_update = Fn(() => {
    const base_position = initial_position.element(instanceIndex);
    const current_position = position_storage_at.element(instanceIndex);
    const current_velocity = velocity_storage_at.element(instanceIndex);
    const normal = normal_at.element(instanceIndex);

    // Enhanced noise system
    const timeOffset = time.mul(0.01);
    const noisePos = current_position.mul(0.5).add(vec3(timeOffset, timeOffset.mul(1.3), 0.0));
    const noise = mx_noise_vec3(noisePos, 1.0, 2.0).mul(u_noise_amp);
    
    // Add secondary noise layer
    const fineNoise = mx_noise_vec3(noisePos.mul(3.0), 0.3, 1.5).mul(0.2);
    const complexNoise = noise.add(fineNoise);

    // Distance-based influence with smooth falloff
    const distance = length(u_input_pos.sub(base_position));
    const influence = smoothstep(0.8, 0.0, distance);
    const pointer_influence = influence.mul(u_explode_amp);

    // Glitch effect
    const glitchNoise = mx_noise_float(vec3(base_position.x.mul(20.0), time.mul(5.0), base_position.z.mul(15.0)), 1.0);
    const glitchSpike = step(0.95, glitchNoise).mul(u_glitch_intensity);
    const glitchOffset = normal.mul(glitchSpike).mul(0.5);

    // Calculate displaced position with rotation
    const explosionDir = normal.add(complexNoise.mul(0.3)).add(glitchOffset);
    const displaced_pos = base_position.add(explosionDir.mul(pointer_influence));

    // Add rotation for more chaotic movement
    const rotationAxis = normal.cross(vec3(1.0, 0.0, 0.0)).normalize();
    const rotationAngle = pointer_influence.mul(Math.PI * 0.3);
    const rotated_pos = rotate(displaced_pos.sub(base_position), rotationAxis.mul(rotationAngle)).add(base_position);
    
    // Mix based on interaction state
    const final_displaced = mix(base_position, rotated_pos, u_input_pos_press.mul(0.8).add(0.2));

    // Enhanced spring physics
    const springForce = final_displaced.sub(current_position).mul(u_spring);
    current_velocity.addAssign(springForce);
    current_position.addAssign(current_velocity);
    current_velocity.assign(current_velocity.mul(u_friction));
  })().compute(count);

  // Apply compute results to mesh
  mesh.material.positionNode = position_storage_at.toAttribute();

  // Advanced emissive system
  const vel_at = velocity_storage_at.toAttribute();
  const velocity_magnitude = length(vel_at);
  
  // Dynamic hue rotation based on velocity and time
  const hue_rotated = velocity_magnitude.mul(Math.PI * 15.0).add(time.mul(0.5));
  const base_emissive = hue(emissive_color, hue_rotated);
  
  // Glitch color spikes
  const glitch_color = color('#00ff88');
  const glitch_spike = step(0.98, mx_noise_float(vec3(time.mul(8.0)), 1.0));
  const final_emissive = mix(base_emissive, glitch_color, glitch_spike.mul(u_glitch_intensity));
  
  // Intensity based on movement
  const emission_factor = velocity_magnitude.mul(15.0).add(0.1);
  
  mesh.material.emissiveNode = final_emissive.mul(emission_factor).mul(emissive_boost);

  // Enhanced Post Processing
  const composer = new THREE.PostProcessing(renderer);
  const scene_pass = pass(scene, camera);

  scene_pass.setMRT(
    mrt({
      output: output,
      normal: normalView,
    })
  );

  const scene_color = scene_pass.getTextureNode('output');
  const scene_depth = scene_pass.getTextureNode('depth');
  const scene_normal = scene_pass.getTextureNode('normal');

  // Enhanced AO
  const ao_pass = ao(scene_depth, scene_normal, camera);
  ao_pass.resolutionScale = 1.0;

  const ao_denoise = denoise(ao_pass.getTextureNode(), scene_depth, scene_normal, camera);
  const ao_enhanced = ao_denoise.mul(scene_color);

  // Dynamic bloom
  const bloom_pass = bloom(
    ao_enhanced, 
    u_bloom_strength, 
    0.4, 
    0.1
  );

  // Enhanced film grain with glitch
  const grain_base = mx_noise_float(vec3(uv(), time.mul(0.1)).mul(sizes.width), 0.03);
  const glitch_grain = mx_noise_float(vec3(time.mul(20.0), uv().x.mul(100.0), 0.0), 0.05);
  const post_noise = grain_base.add(glitch_grain.mul(u_glitch_intensity)).mul(0.8);

  // Color aberration effect
  const aberration = mx_noise_float(vec3(uv().mul(10.0), time.mul(3.0)), 0.01).mul(u_glitch_intensity);

  composer.outputNode = ao_enhanced.add(bloom_pass).add(post_noise).add(aberration);

  // Interaction setup
  const ray_cast = new THREE.Raycaster();

  window.addEventListener('pointerup', (event) => {
    u_input_pos_press.value = 0.0;
  }, { passive: false });

  window.addEventListener('pointermove', (event) => {
    const x = event.clientX / sizes.width - 0.5;
    const y = event.clientY / sizes.height - 0.5;

    const _p = new THREE.Vector2(x, -y).multiplyScalar(2.0);
    ray_cast.setFromCamera(_p, camera);
    const intersect = ray_cast.intersectObject(mesh, true);
    
    if (intersect.length) {
      u_input_pos_press.value = 1.0;
      // Convert to local space for better effect
      const localPoint = mesh.worldToLocal(intersect[0].point.clone());
      u_input_pos.value.copy(localPoint);
    }
  }, { passive: false });

  // Enhanced animation loop
  renderer.setAnimationLoop(animate);
  
  function animate() {
    renderer.computeAsync(compute_update);
    composer.renderAsync();
    
    // Subtle auto-rotation when not interacting
    if (u_input_pos_press.value < 0.1) {
      mesh.rotation.x += 0.002;
      mesh.rotation.y += 0.005;
    }
  }

  // Responsive resize
  window.addEventListener('resize', () => {
    sizes.width = window.innerWidth;
    sizes.height = window.innerHeight;
    camera.aspect = sizes.width / sizes.height;
    camera.updateProjectionMatrix();
    renderer.setSize(sizes.width, sizes.height);
  });

  /**
   * Create simple HTML controls instead of dat.gui
   */
  function createSimpleControls(params) {
    const controlsDiv = document.createElement('div');
    controlsDiv.style.cssText = `
      position: absolute;
      top: 20px;
      right: 20px;
      background: rgba(0,0,0,0.8);
      padding: 15px;
      border-radius: 8px;
      font-family: Arial, sans-serif;
      font-size: 12px;
      color: white;
      z-index: 1000;
    `;

    const controls = [
      { name: 'Explosion Power', key: 'explode_amp', min: 0.1, max: 3.0, step: 0.1, uniform: u_explode_amp },
      { name: 'Noise Amplitude', key: 'noise_amp', min: 0.0, max: 3.0, step: 0.1, uniform: u_noise_amp },
      { name: 'Spring Force', key: 'spring', min: 0.0, max: 0.15, step: 0.01, uniform: u_spring },
      { name: 'Friction', key: 'friction', min: 0.8, max: 0.99, step: 0.01, uniform: u_friction },
      { name: 'Emissive Boost', key: 'emissive_boost', min: 1.0, max: 15.0, step: 0.5, uniform: emissive_boost },
      { name: 'Glitch Intensity', key: 'glitch_intensity', min: 0.0, max: 2.0, step: 0.1, uniform: u_glitch_intensity },
      { name: 'Bloom Strength', key: 'bloom_strength', min: 0.0, max: 3.0, step: 0.1, uniform: u_bloom_strength },
    ];

    controls.forEach(control => {
      const label = document.createElement('label');
      label.textContent = control.name;
      label.style.display = 'block';
      label.style.marginBottom = '5px';

      const slider = document.createElement('input');
      slider.type = 'range';
      slider.min = control.min;
      slider.max = control.max;
      slider.step = control.step;
      slider.value = params[control.key];
      slider.style.width = '150px';
      slider.style.marginBottom = '10px';

      slider.addEventListener('input', (e) => {
        const value = parseFloat(e.target.value);
        params[control.key] = value;
        control.uniform.value = value;
      });

      controlsDiv.appendChild(label);
      controlsDiv.appendChild(slider);
    });

    document.body.appendChild(controlsDiv);
  }
}

window.onload = preload;