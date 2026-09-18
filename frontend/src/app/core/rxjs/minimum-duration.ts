import { concatMap, defer, dematerialize, map, materialize, MonoTypeOperatorFunction, timer } from 'rxjs';

export function withMinimumDuration<T>(minimumDurationMs: number): MonoTypeOperatorFunction<T> {
  return (source) =>
    defer(() => {
      const startedAt = Date.now();

      return source.pipe(
        materialize(),
        concatMap((notification) => {
          const elapsedMs = Date.now() - startedAt;
          const remainingMs = Math.max(0, minimumDurationMs - elapsedMs);

          return timer(remainingMs).pipe(map(() => notification));
        }),
        dematerialize(),
      );
    });
}
