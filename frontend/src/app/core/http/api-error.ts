export interface ApiErrorResponse {
  code?: string;
  message?: string;
  request_id?: string;
  errors?: readonly ApiValidationError[];
}

export interface ApiValidationError {
  loc?: readonly unknown[];
  msg?: string;
  type?: string;
}

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  requestId: string | null;
  details: readonly ApiValidationError[];
}

export function getErrorMessage(error: unknown): string {
  if (isNormalizedApiError(error)) {
    const firstValidationMessage = error.details[0]?.msg;

    return firstValidationMessage ? `${error.message}: ${firstValidationMessage}` : error.message;
  }

  return 'Something went wrong. Please try again.';
}

export function isNormalizedApiError(error: unknown): error is NormalizedApiError {
  return typeof error === 'object' && error !== null && 'status' in error && 'message' in error;
}
