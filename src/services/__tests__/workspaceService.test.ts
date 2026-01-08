import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { workspaceService, WorkspaceMemberRole } from '../workspaceService';
import { prisma } from '../../lib/prisma';

// Mock Prisma client
jest.mock('../../lib/prisma', () => ({
  prisma: {
    workspace: {
      create: jest.fn(),
      findMany: jest.fn(),
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      count: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
    todo: {
      count: jest.fn(),
    },
    workspaceList: {
      count: jest.fn(),
    },
  },
}));

describe('WorkspaceService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create a workspace with owner as member', async () => {
      const mockWorkspace = {
        id: 1,
        name: 'Test Workspace',
        description: 'Test Description',
        ownerId: 1,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workspace.create as jest.Mock).mockResolvedValue(mockWorkspace);

      const result = await workspaceService.create(
        {
          name: 'Test Workspace',
          description: 'Test Description',
        },
        1
      );

      expect(result).toEqual(mockWorkspace);
      expect(prisma.workspace.create).toHaveBeenCalledWith({
        data: {
          name: 'Test Workspace',
          description: 'Test Description',
          settings: null,
          ownerId: 1,
          members: {
            create: {
              userId: 1,
              role: WorkspaceMemberRole.OWNER,
              joinedAt: expect.any(Date),
            },
          },
        },
      });
    });

    it('should create a workspace with settings', async () => {
      const mockWorkspace = {
        id: 1,
        name: 'Test Workspace',
        description: null,
        ownerId: 1,
        settings: JSON.stringify({ theme: 'dark' }),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workspace.create as jest.Mock).mockResolvedValue(mockWorkspace);

      const result = await workspaceService.create(
        {
          name: 'Test Workspace',
          settings: { theme: 'dark' },
        },
        1
      );

      expect(result).toEqual(mockWorkspace);
    });
  });

  describe('getAllForUser', () => {
    it('should return all workspaces for a user', async () => {
      const mockMemberships = [
        {
          workspace: {
            id: 1,
            name: 'Workspace 1',
            description: null,
            ownerId: 1,
            settings: null,
            createdAt: new Date(),
            updatedAt: new Date(),
            members: [],
            _count: { todos: 5, lists: 2, members: 3 },
          },
        },
      ];

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMemberships);

      const result = await workspaceService.getAllForUser(1);

      expect(result).toHaveLength(1);
      expect(result[0]?.name).toBe('Workspace 1');
      expect(prisma.workspaceMember.findMany).toHaveBeenCalledWith({
        where: { userId: 1 },
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
    });
  });

  describe('getById', () => {
    it('should return workspace if user is a member', async () => {
      const mockWorkspace = {
        id: 1,
        name: 'Test Workspace',
        description: null,
        ownerId: 1,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
        members: [],
        _count: { todos: 5, lists: 2, members: 3 },
      };

      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(mockWorkspace);

      const result = await workspaceService.getById(1, 1);

      expect(result).toEqual(mockWorkspace);
    });

    it('should return null if workspace not found', async () => {
      (prisma.workspace.findFirst as jest.Mock).mockResolvedValue(null);

      const result = await workspaceService.getById(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('update', () => {
    it('should update workspace if user has permission', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.OWNER,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      const mockUpdatedWorkspace = {
        id: 1,
        name: 'Updated Workspace',
        description: 'Updated Description',
        ownerId: 1,
        settings: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.workspace.update as jest.Mock).mockResolvedValue(mockUpdatedWorkspace);

      const result = await workspaceService.update(1, 1, {
        name: 'Updated Workspace',
        description: 'Updated Description',
      });

      expect(result).toEqual(mockUpdatedWorkspace);
    });

    it('should throw error if user lacks permission', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.VIEWER,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);

      await expect(
        workspaceService.update(1, 1, { name: 'Updated' })
      ).rejects.toThrow('Insufficient permissions');
    });
  });

  describe('delete', () => {
    it('should delete workspace if user is owner', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.OWNER,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.workspace.delete as jest.Mock).mockResolvedValue({});

      const result = await workspaceService.delete(1, 1);

      expect(result).toBe(true);
      expect(prisma.workspace.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error if user is not owner', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.ADMIN,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);

      await expect(workspaceService.delete(1, 1)).rejects.toThrow('Only workspace owner');
    });
  });

  describe('addMember', () => {
    it('should add member if user has permission', async () => {
      const mockInviter = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.ADMIN,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      const mockUser = {
        id: 2,
        email: 'newmember@example.com',
        name: 'New Member',
      };

      const mockNewMember = {
        id: 2,
        workspaceId: 1,
        userId: 2,
        role: WorkspaceMemberRole.MEMBER,
        invitedAt: new Date(),
        joinedAt: null,
        invitedBy: 1,
      };

      (prisma.workspaceMember.findUnique as jest.Mock)
        .mockResolvedValueOnce(mockInviter) // For permission check
        .mockResolvedValueOnce(null); // For existing member check
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(mockUser);
      (prisma.workspaceMember.create as jest.Mock).mockResolvedValue(mockNewMember);

      const result = await workspaceService.addMember(
        1,
        { email: 'newmember@example.com' },
        1
      );

      expect(result).toEqual(mockNewMember);
    });

    it('should throw error if user not found', async () => {
      const mockInviter = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.ADMIN,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockInviter);
      (prisma.user.findUnique as jest.Mock).mockResolvedValue(null);

      await expect(
        workspaceService.addMember(1, { email: 'notfound@example.com' }, 1)
      ).rejects.toThrow('User not found');
    });
  });

  describe('getUserRole', () => {
    it('should return user role if member', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.ADMIN,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);

      const result = await workspaceService.getUserRole(1, 1);

      expect(result).toBe(WorkspaceMemberRole.ADMIN);
    });

    it('should return null if not a member', async () => {
      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(null);

      const result = await workspaceService.getUserRole(1, 1);

      expect(result).toBeNull();
    });
  });

  describe('getStats', () => {
    it('should return workspace statistics', async () => {
      const mockMember = {
        id: 1,
        workspaceId: 1,
        userId: 1,
        role: WorkspaceMemberRole.MEMBER,
        invitedAt: new Date(),
        joinedAt: new Date(),
        invitedBy: null,
      };

      (prisma.workspaceMember.findUnique as jest.Mock).mockResolvedValue(mockMember);
      (prisma.todo.count as jest.Mock)
        .mockResolvedValueOnce(10) // total todos
        .mockResolvedValueOnce(7); // completed todos
      (prisma.workspaceMember.count as jest.Mock).mockResolvedValue(5);
      (prisma.workspaceList.count as jest.Mock).mockResolvedValue(3);

      const result = await workspaceService.getStats(1, 1);

      expect(result).toEqual({
        totalTodos: 10,
        completedTodos: 7,
        completionRate: 70,
        totalMembers: 5,
        totalLists: 3,
      });
    });
  });
});
