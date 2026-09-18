import { computed, DestroyRef, inject, Injectable, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, concatMap, EMPTY, exhaustMap, finalize, map, range, Subject, switchMap, tap } from 'rxjs';

import { getErrorMessage } from '@core/http/api-error';
import { withMinimumDuration } from '@core/rxjs/minimum-duration';
import { PageMeta, PageNumber, PageSize, SearchQuery, TrialListItem } from '../models/trial.models';
import { TrialsApiService } from '../services/trials-api.service';

const MINIMUM_LOADING_STATE_MS = 500;

export interface SearchRequest {
  query: SearchQuery;
  page: PageNumber;
  pageSize: PageSize;
}

@Injectable()
export class TrialsSearchStore {
  private readonly api = inject(TrialsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly searchRequests$ = new Subject<SearchRequest>();
  private readonly loadMoreRequests$ = new Subject<void>();

  readonly query = signal<SearchQuery>('');
  readonly page = signal<PageNumber>(1);
  readonly pageSize = signal<PageSize>(5);
  readonly items = signal<readonly TrialListItem[]>([]);
  readonly meta = signal<PageMeta | null>(null);
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

          return range(1, request.page).pipe(
            concatMap((page) => this.api.searchTrials({ ...request, page })),
            withMinimumDuration(MINIMUM_LOADING_STATE_MS),
            tap((response) => {
              this.items.update((items) => [...items, ...response.items]);
              this.meta.set(response.meta);
              this.page.set(response.meta.page);
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
          const meta = this.meta();

          if (!meta?.hasNext || this.loading() || this.loadingMore()) {
            return EMPTY;
          }

          this.loadingMore.set(true);
          this.error.set(null);

          return this.api.searchTrials({
            query: this.query(),
            page: meta.page + 1,
            pageSize: this.pageSize(),
          }).pipe(
            tap((response) => {
              this.items.update((items) => [...items, ...response.items]);
              this.meta.set(response.meta);
              this.page.set(response.meta.page);
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
    this.searchRequests$.next(request);
  }

  loadMore(): void {
    this.loadMoreRequests$.next();
  }

  private setPendingState(request: SearchRequest): void {
    this.query.set(request.query);
    this.page.set(request.page);
    this.pageSize.set(request.pageSize);
    this.items.set([]);
    this.meta.set(null);
    this.loading.set(true);
    this.loadingMore.set(false);
    this.error.set(null);
  }
}

function normalizeSearchRequest(request: SearchRequest): SearchRequest {
  return {
    query: request.query.trim(),
    page: request.page,
    pageSize: request.pageSize,
  };
}
