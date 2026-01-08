import { prisma } from '../lib/prisma';
import {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
} from '@prisma/client';

export {
  Subscription,
  SubscriptionTier,
  SubscriptionStatus,
} from '@prisma/client';

export type CreateSubscriptionInput = {
  userId: number;
  tier?: SubscriptionTier;
};

export type UpdateSubscriptionInput = {
  tier?: SubscriptionTier;
  status?: SubscriptionStatus;
  cancelAtPeriodEnd?: boolean;
};

export type TierLimits = {
  maxTodos: number | null; // null = unlimited
  maxCollaborators: number | null;
  maxTags: number | null;
  maxWorkspaces: number | null;
  maxWorkspaceMembers: number | null;
  hasRecurringTasks: boolean;
  hasTimeTracking: boolean;
  hasCalendarIntegration: boolean;
  hasAdvancedNotifications: boolean;
  hasTemplates: boolean;
  hasWorkspaces: boolean;
  hasAnalytics: boolean;
  hasApiAccess: boolean;
};

// Tier pricing and limits configuration
export const TIER_CONFIG = {
  [SubscriptionTier.FREE]: {
    name: 'Free',
    price: 0,
    billingPeriod: 'lifetime' as const,
    limits: {
      maxTodos: 50,
      maxCollaborators: 0,
      maxTags: 10,
      maxWorkspaces: 0,
      maxWorkspaceMembers: 0,
      hasRecurringTasks: false,
      hasTimeTracking: false,
      hasCalendarIntegration: false,
      hasAdvancedNotifications: false,
      hasTemplates: false,
      hasWorkspaces: false,
      hasAnalytics: false,
      hasApiAccess: false,
    },
  },
  [SubscriptionTier.PRO]: {
    name: 'Pro',
    price: 9.99,
    billingPeriod: 'month' as const,
    stripePriceId: 'price_pro_monthly_stub', // Stubbed Stripe price ID
    limits: {
      maxTodos: null, // unlimited
      maxCollaborators: 5,
      maxTags: null,
      maxWorkspaces: 1,
      maxWorkspaceMembers: 5,
      hasRecurringTasks: true,
      hasTimeTracking: true,
      hasCalendarIntegration: true,
      hasAdvancedNotifications: true,
      hasTemplates: true,
      hasWorkspaces: true,
      hasAnalytics: true,
      hasApiAccess: false,
    },
  },
  [SubscriptionTier.TEAM]: {
    name: 'Team',
    price: 29.99,
    billingPeriod: 'month' as const,
    stripePriceId: 'price_team_monthly_stub', // Stubbed Stripe price ID
    limits: {
      maxTodos: null,
      maxCollaborators: null, // unlimited
      maxTags: null,
      maxWorkspaces: null, // unlimited
      maxWorkspaceMembers: null, // unlimited
      hasRecurringTasks: true,
      hasTimeTracking: true,
      hasCalendarIntegration: true,
      hasAdvancedNotifications: true,
      hasTemplates: true,
      hasWorkspaces: true,
      hasAnalytics: true,
      hasApiAccess: true,
    },
  },
};

class SubscriptionService {
  /**
   * Get subscription by user ID
   */
  async getByUserId(userId: number): Promise<Subscription | null> {
    return prisma.subscription.findUnique({
      where: { userId },
      include: {
        billingHistory: {
          orderBy: { createdAt: 'desc' },
          take: 10,
        },
      },
    });
  }

  /**
   * Create a new subscription (typically FREE tier for new users)
   */
  async create(input: CreateSubscriptionInput): Promise<Subscription> {
    const tier = input.tier ?? SubscriptionTier.FREE;

    // Calculate current period end (30 days for paid tiers)
    const currentPeriodEnd =
      tier !== SubscriptionTier.FREE
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

    return prisma.subscription.create({
      data: {
        userId: input.userId,
        tier,
        status: SubscriptionStatus.ACTIVE,
        currentPeriodEnd,
      },
    });
  }

  /**
   * Update subscription tier (stubbed Stripe integration)
   */
  async updateTier(
    userId: number,
    newTier: SubscriptionTier
  ): Promise<Subscription> {
    const subscription = await this.getByUserId(userId);

    if (!subscription) {
      throw new Error('Subscription not found');
    }

    const oldTier = subscription.tier;

    // In stub mode, we just update the tier directly
    // In production, this would create/update Stripe subscription
    const currentPeriodEnd =
      newTier !== SubscriptionTier.FREE
        ? new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
        : null;

    const config = TIER_CONFIG[newTier];
    const updated = await prisma.subscription.update({
      where: { userId },
      data: {
        tier: newTier,
        currentPeriodEnd,
        stripePriceId: 'stripePriceId' in config ? config.stripePriceId : null,
      },
    });

    // Create billing history entry for the tier change
    await this.createBillingHistoryEntry(
      updated.id,
      TIER_CONFIG[newTier].price,
      `Subscription ${oldTier === SubscriptionTier.FREE ? 'started' : 'changed'} from ${oldTier} to ${newTier}`
    );

    return updated;
  }

  /**
   * Cancel subscription at period end
   */
  async cancel(userId: number): Promise<Subscription> {
    return prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: true,
      },
    });
  }

  /**
   * Reactivate a cancelled subscription
   */
  async reactivate(userId: number): Promise<Subscription> {
    return prisma.subscription.update({
      where: { userId },
      data: {
        cancelAtPeriodEnd: false,
        status: SubscriptionStatus.ACTIVE,
      },
    });
  }

  /**
   * Get tier limits for a user
   */
  async getUserLimits(userId: number): Promise<TierLimits> {
    const subscription = await this.getByUserId(userId);
    const tier = subscription?.tier ?? SubscriptionTier.FREE;
    return TIER_CONFIG[tier].limits;
  }

  /**
   * Check if user has access to a specific feature
   */
  async hasFeatureAccess(
    userId: number,
    feature: keyof TierLimits
  ): Promise<boolean> {
    const limits = await this.getUserLimits(userId);
    const value = limits[feature];

    // For boolean features, return the value directly
    if (typeof value === 'boolean') {
      return value;
    }

    // For numeric limits, null means unlimited (true)
    return value === null || value > 0;
  }

  /**
   * Check if user can create more items (todos, tags, workspaces, etc.)
   */
  async canCreateMore(
    userId: number,
    limitType: 'maxTodos' | 'maxCollaborators' | 'maxTags' | 'maxWorkspaces' | 'maxWorkspaceMembers',
    currentCount: number
  ): Promise<{
    allowed: boolean;
    limit: number | null;
    remaining: number | null;
  }> {
    const limits = await this.getUserLimits(userId);
    const limit = limits[limitType];

    if (limit === null) {
      return { allowed: true, limit: null, remaining: null };
    }

    const remaining = limit - currentCount;
    return {
      allowed: remaining > 0,
      limit,
      remaining: Math.max(0, remaining),
    };
  }

  /**
   * Get all tier configurations (for pricing page)
   */
  getAllTierConfigs() {
    return TIER_CONFIG;
  }

  /**
   * Create a billing history entry (stubbed)
   */
  private async createBillingHistoryEntry(
    subscriptionId: number,
    amount: number,
    description: string
  ): Promise<void> {
    await prisma.billingHistory.create({
      data: {
        subscriptionId,
        amount,
        status: 'succeeded',
        description,
        paidAt: new Date(),
      },
    });
  }

  /**
   * Process subscription renewals (cron job helper)
   * In stub mode, this just extends the period
   */
  async processRenewals(): Promise<void> {
    const expiringSubs = await prisma.subscription.findMany({
      where: {
        currentPeriodEnd: {
          lte: new Date(),
        },
        status: SubscriptionStatus.ACTIVE,
        tier: {
          not: SubscriptionTier.FREE,
        },
      },
    });

    for (const sub of expiringSubs) {
      if (sub.cancelAtPeriodEnd) {
        // Downgrade to FREE
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            tier: SubscriptionTier.FREE,
            status: SubscriptionStatus.CANCELLED,
            currentPeriodEnd: null,
          },
        });
      } else {
        // Renew for another period
        const newPeriodEnd = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
        await prisma.subscription.update({
          where: { id: sub.id },
          data: {
            currentPeriodStart: new Date(),
            currentPeriodEnd: newPeriodEnd,
          },
        });

        // Create billing history
        await this.createBillingHistoryEntry(
          sub.id,
          TIER_CONFIG[sub.tier].price,
          `Subscription renewed for ${TIER_CONFIG[sub.tier].name} tier`
        );
      }
    }
  }
}

export const subscriptionService = new SubscriptionService();
