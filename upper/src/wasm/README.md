# WebAssembly (WASM) Folder

## Purpose

The `wasm` folder contains WebAssembly modules used in the XR Space Platform. These modules are designed to handle CPU-intensive tasks, such as physics simulations and rendering optimizations, to enhance the performance of the XR environment.

## WebAssembly Modules

### Voxel Data Generation

The `wasm` folder includes a module for generating voxel data, which is used to create and manage the voxel-based environment in the XR Space Platform. This module is written in Rust and compiled to WebAssembly for efficient execution in the browser.

## Building the WASM Module

To build the WebAssembly module, follow these steps:

1. **Navigate to the `wasm` folder**:
   ```bash
   cd ./src/wasm
   ```

2. **Build the WASM module using Cargo**:
   ```bash
   cargo build --target wasm32-unknown-unknown --release
   ```

3. **Generate the JavaScript bindings using `wasm-bindgen`**:
   ```bash
   wasm-bindgen --target web --out-dir ./pkg ./target/wasm32-unknown-unknown/release/wasm.wasm
   ```

### Usage

The WebAssembly modules can be imported and used in the JavaScript code of the XR Space Platform. For example, to use the voxel data generation module, you can import it as follows:

```javascript
import init, { generate_voxel_data } from './pkg/wasm.js';

async function initWasm() {
  await init();
  const voxelData = generate_voxel_data();
  console.log(voxelData);
}

initWasm();
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for more details.

## Contributing

Contributions are welcome! Please read our [contributing guidelines](CONTRIBUTING.md) for details on our code of conduct, and the process for submitting pull requests.

## Contact

For any questions or support, please contact the maintainers through the project's GitHub repository or community channels.
