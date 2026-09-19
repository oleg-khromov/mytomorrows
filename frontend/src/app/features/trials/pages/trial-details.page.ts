import { ChangeDetectionStrategy, Component, DestroyRef, computed, inject, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { ActivatedRoute, Params, RouterLink } from '@angular/router';
import { catchError, distinctUntilChanged, finalize, map, of, switchMap, tap } from 'rxjs';

import { getErrorMessage } from '@core/http/api-error';
import { withMinimumDuration } from '@core/rxjs/minimum-duration';
import { TrialsApiService } from '../services/trials-api.service';
import { isResultLimit, ResultLimit, SearchQuery, TrialDetail } from '../models/trial.models';
import { TrialDetailComponent } from '../components/trial-detail/trial-detail.component';
import { TrialDetailsSkeletonComponent } from '../components/trial-details-skeleton/trial-details-skeleton.component';

const MINIMUM_LOADING_STATE_MS = 500;

interface SearchReturnQueryParams {
  q: SearchQuery | null;
  limit: ResultLimit;
}

interface TrialDetailsNavigationState {
  returnQueryParams?: SearchReturnQueryParams;
  scrollY?: number;
}

@Component({
  selector: 'app-trial-details-page',
  standalone: true,
  imports: [RouterLink, TrialDetailComponent, TrialDetailsSkeletonComponent],
  templateUrl: './trial-details.page.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDetailsPage {
  private readonly route = inject(ActivatedRoute);
  private readonly api = inject(TrialsApiService);
  private readonly destroyRef = inject(DestroyRef);

  readonly trial = signal<TrialDetail | null>(null);
  readonly loading = signal(true);
  readonly error = signal<string | null>(null);
  readonly backQueryParams = signal<Params>(readReturnQueryParams());
  readonly backNavigationState = signal<Pick<TrialDetailsNavigationState, 'scrollY'>>(readBackNavigationState());

  readonly title = computed(() => this.trial()?.title ?? 'Trial details');

  constructor() {
    this.route.paramMap
      .pipe(
        map((params) => params.get('trialId') ?? ''),
        distinctUntilChanged(),
        tap(() => {
          this.loading.set(true);
          this.error.set(null);
          this.trial.set(null);
        }),
        switchMap((trialId) =>
          this.api.getTrial(trialId).pipe(
            withMinimumDuration(MINIMUM_LOADING_STATE_MS),
            catchError((error: unknown) => {
              this.error.set(getErrorMessage(error));
              return of(null);
            }),
            finalize(() => this.loading.set(false)),
          ),
        ),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe((trial) => this.trial.set(trial));
  }
}

function readReturnQueryParams(): Params {
  const state = globalThis.history?.state as TrialDetailsNavigationState | undefined;
  const returnQueryParams = state?.returnQueryParams;

  if (!isSearchReturnQueryParams(returnQueryParams)) {
    return {};
  }

  return {
    q: returnQueryParams.q || null,
    limit: returnQueryParams.limit,
  };
}

function readBackNavigationState(): Pick<TrialDetailsNavigationState, 'scrollY'> {
  const state = globalThis.history?.state as TrialDetailsNavigationState | undefined;
  const scrollY = state?.scrollY;

  return typeof scrollY === 'number' && Number.isFinite(scrollY) ? { scrollY } : {};
}

function isSearchReturnQueryParams(value: unknown): value is SearchReturnQueryParams {
  if (!isRecord(value)) {
    return false;
  }

  const q = value['q'];
  const limit = value['limit'];

  return (
    (q === null || typeof q === 'string') &&
    typeof limit === 'number' &&
    isResultLimit(limit)
  );
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null;
}
