# ChronoFresh

ChronoFresh is a local-first produce freshness and shelf-life product. A FastAPI API stores scans in PostgreSQL, a React website supports inventory and analytics, and an Expo Android app supports camera/gallery scanning and local reminders.

The current prediction provider is intentionally a deterministic stub. No trained model or fabricated model integration is included.

## Projects

- `backend/` — FastAPI, SQLAlchemy, Alembic and the DSS/stub prediction contract
- `frontend/` — React/Vite website
- `app/` — Expo Router Android application
- `docs/` — API, architecture, demo and model handoff notes

## Quick start

1. Create a PostgreSQL database named `chronofresh`.
2. Copy `backend/.env.example` to `backend/.env` and set the real PostgreSQL password.
3. In `backend/`, install dependencies, run `alembic upgrade head`, then run `uvicorn app.main:app --reload --host 0.0.0.0 --port 8000`.
4. In `frontend/`, run `npm install` then `npm run dev`.
5. In `app/`, run `npm install` then `npx expo start`; press `a` for an installed Android emulator or scan the QR code with Expo Go.

See [RUNNING.md](RUNNING.md) for environment and Android networking details.
