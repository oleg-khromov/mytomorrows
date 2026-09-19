import { HttpClient, HttpParams } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { map, Observable } from 'rxjs';

import { environment } from '../../../../environments/environment';
import {
  mapSearchResponse,
  mapSuggestionsResponse,
  mapTrialDetail,
  SearchTrialsParams,
  TrialId,
  TrialDetail,
  TrialDetailDto,
  TrialsSuggestionsResponse,
  TrialsSuggestionsResponseDto,
  TrialsSearchResponse,
  TrialsSearchResponseDto,
} from '../models/trial.models';

@Injectable({ providedIn: 'root' })
export class TrialsApiService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.apiBaseUrl}/trials`;

  searchTrials(params: SearchTrialsParams): Observable<TrialsSearchResponse> {
    let httpParams = new HttpParams()
      .set('offset', params.offset)
      .set('limit', params.limit);

    if (params.query) {
      httpParams = httpParams.set('q', params.query);
    }

    return this.http
      .get<TrialsSearchResponseDto>(this.baseUrl, { params: httpParams })
      .pipe(map(mapSearchResponse));
  }

  getTrial(trialId: TrialId): Observable<TrialDetail> {
    return this.http
      .get<TrialDetailDto>(`${this.baseUrl}/${encodeURIComponent(trialId)}`)
      .pipe(map(mapTrialDetail));
  }

  suggestTrials(query: string, limit = 6): Observable<TrialsSuggestionsResponse> {
    const params = new HttpParams()
      .set('q', query)
      .set('limit', limit);

    return this.http
      .get<TrialsSuggestionsResponseDto>(`${this.baseUrl}/suggestions`, { params })
      .pipe(map(mapSuggestionsResponse));
  }
}
