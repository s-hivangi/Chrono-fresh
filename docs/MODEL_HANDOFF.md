# Chronofresh AI Model Handoff Guide

This document provides exact instructions for integrating your teammate's trained dual-backbone computer vision model (EfficientNet-B3 + EfficientNetV2-S) into the Chronofresh backend once training is finished and weights are exported.

---

## 1. Exporting the Model

Your teammate can export the trained model in either **ONNX** or **TorchScript** format:

### ONNX Export (Recommended for cross-platform speed)
```python
import torch

# Assuming `model` is your trained dual-backbone PyTorch model
model.eval()
dummy_input = torch.randn(1, 3, 224, 224) # or 300x300 based on your image size

torch.onnx.export(
    model,
    dummy_input,
    "best_model.onnx",
    export_params=True,
    opset_version=14,
    do_constant_folding=True,
    input_names=["input_image"],
    output_names=["ripeness_logits", "days_remaining_pred"],
)
```

### TorchScript Export
```python
traced_model = torch.jit.trace(model, dummy_input)
traced_model.save("best_model.pt")
```

---

## 2. Directory Structure

Place the exported `best_model.onnx` or `best_model.pt` file inside the `backend/models` directory:

```
Chronofresh/
├── backend/
│   ├── app/
│   │   ├── main.py
│   │   ├── prediction_service.py
│   │   └── ...
│   ├── models/
│   │   └── best_model.onnx  <-- Drop exported file here!
│   └── .env
```

---

## 3. Activating Real Model Inference

In `backend/.env`, set the environment variable:

```env
USE_REAL_MODEL=true
```

When `USE_REAL_MODEL=true`, the `ModelInferenceEngine` in `backend/app/prediction_service.py` will automatically route incoming produce image uploads to the exported model for real-time dual-head classification and continuous shelf-life regression!

If `USE_REAL_MODEL=false` or if the model file is not found, the system gracefully falls back to the deterministic stub engine without breaking any API endpoints or frontend UI components.
