import { NextFunction, Request, Response } from 'express';

/**
 * Global error handling middleware
 * Catches all unhandled errors and returns a standardized error response
 * Must be the last middleware in the Express app
 */
export function errorHandler(err: unknown, _req: Request, res: Response, _next: NextFunction) {
  // Extract error message or use default message
  const message = err instanceof Error ? err.message : 'Internal Server Error';
  
  // Return standardized error response with 500 status code
  res.status(500).json({ message });
}


