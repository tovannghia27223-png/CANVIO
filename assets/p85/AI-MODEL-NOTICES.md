# CANVIO P85 runtime and model notices

P85 uses free/open-source browser runtimes pinned by `scripts/vendor-p85-runtimes.sh` and checksums recorded in `P85-VENDOR-MANIFEST.json`: Three.js r187, three-mesh-bvh 0.9.18, three-gpu-pathtracer 0.0.28, postprocessing 6.39.6, OpenCV.js 5.0.0-release.1, dotLottie Web 0.83.2, and Rive Canvas 2.50.0. Full upstream license texts are provisioned under `licenses/`.

The runtime assets are self-hosted under `assets/p85/` and loaded only after the user opens the corresponding tool. No boot-time CDN request, paid API, remote video upload, or model download is performed by P85. OpenCV optical-flow processing is local to the browser and can be stopped; path tracing requires WebGPU and is explicitly experimental. Rive is a playback runtime, not an authoring editor, and CANVIO does not bypass upstream export attribution/branding restrictions.
