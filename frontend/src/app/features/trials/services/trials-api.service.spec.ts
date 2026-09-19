import { TestBed } from '@angular/core/testing';
import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';

import { TrialsApiService } from './trials-api.service';

describe(TrialsApiService.name, () => {
  let service: TrialsApiService;
  let http: HttpTestingController;

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [
        TrialsApiService,
        provideHttpClient(),
        provideHttpClientTesting(),
      ],
    });

    service = TestBed.inject(TrialsApiService);
    http = TestBed.inject(HttpTestingController);
  });

  afterEach(() => {
    http.verify();
  });

  it('maps paginated search DTOs to UI models', () => {
    service.searchTrials({ query: 'solid tumor', offset: 0, limit: 10 }).subscribe((response) => {
      expect(response.items[0].countryCount).toBe(2);
      expect(response.items[0].lastUpdated).toBe('2026-08-12');
      expect(response.meta.limit).toBe(10);
    });

    const request = http.expectOne((item) => item.url === '/api/v1/trials');

    expect(request.request.params.get('q')).toBe('solid tumor');
    expect(request.request.params.get('offset')).toBe('0');
    expect(request.request.params.get('limit')).toBe('10');

    request.flush({
      query: 'solid tumor',
      items: [
        {
          id: 'NCT-1001',
          title: 'Targeted Therapy for Advanced Solid Tumors',
          condition: 'Solid Tumor',
          phase: 'Phase 2',
          status: 'Recruiting',
          sponsor: 'Amsterdam Oncology Research Network',
          country_count: 2,
          last_updated: '2026-08-12',
        },
      ],
      meta: {
        offset: 0,
        limit: 10,
        total_items: 1,
        has_next: false,
        next_offset: null,
      },
    });
  });

  it('omits q when the query is empty so browsing all trials remains possible', () => {
    service.searchTrials({ query: '', offset: 0, limit: 10 }).subscribe((response) => {
      expect(response.items).toEqual([]);
      expect(response.meta.totalItems).toBe(0);
    });

    const request = http.expectOne((item) => item.url === '/api/v1/trials');

    expect(request.request.params.has('q')).toBeFalse();
    expect(request.request.params.get('offset')).toBe('0');
    expect(request.request.params.get('limit')).toBe('10');

    request.flush({
      query: '',
      items: [],
      meta: {
        offset: 0,
        limit: 10,
        total_items: 0,
        has_next: false,
        next_offset: null,
      },
    });
  });

  it('maps trial detail DTOs to UI models', () => {
    service.getTrial('NCT-1001').subscribe((trial) => {
      expect(trial.contactEmail).toBe('solid-tumor@example.test');
      expect(trial.sourceUrl).toContain('NCT-1001');
      expect(trial.locations[0].country).toBe('Netherlands');
    });

    const request = http.expectOne('/api/v1/trials/NCT-1001');

    request.flush({
      id: 'NCT-1001',
      title: 'Targeted Therapy for Advanced Solid Tumors',
      condition: 'Solid Tumor',
      phase: 'Phase 2',
      status: 'Recruiting',
      sponsor: 'Amsterdam Oncology Research Network',
      country_count: 2,
      last_updated: '2026-08-12',
      summary: 'Evaluates targeted therapy.',
      intervention: 'MTX-204',
      eligibility: ['Age 18 years or older'],
      locations: [{ country: 'Netherlands', city: 'Amsterdam', facility: 'Amsterdam UMC' }],
      contact_email: 'solid-tumor@example.test',
      source_url: 'https://clinicaltrials.example.test/NCT-1001',
    });
  });

  it('maps suggestion DTOs to UI models', () => {
    service.suggestTrials('cancer', 4).subscribe((response) => {
      expect(response.items).toEqual([
        {
          value: 'Breast Cancer',
          label: 'Breast Cancer',
          matchType: 'condition',
        },
      ]);
    });

    const request = http.expectOne((item) => item.url === '/api/v1/trials/suggestions');

    expect(request.request.params.get('q')).toBe('cancer');
    expect(request.request.params.get('limit')).toBe('4');

    request.flush({
      query: 'cancer',
      items: [
        {
          value: 'Breast Cancer',
          label: 'Breast Cancer',
          match_type: 'condition',
        },
      ],
    });
  });
});
