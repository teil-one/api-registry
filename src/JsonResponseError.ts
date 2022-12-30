export class JsonResponseError extends Error {
  public readonly response: Response;
  public readonly cause?: Error;

  constructor(response: Response, message?: string, cause?: Error) {
    super(message);

    this.response = response;
    this.cause = cause;
  }
}
