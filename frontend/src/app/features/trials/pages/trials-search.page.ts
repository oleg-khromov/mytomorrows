import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

import { TrialsSearchStore } from '../store/trials-search.store';
import { TrialSearchFormComponent } from '../components/trial-search-form/trial-search-form.component';
import { TrialsListComponent } from '../components/trials-list/trials-list.component';
import { TrialsListSkeletonComponent } from '../components/trials-list-skeleton/trials-list-skeleton.component';
import { InfiniteScrollSentinelComponent } from '../components/infinite-scroll-sentinel/infinite-scroll-sentinel.component';
import { DEFAULT_PAGE_SIZE, PageNumber, PageSize, SearchQuery, toPageSize } from '../models/trial.models';

interface TrialsSearchRouteQuery {
  query: SearchQuery;
  page: PageNumber;
  pageSize: PageSize;
}

@Component({
  selector: 'app-trials-search-page',
  standalone: true,
  imports: [TrialSearchFormComponent, TrialsListComponent, TrialsListSkeletonComponent, InfiniteScrollSentinelComponent],
  providers: [TrialsSearchStore],
  templateUrl: './trials-search.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialsSearchPage {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly destroyRef = inject(DestroyRef);
  private readonly restoreScrollY = readNavigationScrollY();
  private hasRestoredScroll = false;

  readonly store = inject(TrialsSearchStore);

  constructor() {
    this.route.queryParamMap
      .pipe(
        map((params) => ({
          query: params.get('q') ?? '',
          page: toPositiveInteger(params.get('page'), 1),
          pageSize: toPageSizeParam(params.get('page_size'), DEFAULT_PAGE_SIZE),
        } satisfies TrialsSearchRouteQuery)),
        distinctUntilChanged(
          (previous, current) =>
            previous.query === current.query &&
            previous.page === current.page &&
            previous.pageSize === current.pageSize,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((request) => this.store.load(request));

    effect(() => {
      if (this.hasRestoredScroll || this.restoreScrollY <= 0 || this.store.loading() || this.store.items().length === 0) {
        return;
      }

      this.hasRestoredScroll = true;
      globalThis.requestAnimationFrame(() => {
        globalThis.scrollTo({ top: this.restoreScrollY, behavior: 'auto' });
      });
    });
  }

  search(query: SearchQuery): void {
    void this.router.navigate([], {
      relativeTo: this.route,
      queryParams: {
        q: query || null,
        page: 1,
        page_size: this.store.pageSize(),
      },
    });
  }

  loadMore(): void {
    this.store.loadMore();
  }
}

interface SearchNavigationState {
  scrollY?: number;
}

function readNavigationScrollY(): number {
  const state = globalThis.history?.state as SearchNavigationState | undefined;
  const scrollY = state?.scrollY;

  return typeof scrollY === 'number' && Number.isFinite(scrollY) ? scrollY : 0;
}

function toPositiveInteger(value: string | null, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

function toPageSizeParam(value: string | null, fallback: PageSize): PageSize {
  const parsed = toPositiveInteger(value, fallback);
  return toPageSize(parsed, fallback);
}
