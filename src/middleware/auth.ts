import { Request, Response, NextFunction } from 'express';

export function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction,
): void {
  const header = req.get("X-User-Id");
  const userId = Number(header);

  if (!header || !Number.isInteger(userId) || userId <= 0) {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  // Store the authenticated userId on res.locals.userId
  res.locals.userId = userId;

  next();
}

export default authMiddleware;
