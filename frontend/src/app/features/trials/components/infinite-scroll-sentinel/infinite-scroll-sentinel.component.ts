import { afterNextRender, ChangeDetectionStrategy, Component, effect, ElementRef, inject, input, output, signal } from '@angular/core';

@Component({
  selector: 'app-infinite-scroll-sentinel',
  standalone: true,
  templateUrl: './infinite-scroll-sentinel.component.html',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class InfiniteScrollSentinelComponent {
  private readonly element = inject<ElementRef<HTMLElement>>(ElementRef);
  private observer: IntersectionObserver | null = null;
  private readonly intersecting = signal(false);

  readonly disabled = input(false);
  readonly reached = output<void>();

  constructor() {
    effect(() => {
      if (!this.disabled() && this.intersecting()) {
        this.reached.emit();
      }
    });

    afterNextRender(() => {
      if (!('IntersectionObserver' in globalThis)) {
        return;
      }

      this.observer = new IntersectionObserver(
        (entries) => {
          this.intersecting.set(entries.some((entry) => entry.isIntersecting));
        },
        { rootMargin: '360px 0px' },
      );
      this.observer.observe(this.element.nativeElement);
    });
  }

  ngOnDestroy(): void {
    this.observer?.disconnect();
  }
}
