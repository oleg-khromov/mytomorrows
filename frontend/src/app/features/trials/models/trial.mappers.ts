import {
  DEFAULT_PAGE_SIZE,
  PageMeta,
  PageMetaDto,
  TrialDetail,
  TrialDetailDto,
  TrialListItem,
  TrialListItemDto,
  TrialSuggestion,
  TrialSuggestionDto,
  TrialsSuggestionsResponse,
  TrialsSuggestionsResponseDto,
  TrialsSearchResponse,
  TrialsSearchResponseDto,
  toPageSize,
} from './trial.types';

export function mapTrialListItem(dto: TrialListItemDto): TrialListItem {
  return {
    id: dto.id,
    title: dto.title,
    condition: dto.condition,
    phase: dto.phase,
    status: dto.status,
    sponsor: dto.sponsor,
    countryCount: dto.country_count,
    lastUpdated: dto.last_updated,
  };
}

export function mapPageMeta(dto: PageMetaDto): PageMeta {
  return {
    page: dto.page,
    pageSize: toPageSize(dto.page_size, DEFAULT_PAGE_SIZE),
    totalItems: dto.total_items,
    totalPages: dto.total_pages,
    hasNext: dto.has_next,
    hasPrevious: dto.has_previous,
  };
}

export function mapSearchResponse(dto: TrialsSearchResponseDto): TrialsSearchResponse {
  return {
    query: dto.query,
    items: dto.items.map(mapTrialListItem),
    meta: mapPageMeta(dto.meta),
  };
}

export function mapTrialDetail(dto: TrialDetailDto): TrialDetail {
  return {
    ...mapTrialListItem(dto),
    summary: dto.summary,
    intervention: dto.intervention,
    eligibility: dto.eligibility,
    locations: dto.locations,
    contactEmail: dto.contact_email,
    sourceUrl: dto.source_url,
  };
}

export function mapTrialSuggestion(dto: TrialSuggestionDto): TrialSuggestion {
  return {
    value: dto.value,
    label: dto.label,
    matchType: dto.match_type,
  };
}

export function mapSuggestionsResponse(dto: TrialsSuggestionsResponseDto): TrialsSuggestionsResponse {
  return {
    query: dto.query,
    items: dto.items.map(mapTrialSuggestion),
  };
}
