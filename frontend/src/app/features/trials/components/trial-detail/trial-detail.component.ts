import { ChangeDetectionStrategy, Component, input } from '@angular/core';

import { TrialDetail } from '../../models/trial.models';

@Component({
  selector: 'app-trial-detail',
  standalone: true,
  templateUrl: './trial-detail.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class TrialDetailComponent {
  readonly trial = input.required<TrialDetail>();
}
