import { HttpErrorResponse, HttpInterceptorFn } from '@angular/common/http';
import { catchError, throwError } from 'rxjs';

import { ApiErrorResponse, ApiValidationError, NormalizedApiError } from './api-error';

export const apiErrorInterceptor: HttpInterceptorFn = (request, next) => {
  return next(request).pipe(
    catchError((error: HttpErrorResponse) => {
      return throwError(() => normalizeHttpError(error));
    }),
  );
};

function normalizeHttpError(error: HttpErrorResponse): NormalizedApiError {
  const body = isApiErrorResponse(error.error) ? error.error : null;

  return {
    status: error.status,
    code: body?.code ?? 'http_error',
    message: body?.message ?? fallbackMessage(error),
    requestId: body?.request_id ?? error.headers.get('x-request-id'),
    details: Array.isArray(body?.errors) ? body.errors.filter(isApiValidationError) : [],
  };
}

function isApiErrorResponse(value: unknown): value is ApiErrorResponse {
  return typeof value === 'object' && value !== null;
}

function isApiValidationError(value: unknown): value is ApiValidationError {
  return typeof value === 'object' && value !== null;
}

function fallbackMessage(error: HttpErrorResponse): string {
  if (error.status === 0) {
    return 'Cannot reach the server. Check that the backend is running.';
  }

  return error.message || 'Request failed.';
}
