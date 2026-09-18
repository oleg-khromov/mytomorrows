export type TrialId = string;
export type SearchQuery = string;
export type PageNumber = number;
export type PageSize = 5 | 10 | 20;

export const DEFAULT_PAGE_SIZE: PageSize = 5;
export const ALLOWED_PAGE_SIZES = [5, 10, 20] as const satisfies readonly PageSize[];
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

export interface PageMetaDto {
  page: number;
  page_size: number;
  total_items: number;
  total_pages: number;
  has_next: boolean;
  has_previous: boolean;
}

export interface TrialsSearchResponseDto {
  query: string;
  items: readonly TrialListItemDto[];
  meta: PageMetaDto;
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

export interface PageMeta {
  page: PageNumber;
  pageSize: PageSize;
  totalItems: number;
  totalPages: number;
  hasNext: boolean;
  hasPrevious: boolean;
}

export interface TrialsSearchResponse {
  query: string;
  items: readonly TrialListItem[];
  meta: PageMeta;
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
  page: PageNumber;
  pageSize: PageSize;
}

export function toPageSize(value: number, fallback: PageSize = DEFAULT_PAGE_SIZE): PageSize {
  return isPageSize(value) ? value : fallback;
}

export function isPageSize(value: number): value is PageSize {
  return ALLOWED_PAGE_SIZES.includes(value as PageSize);
}
