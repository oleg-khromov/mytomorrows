export type TrialId = string;
export type SearchQuery = string;
export type ResultOffset = number;
export type ResultLimit = 10 | 20 | 50;

export const DEFAULT_RESULT_LIMIT: ResultLimit = 10;
export const ALLOWED_RESULT_LIMITS = [10, 20, 50] as const satisfies readonly ResultLimit[];
export const MIN_SEARCH_QUERY_LENGTH = 3;
export const MAX_SEARCH_QUERY_LENGTH = 120;

export interface TrialListItemDto {
  id: TrialId;
  title: string;
  condition: string;
  phase: string;
  status: string;
  sponsor: string;
  country_count: number;
  last_updated: string;
}

export interface TrialLocationDto {
  country: string;
  city: string;
  facility: string;
}

export interface TrialDetailDto extends TrialListItemDto {
  summary: string;
  intervention: string;
  eligibility: readonly string[];
  locations: readonly TrialLocationDto[];
  contact_email: string;
  source_url: string;
}

export interface SearchMetaDto {
  offset: number;
  limit: number;
  total_items: number;
  has_next: boolean;
  next_offset: number | null;
}

export interface TrialsSearchResponseDto {
  query: string;
  items: readonly TrialListItemDto[];
  meta: SearchMetaDto;
}

export interface TrialSuggestionDto {
  value: string;
  label: string;
  match_type: string;
}

export interface TrialsSuggestionsResponseDto {
  query: string;
  items: readonly TrialSuggestionDto[];
}

export interface TrialListItem {
  id: TrialId;
  title: string;
  condition: string;
  phase: string;
  status: string;
  sponsor: string;
  countryCount: number;
  lastUpdated: string;
}

export interface TrialLocation {
  country: string;
  city: string;
  facility: string;
}

export interface TrialDetail extends TrialListItem {
  summary: string;
  intervention: string;
  eligibility: readonly string[];
  locations: readonly TrialLocation[];
  contactEmail: string;
  sourceUrl: string;
}

export interface SearchMeta {
  offset: ResultOffset;
  limit: ResultLimit;
  totalItems: number;
  hasNext: boolean;
  nextOffset: ResultOffset | null;
}

export interface TrialsSearchResponse {
  query: string;
  items: readonly TrialListItem[];
  meta: SearchMeta;
}

export interface TrialSuggestion {
  value: string;
  label: string;
  matchType: string;
}

export interface TrialsSuggestionsResponse {
  query: string;
  items: readonly TrialSuggestion[];
}

export interface SearchTrialsParams {
  query: SearchQuery;
  offset: ResultOffset;
  limit: ResultLimit;
}

export function toResultLimit(value: number, fallback: ResultLimit = DEFAULT_RESULT_LIMIT): ResultLimit {
  return isResultLimit(value) ? value : fallback;
}

export function isResultLimit(value: number): value is ResultLimit {
  return ALLOWED_RESULT_LIMITS.includes(value as ResultLimit);
}
