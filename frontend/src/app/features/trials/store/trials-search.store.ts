import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, EMPTY, exhaustMap, finalize, map, Subject, switchMap, tap } from 'rxjs';

import { getErrorMessage } from '@core/http/api-error';
import { withMinimumDuration } from '@core/rxjs/minimum-duration';
import { DEFAULT_RESULT_LIMIT, ResultLimit, ResultOffset, SearchMeta, SearchQuery, TrialListItem } from '../models/trial.models';
import { TrialsApiService } from '../services/trials-api.service';

const MINIMUM_LOADING_STATE_MS = 500;

export interface SearchRequest {
  query: SearchQuery;
  offset: ResultOffset;
  limit: ResultLimit;
}

@Injectable()
export class TrialsSearchStore {
  private readonly api = inject(TrialsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchRequests$ = new Subject<SearchRequest>();
  private readonly loadMoreRequests$ = new Subject<void>();

  readonly query = signal<SearchQuery>('');
  readonly offset = signal<ResultOffset>(0);
  readonly limit = signal<ResultLimit>(DEFAULT_RESULT_LIMIT);
  readonly items = signal<readonly TrialListItem[]>([]);
  readonly meta = signal<SearchMeta | null>(null);
  readonly loading = signal(false);
  readonly loadingMore = signal(false);
  readonly error = signal<string | null>(null);

  readonly hasSearched = computed(() => this.meta() !== null || this.loading());
  readonly hasResults = computed(() => this.items().length > 0);
  readonly loadedCount = computed(() => this.items().length);
  readonly totalItems = computed(() => this.meta()?.totalItems ?? 0);
  readonly canLoadMore = computed(() => !!this.meta()?.hasNext && !this.loading() && !this.loadingMore());

  constructor() {
    this.searchRequests$
      .pipe(
        map((request) => normalizeSearchRequest(request)),
        switchMap((request) => {
          this.setPendingState(request);

          return this.api.searchTrials(request).pipe(
            withMinimumDuration(MINIMUM_LOADING_STATE_MS),
            tap((response) => {
              this.items.set(response.items);
              this.meta.set(response.meta);
              this.offset.set(response.meta.offset);
            }),
            catchError((error: unknown) => {
              this.items.set([]);
              this.meta.set(null);
              this.error.set(getErrorMessage(error));

              return EMPTY;
            }),
            finalize(() => this.loading.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();

    this.loadMoreRequests$
      .pipe(
        exhaustMap(() => {
          const nextOffset = this.meta()?.nextOffset;

          if (nextOffset === null || nextOffset === undefined || this.loading() || this.loadingMore()) {
            return EMPTY;
          }

          this.loadingMore.set(true);
          this.error.set(null);

          return this.api.searchTrials({
            query: this.query(),
            offset: nextOffset,
            limit: this.limit(),
          }).pipe(
            tap((response) => {
              this.items.update((items) => [...items, ...response.items]);
              this.meta.set(response.meta);
              this.offset.set(response.meta.offset);
            }),
            catchError((error: unknown) => {
              this.error.set(getErrorMessage(error));

              return EMPTY;
            }),
            finalize(() => this.loadingMore.set(false)),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  load(request: SearchRequest): void {
    const normalizedRequest = normalizeSearchRequest(request);

    if (this.canUseCurrentState(normalizedRequest)) {
      return;
    }

    this.searchRequests$.next(normalizedRequest);
  }

  loadMore(): void {
    this.loadMoreRequests$.next();
  }

  private setPendingState(request: SearchRequest): void {
    this.query.set(request.query);
    this.offset.set(request.offset);
    this.limit.set(request.limit);
    this.items.set([]);
    this.meta.set(null);
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
  }

  private canUseCurrentState(request: SearchRequest): boolean {
    return (
      request.offset === 0 &&
      this.meta() !== null &&
      !this.loading() &&
      !this.loadingMore() &&
      isSameSearchRequest(request, this.query(), this.limit())
    );
  }
}

function normalizeSearchRequest(request: SearchRequest): SearchRequest {
  return {
    query: request.query.trim(),
    offset: request.offset,
    limit: request.limit,
  };
}

function isSameSearchRequest(request: SearchRequest, query: SearchQuery, limit: ResultLimit): boolean {
  return request.query === query && request.limit === limit;
}
