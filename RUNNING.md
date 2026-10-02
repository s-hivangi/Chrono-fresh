# Running ChronoFresh locally

Run the backend, website, and mobile app in **three separate terminals**. The phone and computer must be on the same Wi-Fi. No Cloudflare tunnel or launcher script is required.

## 1. Backend

Prerequisites: Python 3.12, PostgreSQL, and a `chronofresh_db` database. Configure `backend/.env` from `backend/.env.example`. Set a unique random `AUTH_TOKEN_SECRET` of at least 32 characters; keep it, your database password, and `ANALYSIS_TOKEN_SECRET` private. Use the same auth secret across backend restarts or existing sessions will become invalid. The checked-in Keras model files are `backend/models/efficientnetb3_final.keras` and `backend/models/model_metadata.json`; `PREDICTION_PROVIDER=stub` remains available for local development, but the current backend `.env` selects `keras`.

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

The auth migration (`20261002_0004`) adds users, hashed refresh sessions, and nullable owner columns. Existing produce/scans are preserved as legacy unowned rows and are not visible to new accounts. Do not manually assign old rows without deciding which real account owns them. Run `alembic upgrade head` before starting the updated backend; otherwise login and private endpoints will fail because their tables/columns do not exist.

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

The website now opens on a small sign-in/create-account gate; its existing dashboard, scan, history, and other pages retain their layouts. Web credentials are kept in memory for this local version, so a browser reload requires signing in again. Saved history remains in PostgreSQL and reappears after login.

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

On mobile, Create Account and Sign In use the backend. The app stores only the refresh credential in Android/iOS SecureStore; the short-lived access token stays in memory. A returning account refreshes its session at startup. Guests can still capture and analyze a photo, but must sign in before saving. Guest analysis is not saved to History; each account sees only its own PostgreSQL-backed produce and scans. History refetches on every screen focus and on pull-to-refresh. Signing out clears account caches and scheduled produce reminders. On this project's current setup, notification scheduling is disabled inside Expo Go; use a development/production build to test local reminders.

## Current verification (2 October 2026)

- PostgreSQL migration applied to `20261002_0004` without removing existing rows. The configured Keras provider was confirmed in the preceding investigation.
- Backend tests: 43 passed, 1 optional model smoke test skipped. Authentication tests cover registration, Argon2id hash, login, token rotation/revocation, guest no-save behavior, and cross-account record isolation. Use a workspace-local pytest temp directory on this Windows setup because the global temp directory may deny access.
- Mobile TypeScript check and Android JavaScript export passed; Expo dependency check passed; Expo Doctor passed 21/21 checks. The web production build passed (with a bundle-size warning).
- Physical-phone launch, screen-focus refetch, account-switch visual behavior, and complete scan/save flow are **not yet manually verified**. A local native development build failed during CMake configuration in the preceding investigation; that does **not** prove an app runtime crash.

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
