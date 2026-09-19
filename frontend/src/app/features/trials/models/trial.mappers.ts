import {
  DEFAULT_RESULT_LIMIT,
  SearchMeta,
  SearchMetaDto,
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
  toResultLimit,
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

export function mapSearchMeta(dto: SearchMetaDto): SearchMeta {
  return {
    offset: dto.offset,
    limit: toResultLimit(dto.limit, DEFAULT_RESULT_LIMIT),
    totalItems: dto.total_items,
    hasNext: dto.has_next,
    nextOffset: dto.next_offset,
  };
}

export function mapSearchResponse(dto: TrialsSearchResponseDto): TrialsSearchResponse {
  return {
    query: dto.query,
    items: dto.items.map(mapTrialListItem),
    meta: mapSearchMeta(dto.meta),
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
