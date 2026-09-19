# Running ChronoFresh locally

## PostgreSQL and backend

Create `chronofresh`, then configure `backend/.env` from `backend/.env.example`:

```env
DATABASE_URL=postgresql+psycopg2://postgres:YOUR_PASSWORD@localhost:5432/chronofresh
UPLOAD_DIRECTORY=uploads
PREDICTION_PROVIDER=stub
USE_REAL_MODEL=false
CORS_ORIGINS=http://localhost:5173,http://localhost:8081
MAX_UPLOAD_SIZE_MB=10
ANALYSIS_TOKEN_SECRET=replace-with-a-long-random-local-secret
```

Run:

```powershell
cd backend
alembic upgrade head
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

API documentation: `http://localhost:8000/docs`.

## Website

```powershell
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`.

## Android app

Set `EXPO_PUBLIC_API_BASE_URL` before starting Metro:

- Android emulator: `http://10.0.2.2:8000`
- Physical phone on the same Wi-Fi: `http://YOUR_COMPUTER_LAN_IP:8000`
- Web preview: `http://localhost:8000`

```powershell
cd app
$env:EXPO_PUBLIC_API_BASE_URL="http://10.0.2.2:8000"
npx expo start
```

Press `a` for Android, or scan the QR code with Expo Go. Local notifications are optional; denying permission does not block the app.
