from fastapi import Depends
from sqlalchemy.orm import Session

from app.core.errors import TrialNotFoundError
from app.db.models.trial import TrialModel
from app.db.session import get_db_session
from app.repositories.trial_repository import TrialRepository
from app.schemas.trial import (
    SearchMeta,
    TrialDetailResponse,
    TrialListItemResponse,
    TrialLocationResponse,
    TrialSuggestionResponse,
    TrialsSuggestionsResponse,
    TrialsSearchResponse,
)


class TrialService:
    def __init__(self, repository: TrialRepository) -> None:
        self.repository = repository

    def search_trials(self, *, query: str, offset: int, limit: int) -> TrialsSearchResponse:
        normalized_query = query.strip()
        page_items, total_items = self.repository.search(query=normalized_query, offset=offset, limit=limit)
        next_offset = offset + len(page_items)
        has_next = next_offset < total_items

        return TrialsSearchResponse(
            query=normalized_query,
            items=[self._to_list_item(trial) for trial in page_items],
            meta=SearchMeta(
                offset=offset,
                limit=limit,
                total_items=total_items,
                has_next=has_next,
                next_offset=next_offset if has_next else None,
            ),
        )

    def get_trial(self, trial_id: str) -> TrialDetailResponse:
        trial = self.repository.get_by_id(trial_id)

        if trial is None:
            raise TrialNotFoundError(trial_id)

        return self._to_detail(trial)

    def suggest_trials(self, *, query: str, limit: int) -> TrialsSuggestionsResponse:
        normalized_query = query.strip()

        return TrialsSuggestionsResponse(
            query=normalized_query,
            items=[
                TrialSuggestionResponse(value=condition, label=condition, match_type="condition")
                for condition in self.repository.suggest(query=normalized_query, limit=limit)
            ],
        )

    def _to_list_item(self, trial: TrialModel) -> TrialListItemResponse:
        return TrialListItemResponse(
            id=trial.id,
            title=trial.title,
            condition=trial.condition,
            phase=trial.phase,
            status=trial.status,
            sponsor=trial.sponsor,
            country_count=len({location.country for location in trial.locations}),
            last_updated=trial.last_updated.isoformat(),
        )

    def _to_detail(self, trial: TrialModel) -> TrialDetailResponse:
        return TrialDetailResponse(
            **self._to_list_item(trial).model_dump(),
            summary=trial.summary,
            intervention=trial.intervention,
            eligibility=[item.criterion for item in trial.eligibility],
            locations=[
                TrialLocationResponse(
                    country=location.country,
                    city=location.city,
                    facility=location.facility,
                )
                for location in trial.locations
            ],
            contact_email=trial.contact_email,
            source_url=trial.source_url,
        )


def get_trial_service(session: Session = Depends(get_db_session)) -> TrialService:
    return TrialService(TrialRepository(session))
