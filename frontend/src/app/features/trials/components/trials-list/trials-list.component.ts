import { ChangeDetectionStrategy, Component, input, signal } from '@angular/core';
import { RouterLink } from '@angular/router';

import { DEFAULT_PAGE_SIZE, PageNumber, PageSize, SearchQuery, TrialListItem } from '../../models/trial.models';
import { TrialsListSkeletonComponent } from '../trials-list-skeleton/trials-list-skeleton.component';

@Component({
  selector: 'app-trials-list',
  standalone: true,
  imports: [RouterLink, TrialsListSkeletonComponent],
  templateUrl: './trials-list.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialsListComponent {
  readonly trials = input.required<readonly TrialListItem[]>();
  readonly loading = input(false);
  readonly error = input<string | null>(null);
  readonly query = input<SearchQuery>('');
  readonly page = input<PageNumber>(1);
  readonly pageSize = input<PageSize>(DEFAULT_PAGE_SIZE);
  readonly scrollY = signal(0);

  captureScrollPosition(): void {
    this.scrollY.set(globalThis.scrollY ?? 0);
  }
}
