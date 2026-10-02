# Demo walkthrough

1. Start PostgreSQL, then FastAPI with `--host 0.0.0.0 --port 8000`. Set `app/.env` to `http://<computer-Wi-Fi-IPv4>:8000`, run `npm start` in `app/`, and open Expo Go on a phone using the same Wi-Fi. See `RUNNING.md` for the exact commands.
2. In the app, open Scan and choose a Banana or Guava photo from Camera or Gallery.
3. Review the image, produce type and storage, then Analyze.
4. Confirm the Result page and choose Add to My Produce.
5. Open My Produce and the item detail. Rescan it to create a second timeline observation.
6. Mark the item Used or Discarded and confirm it appears in History with its completion time.
7. Open the website and verify Dashboard, My Produce, History and Analytics reflect the same PostgreSQL data.

For the website, run `npm run dev` in `frontend/`. Its empty `VITE_API_BASE_URL` uses Vite's proxy for API and image requests, including when viewed over the same Wi-Fi.

The configured Keras model is the primary predictor. A reliable/verified result can be saved; an uncertain result asks for another photo. Explain that the model's day output is an estimate, DSS advice is rule-based, raw confidence is not guaranteed accuracy, and reported test accuracy is about 41%. Always present the food-safety disclaimer.
