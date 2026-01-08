import { prisma } from '../lib/prisma';
import {
  Notification,
  NotificationSettings,
  NotificationRule,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  DigestFrequency,
  Priority,
} from '@prisma/client';

export {
  Notification,
  NotificationSettings,
  NotificationRule,
  NotificationType,
  NotificationChannel,
  NotificationStatus,
  DigestFrequency,
} from '@prisma/client';

export type CreateNotificationInput = {
  userId: number;
  type: NotificationType;
  channel: NotificationChannel;
  title: string;
  message: string;
  actionUrl?: string;
  todoId?: number;
  listId?: number;
  scheduledFor?: Date;
};

export type UpdateNotificationSettingsInput = Partial<{
  emailEnabled: boolean;
  browserPushEnabled: boolean;
  inAppEnabled: boolean;
  taskDueSoonEnabled: boolean;
  taskDueSoonHours: number;
  taskOverdueEnabled: boolean;
  taskAssignedEnabled: boolean;
  taskCompletedEnabled: boolean;
  digestFrequency: DigestFrequency;
  digestTime: string;
  digestDaysOfWeek: string[];
  quietHoursEnabled: boolean;
  quietHoursStart: string;
  quietHoursEnd: string;
  mutedListIds: number[];
  mutedTagIds: number[];
}>;

export type CreateNotificationRuleInput = {
  userId: number;
  name: string;
  description?: string;
  triggerType: string;
  conditions: Record<string, any>;
  channel: NotificationChannel;
  message: string;
  maxPerDay?: number;
};

export type NotificationWithDetails = Notification & {
  todo?: { id: number; title: string } | null;
  list?: { id: number; name: string } | null;
};

export type DigestData = {
  overdueTodos: Array<{
    id: number;
    title: string;
    dueDate: Date;
    priority: Priority;
  }>;
  dueSoonTodos: Array<{
    id: number;
    title: string;
    dueDate: Date;
    priority: Priority;
  }>;
  completedTodos: Array<{ id: number; title: string; completedAt: Date }>;
  totalActive: number;
};

class NotificationService {
  /**
   * Create a new notification
   */
  async create(input: CreateNotificationInput): Promise<Notification> {
    // Check user's notification settings
    const settings = await this.getSettings(input.userId);

    // Check if notification type is enabled
    if (!this.isNotificationTypeEnabled(settings, input.type)) {
      throw new Error(
        `Notification type ${input.type} is disabled for this user`
      );
    }

    // Check if channel is enabled
    if (!this.isChannelEnabled(settings, input.channel)) {
      throw new Error(
        `Notification channel ${input.channel} is disabled for this user`
      );
    }

    // Check quiet hours
    if (this.isInQuietHours(settings)) {
      // Schedule for after quiet hours
      const scheduledFor = this.calculateNextAvailableTime(settings);
      input.scheduledFor = scheduledFor;
    }

    return prisma.notification.create({
      data: {
        userId: input.userId,
        type: input.type,
        channel: input.channel,
        title: input.title,
        message: input.message,
        actionUrl: input.actionUrl,
        todoId: input.todoId,
        listId: input.listId,
        scheduledFor: input.scheduledFor,
      },
    });
  }

  /**
   * Get all notifications for a user
   */
  async getAllForUser(
    userId: number,
    options?: {
      status?: NotificationStatus;
      type?: NotificationType;
      limit?: number;
      includeRead?: boolean;
    }
  ): Promise<NotificationWithDetails[]> {
    return prisma.notification.findMany({
      where: {
        userId,
        status: options?.status,
        type: options?.type,
        readAt: options?.includeRead ? undefined : null,
      },
      orderBy: { createdAt: 'desc' },
      take: options?.limit ?? 50,
    });
  }

  /**
   * Get unread notification count
   */
  async getUnreadCount(userId: number): Promise<number> {
    return prisma.notification.count({
      where: {
        userId,
        readAt: null,
        status: { in: [NotificationStatus.PENDING, NotificationStatus.SENT] },
      },
    });
  }

  /**
   * Mark notification as read
   */
  async markAsRead(id: number, userId: number): Promise<Notification> {
    return prisma.notification.update({
      where: { id, userId },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
  }

  /**
   * Mark all notifications as read
   */
  async markAllAsRead(userId: number): Promise<{ count: number }> {
    const result = await prisma.notification.updateMany({
      where: {
        userId,
        readAt: null,
      },
      data: {
        readAt: new Date(),
        status: NotificationStatus.READ,
      },
    });
    return { count: result.count };
  }

  /**
   * Snooze a notification
   */
  async snooze(
    id: number,
    userId: number,
    snoozedUntil: Date
  ): Promise<Notification> {
    return prisma.notification.update({
      where: { id, userId },
      data: { snoozedUntil },
    });
  }

  /**
   * Delete a notification
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await prisma.notification.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  /**
   * Get or create notification settings for a user
   */
  async getSettings(userId: number): Promise<NotificationSettings> {
    let settings = await prisma.notificationSettings.findUnique({
      where: { userId },
    });

    if (!settings) {
      settings = await prisma.notificationSettings.create({
        data: { userId },
      });
    }

    return settings;
  }

  /**
   * Update notification settings
   */
  async updateSettings(
    userId: number,
    input: UpdateNotificationSettingsInput
  ): Promise<NotificationSettings> {
    // Serialize arrays to JSON strings for storage
    const data: any = { ...input };

    if (input.digestDaysOfWeek) {
      data.digestDaysOfWeek = JSON.stringify(input.digestDaysOfWeek);
    }
    if (input.mutedListIds) {
      data.mutedListIds = JSON.stringify(input.mutedListIds);
    }
    if (input.mutedTagIds) {
      data.mutedTagIds = JSON.stringify(input.mutedTagIds);
    }

    // Ensure settings exist
    await this.getSettings(userId);

    return prisma.notificationSettings.update({
      where: { userId },
      data,
    });
  }

  /**
   * Generate and send due soon notifications
   */
  async generateDueSoonNotifications(): Promise<number> {
    let count = 0;

    // Get all users with enabled due soon notifications
    const settings = await prisma.notificationSettings.findMany({
      where: { taskDueSoonEnabled: true },
    });

    for (const setting of settings) {
      const now = new Date();
      const dueWindow = new Date(
        now.getTime() + setting.taskDueSoonHours * 60 * 60 * 1000
      );

      // Find todos due within the window
      const todos = await prisma.todo.findMany({
        where: {
          userId: setting.userId,
          isComplete: false,
          deletedAt: null,
          dueDate: {
            gte: now,
            lte: dueWindow,
          },
        },
      });

      for (const todo of todos) {
        // Check if notification already sent for this todo
        const existing = await prisma.notification.findFirst({
          where: {
            userId: setting.userId,
            todoId: todo.id,
            type: NotificationType.TASK_DUE_SOON,
            createdAt: {
              gte: new Date(now.getTime() - 24 * 60 * 60 * 1000), // Last 24 hours
            },
          },
        });

        if (!existing) {
          await this.create({
            userId: setting.userId,
            type: NotificationType.TASK_DUE_SOON,
            channel: NotificationChannel.IN_APP,
            title: 'Task Due Soon',
            message: `"${todo.title}" is due in ${setting.taskDueSoonHours} hours`,
            actionUrl: `/todos/${todo.id}`,
            todoId: todo.id,
          });
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Generate and send overdue notifications
   */
  async generateOverdueNotifications(): Promise<number> {
    let count = 0;

    const settings = await prisma.notificationSettings.findMany({
      where: { taskOverdueEnabled: true },
    });

    for (const setting of settings) {
      const now = new Date();

      const todos = await prisma.todo.findMany({
        where: {
          userId: setting.userId,
          isComplete: false,
          deletedAt: null,
          dueDate: { lt: now },
        },
      });

      for (const todo of todos) {
        // Check if notification already sent today
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const existing = await prisma.notification.findFirst({
          where: {
            userId: setting.userId,
            todoId: todo.id,
            type: NotificationType.TASK_OVERDUE,
            createdAt: { gte: today },
          },
        });

        if (!existing) {
          await this.create({
            userId: setting.userId,
            type: NotificationType.TASK_OVERDUE,
            channel: NotificationChannel.IN_APP,
            title: 'Task Overdue',
            message: `"${todo.title}" is overdue`,
            actionUrl: `/todos/${todo.id}`,
            todoId: todo.id,
          });
          count++;
        }
      }
    }

    return count;
  }

  /**
   * Generate daily/weekly digest data
   */
  async generateDigestData(userId: number): Promise<DigestData> {
    const now = new Date();
    const tomorrow = new Date(now.getTime() + 24 * 60 * 60 * 1000);

    // Overdue todos
    const overdueTodos = await prisma.todo.findMany({
      where: {
        userId,
        isComplete: false,
        deletedAt: null,
        dueDate: { lt: now },
      },
      select: { id: true, title: true, dueDate: true, priority: true },
      orderBy: { priority: 'desc' },
    });

    // Due soon todos (next 24 hours)
    const dueSoonTodos = await prisma.todo.findMany({
      where: {
        userId,
        isComplete: false,
        deletedAt: null,
        dueDate: {
          gte: now,
          lte: tomorrow,
        },
      },
      select: { id: true, title: true, dueDate: true, priority: true },
      orderBy: { dueDate: 'asc' },
    });

    // Recently completed todos (last 24 hours)
    const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
    const completedTodos = await prisma.todo.findMany({
      where: {
        userId,
        isComplete: true,
        updatedAt: { gte: yesterday },
      },
      select: { id: true, title: true, updatedAt: true },
      orderBy: { updatedAt: 'desc' },
      take: 10,
    });

    // Total active todos
    const totalActive = await prisma.todo.count({
      where: {
        userId,
        isComplete: false,
        deletedAt: null,
      },
    });

    return {
      overdueTodos,
      dueSoonTodos,
      completedTodos: completedTodos.map((t) => ({
        ...t,
        completedAt: t.updatedAt,
      })),
      totalActive,
    };
  }

  /**
   * Create notification rule
   */
  async createRule(
    input: CreateNotificationRuleInput
  ): Promise<NotificationRule> {
    return prisma.notificationRule.create({
      data: {
        userId: input.userId,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        conditions: JSON.stringify(input.conditions),
        channel: input.channel,
        message: input.message,
        maxPerDay: input.maxPerDay,
      },
    });
  }

  /**
   * Get all rules for a user
   */
  async getAllRules(userId: number): Promise<NotificationRule[]> {
    return prisma.notificationRule.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Update rule
   */
  async updateRule(
    id: number,
    userId: number,
    updates: Partial<CreateNotificationRuleInput>
  ): Promise<NotificationRule> {
    const data: any = { ...updates };
    if (updates.conditions) {
      data.conditions = JSON.stringify(updates.conditions);
    }

    return prisma.notificationRule.update({
      where: { id, userId },
      data,
    });
  }

  /**
   * Delete rule
   */
  async deleteRule(id: number, userId: number): Promise<boolean> {
    const result = await prisma.notificationRule.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  // ===== HELPER METHODS =====

  private isNotificationTypeEnabled(
    settings: NotificationSettings,
    type: NotificationType
  ): boolean {
    switch (type) {
      case NotificationType.TASK_DUE_SOON:
        return settings.taskDueSoonEnabled;
      case NotificationType.TASK_OVERDUE:
        return settings.taskOverdueEnabled;
      case NotificationType.TASK_ASSIGNED:
        return settings.taskAssignedEnabled;
      case NotificationType.TASK_COMPLETED:
        return settings.taskCompletedEnabled;
      default:
        return true;
    }
  }

  private isChannelEnabled(
    settings: NotificationSettings,
    channel: NotificationChannel
  ): boolean {
    switch (channel) {
      case NotificationChannel.EMAIL:
        return settings.emailEnabled;
      case NotificationChannel.BROWSER_PUSH:
        return settings.browserPushEnabled;
      case NotificationChannel.IN_APP:
        return settings.inAppEnabled;
      default:
        return true;
    }
  }

  private isInQuietHours(settings: NotificationSettings): boolean {
    if (
      !settings.quietHoursEnabled ||
      !settings.quietHoursStart ||
      !settings.quietHoursEnd
    ) {
      return false;
    }

    const now = new Date();
    const currentTime = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}`;

    return (
      currentTime >= settings.quietHoursStart &&
      currentTime <= settings.quietHoursEnd
    );
  }

  private calculateNextAvailableTime(settings: NotificationSettings): Date {
    if (!settings.quietHoursEnd) {
      return new Date();
    }

    const parts = settings.quietHoursEnd.split(':').map(Number);
    const hours = parts[0] ?? 0;
    const minutes = parts[1] ?? 0;
    const nextTime = new Date();
    nextTime.setHours(hours, minutes, 0, 0);

    // If quiet hours end time has already passed today, schedule for tomorrow
    if (nextTime <= new Date()) {
      nextTime.setDate(nextTime.getDate() + 1);
    }

    return nextTime;
  }
}

export const notificationService = new NotificationService();
