import { prisma } from '../lib/prisma';
import { ActivityFeedItem, ActivityAction, User } from '@prisma/client';

export { ActivityAction } from '@prisma/client';

export type ActivityMetadata = {
  entityName?: string;
  oldValue?: string;
  newValue?: string;
  assignedToName?: string;
  memberEmail?: string;
  memberRole?: string;
  [key: string]: unknown;
};

export type CreateActivityInput = {
  workspaceId: number;
  actorId: number;
  action: ActivityAction;
  entityType: string;
  entityId?: number;
  metadata?: ActivityMetadata;
};

export type ActivityWithActor = ActivityFeedItem & {
  actor: Pick<User, 'id' | 'email' | 'name'>;
};

export type PaginationOptions = {
  limit?: number;
  offset?: number;
  actionFilter?: ActivityAction[];
};

class ActivityService {
  /**
   * Log an activity to the feed
   */
  async logActivity(input: CreateActivityInput): Promise<ActivityFeedItem> {
    return prisma.activityFeedItem.create({
      data: {
        workspaceId: input.workspaceId,
        actorId: input.actorId,
        action: input.action,
        entityType: input.entityType,
        entityId: input.entityId,
        metadata: input.metadata ? JSON.stringify(input.metadata) : null,
      },
    });
  }

  /**
   * Get activity feed for a workspace
   */
  async getActivityFeed(
    workspaceId: number,
    options: PaginationOptions = {}
  ): Promise<{
    activities: ActivityWithActor[];
    total: number;
    hasMore: boolean;
  }> {
    const limit = options.limit ?? 50;
    const offset = options.offset ?? 0;

    const where = {
      workspaceId,
      ...(options.actionFilter && {
        action: { in: options.actionFilter },
      }),
    };

    const [activities, total] = await Promise.all([
      prisma.activityFeedItem.findMany({
        where,
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
        take: limit,
        skip: offset,
      }),
      prisma.activityFeedItem.count({ where }),
    ]);

    return {
      activities,
      total,
      hasMore: offset + activities.length < total,
    };
  }

  /**
   * Log todo creation
   */
  async logTodoCreated(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.CREATED,
      entityType: 'todo',
      entityId: todoId,
      metadata: { entityName: todoTitle },
    });
  }

  /**
   * Log todo update
   */
  async logTodoUpdated(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string,
    changes?: Record<string, unknown>
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.UPDATED,
      entityType: 'todo',
      entityId: todoId,
      metadata: { entityName: todoTitle, ...changes },
    });
  }

  /**
   * Log todo deletion
   */
  async logTodoDeleted(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.DELETED,
      entityType: 'todo',
      entityId: todoId,
      metadata: { entityName: todoTitle },
    });
  }

  /**
   * Log todo completion
   */
  async logTodoCompleted(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.COMPLETED,
      entityType: 'todo',
      entityId: todoId,
      metadata: { entityName: todoTitle },
    });
  }

  /**
   * Log todo assignment
   */
  async logTodoAssigned(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string,
    assignedToName: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.ASSIGNED,
      entityType: 'todo',
      entityId: todoId,
      metadata: {
        entityName: todoTitle,
        assignedToName,
      },
    });
  }

  /**
   * Log comment posted
   */
  async logCommentPosted(
    workspaceId: number,
    actorId: number,
    todoId: number,
    todoTitle: string,
    commentId: number
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.COMMENTED,
      entityType: 'todo',
      entityId: todoId,
      metadata: {
        entityName: todoTitle,
        commentId,
      },
    });
  }

  /**
   * Log member added
   */
  async logMemberAdded(
    workspaceId: number,
    actorId: number,
    memberEmail: string,
    memberRole: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.MEMBER_ADDED,
      entityType: 'member',
      metadata: {
        memberEmail,
        memberRole,
      },
    });
  }

  /**
   * Log member removed
   */
  async logMemberRemoved(
    workspaceId: number,
    actorId: number,
    memberEmail: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.MEMBER_REMOVED,
      entityType: 'member',
      metadata: {
        memberEmail,
      },
    });
  }

  /**
   * Log member role changed
   */
  async logMemberRoleChanged(
    workspaceId: number,
    actorId: number,
    memberEmail: string,
    oldRole: string,
    newRole: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.MEMBER_ROLE_CHANGED,
      entityType: 'member',
      metadata: {
        memberEmail,
        oldValue: oldRole,
        newValue: newRole,
      },
    });
  }

  /**
   * Log list creation
   */
  async logListCreated(
    workspaceId: number,
    actorId: number,
    listId: number,
    listName: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.CREATED,
      entityType: 'list',
      entityId: listId,
      metadata: { entityName: listName },
    });
  }

  /**
   * Log list update
   */
  async logListUpdated(
    workspaceId: number,
    actorId: number,
    listId: number,
    listName: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.UPDATED,
      entityType: 'list',
      entityId: listId,
      metadata: { entityName: listName },
    });
  }

  /**
   * Log list deletion
   */
  async logListDeleted(
    workspaceId: number,
    actorId: number,
    listId: number,
    listName: string
  ): Promise<ActivityFeedItem> {
    return this.logActivity({
      workspaceId,
      actorId,
      action: ActivityAction.DELETED,
      entityType: 'list',
      entityId: listId,
      metadata: { entityName: listName },
    });
  }
}

export const activityService = new ActivityService();
