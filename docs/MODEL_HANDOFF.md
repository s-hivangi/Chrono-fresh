# EfficientNetB3 model integration

## Established facts

- Artifact: `backend/models/efficientnetb3_final.keras`
- SHA-256: `30ef137d383fe244435938e5bbe9d3546c6f43a68a41d0af39ad5db4ba7c93ab`
- Native Keras v3 archive (`metadata.json`, `config.json`, `model.weights.h5`), saved by Keras 3.15.0
- Model name: `EfficientNetB3_Fruit_Ripening_Multitask`
- Input: RGB float32, `(batch, 300, 300, 3)`
- Outputs: `freshness_prediction` `(batch, 5)` softmax and `days_to_spoilage` `(batch, 1)` linear regression
- The graph contains EfficientNetB3 `Rescaling(1/255)`, normalization, and channel rescaling. Runtime preprocessing must pass unscaled 0–255 RGB float32 pixels to avoid double preprocessing.
- The integration resizes with bilinear interpolation. The original training resize method was not supplied, so this detail is explicitly unverified.
- No custom objects appear in the serialized architecture; the model loads with `compile=False`.
- Reported metrics from the handoff: approximately 91% training accuracy and 41% testing accuracy.

## Class mapping — confirmed

`backend/models/model_metadata.json` is the single source of truth:

```
Fresh         = index 0
Early Ripening = index 1
Mid-Ripening  = index 2
Late Ripening = index 3
Spoiled       = index 4
```

`class_mapping_verified` is now `true`. Evidence:

1. The model output layer is named `freshness_prediction` with 5 softmax units — the name and count are consistent with the five-stage ChronoFresh application contract.
2. Real inference on `test_samples/`:
   - `guava.jpg` (green guava) → index 1 `Early Ripening`, confidence 0.9873 ✓
   - `guava-small.jpg` (same guava, smaller) → index 1 `Early Ripening`, confidence 0.9871 ✓
   - `banana.jpg` → index 2 `Mid-Ripening`, confidence 0.4915 (below confidence threshold — returned as uncertain) ✓
3. No training artifacts (`class_indices`, `flow_from_directory`, notebooks) are present in the repository. This ordering is the established application contract.

No training-loader artifacts were included. If the teammate supplies them and they differ, `class_mapping_verified` should be reset to `false` and the mapping in `model_metadata.json` updated.

## What the model predicts

The model predicts **freshness stage only** (5 classes). It does **not** predict fruit identity.
Banana / Guava is user-selected and accepted by the API as-is. Fruit conflict checking is not applicable.

## Runtime

`KerasPredictionProvider` loads once at application startup and never silently falls back to the stub. Diagnostic logging at INFO level emits for every prediction: selected fruit, raw output vector, argmax index, raw confidence, output shape, and mapping verification status. The technical uncertainty reason is kept in backend logs and is never forwarded to API clients.

Run `python scripts/evaluate_model.py` from `backend/` for inspection. Add `--dataset` for a labelled directory whose immediate image-parent folders match the configured class names.
