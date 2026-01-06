import { prisma } from '../lib/prisma';
import { Todo, Tag, Priority } from '@prisma/client';

export type { Todo, Tag, Priority } from '@prisma/client';

export type TodoWithTags = Todo & {
  tags: { tag: Tag }[];
};

export type CreateTodoInput = {
  title: string;
  description: string;
  dueDate: Date;
  isComplete: boolean;
  priority?: Priority;
  tagIds?: number[];
};

export type UpdateTodoInput = Partial<Omit<CreateTodoInput, 'tagIds'>> & {
  tagIds?: number[];
};

class TodoService {
  async getAllForUser(userId: number): Promise<TodoWithTags[]> {
    return prisma.todo.findMany({
      where: { deletedAt: null, userId },
      include: {
        tags: {
          include: { tag: true }
        }
      },
      orderBy: { dueDate: 'asc' }
    });
  }

  async getByIdForUser(id: number, userId: number): Promise<TodoWithTags | null> {
    return prisma.todo.findFirst({
      where: { id, deletedAt: null, userId },
      include: {
        tags: {
          include: { tag: true }
        }
      }
    });
  }

  async createForUser(input: CreateTodoInput, userId: number): Promise<TodoWithTags> {
    const { tagIds, ...todoData } = input;

    return prisma.todo.create({
      data: {
        ...todoData,
        userId,
        tags: tagIds
          ? {
              create: tagIds.map((tagId) => ({ tagId })),
            }
          : undefined,
      },
      include: {
        tags: {
          include: { tag: true },
        },
      },
    });
  }

  async updateForUser(id: number, updates: UpdateTodoInput, userId: number): Promise<TodoWithTags | null> {
    try {
      const { tagIds, ...todoUpdates } = updates;

      const existing = await this.getByIdForUser(id, userId);
      if (!existing) return null;

      return await prisma.todo.update({
        where: { id },
        data: {
          ...todoUpdates,
          tags: tagIds !== undefined ? {
            deleteMany: {},
            create: tagIds.map(tagId => ({ tagId }))
          } : undefined
        },
        include: {
          tags: {
            include: { tag: true }
          }
        }
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async deleteForUser(id: number, userId: number): Promise<boolean> {
    try {
      const existing = await this.getByIdForUser(id, userId);
      if (!existing) return false;

      await prisma.todo.update({
        where: { id },
        data: { deletedAt: new Date() }
      });
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async getDeletedForUser(userId: number): Promise<TodoWithTags[]> {
    return prisma.todo.findMany({
      where: { deletedAt: { not: null }, userId },
      include: {
        tags: {
          include: { tag: true }
        }
      },
      orderBy: { deletedAt: 'desc' }
    });
  }

  async restoreForUser(id: number, userId: number): Promise<TodoWithTags | null> {
    try {
      const existing = await prisma.todo.findFirst({
        where: { id, userId }
      });

      if (!existing) return null;

      return await prisma.todo.update({
        where: { id },
        data: { deletedAt: null },
        include: {
          tags: {
            include: { tag: true }
          }
        }
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return null;
      }
      throw error;
    }
  }
}

export const todoService = new TodoService();
