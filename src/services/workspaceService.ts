import { prisma } from '../lib/prisma';
import {
  Workspace,
  WorkspaceMember,
  WorkspaceMemberRole,
  User,
} from '@prisma/client';

export { WorkspaceMemberRole } from '@prisma/client';

export type CreateWorkspaceInput = {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export type UpdateWorkspaceInput = {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
};

export type AddMemberInput = {
  email: string;
  role?: WorkspaceMemberRole;
};

export type WorkspaceWithDetails = Workspace & {
  members: (WorkspaceMember & {
    user: Pick<User, 'id' | 'email' | 'name'>;
  })[];
  _count?: {
    todos: number;
    lists: number;
    members: number;
  };
};

// Permission matrix
const PERMISSIONS = {
  DELETE_WORKSPACE: [WorkspaceMemberRole.OWNER],
  UPDATE_WORKSPACE: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
  ADD_MEMBER: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
  REMOVE_MEMBER: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
  CHANGE_ROLE: [WorkspaceMemberRole.OWNER, WorkspaceMemberRole.ADMIN],
  CREATE_TODO: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
  ],
  EDIT_TODO: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
  ],
  CREATE_LIST: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
  ],
  EDIT_LIST: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
  ],
  VIEW_WORKSPACE: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
    WorkspaceMemberRole.VIEWER,
  ],
  COMMENT: [
    WorkspaceMemberRole.OWNER,
    WorkspaceMemberRole.ADMIN,
    WorkspaceMemberRole.MEMBER,
  ],
} as const;

export type WorkspacePermission = keyof typeof PERMISSIONS;

class WorkspaceService {
  /**
   * Create a new workspace
   */
  async create(
    input: CreateWorkspaceInput,
    userId: number
  ): Promise<Workspace> {
    const workspace = await prisma.workspace.create({
      data: {
        name: input.name,
        description: input.description,
        settings: input.settings ? JSON.stringify(input.settings) : null,
        ownerId: userId,
        members: {
          create: {
            userId,
            role: WorkspaceMemberRole.OWNER,
            joinedAt: new Date(),
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Get all workspaces for a user
   */
  async getAllForUser(userId: number): Promise<WorkspaceWithDetails[]> {
    const memberships = await prisma.workspaceMember.findMany({
      where: { userId },
      include: {
        workspace: {
          include: {
            members: {
              include: {
                user: {
                  select: {
                    id: true,
                    email: true,
                    name: true,
                  },
                },
              },
            },
            _count: {
              select: {
                todos: true,
                lists: true,
                members: true,
              },
            },
          },
        },
      },
    });

    return memberships.map((m) => m.workspace);
  }

  /**
   * Get workspace by ID (with permission check)
   */
  async getById(
    workspaceId: number,
    userId: number
  ): Promise<WorkspaceWithDetails | null> {
    const workspace = await prisma.workspace.findFirst({
      where: {
        id: workspaceId,
        members: {
          some: { userId },
        },
      },
      include: {
        members: {
          include: {
            user: {
              select: {
                id: true,
                email: true,
                name: true,
              },
            },
          },
        },
        _count: {
          select: {
            todos: true,
            lists: true,
            members: true,
          },
        },
      },
    });

    return workspace;
  }

  /**
   * Update workspace
   */
  async update(
    workspaceId: number,
    userId: number,
    input: UpdateWorkspaceInput
  ): Promise<Workspace> {
    // Check permission
    const hasPermission = await this.hasPermission(
      workspaceId,
      userId,
      'UPDATE_WORKSPACE'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to update workspace');
    }

    return prisma.workspace.update({
      where: { id: workspaceId },
      data: {
        name: input.name,
        description: input.description,
        settings: input.settings ? JSON.stringify(input.settings) : undefined,
      },
    });
  }

  /**
   * Delete workspace
   */
  async delete(workspaceId: number, userId: number): Promise<boolean> {
    // Check permission (only owner can delete)
    const hasPermission = await this.hasPermission(
      workspaceId,
      userId,
      'DELETE_WORKSPACE'
    );
    if (!hasPermission) {
      throw new Error('Only workspace owner can delete workspace');
    }

    await prisma.workspace.delete({
      where: { id: workspaceId },
    });

    return true;
  }

  /**
   * Add member to workspace
   */
  async addMember(
    workspaceId: number,
    input: AddMemberInput,
    invitedBy: number
  ): Promise<WorkspaceMember> {
    // Check permission
    const hasPermission = await this.hasPermission(
      workspaceId,
      invitedBy,
      'ADD_MEMBER'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to add members');
    }

    // Find user by email
    const user = await prisma.user.findUnique({
      where: { email: input.email },
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Check if already a member
    const existing = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId: user.id,
        },
      },
    });

    if (existing) {
      throw new Error('User is already a member of this workspace');
    }

    return prisma.workspaceMember.create({
      data: {
        workspaceId,
        userId: user.id,
        role: input.role ?? WorkspaceMemberRole.MEMBER,
        invitedBy,
      },
    });
  }

  /**
   * Remove member from workspace
   */
  async removeMember(
    workspaceId: number,
    memberId: number,
    userId: number
  ): Promise<boolean> {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
      include: { workspace: true },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new Error('Member not found in this workspace');
    }

    // Can't remove the owner
    if (member.role === WorkspaceMemberRole.OWNER) {
      throw new Error('Cannot remove workspace owner');
    }

    // Check if user is removing themselves (always allowed) or has permission
    if (member.userId !== userId) {
      const hasPermission = await this.hasPermission(
        workspaceId,
        userId,
        'REMOVE_MEMBER'
      );
      if (!hasPermission) {
        throw new Error('Insufficient permissions to remove members');
      }
    }

    await prisma.workspaceMember.delete({
      where: { id: memberId },
    });

    return true;
  }

  /**
   * Update member role
   */
  async updateMemberRole(
    workspaceId: number,
    memberId: number,
    role: WorkspaceMemberRole,
    userId: number
  ): Promise<WorkspaceMember> {
    // Check permission
    const hasPermission = await this.hasPermission(
      workspaceId,
      userId,
      'CHANGE_ROLE'
    );
    if (!hasPermission) {
      throw new Error('Insufficient permissions to change member roles');
    }

    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member || member.workspaceId !== workspaceId) {
      throw new Error('Member not found in this workspace');
    }

    // Can't change owner role
    if (member.role === WorkspaceMemberRole.OWNER) {
      throw new Error('Cannot change role of workspace owner');
    }

    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { role },
    });
  }

  /**
   * Accept workspace invitation
   */
  async acceptInvitation(
    memberId: number,
    userId: number
  ): Promise<WorkspaceMember> {
    const member = await prisma.workspaceMember.findUnique({
      where: { id: memberId },
    });

    if (!member) {
      throw new Error('Invitation not found');
    }

    if (member.userId !== userId) {
      throw new Error('This invitation is not for you');
    }

    if (member.joinedAt) {
      throw new Error('Invitation already accepted');
    }

    return prisma.workspaceMember.update({
      where: { id: memberId },
      data: { joinedAt: new Date() },
    });
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: number): Promise<
    (WorkspaceMember & {
      workspace: Workspace;
    })[]
  > {
    return prisma.workspaceMember.findMany({
      where: {
        userId,
        joinedAt: null,
      },
      include: {
        workspace: true,
      },
    });
  }

  /**
   * Get user's role in workspace
   */
  async getUserRole(
    workspaceId: number,
    userId: number
  ): Promise<WorkspaceMemberRole | null> {
    const member = await prisma.workspaceMember.findUnique({
      where: {
        workspaceId_userId: {
          workspaceId,
          userId,
        },
      },
    });

    return member?.role ?? null;
  }

  /**
   * Check if user has specific permission in workspace
   */
  async hasPermission(
    workspaceId: number,
    userId: number,
    permission: WorkspacePermission
  ): Promise<boolean> {
    const role = await this.getUserRole(workspaceId, userId);
    if (!role) return false;

    const allowedRoles = PERMISSIONS[permission];
    return allowedRoles.includes(role);
  }

  /**
   * Get workspace statistics
   */
  async getStats(workspaceId: number, userId: number) {
    // Verify user has access
    const hasAccess = await this.hasPermission(
      workspaceId,
      userId,
      'VIEW_WORKSPACE'
    );
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    const [totalTodos, completedTodos, totalMembers, totalLists] =
      await Promise.all([
        prisma.todo.count({ where: { workspaceId } }),
        prisma.todo.count({ where: { workspaceId, completed: true } }),
        prisma.workspaceMember.count({ where: { workspaceId } }),
        prisma.workspaceList.count({ where: { workspaceId } }),
      ]);

    return {
      totalTodos,
      completedTodos,
      completionRate:
        totalTodos > 0 ? (completedTodos / totalTodos) * 100 : 0,
      totalMembers,
      totalLists,
    };
  }

  /**
   * Get all members of a workspace
   */
  async getMembers(
    workspaceId: number,
    userId: number
  ): Promise<
    (WorkspaceMember & {
      user: Pick<User, 'id' | 'email' | 'name'>;
    })[]
  > {
    // Verify user has access
    const hasAccess = await this.hasPermission(
      workspaceId,
      userId,
      'VIEW_WORKSPACE'
    );
    if (!hasAccess) {
      throw new Error('Access denied');
    }

    return prisma.workspaceMember.findMany({
      where: { workspaceId },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    });
  }
}

export const workspaceService = new WorkspaceService();
