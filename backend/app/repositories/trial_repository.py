from sqlalchemy import ColumnElement, func, select
from sqlalchemy.orm import Session, selectinload

from app.db.models.trial import TrialModel


class TrialRepository:
    def __init__(self, session: Session) -> None:
        self.session = session

    def search(self, *, query: str, offset: int, limit: int) -> tuple[list[TrialModel], int]:
        filters = self._search_filters(query)

        total_items = self.session.scalar(select(func.count()).select_from(TrialModel).where(*filters)) or 0
        statement = (
            select(TrialModel)
            .where(*filters)
            .options(selectinload(TrialModel.eligibility), selectinload(TrialModel.locations))
            .order_by(TrialModel.last_updated.desc(), TrialModel.id.asc())
            .offset(offset)
            .limit(limit)
        )

        return list(self.session.scalars(statement).all()), total_items

    def get_by_id(self, trial_id: str) -> TrialModel | None:
        statement = (
            select(TrialModel)
            .where(TrialModel.id == trial_id)
            .options(selectinload(TrialModel.eligibility), selectinload(TrialModel.locations))
        )

        return self.session.scalars(statement).one_or_none()

    def suggest(self, *, query: str, limit: int) -> list[str]:
        filters = self._search_filters(query)
        statement = (
            select(TrialModel.condition)
            .where(*filters)
            .group_by(TrialModel.condition)
            .order_by(func.max(TrialModel.last_updated).desc(), TrialModel.condition.asc())
            .limit(limit)
        )

        return list(self.session.scalars(statement).all())

    def _search_filters(self, query: str) -> tuple[ColumnElement[bool], ...]:
        if not query:
            return ()

        pattern = f"%{query}%"

        return (TrialModel.condition.ilike(pattern),)
