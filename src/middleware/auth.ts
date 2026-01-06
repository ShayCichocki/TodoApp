import { Request, Response, NextFunction } from 'express';
import { userService } from '../services/userService';

export const requireAuth = async (
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.session.userId;

  if (!userId) {
    res.status(401).json({ error: 'Authentication required' });
    return;
  }

  const user = await userService.findById(userId);
  if (!user) {
    req.session.userId = undefined;
    res.status(401).json({ error: 'Invalid session' });
    return;
  }

  req.user = {
    id: user.id,
    email: user.email,
  };

  next();
};

export const attachUser = async (
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> => {
  const userId = req.session.userId;

  if (userId) {
    const user = await userService.findById(userId);
    if (user) {
      req.user = {
        id: user.id,
        email: user.email,
      };
    }
  }

  next();
};
