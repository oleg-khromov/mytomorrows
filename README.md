# Full-stack demo application for searching clinical trials by condition.

## Stack

- Backend: FastAPI, Pydantic v2, SQLAlchemy, Alembic, PostgreSQL
- Frontend: Angular `21.2.7`, standalone components, signals, Angular i18n
- Runtime: Docker Compose for frontend, backend, and database

## Install And Run With Docker

From this folder:

```bash
docker compose up --build
```

Open:

- Frontend: `http://localhost:4200`
- Backend health check: `http://localhost:8000/health`
- Backend API: `http://localhost:8000/api/v1/trials?q=cancer&page=1&page_size=5`
- PostgreSQL: `localhost:5433`, database `mytomorrows`

Docker uses:

- `backend/.env`
- `frontend/.env`
- `docker-compose.yml`

## Install Backend Locally

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

By default, local backend runs use SQLite at `backend/trials.db`. Docker Compose uses PostgreSQL.

## Install Frontend Locally

Use Node `22.12+`.

```bash
cd frontend
npm install
npm start
```

Frontend runs on `http://localhost:4200` and proxies `/api` to `http://localhost:8000`.

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

## Project Structure

```text
.
├── backend
│   ├── app
│   │   ├── api/routes      # FastAPI route handlers
│   │   ├── core            # configuration and error handling
│   │   ├── data            # static seed dataset
│   │   ├── db              # SQLAlchemy setup, ORM models, seed command
│   │   ├── domain          # demo domain dataclasses
│   │   ├── repositories    # database query layer
│   │   ├── schemas         # Pydantic request/response schemas
│   │   └── services        # business logic and response mapping
│   ├── api                 # Vercel FastAPI entrypoint
│   ├── migrations          # Alembic migrations
│   ├── scripts             # deployment/build helpers
│   ├── tests               # backend tests
│   ├── Dockerfile
│   ├── pyproject.toml
│   └── vercel.json
├── frontend
│   ├── scripts             # frontend build-time environment generation
│   ├── src
│   │   ├── app
│   │   │   ├── core        # shared HTTP and RxJS helpers
│   │   │   └── features
│   │   │       └── trials  # trials pages, components, services, store, models
│   │   ├── environments    # Angular environment configuration
│   │   ├── locale          # Angular i18n translations
│   │   ├── main.ts
│   │   └── styles.css
│   ├── Dockerfile
│   ├── angular.json
│   ├── package.json
│   └── vercel.json
├── docker-compose.yml
└── README.md
```
