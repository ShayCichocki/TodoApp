import { describe, it, expect, beforeEach, jest } from '@jest/globals';
import { commentService } from '../commentService';
import { prisma } from '../../lib/prisma';

jest.mock('../../lib/prisma', () => ({
  prisma: {
    comment: {
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
      findMany: jest.fn(),
      findUnique: jest.fn(),
    },
    workspaceMember: {
      findMany: jest.fn(),
    },
    todo: {
      findUnique: jest.fn(),
    },
    user: {
      findUnique: jest.fn(),
    },
  },
}));

describe('CommentService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('create', () => {
    it('should create comment with parsed mentions', async () => {
      const mockMembers = [
        {
          userId: 2,
          user: {
            id: 2,
            email: 'john@example.com',
            name: 'John Doe',
          },
        },
        {
          userId: 3,
          user: {
            id: 3,
            email: 'jane@example.com',
            name: 'Jane Smith',
          },
        },
      ];

      const mockComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'Hey @john@example.com, can you review this?',
        mentions: JSON.stringify([2]),
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await commentService.create({
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'Hey @john@example.com, can you review this?',
      });

      expect(result).toEqual(mockComment);
      expect(prisma.comment.create).toHaveBeenCalledWith({
        data: {
          todoId: 1,
          workspaceId: 1,
          authorId: 1,
          content: 'Hey @john@example.com, can you review this?',
          mentions: JSON.stringify([2]),
        },
      });
    });

    it('should create comment without mentions', async () => {
      const mockComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'This is a regular comment',
        mentions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([]);
      (prisma.comment.create as jest.Mock).mockResolvedValue(mockComment);

      const result = await commentService.create({
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'This is a regular comment',
      });

      expect(result).toEqual(mockComment);
    });
  });

  describe('update', () => {
    it('should update comment if user is author', async () => {
      const mockExistingComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'Old content',
        mentions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const mockUpdatedComment = {
        ...mockExistingComment,
        content: 'New content with @jane@example.com',
        mentions: JSON.stringify([3]),
      };

      const mockMembers = [
        {
          userId: 3,
          user: {
            id: 3,
            email: 'jane@example.com',
            name: 'Jane Smith',
          },
        },
      ];

      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockExistingComment);
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);
      (prisma.comment.update as jest.Mock).mockResolvedValue(mockUpdatedComment);

      const result = await commentService.update(1, 1, {
        content: 'New content with @jane@example.com',
      });

      expect(result).toEqual(mockUpdatedComment);
    });

    it('should throw error if user is not author', async () => {
      const mockComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 2,
        content: 'Test comment',
        mentions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);

      await expect(
        commentService.update(1, 1, { content: 'Updated' })
      ).rejects.toThrow('You can only edit your own comments');
    });
  });

  describe('delete', () => {
    it('should delete comment if user is author', async () => {
      const mockComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 1,
        content: 'Test comment',
        mentions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);
      (prisma.comment.delete as jest.Mock).mockResolvedValue(mockComment);

      const result = await commentService.delete(1, 1);

      expect(result).toBe(true);
      expect(prisma.comment.delete).toHaveBeenCalledWith({
        where: { id: 1 },
      });
    });

    it('should throw error if user is not author', async () => {
      const mockComment = {
        id: 1,
        todoId: 1,
        workspaceId: 1,
        authorId: 2,
        content: 'Test comment',
        mentions: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      (prisma.comment.findUnique as jest.Mock).mockResolvedValue(mockComment);

      await expect(commentService.delete(1, 1)).rejects.toThrow(
        'You can only delete your own comments'
      );
    });
  });

  describe('parseMentions', () => {
    it('should parse email mentions', async () => {
      const mockMembers = [
        {
          userId: 2,
          user: {
            id: 2,
            email: 'john@example.com',
            name: 'John Doe',
          },
        },
      ];

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      const result = await commentService.parseMentions(
        'Hey @john@example.com, check this out',
        1
      );

      expect(result).toEqual([2]);
    });

    it('should parse username mentions', async () => {
      const mockMembers = [
        {
          userId: 2,
          user: {
            id: 2,
            email: 'john@example.com',
            name: 'john',
          },
        },
      ];

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      const result = await commentService.parseMentions('Hey @john, check this out', 1);

      expect(result).toEqual([2]);
    });

    it('should parse multiple mentions', async () => {
      const mockMembers = [
        {
          userId: 2,
          user: {
            id: 2,
            email: 'john@example.com',
            name: 'John Doe',
          },
        },
        {
          userId: 3,
          user: {
            id: 3,
            email: 'jane@example.com',
            name: 'Jane Smith',
          },
        },
      ];

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      const result = await commentService.parseMentions(
        'Hey @john@example.com and @jane@example.com',
        1
      );

      expect(result).toEqual([2, 3]);
    });

    it('should return empty array if no mentions found', async () => {
      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue([]);

      const result = await commentService.parseMentions('This has no mentions', 1);

      expect(result).toEqual([]);
    });

    it('should deduplicate mentions', async () => {
      const mockMembers = [
        {
          userId: 2,
          user: {
            id: 2,
            email: 'john@example.com',
            name: 'John Doe',
          },
        },
      ];

      (prisma.workspaceMember.findMany as jest.Mock).mockResolvedValue(mockMembers);

      const result = await commentService.parseMentions(
        'Hey @john@example.com, @john@example.com',
        1
      );

      expect(result).toEqual([2]);
    });
  });

  describe('getCommentsForTodo', () => {
    it('should return all comments for a todo', async () => {
      const mockComments = [
        {
          id: 1,
          todoId: 1,
          workspaceId: 1,
          authorId: 1,
          content: 'First comment',
          mentions: null,
          createdAt: new Date(),
          updatedAt: new Date(),
          author: {
            id: 1,
            email: 'user@example.com',
            name: 'Test User',
          },
        },
      ];

      (prisma.comment.findMany as jest.Mock).mockResolvedValue(mockComments);

      const result = await commentService.getCommentsForTodo(1);

      expect(result).toEqual(mockComments);
      expect(prisma.comment.findMany).toHaveBeenCalledWith({
        where: { todoId: 1 },
        include: {
          author: {
            select: {
              id: true,
              email: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'asc' },
      });
    });
  });
});
