# API

Base URL: `http://localhost:8000/api/v1`. New scans accept only `banana` or `guava`; historical records with older values are not deleted.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service, provider and model identifier |
| GET | `/meta` | Supported produce, stages, storage and provider metadata |
| POST | `/analyze` | Validate and analyze without saving |
| POST | `/produce` | Save an item and its analyzed initial result |
| GET | `/produce` | List active, completed or all items |
| GET/PATCH | `/produce/{id}` | Read or update an item |
| POST | `/produce/{id}/rescan` | Append a new observation |
| GET | `/produce/{id}/history` | Read observations |
| GET | `/produce/{id}/timeline` | Read definite predictions chronologically |
| POST | `/produce/{id}/complete` | Mark consumed or discarded |
| GET | `/dashboard` | Counts, Use First, recent scans and active items |
| GET | `/analytics` | Aggregate scan and outcome statistics |

`POST /analyze` returns `analysis_status` (`reliable`, `verified`, or `uncertain`), `prediction_source`, `model_version`, `raw_model_confidence`, and a signed one-hour `analysis_token`. Submit the same normalized image, produce type, and token to `POST /produce`; the token is bound to the image SHA-256 so Save cannot silently rerun or change the displayed prediction. Uncertain analyses cannot be saved as definite initial results.
