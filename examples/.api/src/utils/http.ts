import type { Response } from "express";

export type ErrorShape = {
  error: string;
  reason?: string;
  details?: Record<string, unknown>;
};

export function sendError(res: Response, status: number, payload: ErrorShape): void {
  res.status(status).json(payload);
}
