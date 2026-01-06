import { Router, Request, Response } from 'express';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { RegisterSchema, LoginSchema } from '../schemas/authSchemas';
import { authService } from '../services/authService';
import { userService } from '../services/userService';

const router: Router = Router();

router.post(
  '/register',
  validateBody(RegisterSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await authService.register(req.body);

      if (!result.success) {
        res.status(400).json({ error: result.error });
        return;
      }

      if (result.user) {
        req.session.userId = result.user.id;
        res.status(201).json({ user: result.user });
        return;
      }

      res.status(500).json({ error: 'Registration failed' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/login',
  validateBody(LoginSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await authService.login(req.body);

      if (!result.success) {
        res.status(401).json({ error: result.error });
        return;
      }

      if (result.user) {
        req.session.userId = result.user.id;
        res.status(200).json({ user: result.user });
        return;
      }

      res.status(500).json({ error: 'Login failed' });
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post('/logout', async (req: Request, res: Response): Promise<void> => {
  req.session.destroy((err) => {
    if (err) {
      res.status(500).json({ error: 'Failed to logout' });
      return;
    }
    res.status(204).send();
  });
});

router.get('/me', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated' });
      return;
    }

    const user = await userService.findById(req.user.id);
    if (!user) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    res.json({ user });
  } catch (error) {
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
