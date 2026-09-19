# Model handoff

ChronoFresh currently uses only `StubPredictionService` in `backend/app/prediction_service.py`. Keep `USE_REAL_MODEL=false`.

The stable application-facing prediction contract is:

`freshness_stage`, `days_remaining`, `days_remaining_display`, `confidence`, `advice`, `refrigeration_trigger`, `fifo_priority`, and `action_type`.

When the teammate supplies a trained artifact, preprocessing, label ordering, tensor names/shapes, normalization, runtime dependency and output mapping must be documented and implemented together. Placing a `.onnx` or `.pt` file in the repository and setting a flag is **not currently sufficient**: the real-inference branch is deliberately not implemented. Until that handoff is complete and tested, the engine always returns the stub result.
