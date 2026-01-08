import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { activityService, ActivityAction } from '../activityService';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    activityFeedItem: {
      create: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

describe('ActivityService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('logActivity', () => {
    it('should log an activity with metadata', async () => {
      const mockActivity = {
        id: 1,
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.CREATED,
        entityType: 'todo',
        entityId: 1,
        metadata: JSON.stringify({ entityName: 'Test Todo' }),
        createdAt: new Date(),
      };

      (prisma.activityFeedItem.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await activityService.logActivity({
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.CREATED,
        entityType: 'todo',
        entityId: 1,
        metadata: { entityName: 'Test Todo' },
      });

      expect(result).toEqual(mockActivity);
      expect(prisma.activityFeedItem.create).toHaveBeenCalledWith({
        data: {
          workspaceId: 1,
          actorId: 1,
          action: ActivityAction.CREATED,
          entityType: 'todo',
          entityId: 1,
          metadata: JSON.stringify({ entityName: 'Test Todo' }),
        },
      });
    });

    it('should log activity without metadata', async () => {
      const mockActivity = {
        id: 2,
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.DELETED,
        entityType: 'list',
        entityId: null,
        metadata: null,
        createdAt: new Date(),
      };

      (prisma.activityFeedItem.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await activityService.logActivity({
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.DELETED,
        entityType: 'list',
      });

      expect(result).toEqual(mockActivity);
    });
  });

  describe('getActivityFeed', () => {
    it('should return paginated activity feed', async () => {
      const mockActivities = [
        {
          id: 1,
          workspaceId: 1,
          actorId: 1,
          action: ActivityAction.CREATED,
          entityType: 'todo',
          entityId: 1,
          metadata: null,
          createdAt: new Date(),
          actor: {
            id: 1,
            email: 'user@example.com',
            name: 'Test User',
          },
        },
      ];

      (prisma.activityFeedItem.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (prisma.activityFeedItem.count as jest.Mock).mockResolvedValue(1);

      const result = await activityService.getActivityFeed(1, { limit: 10, offset: 0 });

      expect(result).toEqual({
        activities: mockActivities,
        total: 1,
        hasMore: false,
      });
    });

    it('should filter by action type', async () => {
      const mockActivities = [
        {
          id: 1,
          workspaceId: 1,
          actorId: 1,
          action: ActivityAction.CREATED,
          entityType: 'todo',
          entityId: 1,
          metadata: null,
          createdAt: new Date(),
          actor: {
            id: 1,
            email: 'user@example.com',
            name: 'Test User',
          },
        },
      ];

      (prisma.activityFeedItem.findMany as jest.Mock).mockResolvedValue(mockActivities);
      (prisma.activityFeedItem.count as jest.Mock).mockResolvedValue(1);

      await activityService.getActivityFeed(1, {
        limit: 10,
        offset: 0,
        actionFilter: [ActivityAction.CREATED, ActivityAction.UPDATED],
      });

      expect(prisma.activityFeedItem.findMany).toHaveBeenCalledWith({
        where: {
          workspaceId: 1,
          action: { in: [ActivityAction.CREATED, ActivityAction.UPDATED] },
        },
        include: {
          actor: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: 10,
        skip: 0,
      });
    });
  });

  describe('logTodoCreated', () => {
    it('should log todo creation', async () => {
      const mockActivity = {
        id: 1,
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.CREATED,
        entityType: 'todo',
        entityId: 1,
        metadata: JSON.stringify({ entityName: 'New Todo' }),
        createdAt: new Date(),
      };

      (prisma.activityFeedItem.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await activityService.logTodoCreated(1, 1, 1, 'New Todo');

      expect(result).toEqual(mockActivity);
    });
  });

  describe('logMemberAdded', () => {
    it('should log member addition', async () => {
      const mockActivity = {
        id: 1,
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.MEMBER_ADDED,
        entityType: 'member',
        entityId: null,
        metadata: JSON.stringify({ memberEmail: 'newmember@example.com', memberRole: 'MEMBER' }),
        createdAt: new Date(),
      };

      (prisma.activityFeedItem.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await activityService.logMemberAdded(
        1,
        1,
        'newmember@example.com',
        'MEMBER'
      );

      expect(result).toEqual(mockActivity);
    });
  });

  describe('logTodoAssigned', () => {
    it('should log todo assignment', async () => {
      const mockActivity = {
        id: 1,
        workspaceId: 1,
        actorId: 1,
        action: ActivityAction.ASSIGNED,
        entityType: 'todo',
        entityId: 1,
        metadata: JSON.stringify({
          entityName: 'Test Todo',
          assignedToName: 'John Doe',
        }),
        createdAt: new Date(),
      };

      (prisma.activityFeedItem.create as jest.Mock).mockResolvedValue(mockActivity);

      const result = await activityService.logTodoAssigned(1, 1, 1, 'Test Todo', 'John Doe');

      expect(result).toEqual(mockActivity);
    });
  });
});
