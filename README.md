# Recreated Online Coding Task

Goal: rebuild the interview task as a production-style full-stack slice.

Stack:

- Backend: FastAPI, Pydantic v2, SQLAlchemy, Alembic migrations, PostgreSQL, service/repository layers, validation, tests.
- Frontend: Angular `21.2.7`, standalone components, feature-based architecture, signals, Angular i18n, route-based details.
- Runtime: Docker Compose with separate frontend, backend, and PostgreSQL containers.

Task:

1. Main page has a search input and submit button.
2. Search calls the backend with pagination. It does not fetch all trials at once.
3. Results list shows only selected summary fields.
4. Clicking a trial navigates to a details route.
5. Details page fetches the full trial by id and renders all relevant fields.
6. User can go back to the search page.

State management decision:

- This exercise uses Angular signals and a feature-level `TrialsSearchStore`.
- NgRx Store is intentionally not used because the state is local to one feature and does not require global action history, effects, router-store integration, or cross-feature sharing.
- Infinite scroll return state is handled with URL query params plus Angular router state. That is enough for this single search-to-detail flow and avoids global state for temporary UI position.
- If this grew into saved trials, auth-aware recommendations, cross-feature filters, or multiple teams sharing state, NgRx or `@ngrx/signals` would become more reasonable.

## Run With Docker

From this folder:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:4200`
- Backend health check: `http://localhost:8000/health`
- Backend search endpoint: `http://localhost:8000/api/v1/trials?q=solid%20tumor&page=1&page_size=5`
- PostgreSQL: `localhost:5433`, database `mytomorrows`

Docker layout:

- `backend/Dockerfile` runs Alembic migrations, seeds the database, then starts FastAPI with Python `3.12`.
- `frontend/Dockerfile` builds Angular and serves it with nginx.
- `frontend/nginx.conf` serves the Angular app and proxies `/api` to the backend container.
- `docker-compose.yml` starts PostgreSQL, the backend, and the frontend with health checks.

Environment files:

- `backend/.env` is used by Docker Compose for the API and database connection.
- `backend/.env.example` documents backend variables for local/prod-style configuration.
- `frontend/.env` documents the expected API base path for the container.
- `frontend/src/environments/environment.ts` centralizes the Angular API base URL.

## Run Backend

```bash
cd backend
python -m venv .venv
source .venv/bin/activate
pip install -e ".[test]"
alembic upgrade head
python -m app.db.seed
uvicorn app.main:app --reload
```

Backend runs on `http://localhost:8000`.

Useful endpoints:

- `GET /health`
- `GET /api/v1/trials?q=solid%20tumor&page=1&page_size=5` searches by condition only.
- `GET /api/v1/trials/suggestions?q=cancer&limit=6` returns condition suggestions only.
- `GET /api/v1/trials/{trial_id}`

By default local backend runs use SQLite at `./trials.db`. Docker Compose uses PostgreSQL through `backend/.env`.

## Run Frontend

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200` and proxies `/api` to `http://localhost:8000`.

## Deploy To Vercel

This repository is prepared for two Vercel projects:

- Backend project root: `backend`
- Frontend project root: `frontend`

Deploy the backend first. It needs a hosted PostgreSQL database because Vercel does not run the local `docker-compose.yml` database.

Backend Vercel environment variables:

```bash
ENVIRONMENT=production
DATABASE_URL=postgresql://USER:PASSWORD@HOST:PORT/DATABASE
ALLOWED_ORIGINS=["https://YOUR-FRONTEND.vercel.app"]
```

`POSTGRES_URL` or `POSTGRES_PRISMA_URL` also work if your Vercel database integration provides those names. The backend build hook runs Alembic migrations and seeds the demo trials when a hosted Postgres URL is available.

Frontend Vercel environment variables:

```bash
API_BASE_URL=https://YOUR-BACKEND.vercel.app/api/v1
```

If frontend and backend are served from the same origin later, leave `API_BASE_URL` unset and the frontend uses `/api/v1`.

Recommended order:

1. Push this folder to GitHub.
2. Import the GitHub repo into Vercel as a backend project with root directory `backend`.
3. Attach or configure hosted PostgreSQL, then deploy the backend.
4. Import the same GitHub repo into Vercel as a frontend project with root directory `frontend`.
5. Set `API_BASE_URL` to the backend deployment URL plus `/api/v1`.
6. Update backend `ALLOWED_ORIGINS` to the final frontend Vercel URL and redeploy backend.

## Angular i18n

This project uses Angular's built-in compile-time i18n:

- templates use `i18n` and `i18n-*` attributes;
- feature state stores do not contain translated display copy;
- TypeScript user-facing strings can use `$localize` if a future non-template message needs translation;
- Dutch translations live in `frontend/src/locale/messages.nl.xlf`;
- `@angular/localize/init` is included in Angular polyfills.

Useful commands:

```bash
cd frontend
npm run extract-i18n
npm run build:en
npm run build:nl
```

The Docker frontend builds the default production English bundle. To build the Dutch bundle locally, use `npm run build:nl`.

## Run Tests

Backend:

```bash
cd backend
pytest
```

Frontend:

```bash
cd frontend
npm test
```

## Interview Talking Points

- I modeled separate list and detail DTOs so the search page stays lightweight.
- Search requests are submitted intentionally; typing in the input does not call the API.
- Autocomplete suggestions wait for `600ms` of quiet typing, require at least `3` characters, show a short input spinner while loading, and cancel pending timers or in-flight requests with `switchMap`.
- Search input requires at least `3` characters before submit; empty query is still allowed for the initial paginated browse view.
- Backend search validation lives in a Pydantic query model, not route-level manual checks.
- The clear button in the search input resets the query and reloads all paginated trials.
- Full search uses explicit submit; no full result request is sent on every keystroke.
- New searches and autocomplete requests use RxJS `switchMap`, so stale slower responses cannot overwrite newer results.
- Results use infinite scroll with `IntersectionObserver`, appending server pages instead of showing pagination controls. The sentinel uses a `360px` root margin, so it loads earlier on small windows and can auto-fill on tall windows until the viewport has enough content or no pages remain.
- When returning from detail, router state restores both the loaded pages and scroll position.
- Search and detail requests keep the skeleton visible for at least `500ms` in this demo, so the loading state can be seen during local/interview walkthroughs.
- Pagination is part of the backend/database contract, not frontend slicing after downloading everything.
- Query params store search-page state, so refresh/back/forward work naturally.
- Detail URLs stay canonical (`/trials/:trialId`); return-to-search context is passed through Angular router state only when navigating from the list.
- The app does not use `sessionStorage` or `localStorage` for search or back-navigation state.
- The frontend uses signals for local state and computed view state.
- TypeScript strict mode is enabled, with typed DTOs, UI models, route query parsing, readonly result arrays, and constrained page sizes.
- Frontend DTO/domain types live separately from mapper functions; `trial.models.ts` is a barrel for ergonomics.
- Angular i18n is compile-time, so translated production bundles do not need an extra runtime translation library.
- HTTP errors are normalized in one interceptor.
- Backend errors use a stable envelope with request ids; database failures return a safe `503` response.
- Backend validation rejects invalid pagination and overly long queries.
- Backend validation rejects non-empty search queries shorter than `3` characters.
- SQLAlchemy repositories query PostgreSQL in Docker and SQLite in tests.
- PostgreSQL uses a `pg_trgm` GIN index on `trials.condition` for faster `ILIKE '%term%'` condition search.
- `app/db/models` contains ORM models; `app/domain` contains seed/demo domain dataclasses.
- Tests cover search, pagination, detail, not found, and frontend API mapping/store behavior.
