from datetime import date

from sqlalchemy import select
from sqlalchemy.orm import Session

from app.data.trials import TRIALS
from app.db.models.trial import TrialEligibilityModel, TrialLocationModel, TrialModel
from app.db.session import SessionLocal


def seed_trials(session: Session | None = None) -> None:
    if session is not None:
        _seed_trials(session)
        return

    with SessionLocal() as session:
        _seed_trials(session)


def _seed_trials(session: Session) -> None:
    existing_trial_ids = set(session.scalars(select(TrialModel.id)).all())
    new_trials = [trial for trial in TRIALS if trial.id not in existing_trial_ids]

    if not new_trials:
        return

    session.add_all(
        TrialModel(
            id=trial.id,
            title=trial.title,
            condition=trial.condition,
            sponsor=trial.sponsor,
            phase=trial.phase.value,
            status=trial.status.value,
            summary=trial.summary,
            intervention=trial.intervention,
            last_updated=date.fromisoformat(trial.last_updated),
            contact_email=trial.contact_email,
            source_url=trial.source_url,
            eligibility=[
                TrialEligibilityModel(order_index=index, criterion=criterion)
                for index, criterion in enumerate(trial.eligibility)
            ],
            locations=[
                TrialLocationModel(
                    country=location.country,
                    city=location.city,
                    facility=location.facility,
                )
                for location in trial.locations
            ],
        )
        for trial in new_trials
    )
    session.commit()


if __name__ == "__main__":
    seed_trials()
