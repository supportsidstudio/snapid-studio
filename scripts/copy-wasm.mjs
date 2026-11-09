import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const rootDir = path.resolve(__dirname, '..');

// 1. Copy ONNX Runtime WebAssembly and Asyncify binaries to public/onnxruntime/
const ortDistDir = path.join(rootDir, 'node_modules/onnxruntime-web/dist');
const targetOnnxDir = path.join(rootDir, 'public/onnxruntime');

if (!fs.existsSync(targetOnnxDir)) {
  fs.mkdirSync(targetOnnxDir, { recursive: true });
}

if (fs.existsSync(ortDistDir)) {
  const files = fs.readdirSync(ortDistDir);
  let count = 0;
  for (const file of files) {
    if (file.endsWith('.wasm') || (file.startsWith('ort-wasm') && file.endsWith('.mjs')) || (file.startsWith('ort.') && file.endsWith('.mjs'))) {
      const srcFile = path.join(ortDistDir, file);
      const destFile = path.join(targetOnnxDir, file);
      fs.copyFileSync(srcFile, destFile);
      count++;
    }
  }
  console.log(`[postinstall] Successfully copied ${count} ONNX Runtime WASM/MJS binaries to public/onnxruntime/`);
} else {
  console.warn(`[postinstall] onnxruntime-web dist folder not found at ${ortDistDir}`);
}

// 2. Copy coi-serviceworker.js to public/
const coiSrc = path.join(rootDir, 'node_modules/coi-serviceworker/coi-serviceworker.js');
const coiDest = path.join(rootDir, 'public/coi-serviceworker.js');

if (fs.existsSync(coiSrc)) {
  fs.copyFileSync(coiSrc, coiDest);
  console.log(`[postinstall] Successfully copied coi-serviceworker.js to public/`);
} else {
  console.warn(`[postinstall] coi-serviceworker not found at ${coiSrc}`);
}
