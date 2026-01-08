import { prisma } from '../lib/prisma';
import {
  TimeEntry,
  PomodoroSession,
  PomodoroSessionType,
} from '@prisma/client';

export {
  TimeEntry,
  PomodoroSession,
  PomodoroSessionType,
} from '@prisma/client';

export type StartTimerInput = {
  userId: number;
  todoId?: number;
  description?: string;
};

export type StopTimerInput = {
  userId: number;
  endTime?: Date;
};

export type StartPomodoroInput = {
  userId: number;
  todoId?: number;
  type?: PomodoroSessionType;
  duration?: number; // in minutes
};

export type TimeEntryWithTodo = TimeEntry & {
  todo?: {
    id: number;
    title: string;
  } | null;
};

export type PomodoroSessionWithTodo = PomodoroSession & {
  todo?: {
    id: number;
    title: string;
  } | null;
};

export type TimeStats = {
  totalSeconds: number;
  totalMinutes: number;
  totalHours: number;
  entriesCount: number;
  byTodo: Array<{
    todoId: number;
    todoTitle: string;
    totalSeconds: number;
    totalHours: number;
    entriesCount: number;
  }>;
};

// Default Pomodoro durations (in minutes)
const POMODORO_DURATIONS = {
  [PomodoroSessionType.WORK]: 25,
  [PomodoroSessionType.SHORT_BREAK]: 5,
  [PomodoroSessionType.LONG_BREAK]: 15,
};

class TimeTrackingService {
  /**
   * Start a new timer
   */
  async startTimer(input: StartTimerInput): Promise<TimeEntry> {
    // Stop any active timers for this user first
    await this.stopAllActiveTimers(input.userId);

    return prisma.timeEntry.create({
      data: {
        userId: input.userId,
        todoId: input.todoId,
        description: input.description,
        startTime: new Date(),
        isActive: true,
      },
    });
  }

  /**
   * Stop the active timer for a user
   */
  async stopTimer(input: StopTimerInput): Promise<TimeEntry | null> {
    const activeTimer = await prisma.timeEntry.findFirst({
      where: {
        userId: input.userId,
        isActive: true,
      },
    });

    if (!activeTimer) {
      return null;
    }

    const endTime = input.endTime || new Date();
    const duration = Math.floor(
      (endTime.getTime() - activeTimer.startTime.getTime()) / 1000
    );

    return prisma.timeEntry.update({
      where: { id: activeTimer.id },
      data: {
        endTime,
        duration,
        isActive: false,
      },
    });
  }

  /**
   * Get the active timer for a user
   */
  async getActiveTimer(userId: number): Promise<TimeEntryWithTodo | null> {
    return prisma.timeEntry.findFirst({
      where: {
        userId,
        isActive: true,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });
  }

  /**
   * Get all time entries for a user
   */
  async getAllTimeEntries(
    userId: number,
    options?: {
      todoId?: number;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    }
  ): Promise<TimeEntryWithTodo[]> {
    return prisma.timeEntry.findMany({
      where: {
        userId,
        todoId: options?.todoId,
        startTime: {
          gte: options?.fromDate,
          lte: options?.toDate,
        },
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: options?.limit,
    });
  }

  /**
   * Get time statistics for a user
   */
  async getTimeStats(
    userId: number,
    options?: {
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<TimeStats> {
    const entries = await prisma.timeEntry.findMany({
      where: {
        userId,
        isActive: false, // Only completed entries
        startTime: {
          gte: options?.fromDate,
          lte: options?.toDate,
        },
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
    });

    const totalSeconds = entries.reduce(
      (sum, entry) => sum + (entry.duration || 0),
      0
    );

    // Group by todo
    const byTodoMap = new Map<
      number,
      { title: string; seconds: number; count: number }
    >();

    entries.forEach((entry) => {
      if (entry.todoId && entry.todo) {
        const existing = byTodoMap.get(entry.todoId) || {
          title: entry.todo.title,
          seconds: 0,
          count: 0,
        };
        byTodoMap.set(entry.todoId, {
          title: entry.todo.title,
          seconds: existing.seconds + (entry.duration || 0),
          count: existing.count + 1,
        });
      }
    });

    const byTodo = Array.from(byTodoMap.entries())
      .map(([todoId, data]) => ({
        todoId,
        todoTitle: data.title,
        totalSeconds: data.seconds,
        totalHours: Math.round((data.seconds / 3600) * 100) / 100,
        entriesCount: data.count,
      }))
      .sort((a, b) => b.totalSeconds - a.totalSeconds);

    return {
      totalSeconds,
      totalMinutes: Math.floor(totalSeconds / 60),
      totalHours: Math.round((totalSeconds / 3600) * 100) / 100,
      entriesCount: entries.length,
      byTodo,
    };
  }

  /**
   * Delete a time entry
   */
  async deleteTimeEntry(id: number, userId: number): Promise<boolean> {
    const result = await prisma.timeEntry.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  /**
   * Stop all active timers for a user (cleanup helper)
   */
  private async stopAllActiveTimers(userId: number): Promise<void> {
    const activeTimers = await prisma.timeEntry.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    const now = new Date();

    await Promise.all(
      activeTimers.map((timer) => {
        const duration = Math.floor(
          (now.getTime() - timer.startTime.getTime()) / 1000
        );
        return prisma.timeEntry.update({
          where: { id: timer.id },
          data: {
            endTime: now,
            duration,
            isActive: false,
          },
        });
      })
    );
  }

  // ===== POMODORO METHODS =====

  /**
   * Start a new Pomodoro session
   */
  async startPomodoro(input: StartPomodoroInput): Promise<PomodoroSession> {
    const type = input.type || PomodoroSessionType.WORK;
    const duration = input.duration || POMODORO_DURATIONS[type];

    return prisma.pomodoroSession.create({
      data: {
        userId: input.userId,
        todoId: input.todoId,
        type,
        duration,
        startTime: new Date(),
      },
    });
  }

  /**
   * Complete a Pomodoro session
   */
  async completePomodoro(
    sessionId: number,
    userId: number
  ): Promise<PomodoroSession> {
    return prisma.pomodoroSession.update({
      where: {
        id: sessionId,
        userId,
      },
      data: {
        endTime: new Date(),
        completed: true,
      },
    });
  }

  /**
   * Get active Pomodoro session
   */
  async getActivePomodoro(
    userId: number
  ): Promise<PomodoroSessionWithTodo | null> {
    return prisma.pomodoroSession.findFirst({
      where: {
        userId,
        completed: false,
        endTime: null,
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
    });
  }

  /**
   * Get all Pomodoro sessions for a user
   */
  async getAllPomodoroSessions(
    userId: number,
    options?: {
      todoId?: number;
      fromDate?: Date;
      toDate?: Date;
      limit?: number;
    }
  ): Promise<PomodoroSessionWithTodo[]> {
    return prisma.pomodoroSession.findMany({
      where: {
        userId,
        todoId: options?.todoId,
        startTime: {
          gte: options?.fromDate,
          lte: options?.toDate,
        },
      },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
          },
        },
      },
      orderBy: { startTime: 'desc' },
      take: options?.limit,
    });
  }

  /**
   * Get Pomodoro statistics
   */
  async getPomodoroStats(
    userId: number,
    options?: {
      fromDate?: Date;
      toDate?: Date;
    }
  ): Promise<{
    completedCount: number;
    workSessionsCount: number;
    totalMinutes: number;
  }> {
    const sessions = await prisma.pomodoroSession.findMany({
      where: {
        userId,
        completed: true,
        startTime: {
          gte: options?.fromDate,
          lte: options?.toDate,
        },
      },
    });

    const workSessions = sessions.filter(
      (s) => s.type === PomodoroSessionType.WORK
    );
    const totalMinutes = sessions.reduce((sum, s) => sum + s.duration, 0);

    return {
      completedCount: sessions.length,
      workSessionsCount: workSessions.length,
      totalMinutes,
    };
  }

  /**
   * Delete a Pomodoro session
   */
  async deletePomodoroSession(id: number, userId: number): Promise<boolean> {
    const result = await prisma.pomodoroSession.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }
}

export const timeTrackingService = new TimeTrackingService();
