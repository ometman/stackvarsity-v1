/**
 * Domain-specific authentication and authorization errors with safe HTTP status codes.
 * Messages are designed to be safe for client responses without leaking internal secrets.
 */
export class AuthModuleError extends Error {
  public readonly statusCode: number;
  public readonly code: string;

  constructor(message: string, statusCode: number, code: string) {
    super(message);
    this.name = new.target.name;
    this.statusCode = statusCode;
    this.code = code;
  }
}

export class UnauthorizedError extends AuthModuleError {
  constructor(message = "Authentication required") {
    super(message, 401, "UNAUTHORIZED");
  }
}

export class ForbiddenError extends AuthModuleError {
  constructor(message = "You do not have permission to perform this action") {
    super(message, 403, "FORBIDDEN");
  }
}

export class MfaRequiredError extends AuthModuleError {
  constructor(message = "Administrator multi-factor authentication is required") {
    super(message, 403, "MFA_REQUIRED");
  }
}

export class ValidationError extends AuthModuleError {
  constructor(message = "Invalid request input") {
    super(message, 400, "VALIDATION_ERROR");
  }
}

export class ConflictError extends AuthModuleError {
  constructor(message = "Resource already exists") {
    super(message, 409, "CONFLICT");
  }
}

export class RateLimitError extends AuthModuleError {
  public readonly retryAfterSeconds: number;

  constructor(retryAfterSeconds = 60, message = "Too many requests. Please try again later.") {
    super(message, 429, "RATE_LIMITED");
    this.retryAfterSeconds = retryAfterSeconds;
  }
}
