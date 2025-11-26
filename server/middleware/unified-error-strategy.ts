import { Request, Response, NextFunction } from "express";

export function unifiedErrorStrategy(err: any, req: Request, res: Response, next: NextFunction) {
  console.error("Unhandled Error:", err);

  if (err?.status) {
    return res.status(err.status).json({ error: err.message });
  }

  res.status(500).json({
    error: "Internal Server Error",
    trace: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
}
