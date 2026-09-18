import { ChangeDetectionStrategy, Component } from '@angular/core';

@Component({
  selector: 'app-trial-details-skeleton',
  standalone: true,
  templateUrl: './trial-details-skeleton.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDetailsSkeletonComponent {
  readonly sections = [1, 2, 3] as const;
}
