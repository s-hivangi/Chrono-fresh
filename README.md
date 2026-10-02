# ChronoFresh

ChronoFresh estimates visible freshness and remaining use time for **Banana and Guava only**. One FastAPI/PostgreSQL backend serves the React website and Expo Android application in `app/`.

The primary predictor is the supplied EfficientNetB3 Keras multitask model. It returns a five-class freshness softmax and a `days_to_spoilage` regression. A separate rule-based DSS converts those outputs into storage/use guidance. ChronoFresh is not a food-safety diagnostic: always check smell, texture, damage, and normal food-safety guidance.

The teammate reported about 91% training accuracy and 41% testing accuracy. Raw softmax confidence is therefore shown as a model score, not guaranteed correctness. Low-confidence or otherwise unverified results become `uncertain` and request a rescan; an optional external verifier can only confirm an uncertain result when it agrees.

## Projects

- `backend/` — FastAPI, PostgreSQL/SQLAlchemy, Alembic, Keras inference, DSS and evaluation tool
- `frontend/` — React/Vite website
- `app/` — Expo Router Android application (the directory name remains `app/`)
- `docs/` — API, architecture, model handoff and demo notes

See [RUNNING.md](RUNNING.md) for exact setup and commands.

## Physical-phone demo workflow

Run FastAPI on `0.0.0.0:8000`, set `app/.env` to your computer's Wi-Fi IPv4 address, and run `npm start` in `app/`. Open the QR code in Expo Go while the phone and computer share Wi-Fi. The website runs separately with `npm run dev` in `frontend/`. See [RUNNING.md](RUNNING.md) for the exact commands and connection checks.
