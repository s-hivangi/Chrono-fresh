# Running ChronoFresh locally

Run the backend, website, and mobile app in **three separate terminals**. The phone and computer must be on the same Wi-Fi. No Cloudflare tunnel or launcher script is required.

## 1. Backend

Prerequisites: Python 3.12, PostgreSQL, and a `chronofresh_db` database. Configure `backend/.env` from `backend/.env.example`. Keep your database password and `ANALYSIS_TOKEN_SECRET` private. The checked-in Keras model files are `backend/models/efficientnetb3_final.keras` and `backend/models/model_metadata.json`; `PREDICTION_PROVIDER=stub` remains available for local development, but the current backend `.env` selects `keras`.

From the repository root in PowerShell:

```powershell
cd backend
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

If the virtual environment does not exist, create it once before the commands above:

```powershell
py -3.12 -m venv .venv
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
```

`0.0.0.0` allows the phone to reach the API; it is not an address to put in the mobile app. On this computer the current Wi-Fi IPv4 address is `192.168.29.142`, so the phone's API URL is `http://192.168.29.142:8000`. If the Wi-Fi address changes, update `app/.env` and restart Expo.

Check the API from the computer, then from the phone's browser:

```powershell
Invoke-RestMethod http://127.0.0.1:8000/api/v1/health
Invoke-RestMethod http://192.168.29.142:8000/api/v1/health
```

The phone browser should open `http://192.168.29.142:8000/api/v1/health`. If the computer check works but the phone check fails, verify both devices are on the same Wi-Fi, disable VPN or guest-network isolation for the test, and allow Python/port 8000 through Windows Firewall on the private network. API docs: `http://127.0.0.1:8000/docs`.

## 2. Website

In a second terminal:

```powershell
cd frontend
npm ci
npm run dev
```

Open `http://localhost:5173` on the computer or `http://192.168.29.142:5173` on the same Wi-Fi. `frontend/.env` leaves `VITE_API_BASE_URL` empty, so the Vite development server proxies `/api` and `/uploads` to the backend. No browser-side `localhost` API address is needed. Restart Vite after changing its `.env`.

## 3. Android app with Expo Go

`app/.env` contains the computer's Wi-Fi API address:

```env
EXPO_PUBLIC_API_BASE_URL=http://192.168.29.142:8000
```

In a third terminal:

```powershell
cd app
npm ci
npm start
```

Open the QR code in an SDK 57-compatible Expo Go on the phone. For an emulator, start it in Android Studio first, then press `a` in the Expo terminal (or use `npm run android`). The app uses LAN mode; the phone and computer must share Wi-Fi. Expo embeds `EXPO_PUBLIC_API_BASE_URL` in the bundle, so restart Expo after editing `app/.env`. Never put secrets in an `EXPO_PUBLIC_*` variable.

If the shell opens but analysis fails, first open the backend health URL in the phone browser, then use the app's Settings → Test Connection. If the QR code fails to load, check the phone's Expo Go SDK version and whether the phone can reach the computer on the local network. Do not use `127.0.0.1` or `localhost` in `app/.env`: on a phone those refer to the phone itself. A blank or invalid URL produces an in-app setup message rather than crashing during module import.

## Current verification (2 October 2026)

- PostgreSQL connection succeeds; database migration is at head (`20260921_0003`). The configured Keras provider loads successfully.
- Backend tests: 34 passed, 1 optional model smoke test skipped. Use a workspace-local pytest temp directory on this Windows setup because the global temp directory may deny access.
- Android JavaScript export, TypeScript check, Expo dependency check, and Expo Doctor passed in the preceding investigation. A local native development build failed during CMake configuration before installation; that is a separate toolchain issue and does **not** prove an app runtime crash.
- Physical-phone launch and complete scan/save flow are not yet verified. The user will rerun the app and report what happens.

## Validation

```powershell
cd backend
.\.venv\Scripts\python.exe -m pytest -q --basetemp=.pytest-run-local

cd ..\frontend
npm run build

cd ..\app
npx tsc --noEmit
npx expo install --check
npx expo-doctor
```

ChronoFresh predictions estimate visible quality, not food safety. Always check smell, texture, and visible damage.
