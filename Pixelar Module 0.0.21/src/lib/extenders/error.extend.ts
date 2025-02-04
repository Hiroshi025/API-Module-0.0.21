/**
 * @class ClientError
 * @extends {Error}
 * 
 * Custom error class representing client-side errors (4xx HTTP status codes).
 * Use this error when an issue is caused by the client's request, such as invalid input or unauthorized access.
 */
export class ClientError extends Error {
  /**
   * Creates a new instance of `ClientError`.
   * 
   * @param {string} message - The error message describing what went wrong on the client side.
   */
  constructor(message: string) {
    super(message);
    this.name = "ClientError";
  }
}

/**
 * @class ServerError
 * @extends {Error}
 * 
 * Custom error class representing server-side errors (5xx HTTP status codes).
 * Use this error when the server encounters an unexpected issue or fails to process a valid request.
 */
export class ServerError extends Error {
  /**
   * Creates a new instance of `ServerError`.
   * 
   * @param {string} message - The error message describing what went wrong on the server side.
   */
  constructor(message: string) {
    super(message);
    this.name = "ServerError";
  }
}

/**
 * @class ValidationError
 * @extends {Error}
 * 
 * Custom error class representing validation errors.
 * Use this error when user input or data does not meet the required validation rules.
 */
export class ValidationError extends Error {
  /**
   * Creates a new instance of `ValidationError`.
   * 
   * @param {string} message - The error message describing what validation rule was violated.
   */
  constructor(message: string) {
    super(message);
    this.name = "ValidationError";
  }
}
