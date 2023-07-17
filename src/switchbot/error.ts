export class HttpError extends Error {
  constructor(statusCode: number, statusText: string, detail?: string) {
    super(`HttpError while ${detail ?? ''}: (${statusCode}) ${statusText}`);
  }
}
