# CANVIO local AI model/runtime notices

## P102 — ORMBG
- Repository: https://huggingface.co/Orangebot/ormbg-ONNX
- Task: Transformers.js `background-removal`
- Model license: Apache-2.0 (as declared by the model repository)
- Used for: user-triggered, in-browser background removal; output is an RGBA PNG stored in the existing CANVIO Asset Library.
- Limitations: model quality is weaker on some pets/products, fine hair against busy backgrounds and transparent objects. No output-quality guarantee is made.

## P105 — Depth Anything V2 Small ONNX
- Repository: https://huggingface.co/onnx-community/depth-anything-v2-small-ONNX
- Task: Transformers.js `depth-estimation`
- Model license: Apache-2.0 (as declared by the model repository)
- Used for: user-triggered monocular relative depth estimation; grayscale depth map is stored in the existing CANVIO Asset Library.
- Limitations: relative depth only, not calibrated metric distance or full scene reconstruction. Edge artifacts and foreground/background ambiguity are expected.

## P80 — Whisper Tiny
- Repository: https://huggingface.co/Xenova/whisper-tiny
- Task: Transformers.js `automatic-speech-recognition`
- Model license: Apache-2.0 (as declared by the model repository)
- Used for: user-triggered local transcription of supported audio, with Vietnamese/English selection and timestamp output.
- Limitations: model accuracy varies by recording quality, accent, noise and vocabulary; no labelled corpus acceptance has been run in this environment.

## Runtime and privacy boundary
- `@huggingface/transformers@3.8.1` and the matching ONNX Runtime Web WASM files are self-hosted under `assets/p85/transformers/`, provisioned by `scripts/vendor-p85-runtimes.sh`, and verified using `assets/p85/P85-VENDOR-MANIFEST.json`. Workers import the local runtime only after an explicit user action.
- Model weights are not bundled. On first use, the selected model files are downloaded from the pinned Hugging Face model repository and browser caching is best-effort. A network connection is therefore still required for a cold first run; after caching, availability depends on browser cache retention.
- Audio/image/video inputs and inference remain in the browser worker; CANVIO does not send them to a paid inference API. No API key or authorization header is embedded.
- These notices identify upstream model declarations; they do not replace preserving the upstream LICENSE files when redistributing model weights. Model weights are not included in this package.
