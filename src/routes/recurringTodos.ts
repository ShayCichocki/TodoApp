import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/limitEnforcement';
import {
  recurringTodoService,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '../services/recurringTodoService';
import { Priority } from '@prisma/client';

const router: Router = Router();

/**
 * GET /api/recurring-todos
 * Get all recurring todos for the current user
 */
router.get(
  '/',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const recurringTodos = await recurringTodoService.getAllForUser(
        req.user!.id
      );
      res.json(recurringTodos);
    } catch (error) {
      console.error('Error fetching recurring todos:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/recurring-todos/:id
 * Get a specific recurring todo
 */
router.get(
  '/:id',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const recurringTodo = await recurringTodoService.getById(
        id,
        req.user!.id
      );

      if (!recurringTodo) {
        res.status(404).json({ error: 'Recurring todo not found' });
        return;
      }

      res.json(recurringTodo);
    } catch (error) {
      console.error('Error fetching recurring todo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/recurring-todos
 * Create a new recurring todo
 */
router.post(
  '/',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        title,
        description,
        priority,
        frequency,
        interval,
        byWeekDay,
        byMonthDay,
        startDate,
        endType,
        endDate,
        count,
      } = req.body;

      // Validation
      if (!title || !frequency || !startDate) {
        res.status(400).json({
          error: 'Missing required fields: title, frequency, startDate',
        });
        return;
      }

      if (!Object.values(RecurrenceFrequency).includes(frequency)) {
        res.status(400).json({ error: 'Invalid frequency' });
        return;
      }

      if (priority && !Object.values(Priority).includes(priority)) {
        res.status(400).json({ error: 'Invalid priority' });
        return;
      }

      const recurringTodo = await recurringTodoService.create({
        userId: req.user!.id,
        title,
        description: description || '',
        priority: priority || Priority.MEDIUM,
        frequency,
        interval: interval || 1,
        byWeekDay,
        byMonthDay,
        startDate: new Date(startDate),
        endType: endType || RecurrenceEndType.NEVER,
        endDate: endDate ? new Date(endDate) : undefined,
        count,
      });

      // Generate initial instances (next 90 days)
      const now = new Date();
      const ninetyDaysFromNow = new Date(
        now.getTime() + 90 * 24 * 60 * 60 * 1000
      );
      await recurringTodoService.generateInstances(
        recurringTodo.id,
        now,
        ninetyDaysFromNow
      );

      res.status(201).json(recurringTodo);
    } catch (error) {
      console.error('Error creating recurring todo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/recurring-todos/:id
 * Update a recurring todo
 */
router.put(
  '/:id',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const { title, description, priority, isActive } = req.body;

      const updated = await recurringTodoService.update(id, req.user!.id, {
        title,
        description,
        priority,
        isActive,
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating recurring todo:', error);

      if ((error as any).code === 'P2025') {
        res.status(404).json({ error: 'Recurring todo not found' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/recurring-todos/:id
 * Delete a recurring todo
 */
router.delete(
  '/:id',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await recurringTodoService.delete(id, req.user!.id);

      if (!deleted) {
        res.status(404).json({ error: 'Recurring todo not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting recurring todo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/recurring-todos/:id/generate
 * Manually trigger instance generation for a date range
 */
router.post(
  '/:id/generate',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const { fromDate, toDate } = req.body;

      if (!fromDate || !toDate) {
        res
          .status(400)
          .json({ error: 'Missing required fields: fromDate, toDate' });
        return;
      }

      await recurringTodoService.generateInstances(
        id,
        new Date(fromDate),
        new Date(toDate)
      );

      res.json({ message: 'Instances generated successfully' });
    } catch (error) {
      console.error('Error generating instances:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/recurring-todos/:id/exceptions
 * Add an exception (skip or reschedule a specific occurrence)
 */
router.post(
  '/:id/exceptions',
  requireAuth,
  requireFeature('hasRecurringTasks'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const { originalDate, action, newDate } = req.body;

      if (
        !originalDate ||
        !action ||
        !['skip', 'reschedule'].includes(action)
      ) {
        res.status(400).json({ error: 'Invalid exception data' });
        return;
      }

      if (action === 'reschedule' && !newDate) {
        res
          .status(400)
          .json({ error: 'newDate is required for reschedule action' });
        return;
      }

      const exception = await recurringTodoService.addException(
        id,
        new Date(originalDate),
        action,
        newDate ? new Date(newDate) : undefined
      );

      res.status(201).json(exception);
    } catch (error) {
      console.error('Error adding exception:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
