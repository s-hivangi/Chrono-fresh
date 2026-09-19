# API

Base URL: `http://localhost:8000/api/v1`.

| Method | Path | Purpose |
|---|---|---|
| GET | `/health` | Service health |
| GET | `/meta` | Produce, stage and storage choices |
| POST | `/analyze` | Validate and analyze an image without saving |
| POST | `/produce` | Save an item and initial prediction |
| GET | `/produce` | List active, completed or all items |
| GET/PATCH | `/produce/{id}` | Read or update an item |
| POST | `/produce/{id}/rescan` | Append a new observation |
| GET | `/produce/{id}/history` | Read all observations |
| GET | `/produce/{id}/timeline` | Chronological prediction timeline |
| POST | `/produce/{id}/complete` | Mark consumed or discarded |
| GET | `/dashboard` | Counts, Use First, recent scans and active items |
| GET | `/analytics` | Aggregate scan and outcome statistics |

`POST /analyze` returns a signed, one-hour `analysis_token`. Send it to `POST /produce` with the same image and produce type so the exact displayed result becomes the saved initial prediction.
