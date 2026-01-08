import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/limitEnforcement';
import { notificationService } from '../services/notificationService';
import { NotificationStatus, NotificationType } from '@prisma/client';

const router: Router = Router();

/**
 * GET /api/notifications
 * Get all notifications for current user
 */
router.get(
  '/',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { status, type, limit, includeRead } = req.query;

      const notifications = await notificationService.getAllForUser(
        req.user!.id,
        {
          status: status as NotificationStatus | undefined,
          type: type as NotificationType | undefined,
          limit: limit ? parseInt(limit as string, 10) : undefined,
          includeRead: includeRead === 'true',
        }
      );

      res.json(notifications);
    } catch (error) {
      console.error('Error fetching notifications:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/notifications/unread-count
 * Get unread notification count
 */
router.get(
  '/unread-count',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const count = await notificationService.getUnreadCount(req.user!.id);
      res.json({ count });
    } catch (error) {
      console.error('Error fetching unread count:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/notifications/:id/read
 * Mark a notification as read
 */
router.post(
  '/:id/read',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    try {
      const notification = await notificationService.markAsRead(
        id,
        req.user!.id
      );
      res.json(notification);
    } catch (error) {
      console.error('Error marking notification as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read
 */
router.post(
  '/read-all',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const result = await notificationService.markAllAsRead(req.user!.id);
      res.json(result);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/notifications/:id/snooze
 * Snooze a notification
 */
router.post(
  '/:id/snooze',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    try {
      const { snoozedUntil } = req.body;

      if (!snoozedUntil) {
        res.status(400).json({ error: 'snoozedUntil is required' });
        return;
      }

      const notification = await notificationService.snooze(
        id,
        req.user!.id,
        new Date(snoozedUntil)
      );
      res.json(notification);
    } catch (error) {
      console.error('Error snoozing notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/notifications/:id
 * Delete a notification
 */
router.delete(
  '/:id',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid notification ID' });
      return;
    }

    try {
      const deleted = await notificationService.delete(id, req.user!.id);

      if (!deleted) {
        res.status(404).json({ error: 'Notification not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting notification:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/notifications/settings
 * Get notification settings for current user
 */
router.get(
  '/settings',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await notificationService.getSettings(req.user!.id);

      // Parse JSON fields for response
      const response = {
        ...settings,
        digestDaysOfWeek: settings.digestDaysOfWeek
          ? JSON.parse(settings.digestDaysOfWeek)
          : [],
        mutedListIds: settings.mutedListIds
          ? JSON.parse(settings.mutedListIds)
          : [],
        mutedTagIds: settings.mutedTagIds
          ? JSON.parse(settings.mutedTagIds)
          : [],
      };

      res.json(response);
    } catch (error) {
      console.error('Error fetching notification settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/notifications/settings
 * Update notification settings
 */
router.put(
  '/settings',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const settings = await notificationService.updateSettings(
        req.user!.id,
        req.body
      );

      // Parse JSON fields for response
      const response = {
        ...settings,
        digestDaysOfWeek: settings.digestDaysOfWeek
          ? JSON.parse(settings.digestDaysOfWeek)
          : [],
        mutedListIds: settings.mutedListIds
          ? JSON.parse(settings.mutedListIds)
          : [],
        mutedTagIds: settings.mutedTagIds
          ? JSON.parse(settings.mutedTagIds)
          : [],
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating notification settings:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/notifications/digest
 * Get digest data for current user
 */
router.get(
  '/digest',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const digestData = await notificationService.generateDigestData(
        req.user!.id
      );
      res.json(digestData);
    } catch (error) {
      console.error('Error generating digest:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/notifications/rules
 * Get all notification rules for current user
 */
router.get(
  '/rules',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const rules = await notificationService.getAllRules(req.user!.id);

      // Parse conditions JSON for each rule
      const response = rules.map((rule) => ({
        ...rule,
        conditions: JSON.parse(rule.conditions),
      }));

      res.json(response);
    } catch (error) {
      console.error('Error fetching notification rules:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/notifications/rules
 * Create a new notification rule
 */
router.post(
  '/rules',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        triggerType,
        conditions,
        channel,
        message,
        maxPerDay,
      } = req.body;

      if (!name || !triggerType || !conditions || !channel || !message) {
        res.status(400).json({
          error:
            'Missing required fields: name, triggerType, conditions, channel, message',
        });
        return;
      }

      const rule = await notificationService.createRule({
        userId: req.user!.id,
        name,
        description,
        triggerType,
        conditions,
        channel,
        message,
        maxPerDay,
      });

      const response = {
        ...rule,
        conditions: JSON.parse(rule.conditions),
      };

      res.status(201).json(response);
    } catch (error) {
      console.error('Error creating notification rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/notifications/rules/:id
 * Update a notification rule
 */
router.put(
  '/rules/:id',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid rule ID' });
      return;
    }

    try {
      const rule = await notificationService.updateRule(
        id,
        req.user!.id,
        req.body
      );

      const response = {
        ...rule,
        conditions: JSON.parse(rule.conditions),
      };

      res.json(response);
    } catch (error) {
      console.error('Error updating notification rule:', error);

      if ((error as any).code === 'P2025') {
        res.status(404).json({ error: 'Rule not found' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/notifications/rules/:id
 * Delete a notification rule
 */
router.delete(
  '/rules/:id',
  requireAuth,
  requireFeature('hasAdvancedNotifications'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid rule ID' });
      return;
    }

    try {
      const deleted = await notificationService.deleteRule(id, req.user!.id);

      if (!deleted) {
        res.status(404).json({ error: 'Rule not found' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting notification rule:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
