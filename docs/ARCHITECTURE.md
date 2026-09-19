# Architecture

The website and Android app are two clients of one FastAPI API. FastAPI validates and normalizes uploaded images, calls the stub prediction provider, applies DSS guidance, and persists products, image history and predictions in PostgreSQL. Alembic owns the database schema.

The mobile app lives in `app/` and uses Expo Router. Its scan session holds the selected image and analyzed result between Scan Review and Result. The signed analysis token prevents a second unrelated prediction during Save. Rescans append history and never replace earlier observations.

The React website uses the same API data, so dashboard, inventory, history and analytics reflect mobile changes without a second datastore.
