# CANVIO local AI model and runtime notices

| Feature | Model | Upstream license | Purpose |
|---|---|---|---|
| P102 background removal | Orangebot/ormbg-ONNX | Apache-2.0 (model repository declaration) | User-triggered local background removal to transparent PNG |
| P105 depth estimation | onnx-community/depth-anything-v2-small-ONNX | Apache-2.0 (model repository declaration) | User-triggered relative depth map generation |
| P80/P59 transcription | Xenova/whisper-tiny | Apache-2.0 (model repository declaration) | User-triggered multilingual transcription |

## Local runtime and privacy boundary
- Transformers.js 3.8.1 and matching ONNX Runtime Web WASM files are self-hosted under `assets/p85/transformers/`, loaded from same-origin workers only after an explicit user action.
- Model weights are not included in the static site. The first use downloads the selected model from the model repository over HTTPS; subsequent availability depends on browser cache retention.
- Image/audio inputs are transferred to local browser workers. CANVIO does not call a paid inference API and embeds no API key or authorization token.
- The model repository's declared license must be preserved together with its upstream license file before model-weight redistribution. Model weights are not redistributed by this project.
- Quality is model-dependent: depth values are relative, not calibrated distances; background removal may need manual review around fine hair/transparent objects; transcription depends on speech/noise/accent and has no blanket accuracy guarantee.
