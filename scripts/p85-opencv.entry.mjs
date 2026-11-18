// Convert the upstream OpenCV.js CommonJS/UMD package entry into a local ESM bundle.
// The package's generated Emscripten module is kept self-contained with no runtime CDN fetch.
import cvModule from '@techstark/opencv-js';
export default cvModule;
