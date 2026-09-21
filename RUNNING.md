# Running ChronoFresh locally

ChronoFresh has three local processes: PostgreSQL and the FastAPI backend, the React website, and the Expo mobile app. Start the backend first because both clients call its API.

## Prerequisites

- Python 3.12 (the selected TensorFlow build does not support Python 3.14)
- PostgreSQL running locally, with a database named `chronofresh`
- Node.js with npm
- For Android: Android Studio, an installed Android Virtual Device, and `ANDROID_HOME` configured if the SDK is not in its standard Windows location

The checked-in model files are required for real inference:

- `backend/models/efficientnetb3_final.keras`
- `backend/models/model_metadata.json`

## 1. Configure and start the backend

Copy `backend/.env.example` to `backend/.env` and set your PostgreSQL password and a private analysis-token secret.

```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/chronofresh
PREDICTION_PROVIDER=keras
MODEL_PATH=models/efficientnetb3_final.keras
MODEL_METADATA_PATH=models/model_metadata.json
MODEL_CONFIDENCE_THRESHOLD=0.75
ANALYSIS_TOKEN_SECRET=replace-with-a-long-random-local-secret
AI_VERIFIER_ENABLED=false
```

`PREDICTION_PROVIDER=keras` uses the supplied EfficientNetB3 model. `stub` remains available only for local development and automated tests; it does not perform real inference.

```powershell
cd backend
uv sync --python 3.12
uv run --python 3.12 alembic upgrade head
uv run --python 3.12 python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

Confirm the API and selected provider in a second PowerShell window:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
Invoke-RestMethod http://127.0.0.1:8000/api/v1/meta
```

The `meta` response should show `prediction_provider: keras` for real inference. FastAPI documentation is at `http://127.0.0.1:8000/docs`.

## 2. Start the website

```powershell
cd frontend
npm ci
$env:VITE_API_BASE_URL="http://127.0.0.1:8000"
npm run dev
```

Open the URL Vite prints (normally `http://127.0.0.1:5173`). The sidebar shows the provider reported by `/api/v1/meta`; it should say `Keras model` when the real-model backend is running.

## 3. Start the Android application

For an Android emulator, `10.0.2.2` reaches the host computer’s localhost:

```powershell
cd app
npm ci
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:8000"
npm run android
```

For a physical phone, replace `10.0.2.2` with your computer’s LAN IP, for example `http://192.168.1.25:8000`. Keep both devices on the same Wi-Fi network and allow port 8000 through Windows Firewall if prompted.

`npm run android` starts ADB, boots the first installed Android Virtual Device, then starts Expo. This is sufficient for an emulator or demo-APK workflow; Play Store publishing is not required.

## Validation commands

```powershell
# Backend API, migrations, and artifact-integrity tests
cd backend
uv run --python 3.12 pytest -q

# Real Keras load plus one inference smoke test (slower)
$env:RUN_MODEL_SMOKE="1"
uv run --python 3.12 pytest -q tests/test_prediction_service.py -k actual_keras_artifact_loads

# Website production build
cd ..\frontend
npm run build

# Mobile TypeScript check and Expo SDK compatibility
cd ..\app
npx tsc --noEmit
npx expo-doctor
```

The real-model smoke test loads the `.keras` artifact and runs one local image through the Keras provider. It does not create database records or start a server.

## Model evaluation (optional)

```powershell
cd backend
uv run --python 3.12 python scripts/evaluate_model.py
uv run --python 3.12 python scripts/evaluate_model.py --dataset path\to\labelled_test --csv results\predictions.csv --json results\evaluation.json
```

ChronoFresh predictions are quality estimates, not food-safety diagnoses. Always check smell, texture, visible damage, and normal food-safety guidance.
