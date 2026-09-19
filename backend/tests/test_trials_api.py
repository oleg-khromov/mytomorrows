from collections.abc import Generator

from fastapi.testclient import TestClient
from sqlalchemy import create_engine
from sqlalchemy.orm import Session, sessionmaker
from sqlalchemy.pool import StaticPool

from app.db.base import Base
from app.db.models import TrialEligibilityModel, TrialLocationModel, TrialModel
from app.db.seed import seed_trials
from app.db.session import get_db_session
from app.main import app


engine = create_engine(
    "sqlite+pysqlite:///:memory:",
    connect_args={"check_same_thread": False},
    poolclass=StaticPool,
)
TestingSessionLocal = sessionmaker(bind=engine, autoflush=False, autocommit=False, expire_on_commit=False)
Base.metadata.create_all(bind=engine)

with TestingSessionLocal() as seed_session:
    seed_trials(seed_session)


def override_db_session() -> Generator[Session, None, None]:
    with TestingSessionLocal() as session:
        yield session


app.dependency_overrides[get_db_session] = override_db_session
client = TestClient(app)


def test_health() -> None:
    response = client.get("/health")

    assert response.status_code == 200
    assert response.json() == {"status": "ok"}


def test_search_returns_paginated_lightweight_results() -> None:
    response = client.get("/api/v1/trials", params={"q": "cancer", "offset": 0, "limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "cancer"
    assert body["meta"]["offset"] == 0
    assert body["meta"]["limit"] == 10
    assert body["meta"]["total_items"] >= 10
    assert body["meta"]["next_offset"] == 10
    assert len(body["items"]) == 10
    assert "summary" not in body["items"][0]
    assert {"id", "title", "condition", "phase", "status", "sponsor", "country_count", "last_updated"} <= set(
        body["items"][0].keys()
    )


def test_search_empty_query_is_allowed_but_still_paginated() -> None:
    response = client.get("/api/v1/trials", params={"offset": 0, "limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert len(body["items"]) == 10
    assert body["meta"]["total_items"] == 100
    assert body["meta"]["has_next"] is True


def test_search_rejects_non_empty_query_shorter_than_three_characters() -> None:
    response = client.get("/api/v1/trials", params={"q": "ca", "offset": 0, "limit": 10})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    assert "at least 3 characters" in str(body["errors"])


def test_search_returns_empty_page_for_query_with_no_matches() -> None:
    response = client.get("/api/v1/trials", params={"q": "bbb", "offset": 0, "limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "bbb"
    assert body["items"] == []
    assert body["meta"]["total_items"] == 0
    assert body["meta"]["next_offset"] is None


def test_search_matches_condition_only() -> None:
    response = client.get("/api/v1/trials", params={"q": "Amsterdam", "offset": 0, "limit": 10})

    assert response.status_code == 200
    body = response.json()
    assert body["items"] == []
    assert body["meta"]["total_items"] == 0


def test_search_rejects_invalid_pagination() -> None:
    response = client.get("/api/v1/trials", params={"offset": -1, "limit": 100})

    assert response.status_code == 422
    body = response.json()
    assert body["code"] == "validation_error"
    assert body["errors"]


def test_get_trial_returns_full_detail() -> None:
    response = client.get("/api/v1/trials/NCT-1001")

    assert response.status_code == 200
    body = response.json()
    assert body["id"] == "NCT-1001"
    assert body["summary"]
    assert body["intervention"]
    assert body["eligibility"]
    assert body["locations"]
    assert body["contact_email"]
    assert body["source_url"]


def test_get_trial_returns_404_for_unknown_id() -> None:
    response = client.get("/api/v1/trials/UNKNOWN")

    assert response.status_code == 404
    body = response.json()
    assert body["code"] == "trial_not_found"


def test_suggest_trials_returns_limited_matches() -> None:
    response = client.get("/api/v1/trials/suggestions", params={"q": "cancer", "limit": 4})

    assert response.status_code == 200
    body = response.json()
    assert body["query"] == "cancer"
    assert 0 < len(body["items"]) <= 4
    assert {"value", "label", "match_type"} <= set(body["items"][0].keys())


def test_suggest_trials_rejects_short_query() -> None:
    response = client.get("/api/v1/trials/suggestions", params={"q": "ca"})

    assert response.status_code == 422
    assert response.json()["code"] == "validation_error"
