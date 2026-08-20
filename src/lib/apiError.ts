export interface ApiEnvelopeSuccess<T> {
  success: true;
  statusCode: number;
  data: T;
}

export interface ApiEnvelopeError {
  success: false;
  statusCode: number;
  message: string | string[];
  errors?: unknown;
}

export type ApiEnvelope<T> = ApiEnvelopeSuccess<T> | ApiEnvelopeError;

export class ApiError extends Error {
  statusCode: number;
  errors?: unknown;

  constructor(message: string, statusCode: number, errors?: unknown) {
    super(message);
    this.name = "ApiError";
    this.statusCode = statusCode;
    this.errors = errors;
  }
}

/** Unwraps the backend's { success, data } / { success:false, message } envelope. */
export function unwrapEnvelope<T>(json: ApiEnvelope<T>): T {
  if (!json.success) {
    const message = Array.isArray(json.message)
      ? json.message.join(", ")
      : json.message;
    throw new ApiError(message, json.statusCode, json.errors);
  }
  return json.data;
}
