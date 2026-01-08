import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/limitEnforcement';
import {
  timeTrackingService,
  PomodoroSessionType,
} from '../services/timeTrackingService';

const router: Router = Router();

// ===== TIMER ROUTES =====

/**
 * POST /api/time-tracking/timer/start
 * Start a new timer
 */
router.post(
  '/timer/start',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { todoId, description } = req.body;

      const timer = await timeTrackingService.startTimer({
        userId: req.user!.id,
        todoId,
        description,
      });

      res.status(201).json(timer);
    } catch (error) {
      console.error('Error starting timer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/time-tracking/timer/stop
 * Stop the active timer
 */
router.post(
  '/timer/stop',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const timer = await timeTrackingService.stopTimer({
        userId: req.user!.id,
      });

      if (!timer) {
        res.status(404).json({ error: 'No active timer found' });
        return;
      }

      res.json(timer);
    } catch (error) {
      console.error('Error stopping timer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/timer/active
 * Get the active timer
 */
router.get(
  '/timer/active',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const timer = await timeTrackingService.getActiveTimer(req.user!.id);
      res.json(timer);
    } catch (error) {
      console.error('Error fetching active timer:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/entries
 * Get all time entries for the user
 */
router.get(
  '/entries',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { todoId, fromDate, toDate, limit } = req.query;

      const entries = await timeTrackingService.getAllTimeEntries(
        req.user!.id,
        {
          todoId: todoId ? parseInt(todoId as string, 10) : undefined,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        }
      );

      res.json(entries);
    } catch (error) {
      console.error('Error fetching time entries:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/stats
 * Get time tracking statistics
 */
router.get(
  '/stats',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, toDate } = req.query;

      const stats = await timeTrackingService.getTimeStats(req.user!.id, {
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching time stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/time-tracking/entries/:id
 * Delete a time entry
 */
router.delete(
  '/entries/:id',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await timeTrackingService.deleteTimeEntry(
        id,
        req.user!.id
      );

      if (!deleted) {
        res.status(404).json({ error: 'Time entry not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting time entry:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

// ===== POMODORO ROUTES =====

/**
 * POST /api/time-tracking/pomodoro/start
 * Start a new Pomodoro session
 */
router.post(
  '/pomodoro/start',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { todoId, type, duration } = req.body;

      if (type && !Object.values(PomodoroSessionType).includes(type)) {
        res.status(400).json({ error: 'Invalid Pomodoro type' });
        return;
      }

      const session = await timeTrackingService.startPomodoro({
        userId: req.user!.id,
        todoId,
        type,
        duration,
      });

      res.status(201).json(session);
    } catch (error) {
      console.error('Error starting Pomodoro:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/time-tracking/pomodoro/:id/complete
 * Complete a Pomodoro session
 */
router.post(
  '/pomodoro/:id/complete',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const session = await timeTrackingService.completePomodoro(
        id,
        req.user!.id
      );
      res.json(session);
    } catch (error) {
      console.error('Error completing Pomodoro:', error);

      if ((error as any).code === 'P2025') {
        res.status(404).json({ error: 'Pomodoro session not found' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/pomodoro/active
 * Get the active Pomodoro session
 */
router.get(
  '/pomodoro/active',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const session = await timeTrackingService.getActivePomodoro(req.user!.id);
      res.json(session);
    } catch (error) {
      console.error('Error fetching active Pomodoro:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/pomodoro/sessions
 * Get all Pomodoro sessions
 */
router.get(
  '/pomodoro/sessions',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { todoId, fromDate, toDate, limit } = req.query;

      const sessions = await timeTrackingService.getAllPomodoroSessions(
        req.user!.id,
        {
          todoId: todoId ? parseInt(todoId as string, 10) : undefined,
          fromDate: fromDate ? new Date(fromDate as string) : undefined,
          toDate: toDate ? new Date(toDate as string) : undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
        }
      );

      res.json(sessions);
    } catch (error) {
      console.error('Error fetching Pomodoro sessions:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/time-tracking/pomodoro/stats
 * Get Pomodoro statistics
 */
router.get(
  '/pomodoro/stats',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { fromDate, toDate } = req.query;

      const stats = await timeTrackingService.getPomodoroStats(req.user!.id, {
        fromDate: fromDate ? new Date(fromDate as string) : undefined,
        toDate: toDate ? new Date(toDate as string) : undefined,
      });

      res.json(stats);
    } catch (error) {
      console.error('Error fetching Pomodoro stats:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/time-tracking/pomodoro/sessions/:id
 * Delete a Pomodoro session
 */
router.delete(
  '/pomodoro/sessions/:id',
  requireAuth,
  requireFeature('hasTimeTracking'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await timeTrackingService.deletePomodoroSession(
        id,
        req.user!.id
      );

      if (!deleted) {
        res.status(404).json({ error: 'Pomodoro session not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting Pomodoro session:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
