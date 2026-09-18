import logging

from fastapi import Request
from fastapi.encoders import jsonable_encoder
from fastapi.exceptions import RequestValidationError
from fastapi.responses import JSONResponse
from pydantic import BaseModel
from sqlalchemy.exc import SQLAlchemyError
from starlette import status

logger = logging.getLogger(__name__)


class ApiError(BaseModel):
    code: str
    message: str
    request_id: str | None = None


class TrialNotFoundError(Exception):
    def __init__(self, trial_id: str) -> None:
        self.trial_id = trial_id
        super().__init__(f"Trial '{trial_id}' was not found")


def _request_id(request: Request) -> str | None:
    return getattr(request.state, "request_id", None)


async def trial_not_found_handler(request: Request, exc: TrialNotFoundError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_404_NOT_FOUND,
        content=ApiError(
            code="trial_not_found",
            message=f"Trial '{exc.trial_id}' was not found",
            request_id=_request_id(request),
        ).model_dump(),
    )


async def validation_exception_handler(request: Request, exc: RequestValidationError) -> JSONResponse:
    return JSONResponse(
        status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
        content={
            "code": "validation_error",
            "message": "Request validation failed",
            "request_id": _request_id(request),
            "errors": _validation_errors(exc),
        },
    )


async def database_exception_handler(request: Request, exc: SQLAlchemyError) -> JSONResponse:
    logger.error("Database error while handling request", exc_info=exc)

    return JSONResponse(
        status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
        content=ApiError(
            code="database_unavailable",
            message="The trial catalogue is temporarily unavailable.",
            request_id=_request_id(request),
        ).model_dump(),
    )


def _validation_errors(exc: RequestValidationError) -> list[dict[str, object]]:
    errors = jsonable_encoder(exc.errors())

    for error in errors:
        error.pop("ctx", None)

    return errors
