import { fakeAsync, TestBed, tick } from '@angular/core/testing';
import { of, Subject, throwError } from 'rxjs';

import { TrialsSearchResponse } from '../models/trial.models';
import { TrialsApiService } from '../services/trials-api.service';
import { TrialsSearchStore } from './trials-search.store';

describe(TrialsSearchStore.name, () => {
  it('loads trials and exposes computed state', fakeAsync(() => {
    const api = jasmine.createSpyObj<TrialsApiService>('TrialsApiService', ['searchTrials']);
    api.searchTrials.and.returnValue(of(buildSearchResponse('solid tumor', 'Targeted Therapy')));

    TestBed.configureTestingModule({
      providers: [
        TrialsSearchStore,
        { provide: TrialsApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TrialsSearchStore);
    store.load({ query: ' solid tumor ', offset: 0, limit: 10 });

    expect(api.searchTrials).toHaveBeenCalledWith({ query: 'solid tumor', offset: 0, limit: 10 });
    expect(store.loading()).toBeTrue();

    tick(500);

    expect(store.items().length).toBe(1);
    expect(store.hasResults()).toBeTrue();
    expect(store.meta()?.totalItems).toBe(1);
    expect(store.loading()).toBeFalse();
  }));

  it('normalizes failed search state', fakeAsync(() => {
    const api = jasmine.createSpyObj<TrialsApiService>('TrialsApiService', ['searchTrials']);
    api.searchTrials.and.returnValue(throwError(() => new Error('Backend unavailable')));

    TestBed.configureTestingModule({
      providers: [
        TrialsSearchStore,
        { provide: TrialsApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TrialsSearchStore);
    store.load({ query: 'solid tumor', offset: 0, limit: 10 });

    tick(500);

    expect(store.items()).toEqual([]);
    expect(store.meta()).toBeNull();
    expect(store.error()).toBe('Something went wrong. Please try again.');
    expect(store.loading()).toBeFalse();
  }));

  it('keeps only the latest in-flight search result', fakeAsync(() => {
    const firstSearch$ = new Subject<TrialsSearchResponse>();
    const secondSearch$ = new Subject<TrialsSearchResponse>();
    const api = jasmine.createSpyObj<TrialsApiService>('TrialsApiService', ['searchTrials']);
    api.searchTrials.and.returnValues(firstSearch$.asObservable(), secondSearch$.asObservable());

    TestBed.configureTestingModule({
      providers: [
        TrialsSearchStore,
        { provide: TrialsApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TrialsSearchStore);
    store.load({ query: 'cancer', offset: 0, limit: 10 });
    store.load({ query: 'tumor', offset: 0, limit: 10 });

    firstSearch$.next(buildSearchResponse('cancer', 'Old result'));
    firstSearch$.complete();
    secondSearch$.next(buildSearchResponse('tumor', 'Latest result'));
    secondSearch$.complete();

    tick(500);

    expect(store.query()).toBe('tumor');
    expect(store.items()[0]?.title).toBe('Latest result');
  }));

  it('appends the next offset for infinite scroll', fakeAsync(() => {
    const secondPage$ = new Subject<TrialsSearchResponse>();
    const api = jasmine.createSpyObj<TrialsApiService>('TrialsApiService', ['searchTrials']);
    api.searchTrials.and.returnValues(
      of(buildSearchResponse('cancer', 'First page result', { totalItems: 2, hasNext: true, nextOffset: 1 })),
      secondPage$.asObservable(),
    );

    TestBed.configureTestingModule({
      providers: [
        TrialsSearchStore,
        { provide: TrialsApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TrialsSearchStore);
    store.load({ query: 'cancer', offset: 0, limit: 10 });

    tick(500);

    store.loadMore();

    expect(store.loadingMore()).toBeTrue();

    secondPage$.next(buildSearchResponse('cancer', 'Second page result', { offset: 1, totalItems: 2, hasNext: false }));
    secondPage$.complete();

    expect(api.searchTrials).toHaveBeenCalledWith({ query: 'cancer', offset: 1, limit: 10 });
    expect(store.items().map((item) => item.title)).toEqual(['First page result', 'Second page result']);
    expect(store.loadedCount()).toBe(2);
    expect(store.totalItems()).toBe(2);
    expect(store.loadingMore()).toBeFalse();
  }));

  it('keeps loaded state for return-from-detail navigation', fakeAsync(() => {
    const api = jasmine.createSpyObj<TrialsApiService>('TrialsApiService', ['searchTrials']);
    api.searchTrials.and.returnValue(of(buildSearchResponse('cancer', 'Cached result')));

    TestBed.configureTestingModule({
      providers: [
        TrialsSearchStore,
        { provide: TrialsApiService, useValue: api },
      ],
    });

    const store = TestBed.inject(TrialsSearchStore);
    store.load({ query: 'cancer', offset: 0, limit: 10 });

    tick(500);

    store.load({ query: 'cancer', offset: 0, limit: 10 });

    expect(api.searchTrials).toHaveBeenCalledTimes(1);
    expect(store.items()[0]?.title).toBe('Cached result');
  }));
});

function buildSearchResponse(
  query: string,
  title: string,
  meta: Partial<TrialsSearchResponse['meta']> = {},
): TrialsSearchResponse {
  return {
    query,
    items: [
      {
        id: 'NCT-1001',
        title,
        condition: 'Solid Tumor',
        phase: 'Phase 2',
        status: 'Recruiting',
        sponsor: 'Sponsor',
        countryCount: 2,
        lastUpdated: '2026-08-12',
      },
    ],
    meta: {
      offset: meta.offset ?? 0,
      limit: meta.limit ?? 10,
      totalItems: meta.totalItems ?? 1,
      hasNext: meta.hasNext ?? false,
      nextOffset: meta.nextOffset ?? null,
    },
  };
}
