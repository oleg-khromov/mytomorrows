from pydantic import BaseModel, ConfigDict, Field, field_validator

MIN_SEARCH_QUERY_LENGTH = 3
MAX_SEARCH_QUERY_LENGTH = 120


class TrialsSearchQueryParams(BaseModel):
    q: str = Field(
        default="",
        min_length=0,
        max_length=MAX_SEARCH_QUERY_LENGTH,
        description="Search by trial condition.",
    )
    page: int = Field(default=1, ge=1)
    page_size: int = Field(default=5, ge=1, le=20)

    @field_validator("q")
    @classmethod
    def validate_query_length(cls, value: str) -> str:
        normalized_value = value.strip()

        if 0 < len(normalized_value) < MIN_SEARCH_QUERY_LENGTH:
            raise ValueError(f"Search query must contain at least {MIN_SEARCH_QUERY_LENGTH} characters.")

        return normalized_value


class TrialLocationResponse(BaseModel):
    country: str
    city: str
    facility: str


class TrialListItemResponse(BaseModel):
    id: str
    title: str
    condition: str
    phase: str
    status: str
    sponsor: str
    country_count: int = Field(ge=0)
    last_updated: str


class TrialDetailResponse(TrialListItemResponse):
    summary: str
    intervention: str
    eligibility: list[str]
    locations: list[TrialLocationResponse]
    contact_email: str
    source_url: str


class PageMeta(BaseModel):
    page: int = Field(ge=1)
    page_size: int = Field(ge=1)
    total_items: int = Field(ge=0)
    total_pages: int = Field(ge=0)
    has_next: bool
    has_previous: bool


class TrialsSearchResponse(BaseModel):
    model_config = ConfigDict(populate_by_name=True)

    query: str
    items: list[TrialListItemResponse]
    meta: PageMeta


class TrialSuggestionResponse(BaseModel):
    value: str
    label: str
    match_type: str


class TrialsSuggestionsResponse(BaseModel):
    query: str
    items: list[TrialSuggestionResponse]
