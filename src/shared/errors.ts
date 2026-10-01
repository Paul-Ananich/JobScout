export class AppError extends Error {
  constructor(
    message: string,
    public code: string,
    public statusCode: number = 500,
    public context?: Record<string, unknown>
  ) {
    super(message);
    this.name = 'AppError';
    Error.captureStackTrace(this, this.constructor);
  }
}

export class EmailFetchError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'EMAIL_FETCH_ERROR', 500, context);
    this.name = 'EmailFetchError';
  }
}

export class EmailParseError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'EMAIL_PARSE_ERROR', 400, context);
    this.name = 'EmailParseError';
  }
}

export class JobDuplicateError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'JOB_DUPLICATE', 409, context);
    this.name = 'JobDuplicateError';
  }
}

export class AnalysisError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'ANALYSIS_ERROR', 500, context);
    this.name = 'AnalysisError';
  }
}

export class TelegramError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'TELEGRAM_ERROR', 500, context);
    this.name = 'TelegramError';
  }
}

export class ConfigError extends AppError {
  constructor(message: string, context?: Record<string, unknown>) {
    super(message, 'CONFIG_ERROR', 500, context);
    this.name = 'ConfigError';
  }
}

export function isAppError(error: unknown): error is AppError {
  return error instanceof AppError;
}

export function wrapError(error: unknown, fallbackMessage: string): AppError {
  if (isAppError(error)) {
    return error;
  }
  if (error instanceof Error) {
    return new AppError(error.message || fallbackMessage, 'UNKNOWN_ERROR', 500, {
      originalError: error.name,
      stack: error.stack,
    });
  }
  return new AppError(fallbackMessage, 'UNKNOWN_ERROR', 500, { originalError: String(error) });
}
