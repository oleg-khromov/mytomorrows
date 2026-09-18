import { ChangeDetectionStrategy, Component, computed, DestroyRef, inject, input, linkedSignal, output, signal } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { catchError, distinctUntilChanged, EMPTY, finalize, map, Subject, switchMap, tap, timer } from 'rxjs';

import { withMinimumDuration } from '@core/rxjs/minimum-duration';
import { MAX_SEARCH_QUERY_LENGTH, MIN_SEARCH_QUERY_LENGTH, SearchQuery, TrialSuggestion } from '../../models/trial.models';
import { TrialsApiService } from '../../services/trials-api.service';

const SUGGESTIONS_DEBOUNCE_MS = 600;
const SUGGESTIONS_MINIMUM_LOADING_MS = 500;

@Component({
  selector: 'app-trial-search-form',
  standalone: true,
  templateUrl: './trial-search-form.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialSearchFormComponent {
  private readonly api = inject(TrialsApiService);
  private readonly destroyRef = inject(DestroyRef);
  private readonly suggestionQueries$ = new Subject<SearchQuery>();

  readonly initialQuery = input<SearchQuery>('');
  readonly loading = input(false);
  readonly submitted = output<SearchQuery>();

  readonly query = linkedSignal<SearchQuery>(() => this.initialQuery());
  readonly suggestions = signal<readonly TrialSuggestion[]>([]);
  readonly suggestionsLoading = signal(false);
  readonly suggestionsOpen = signal(false);
  readonly minLength = MIN_SEARCH_QUERY_LENGTH;
  readonly maxLength = MAX_SEARCH_QUERY_LENGTH;
  readonly trimmedQuery = computed(() => this.query().trim());
  readonly remainingCharacters = computed(() => this.maxLength - this.query().length);
  readonly tooShort = computed(() => this.trimmedQuery().length > 0 && this.trimmedQuery().length < this.minLength);
  readonly tooLong = computed(() => this.remainingCharacters() < 0);
  readonly canSubmit = computed(() => !this.loading() && this.trimmedQuery().length >= this.minLength && !this.tooLong());
  readonly showSuggestions = computed(() => this.suggestionsOpen() && (this.suggestionsLoading() || this.suggestions().length > 0));

  constructor() {
    this.suggestionQueries$
      .pipe(
        map((query) => query.trim()),
        distinctUntilChanged(),
        switchMap((query) => {
          if (query.length < this.minLength || this.tooLong()) {
            this.suggestions.set([]);
            this.suggestionsLoading.set(false);

            return EMPTY;
          }

          return timer(SUGGESTIONS_DEBOUNCE_MS).pipe(
            tap(() => this.suggestionsLoading.set(true)),
            switchMap(() =>
              this.api.suggestTrials(query).pipe(
                withMinimumDuration(SUGGESTIONS_MINIMUM_LOADING_MS),
                tap((response) => {
                  this.suggestions.set(response.items);
                  this.suggestionsOpen.set(true);
                }),
                catchError(() => {
                  this.suggestions.set([]);

                  return EMPTY;
                }),
                finalize(() => this.suggestionsLoading.set(false)),
              ),
            ),
          );
        }),
        takeUntilDestroyed(this.destroyRef),
      )
      .subscribe();
  }

  updateQuery(event: Event): void {
    const input = event.target as HTMLInputElement | null;
    const nextQuery = input?.value ?? '';

    this.query.set(nextQuery);
    this.suggestionsOpen.set(true);
    this.suggestionQueries$.next(nextQuery);
  }

  clear(): void {
    if (this.loading() || this.query().length === 0) {
      return;
    }

    this.query.set('');
    this.suggestions.set([]);
    this.suggestionsOpen.set(false);
    this.submitted.emit('');
  }

  selectSuggestion(suggestion: TrialSuggestion): void {
    this.query.set(suggestion.value);
    this.suggestionsOpen.set(false);
  }

  submit(event: SubmitEvent): void {
    event.preventDefault();

    if (!this.canSubmit()) {
      return;
    }

    this.suggestionsOpen.set(false);
    this.submitted.emit(this.trimmedQuery());
  }
}
