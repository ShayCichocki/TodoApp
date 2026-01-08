import { prisma } from '../lib/prisma';
import {
  RecurringTodo,
  RecurrenceException,
  RecurrenceFrequency,
  RecurrenceEndType,
  Priority,
} from '@prisma/client';
import { RRule, Frequency } from 'rrule';

export {
  RecurringTodo,
  RecurrenceFrequency,
  RecurrenceEndType,
} from '@prisma/client';

export type CreateRecurringTodoInput = {
  userId: number;
  title: string;
  description: string;
  priority?: Priority;
  frequency: RecurrenceFrequency;
  interval?: number;
  byWeekDay?: string[]; // ['MO', 'WE', 'FR']
  byMonthDay?: number;
  startDate: Date;
  endType?: RecurrenceEndType;
  endDate?: Date;
  count?: number;
};

export type UpdateRecurringTodoInput = {
  title?: string;
  description?: string;
  priority?: Priority;
  isActive?: boolean;
};

// Map our enum to rrule Frequency
const FREQUENCY_MAP: Record<RecurrenceFrequency, Frequency> = {
  [RecurrenceFrequency.DAILY]: RRule.DAILY,
  [RecurrenceFrequency.WEEKLY]: RRule.WEEKLY,
  [RecurrenceFrequency.MONTHLY]: RRule.MONTHLY,
  [RecurrenceFrequency.YEARLY]: RRule.YEARLY,
};

// Map day strings to rrule weekday constants
const WEEKDAY_MAP: Record<string, any> = {
  MO: RRule.MO,
  TU: RRule.TU,
  WE: RRule.WE,
  TH: RRule.TH,
  FR: RRule.FR,
  SA: RRule.SA,
  SU: RRule.SU,
};

class RecurringTodoService {
  /**
   * Create a new recurring todo template
   */
  async create(input: CreateRecurringTodoInput): Promise<RecurringTodo> {
    return prisma.recurringTodo.create({
      data: {
        userId: input.userId,
        title: input.title,
        description: input.description,
        priority: input.priority ?? Priority.MEDIUM,
        frequency: input.frequency,
        interval: input.interval ?? 1,
        byWeekDay: input.byWeekDay ? JSON.stringify(input.byWeekDay) : null,
        byMonthDay: input.byMonthDay,
        startDate: input.startDate,
        endType: input.endType ?? RecurrenceEndType.NEVER,
        endDate: input.endDate,
        count: input.count,
      },
    });
  }

  /**
   * Get all recurring todos for a user
   */
  async getAllForUser(userId: number): Promise<RecurringTodo[]> {
    return prisma.recurringTodo.findMany({
      where: { userId },
      include: {
        instances: {
          take: 5,
          orderBy: { dueDate: 'desc' },
        },
        exceptions: true,
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a single recurring todo by ID
   */
  async getById(id: number, userId: number): Promise<RecurringTodo | null> {
    return prisma.recurringTodo.findFirst({
      where: { id, userId },
      include: {
        instances: {
          orderBy: { dueDate: 'desc' },
        },
        exceptions: true,
      },
    });
  }

  /**
   * Update a recurring todo
   */
  async update(
    id: number,
    userId: number,
    input: UpdateRecurringTodoInput
  ): Promise<RecurringTodo> {
    return prisma.recurringTodo.update({
      where: { id, userId },
      data: input,
    });
  }

  /**
   * Delete a recurring todo (also deletes all instances)
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await prisma.recurringTodo.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  /**
   * Generate todo instances for a recurring todo within a date range
   * Uses lazy generation - only creates instances as needed
   */
  async generateInstances(
    recurringTodoId: number,
    fromDate: Date,
    toDate: Date
  ): Promise<void> {
    const recurringTodo = await prisma.recurringTodo.findUnique({
      where: { id: recurringTodoId },
      include: {
        exceptions: true,
        instances: {
          where: {
            recurringDate: {
              gte: fromDate,
              lte: toDate,
            },
          },
        },
      },
    });

    if (!recurringTodo || !recurringTodo.isActive) {
      return;
    }

    // Get occurrence dates using rrule
    const occurrences = this.getOccurrences(recurringTodo, fromDate, toDate);

    // Get existing instance dates
    const existingDates = new Set(
      recurringTodo.instances.map((i) => i.recurringDate?.toISOString())
    );

    // Get exception dates
    const exceptions = new Map(
      recurringTodo.exceptions.map((e) => [e.originalDate.toISOString(), e])
    );

    // Create missing instances
    for (const date of occurrences) {
      const dateStr = date.toISOString();

      // Skip if already exists
      if (existingDates.has(dateStr)) {
        continue;
      }

      // Check for exceptions
      const exception = exceptions.get(dateStr);
      if (exception?.action === 'skip') {
        continue;
      }

      // Determine due date (respect reschedule exceptions)
      const dueDate =
        exception?.action === 'reschedule' && exception.newDate
          ? exception.newDate
          : date;

      // Create the instance
      await prisma.todo.create({
        data: {
          userId: recurringTodo.userId,
          title: recurringTodo.title,
          description: recurringTodo.description,
          priority: recurringTodo.priority,
          dueDate,
          recurringTodoId: recurringTodo.id,
          recurringDate: date,
        },
      });
    }

    // Update last generated timestamp
    await prisma.recurringTodo.update({
      where: { id: recurringTodoId },
      data: { lastGenerated: new Date() },
    });
  }

  /**
   * Get occurrence dates for a recurring todo using rrule
   */
  private getOccurrences(
    recurringTodo: RecurringTodo,
    fromDate: Date,
    toDate: Date
  ): Date[] {
    const options: any = {
      freq: FREQUENCY_MAP[recurringTodo.frequency],
      interval: recurringTodo.interval,
      dtstart: recurringTodo.startDate,
    };

    // Handle weekly recurrence with specific weekdays
    if (
      recurringTodo.frequency === RecurrenceFrequency.WEEKLY &&
      recurringTodo.byWeekDay
    ) {
      const weekdays = JSON.parse(recurringTodo.byWeekDay) as string[];
      options.byweekday = weekdays.map((day) => WEEKDAY_MAP[day]);
    }

    // Handle monthly recurrence with specific day
    if (
      recurringTodo.frequency === RecurrenceFrequency.MONTHLY &&
      recurringTodo.byMonthDay
    ) {
      options.bymonthday = recurringTodo.byMonthDay;
    }

    // Handle recurrence end conditions
    if (
      recurringTodo.endType === RecurrenceEndType.ON_DATE &&
      recurringTodo.endDate
    ) {
      options.until = recurringTodo.endDate;
    } else if (
      recurringTodo.endType === RecurrenceEndType.AFTER_COUNT &&
      recurringTodo.count
    ) {
      options.count = recurringTodo.count;
    }

    const rule = new RRule(options);

    // Get occurrences between dates
    return rule.between(fromDate, toDate, true);
  }

  /**
   * Generate instances for all active recurring todos for a user
   * Typically called when user views their todo list
   */
  async generateAllInstancesForUser(
    userId: number,
    fromDate: Date,
    toDate: Date
  ): Promise<void> {
    const recurringTodos = await prisma.recurringTodo.findMany({
      where: {
        userId,
        isActive: true,
      },
    });

    // Generate instances for each recurring todo
    await Promise.all(
      recurringTodos.map((rt) =>
        this.generateInstances(rt.id, fromDate, toDate)
      )
    );
  }

  /**
   * Add an exception for a specific date (skip or reschedule)
   */
  async addException(
    recurringTodoId: number,
    originalDate: Date,
    action: 'skip' | 'reschedule',
    newDate?: Date
  ): Promise<RecurrenceException> {
    return prisma.recurrenceException.create({
      data: {
        recurringTodoId,
        originalDate,
        action,
        newDate,
      },
    });
  }

  /**
   * Remove an exception
   */
  async removeException(id: number): Promise<void> {
    await prisma.recurrenceException.delete({
      where: { id },
    });
  }
}

export const recurringTodoService = new RecurringTodoService();
