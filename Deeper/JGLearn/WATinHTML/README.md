# WAT-Loader: WebAssembly Text in HTML

A minimal, developer-friendly module that treats WebAssembly Text (WAT) as a first-class citizen in the HTML/CSS/JS stack.

## Quick Start

1. **Include the loader:**
```html
<script src="wat-loader.js"></script>
```

2. **Add WAT modules in HTML:**
```html
<wat-module name="math">
(module
  (func $add (param i32 i32) (result i32)
    local.get 0 local.get 1 i32.add)
  (export "add" (func $add)))
</wat-module>
```

3. **Call from JavaScript:**
```javascript
const result = await WATLoader.call('math', 'add', [5, 3]); // returns 8
```

## Features

- ✅ **Zero Configuration** - Just include the script and start using WAT
- ✅ **HTML Integration** - `<wat-module>` elements work like `<script>` tags
- ✅ **Auto-compilation** - WAT modules compile automatically on page load
- ✅ **Simple API** - Clean JavaScript interface for calling WAT functions
- ✅ **Dynamic Loading** - Add WAT modules programmatically
- ✅ **Error Handling** - Clear error messages for debugging
- ✅ **Event System** - Listen for module load/error events

## API Reference

### WATLoader.call(moduleName, functionName, args)
Call a function from a compiled WAT module.

```javascript
const result = await WATLoader.call('myModule', 'myFunction', [arg1, arg2]);
```

### WATLoader.addModule(name, watCode)
Programmatically add a WAT module.

```javascript
const watCode = `(module (func $test (result i32) i32.const 42) (export "test" (func $test)))`;
await WATLoader.addModule('dynamic', watCode);
const result = await WATLoader.call('dynamic', 'test', []);
```

### WATLoader.getModule(moduleName)
Get direct access to a WebAssembly instance.

```javascript
const module = WATLoader.getModule('myModule');
const result = module.exports.myFunction(arg1, arg2);
```

### WATLoader.getModules()
List all available module names.

```javascript
const modules = WATLoader.getModules(); // ['math', 'graphics', ...]
```

## HTML Elements

### `<wat-module name="moduleName">`
Define a WAT module in HTML. The element content should be valid WAT code.

**Attributes:**
- `name` (required) - Unique identifier for the module
- `data-loaded` - Added automatically when module compiles successfully
- `data-error` - Added automatically if compilation fails

**Events:**
- `wat-loaded` - Fired when module compiles successfully
- `wat-error` - Fired when compilation fails

## Examples

### Basic Math Operations
```html
<wat-module name="math">
(module
  (func $add (param i32 i32) (result i32)
    local.get 0 local.get 1 i32.add)
  (func $multiply (param i32 i32) (result i32)
    local.get 0 local.get 1 i32.mul)
  (export "add" (func $add))
  (export "multiply" (func $multiply)))
</wat-module>

<script>
async function demo() {
  const sum = await WATLoader.call('math', 'add', [5, 3]);
  const product = await WATLoader.call('math', 'multiply', [4, 7]);
  console.log(`5 + 3 = ${sum}, 4 × 7 = ${product}`);
}
demo();
</script>
```

### Canvas Graphics
```html
<wat-module name="graphics">
(module
  (func $pattern (param $x i32) (param $y i32) (param $t i32) (result i32)
    local.get $x local.get $y i32.xor local.get $t i32.add i32.const 255 i32.and)
  (export "pattern" (func $pattern)))
</wat-module>

<canvas id="canvas" width="200" height="200"></canvas>
<script>
async function drawPattern() {
  const canvas = document.getElementById('canvas');
  const ctx = canvas.getContext('2d');
  const imageData = ctx.createImageData(200, 200);
  
  for (let y = 0; y < 200; y++) {
    for (let x = 0; x < 200; x++) {
      const value = await WATLoader.call('graphics', 'pattern', [x, y, 0]);
      const idx = (y * 200 + x) * 4;
      imageData.data[idx] = value;     // Red
      imageData.data[idx + 1] = value; // Green
      imageData.data[idx + 2] = value; // Blue
      imageData.data[idx + 3] = 255;   // Alpha
    }
  }
  
  ctx.putImageData(imageData, 0, 0);
}
drawPattern();
</script>
```

## Browser Support

- Modern browsers with WebAssembly support
- Requires ES2017+ (async/await)
- CDN fallback for wabt.js library

## Why WAT in HTML?

1. **Developer Experience** - Write high-performance code directly in HTML
2. **No Build Step** - WAT compiles in the browser, no toolchain needed  
3. **Rapid Prototyping** - Test WebAssembly code instantly
4. **Educational** - Perfect for learning WebAssembly concepts
5. **Integration** - Seamlessly mix with existing HTML/CSS/JS

This makes WebAssembly more accessible to web developers who want performance without complexity.
