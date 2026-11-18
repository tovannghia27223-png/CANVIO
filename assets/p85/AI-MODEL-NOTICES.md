# CANVIO P85 runtime notices

Runtime versions are pinned and SHA-256 manifested at build time. Runtime assets are same-origin and loaded only after a user action. No CDN fallback or paid API is configured.

- Three.js 0.187.0 / r187: MIT
- three-mesh-bvh 0.9.18: MIT
- three-gpu-pathtracer 0.0.28: MIT; experimental WebGPU implementation
- postprocessing 6.39.6: Zlib
- @techstark/opencv-js 5.0.0-release.1: Apache-2.0
- @lottiefiles/dotlottie-web 0.83.2: MIT
- @rive-app/canvas 2.51.0: MIT
- @huggingface/transformers 3.8.1: Apache-2.0

Full upstream license texts are distributed in the generated licenses/ directory. Model weights are not vendored. Rive is a runtime/player, not an authoring application; no attribution or free-plan restrictions are bypassed.
