import { Request, Response, NextFunction } from 'express';
import { subscriptionService } from '../services/subscriptionService';
import { prisma } from '../lib/prisma';

export type LimitType = 'todos' | 'tags' | 'collaborators';

interface LimitCheckConfig {
  limitType: LimitType;
  limitKey: 'maxTodos' | 'maxTags' | 'maxCollaborators';
  resourceName: string;
}

const LIMIT_CONFIGS: Record<LimitType, LimitCheckConfig> = {
  todos: {
    limitType: 'todos',
    limitKey: 'maxTodos',
    resourceName: 'todos',
  },
  tags: {
    limitType: 'tags',
    limitKey: 'maxTags',
    resourceName: 'tags',
  },
  collaborators: {
    limitType: 'collaborators',
    limitKey: 'maxCollaborators',
    resourceName: 'collaborators',
  },
};

/**
 * Middleware factory to check if user can create more of a specific resource type
 */
export function checkLimit(limitType: LimitType) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    const config = LIMIT_CONFIGS[limitType];
    const userId = req.user.id;

    try {
      // Get current count based on resource type
      const currentCount = await getCurrentCount(userId, limitType);

      // Check if user can create more
      const limitCheck = await subscriptionService.canCreateMore(
        userId,
        config.limitKey,
        currentCount
      );

      if (!limitCheck.allowed) {
        res.status(403).json({
          error: 'Limit reached',
          message: `You've reached your ${config.resourceName} limit (${limitCheck.limit}). Upgrade to continue.`,
          limit: limitCheck.limit,
          current: currentCount,
          remaining: limitCheck.remaining,
          upgradeRequired: true,
        });
        return;
      }

      // Attach limit info to request for use in route handlers
      req.limitInfo = {
        limit: limitCheck.limit,
        current: currentCount,
        remaining: limitCheck.remaining,
      };

      next();
    } catch (error) {
      console.error('Error checking limit:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

/**
 * Get current count of resources for a user
 */
async function getCurrentCount(
  userId: number,
  limitType: LimitType
): Promise<number> {
  switch (limitType) {
    case 'todos':
      return prisma.todo.count({
        where: {
          userId,
          deletedAt: null, // Don't count soft-deleted todos
        },
      });

    case 'tags':
      // Tags are global, but we can count unique tags used by user's todos
      const userTags = await prisma.todoTag.findMany({
        where: {
          todo: {
            userId,
            deletedAt: null,
          },
        },
        select: {
          tagId: true,
        },
        distinct: ['tagId'],
      });
      return userTags.length;

    case 'collaborators':
      // Placeholder for future collaboration feature
      // For now, return 0
      return 0;

    default:
      return 0;
  }
}

/**
 * Middleware to check if user has access to a specific feature
 */
export function requireFeature(
  feature: keyof import('../services/subscriptionService').TierLimits
) {
  return async (
    req: Request,
    res: Response,
    next: NextFunction
  ): Promise<void> => {
    if (!req.user) {
      res.status(401).json({ error: 'Unauthorized' });
      return;
    }

    try {
      const hasAccess = await subscriptionService.hasFeatureAccess(
        req.user.id,
        feature
      );

      if (!hasAccess) {
        res.status(403).json({
          error: 'Feature not available',
          message: `This feature is not available on your current plan. Please upgrade.`,
          feature,
          upgradeRequired: true,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('Error checking feature access:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  };
}

// Extend Express Request type to include limitInfo
declare global {
  namespace Express {
    interface Request {
      limitInfo?: {
        limit: number | null;
        current: number;
        remaining: number | null;
      };
    }
  }
}
