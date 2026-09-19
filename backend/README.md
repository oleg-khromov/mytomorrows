# Backend

FastAPI backend.

## Structure

- `app/main.py`: FastAPI app, middleware, exception handlers, router registration.
- `app/api/routes`: HTTP routes.
- `app/schemas`: Pydantic request validation and response schemas.
- `app/domain`: seed/demo domain dataclasses.
- `app/db`: SQLAlchemy setup, ORM models, and seed command.
- `app/repositories`: database query layer.
- `app/services`: business logic.
- `app/data`: static demo dataset.
- `migrations`: Alembic database migrations.
- `tests`: API tests.

## Production-Style Pieces

- SQLAlchemy models for trials, eligibility criteria, and locations.
- Repository layer for database queries.
- Service layer for business logic and response mapping.
- Pydantic query model for backend search validation.
- Alembic migrations for schema changes.
- PostgreSQL `pg_trgm` GIN index on `trials.condition` for fast contains-search with `ILIKE '%term%'`.
- Idempotent seed command for demo data.
- Stable API error envelopes with request ids.

## Local Run

```bash
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

By default local runs use SQLite at `./trials.db`. Docker Compose uses PostgreSQL through `backend/.env`.

## Docker Run

From the parent `recreated_online_coding_task` folder:

```bash
docker compose up --build backend
```

The API runs on `http://localhost:8000`.

## Vercel Deploy

Use `backend` as the Vercel project root directory.

Vercel commands:

```bash
Install Command: pip install -r requirements.txt
Build Command: python scripts/vercel_build.py
```

Required production environment variables:

```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
ALLOWED_ORIGINS=["https://YOUR-FRONTEND.vercel.app"]
```

The backend also accepts `POSTGRES_URL` or `POSTGRES_PRISMA_URL`. Plain `postgres://` and `postgresql://` URLs are normalized to SQLAlchemy's `postgresql+psycopg://` driver form.

Vercel files:

- `index.py` exports the FastAPI `app` from `app.main`.
- `vercel.json` routes requests to the FastAPI function.
- `requirements.txt` declares Python dependencies for Vercel's Python runtime.
- `scripts/vercel_build.py` runs `alembic upgrade head` and `python -m app.db.seed` when a hosted Postgres URL is configured.

## Tests

```bash
pytest
```

Tests use an in-memory SQLite database with the real SQLAlchemy models and seed data.

## API

- `GET /health`
- `GET /api/v1/trials?q=solid%20tumor&offset=0&limit=10`
- `GET /api/v1/trials/suggestions?q=cancer&limit=6`
- `GET /api/v1/trials/{trial_id}`

The list endpoint searches by condition only and returns lightweight trial summaries. The detail endpoint returns full trial data.
Empty `q` is allowed for paginated browsing. Non-empty `q` values must contain at least `3` characters.
The suggestions endpoint also searches conditions only and returns distinct condition values.
The seed command creates `100` demo trials.
