import { prisma } from '../lib/prisma';
import { Todo, Tag, Priority, User } from '@prisma/client';
import { workspaceService } from './workspaceService';

export type { Todo, Tag, Priority } from '@prisma/client';

export type TodoWithTags = Todo & {
  tags: { tag: Tag }[];
  assignedTo?: Pick<User, 'id' | 'email' | 'name'> | null;
};

export type CreateTodoInput = {
  title: string;
  description: string;
  dueDate: Date;
  isComplete: boolean;
  priority?: Priority;
  tagIds?: number[];
  workspaceId?: number;
  workspaceListId?: number;
  assignedToId?: number;
};

export type UpdateTodoInput = Partial<Omit<CreateTodoInput, 'tagIds'>> & {
  tagIds?: number[];
};

export type TodoFilterOptions = {
  assignedToMe?: boolean;
  assignedToOthers?: boolean;
  unassigned?: boolean;
  listId?: number;
  completed?: boolean;
};

class TodoService {
  async getAllForUser(userId: number): Promise<TodoWithTags[]> {
    return prisma.todo.findMany({
      where: { deletedAt: null, userId, workspaceId: null },
      include: {
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  async getByIdForUser(
    id: number,
    userId: number
  ): Promise<TodoWithTags | null> {
    return prisma.todo.findFirst({
      where: { id, deletedAt: null, userId },
      include: {
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async createForUser(
    input: CreateTodoInput,
    userId: number
  ): Promise<TodoWithTags> {
    const { tagIds, workspaceId, workspaceListId, assignedToId, ...todoData } =
      input;

    // If creating in workspace, verify user has permission
    if (workspaceId) {
      const hasPermission = await workspaceService.hasPermission(
        workspaceId,
        userId,
        'CREATE_TODO'
      );
      if (!hasPermission) {
        throw new Error('Insufficient permissions to create todos in workspace');
      }
    }

    return prisma.todo.create({
      data: {
        ...todoData,
        userId,
        workspaceId,
        workspaceListId,
        assignedToId,
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
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  async updateForUser(
    id: number,
    updates: UpdateTodoInput,
    userId: number
  ): Promise<TodoWithTags | null> {
    try {
      const { tagIds, workspaceId, workspaceListId, assignedToId, ...todoUpdates } = updates;

      const existing = await this.getByIdForUser(id, userId);
      if (!existing) return null;

      // If updating workspace fields, verify permission
      if (existing.workspaceId && workspaceId !== undefined) {
        const hasPermission = await workspaceService.hasPermission(
          existing.workspaceId,
          userId,
          'EDIT_TODO'
        );
        if (!hasPermission) {
          throw new Error('Insufficient permissions to edit workspace todos');
        }
      }

      return await prisma.todo.update({
        where: { id },
        data: {
          ...todoUpdates,
          workspaceId,
          workspaceListId,
          assignedToId,
          tags:
            tagIds !== undefined
              ? {
                  deleteMany: {},
                  create: tagIds.map((tagId) => ({ tagId })),
                }
              : undefined,
        },
        include: {
          tags: {
            include: { tag: true },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
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
        data: { deletedAt: new Date() },
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
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { deletedAt: 'desc' },
    });
  }

  async restoreForUser(
    id: number,
    userId: number
  ): Promise<TodoWithTags | null> {
    try {
      const existing = await prisma.todo.findFirst({
        where: { id, userId },
      });

      if (!existing) return null;

      return await prisma.todo.update({
        where: { id },
        data: { deletedAt: null },
        include: {
          tags: {
            include: { tag: true },
          },
          assignedTo: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  /**
   * Get all todos for a workspace (with filters)
   */
  async getAllForWorkspace(
    workspaceId: number,
    userId: number,
    filters: TodoFilterOptions = {}
  ): Promise<TodoWithTags[]> {
    // Verify user has access to workspace
    const hasAccess = await workspaceService.hasPermission(
      workspaceId,
      userId,
      'VIEW_WORKSPACE'
    );
    if (!hasAccess) {
      throw new Error('Access denied to workspace');
    }

    const where: {
      workspaceId: number;
      deletedAt: null;
      assignedToId?: { equals: number } | { not: null } | null;
      workspaceListId?: number;
      completed?: boolean;
    } = {
      workspaceId,
      deletedAt: null,
    };

    // Apply filters
    if (filters.assignedToMe) {
      where.assignedToId = { equals: userId };
    } else if (filters.assignedToOthers) {
      where.assignedToId = { not: null };
    } else if (filters.unassigned) {
      where.assignedToId = null;
    }

    if (filters.listId) {
      where.workspaceListId = filters.listId;
    }

    if (filters.completed !== undefined) {
      where.completed = filters.completed;
    }

    return prisma.todo.findMany({
      where,
      include: {
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { dueDate: 'asc' },
    });
  }

  /**
   * Assign a todo to a workspace member
   */
  async assignTodo(
    todoId: number,
    assigneeId: number,
    userId: number
  ): Promise<TodoWithTags> {
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    if (!todo.workspaceId) {
      throw new Error('Can only assign workspace todos');
    }

    // Verify user has permission to edit todos
    const hasPermission = await workspaceService.hasPermission(
      todo.workspaceId,
      userId,
      'EDIT_TODO'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to assign todos');
    }

    // Verify assignee is a workspace member
    const assigneeRole = await workspaceService.getUserRole(
      todo.workspaceId,
      assigneeId
    );
    if (!assigneeRole) {
      throw new Error('Assignee is not a workspace member');
    }

    return prisma.todo.update({
      where: { id: todoId },
      data: { assignedToId: assigneeId },
      include: {
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }

  /**
   * Unassign a todo
   */
  async unassignTodo(todoId: number, userId: number): Promise<TodoWithTags> {
    const todo = await prisma.todo.findUnique({
      where: { id: todoId },
    });

    if (!todo) {
      throw new Error('Todo not found');
    }

    if (!todo.workspaceId) {
      throw new Error('Can only unassign workspace todos');
    }

    // Verify user has permission to edit todos
    const hasPermission = await workspaceService.hasPermission(
      todo.workspaceId,
      userId,
      'EDIT_TODO'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to unassign todos');
    }

    return prisma.todo.update({
      where: { id: todoId },
      data: { assignedToId: null },
      include: {
        tags: {
          include: { tag: true },
        },
        assignedTo: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
    });
  }
}

export const todoService = new TodoService();
