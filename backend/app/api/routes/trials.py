from typing import Annotated

from fastapi import APIRouter, Depends, Query

from app.schemas.trial import (
    MAX_SEARCH_QUERY_LENGTH,
    MIN_SEARCH_QUERY_LENGTH,
    TrialDetailResponse,
    TrialsSearchQueryParams,
    TrialsSearchResponse,
    TrialsSuggestionsResponse,
)
from app.services.trial_service import TrialService, get_trial_service

router = APIRouter(prefix="/trials", tags=["trials"])


@router.get("", response_model=TrialsSearchResponse)
def search_trials(
    params: Annotated[TrialsSearchQueryParams, Query()],
    service: TrialService = Depends(get_trial_service),
) -> TrialsSearchResponse:
    return service.search_trials(query=params.q, offset=params.offset, limit=params.limit)


@router.get("/suggestions", response_model=TrialsSuggestionsResponse)
def suggest_trials(
    q: Annotated[str, Query(min_length=MIN_SEARCH_QUERY_LENGTH, max_length=MAX_SEARCH_QUERY_LENGTH)],
    limit: Annotated[int, Query(ge=1, le=10)] = 6,
    service: TrialService = Depends(get_trial_service),
) -> TrialsSuggestionsResponse:
    return service.suggest_trials(query=q, limit=limit)


@router.get("/{trial_id}", response_model=TrialDetailResponse)
def get_trial(
    trial_id: str,
    service: TrialService = Depends(get_trial_service),
) -> TrialDetailResponse:
    return service.get_trial(trial_id)
