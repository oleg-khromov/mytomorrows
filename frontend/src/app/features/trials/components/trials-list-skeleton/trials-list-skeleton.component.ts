import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trials-list-skeleton',
  standalone: true,
  templateUrl: './trials-list-skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialsListSkeletonComponent {
  readonly skeletonRows = [1, 2, 3] as const;
}
