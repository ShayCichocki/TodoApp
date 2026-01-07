import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { subscriptionService, SubscriptionTier } from '../services/subscriptionService';

const router: Router = Router();

/**
 * GET /api/billing/subscription
 * Get current user's subscription details
 */
router.get('/subscription', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.getByUserId(req.user!.id);

    if (!subscription) {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.json(subscription);
  } catch (error) {
    console.error('Error fetching subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/billing/limits
 * Get current user's tier limits and usage
 */
router.get('/limits', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const limits = await subscriptionService.getUserLimits(req.user!.id);
    res.json(limits);
  } catch (error) {
    console.error('Error fetching limits:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/billing/tiers
 * Get all available subscription tiers and pricing (for pricing page)
 */
router.get('/tiers', async (_req: Request, res: Response): Promise<void> => {
  try {
    const tiers = subscriptionService.getAllTierConfigs();
    res.json(tiers);
  } catch (error) {
    console.error('Error fetching tiers:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/subscription/upgrade
 * Upgrade or downgrade subscription tier (stubbed Stripe)
 */
router.post('/subscription/upgrade', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { tier } = req.body;

    if (!tier || !Object.values(SubscriptionTier).includes(tier)) {
      res.status(400).json({ error: 'Invalid tier specified' });
      return;
    }

    const updated = await subscriptionService.updateTier(req.user!.id, tier as SubscriptionTier);

    res.json({
      message: 'Subscription updated successfully',
      subscription: updated,
    });
  } catch (error) {
    console.error('Error upgrading subscription:', error);

    if ((error as Error).message === 'Subscription not found') {
      res.status(404).json({ error: 'Subscription not found' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/subscription/cancel
 * Cancel subscription at end of current period
 */
router.post('/subscription/cancel', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.cancel(req.user!.id);

    res.json({
      message: 'Subscription will be cancelled at the end of the current billing period',
      subscription,
    });
  } catch (error) {
    console.error('Error canceling subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/subscription/reactivate
 * Reactivate a cancelled subscription
 */
router.post('/subscription/reactivate', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const subscription = await subscriptionService.reactivate(req.user!.id);

    res.json({
      message: 'Subscription reactivated successfully',
      subscription,
    });
  } catch (error) {
    console.error('Error reactivating subscription:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/billing/check-limit
 * Check if user can create more of a specific item type
 */
router.post('/check-limit', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { limitType, currentCount } = req.body;

    if (!limitType || currentCount === undefined) {
      res.status(400).json({ error: 'limitType and currentCount are required' });
      return;
    }

    const validLimitTypes = ['maxTodos', 'maxCollaborators', 'maxTags'];
    if (!validLimitTypes.includes(limitType)) {
      res.status(400).json({ error: 'Invalid limitType' });
      return;
    }

    const result = await subscriptionService.canCreateMore(
      req.user!.id,
      limitType as 'maxTodos' | 'maxCollaborators' | 'maxTags',
      currentCount
    );

    res.json(result);
  } catch (error) {
    console.error('Error checking limit:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
