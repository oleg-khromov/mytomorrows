import { ChangeDetectionStrategy, Component, DestroyRef, effect, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Router } from '@angular/router';
import { distinctUntilChanged, map } from 'rxjs';

import { TrialsSearchStore } from '../store/trials-search.store';
import { TrialSearchFormComponent } from '../components/trial-search-form/trial-search-form.component';
import { TrialsListComponent } from '../components/trials-list/trials-list.component';
import { TrialsListSkeletonComponent } from '../components/trials-list-skeleton/trials-list-skeleton.component';
import { InfiniteScrollSentinelComponent } from '../components/infinite-scroll-sentinel/infinite-scroll-sentinel.component';
import { DEFAULT_RESULT_LIMIT, ResultLimit, SearchQuery, toResultLimit } from '../models/trial.models';

interface TrialsSearchRouteQuery {
  query: SearchQuery;
  limit: ResultLimit;
}

@Component({
  selector: 'app-trials-search-page',
  standalone: true,
  imports: [TrialSearchFormComponent, TrialsListComponent, TrialsListSkeletonComponent, InfiniteScrollSentinelComponent],
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
          limit: toLimitParam(params.get('limit'), DEFAULT_RESULT_LIMIT),
        } satisfies TrialsSearchRouteQuery)),
        distinctUntilChanged(
          (previous, current) => previous.query === current.query && previous.limit === current.limit,
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((request) => this.store.load({ ...request, offset: 0 }));

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
        limit: this.store.limit(),
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

function toLimitParam(value: string | null, fallback: ResultLimit): ResultLimit {
  const parsed = toPositiveInteger(value, fallback);
  return toResultLimit(parsed, fallback);
}
