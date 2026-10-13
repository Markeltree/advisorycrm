export class HttpError extends Error {
  constructor(status, message, extra = {}) {
    super(message);
    this.status = status;
    this.extra = extra;
  }
}

export const badRequest = (message, extra) => new HttpError(400, message, extra);
export const unauthorized = (message = 'Sign in to continue.') => new HttpError(401, message);
export const forbidden = (message = 'Your role does not allow this action.') => new HttpError(403, message);
export const notFound = (message = 'Not found.') => new HttpError(404, message);
export const conflict = (message) => new HttpError(409, message);
