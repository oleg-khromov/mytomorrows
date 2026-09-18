from dataclasses import dataclass
from enum import StrEnum


class TrialPhase(StrEnum):
    phase_1 = "Phase 1"
    phase_2 = "Phase 2"
    phase_3 = "Phase 3"
    phase_4 = "Phase 4"


class TrialStatus(StrEnum):
    recruiting = "Recruiting"
    active_not_recruiting = "Active, not recruiting"
    completed = "Completed"


@dataclass(frozen=True)
class TrialLocation:
    country: str
    city: str
    facility: str


@dataclass(frozen=True)
class Trial:
    id: str
    title: str
    condition: str
    sponsor: str
    phase: TrialPhase
    status: TrialStatus
    summary: str
    intervention: str
    eligibility: tuple[str, ...]
    locations: tuple[TrialLocation, ...]
    last_updated: str
    contact_email: str
    source_url: str
