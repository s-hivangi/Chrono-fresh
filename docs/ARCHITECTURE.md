# Architecture

React and Expo are clients of one FastAPI/PostgreSQL API. Upload validation decodes images, enforces size/resolution, and normalizes to RGB JPEG. `PredictionProvider` selects either the explicit development stub or the startup-loaded Keras provider. Keras produces freshness scores and remaining days; a reliability gate may return uncertain, optionally consulting a constrained verifier only in that case. The DSS then converts definite model output into advice.

```text
image + Banana/Guava selection
  -> decode/quality checks
  -> EfficientNetB3 multitask model
  -> raw class score + days regression
  -> reliability gate -> optional verifier on uncertainty only
  -> definite result or rescan request
  -> rule-based DSS guidance
  -> signed Analyze token -> PostgreSQL Save
```

Alembic owns the schema. Prediction rows retain source, model identifier, raw confidence, reliability and verification status. The signed token includes an image digest, preserving Analyze → Save identity. Rescans append history; uncertain rescans are marked `UNCERTAIN` and do not become definite predictions.
