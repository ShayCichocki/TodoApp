import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/limitEnforcement';
import { calendarService } from '../services/calendarService';
import { CalendarProvider, SyncDirection } from '@prisma/client';

const router: Router = Router();

/**
 * GET /api/calendar/connections
 * Get all calendar connections for current user
 */
router.get('/connections', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request, res: Response): Promise<void> => {
  try {
    const connections = await calendarService.getAllConnections(req.user!.id);

    // Remove sensitive token data from response
    const sanitized = connections.map((conn) => ({
      ...conn,
      accessToken: undefined,
      refreshToken: undefined,
    }));

    res.json(sanitized);
  } catch (error) {
    console.error('Error fetching calendar connections:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/calendar/connections/:id
 * Get a specific calendar connection
 */
router.get('/connections/:id', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const connection = await calendarService.getConnection(id, req.user!.id);

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    // Remove sensitive token data
    res.json({
      ...connection,
      accessToken: undefined,
      refreshToken: undefined,
    });
  } catch (error) {
    console.error('Error fetching calendar connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/calendar/connections/:id
 * Update calendar connection settings
 */
router.put('/connections/:id', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const {
      syncDirection,
      syncEnabled,
      autoCreateEvents,
      syncCompletedTodos,
      eventDuration,
    } = req.body;

    const connection = await calendarService.updateConnection(id, req.user!.id, {
      syncDirection,
      syncEnabled,
      autoCreateEvents,
      syncCompletedTodos,
      eventDuration,
    });

    // Remove sensitive token data
    res.json({
      ...connection,
      accessToken: undefined,
      refreshToken: undefined,
    });
  } catch (error) {
    console.error('Error updating calendar connection:', error);

    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/calendar/connections/:id
 * Delete a calendar connection
 */
router.delete('/connections/:id', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const deleted = await calendarService.deleteConnection(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting calendar connection:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/calendar/connections/:id/sync
 * Trigger sync for a calendar connection
 */
router.post('/connections/:id/sync', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const connection = await calendarService.getConnection(id, req.user!.id);

    if (!connection) {
      res.status(404).json({ error: 'Connection not found' });
      return;
    }

    let result;

    switch (connection.syncDirection) {
      case SyncDirection.TODO_TO_CALENDAR:
        result = await calendarService.syncTodosToCalendar(id, req.user!.id);
        break;

      case SyncDirection.CALENDAR_TO_TODO:
        result = await calendarService.syncCalendarToTodos(id, req.user!.id);
        break;

      case SyncDirection.BIDIRECTIONAL:
        result = await calendarService.performBidirectionalSync(id, req.user!.id);
        break;

      default:
        res.status(400).json({ error: 'Invalid sync direction' });
        return;
    }

    res.json(result);
  } catch (error) {
    console.error('Error syncing calendar:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/calendar/connections/:id/refresh-token
 * Refresh OAuth token for a calendar connection
 */
router.post('/connections/:id/refresh-token', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const connection = await calendarService.refreshToken(id, req.user!.id);

    res.json({
      ...connection,
      accessToken: undefined,
      refreshToken: undefined,
    });
  } catch (error) {
    console.error('Error refreshing token:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/calendar/connections/:id/events
 * Get all events for a calendar connection
 */
router.get('/connections/:id/events', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid connection ID' });
    return;
  }

  try {
    const events = await calendarService.getEventsForConnection(id);
    res.json(events);
  } catch (error) {
    console.error('Error fetching calendar events:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/calendar/oauth/authorize
 * Get OAuth authorization URL for a calendar provider
 */
router.get('/oauth/authorize', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request, res: Response): Promise<void> => {
  try {
    const { provider } = req.query;

    if (!provider || !Object.values(CalendarProvider).includes(provider as CalendarProvider)) {
      res.status(400).json({ error: 'Invalid or missing provider parameter' });
      return;
    }

    const authUrl = calendarService.getOAuthUrl(provider as CalendarProvider, req.user!.id);

    res.json({ authUrl });
  } catch (error) {
    console.error('Error generating OAuth URL:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/calendar/oauth/callback
 * Handle OAuth callback from calendar provider
 */
router.get('/oauth/callback', async (req: Request, res: Response): Promise<void> => {
  try {
    const { code, state } = req.query;

    if (!code || !state) {
      res.status(400).json({ error: 'Missing code or state parameter' });
      return;
    }

    // Decode state to get userId and provider
    const stateData = JSON.parse(Buffer.from(state as string, 'base64').toString());
    const { userId, provider } = stateData;

    if (!userId || !provider) {
      res.status(400).json({ error: 'Invalid state parameter' });
      return;
    }

    const connection = await calendarService.handleOAuthCallback(
      provider,
      code as string,
      userId
    );

    // Redirect to frontend with success
    res.redirect(`/calendar?connected=${provider}&status=success`);
  } catch (error) {
    console.error('Error handling OAuth callback:', error);
    res.redirect('/calendar?status=error');
  }
});

/**
 * GET /api/calendar/export/ical
 * Export user's todos as iCal format
 */
router.get('/export/ical', requireAuth, requireFeature('hasCalendarIntegration'), async (req: Request, res: Response): Promise<void> => {
  try {
    const icalData = await calendarService.exportToICal(req.user!.id);

    res.setHeader('Content-Type', 'text/calendar');
    res.setHeader('Content-Disposition', 'attachment; filename="todos.ics"');
    res.send(icalData);
  } catch (error) {
    console.error('Error exporting iCal:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
