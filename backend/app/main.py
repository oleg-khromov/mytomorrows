from uuid import uuid4

from fastapi import FastAPI, Request
from fastapi.exceptions import RequestValidationError
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.exc import SQLAlchemyError

from app.api.routes.trials import router as trials_router
from app.core.config import get_settings
from app.core.errors import (
    TrialNotFoundError,
    database_exception_handler,
    trial_not_found_handler,
    validation_exception_handler,
)

settings = get_settings()

app = FastAPI(title=settings.app_name)

app.add_middleware(
    CORSMiddleware,
    allow_origins=list(settings.allowed_origins),
    allow_credentials=True,
    allow_methods=["GET"],
    allow_headers=["*"],
)


@app.middleware("http")
async def add_request_id(request: Request, call_next):
    request.state.request_id = request.headers.get("x-request-id", str(uuid4()))
    response = await call_next(request)
    response.headers["x-request-id"] = request.state.request_id
    return response


app.add_exception_handler(TrialNotFoundError, trial_not_found_handler)
app.add_exception_handler(RequestValidationError, validation_exception_handler)
app.add_exception_handler(SQLAlchemyError, database_exception_handler)


@app.get("/health")
def health() -> dict[str, str]:
    return {"status": "ok"}


app.include_router(trials_router, prefix=settings.api_prefix)
