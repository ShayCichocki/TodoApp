import { Router, Request, Response } from 'express';
import { todoService } from '../services/todoService';
import { tagService } from '../services/tagService';
import { validateBody } from '../middleware/validate';
import { requireAuth } from '../middleware/auth';
import { checkLimit } from '../middleware/limitEnforcement';
import {
  CreateTodoSchema,
  UpdateTodoSchema,
  CreateTagSchema,
} from '../schemas/todoSchemas';
import authRoutes from './auth';
import billingRoutes from './billing';
import recurringTodosRoutes from './recurringTodos';
import sharedListsRoutes from './sharedLists';
import timeTrackingRoutes from './timeTracking';
import templatesRoutes from './templates';
import notificationsRoutes from './notifications';
import calendarRoutes from './calendar';
import workspacesRoutes from './workspaces';

const router: Router = Router();

// Mount auth routes (public)
router.use('/api/auth', authRoutes);

// Mount billing routes (protected)
router.use('/api/billing', billingRoutes);

// Mount recurring todos routes (protected + feature gated)
router.use('/api/recurring-todos', recurringTodosRoutes);

// Mount shared lists routes (protected)
router.use('/api/shared-lists', sharedListsRoutes);

// Mount time tracking routes (protected + feature gated)
router.use('/api/time-tracking', timeTrackingRoutes);

// Mount templates routes (protected + feature gated)
router.use('/api/templates', templatesRoutes);

// Mount notifications routes (protected + feature gated)
router.use('/api/notifications', notificationsRoutes);

// Mount calendar routes (protected + feature gated)
router.use('/api/calendar', calendarRoutes);

// Mount workspaces routes (protected + feature gated)
router.use('/api/workspaces', workspacesRoutes);

// Public routes
router.get('/api', (_req: Request, res: Response): void => {
  res.send('hello whorl');
});

// Protected todo routes
router.get(
  '/api/todos',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const todos = await todoService.getAllForUser(req.user!.id);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/api/todos/deleted',
  requireAuth,
  async (req: Request, res: Response): Promise<void> => {
    try {
      const todos = await todoService.getDeletedForUser(req.user!.id);
      res.json(todos);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/api/todos/:id',
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const todo = await todoService.getByIdForUser(id, req.user!.id);
      if (!todo) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }

      res.json(todo);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/api/todos',
  requireAuth,
  checkLimit('todos'),
  validateBody(CreateTodoSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const newTodo = await todoService.createForUser(req.body, req.user!.id);
      res.status(201).json(newTodo);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.put(
  '/api/todos/:id',
  requireAuth,
  validateBody(UpdateTodoSchema),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const updated = await todoService.updateForUser(
        id,
        req.body,
        req.user!.id
      );
      if (!updated) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }

      res.json(updated);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete(
  '/api/todos/:id',
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await todoService.deleteForUser(id, req.user!.id);
      if (!deleted) {
        res.status(404).json({ error: 'Todo not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/api/todos/:id/restore',
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const restored = await todoService.restoreForUser(id, req.user!.id);
      if (!restored) {
        res.status(404).json({ error: 'Todo not found or already active' });
        return;
      }

      res.json(restored);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get(
  '/api/tags',
  requireAuth,
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const tags = await tagService.getAll();
      res.json(tags);
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.post(
  '/api/tags',
  requireAuth,
  checkLimit('tags'),
  validateBody(CreateTagSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const newTag = await tagService.create(req.body);
      res.status(201).json(newTag);
    } catch (error) {
      if ((error as { code?: string }).code === 'P2002') {
        res.status(409).json({ error: 'Tag with this name already exists' });
        return;
      }
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.delete(
  '/api/tags/:id',
  requireAuth,
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await tagService.delete(id);
      if (!deleted) {
        res.status(404).json({ error: 'Tag not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

router.get('/api/:id', (req: Request<{ id: string }>, res: Response): void => {
  const { id } = req.params;
  res.json({ message: `Hello ${id}` });
});

export default router;
