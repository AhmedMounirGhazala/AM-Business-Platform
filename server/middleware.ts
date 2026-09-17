import { Express, NextFunction, Request, Response } from 'express';

export type RequestWithId = Request & { requestId?: string };

export function registerRequestMiddleware(app: Express): void {
  app.use((req: RequestWithId, res: Response, next: NextFunction) => {
    const requestId =
      req.header('x-request-id') ||
      `req-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
    res.setHeader('x-request-id', requestId);
    req.requestId = requestId;
    next();
  });
}

export function apiNotFoundMiddleware(
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next();
    return;
  }

  res.status(404).json({
    success: false,
    error: 'API route not found',
    requestId: req.requestId,
  });
}

export function apiErrorMiddleware(
  err: unknown,
  req: RequestWithId,
  res: Response,
  next: NextFunction,
): void {
  if (res.headersSent) {
    next(err);
    return;
  }

  const message = err instanceof Error ? err.message : 'Unexpected server error';
  console.error(
    `[API] ${req.requestId || 'unknown'} ${req.method} ${req.path}: ${message}`,
  );
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    requestId: req.requestId,
  });
}
