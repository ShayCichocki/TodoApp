import { prisma } from '../lib/prisma';
import { Comment, User } from '@prisma/client';

export type CreateCommentInput = {
  todoId: number;
  workspaceId: number;
  authorId: number;
  content: string;
};

export type UpdateCommentInput = {
  content: string;
};

export type CommentWithAuthor = Comment & {
  author: Pick<User, 'id' | 'email' | 'name'>;
};

class CommentService {
  /**
   * Create a new comment
   */
  async create(input: CreateCommentInput): Promise<Comment> {
    // Parse mentions from content
    const mentionedUserIds = await this.parseMentions(
      input.content,
      input.workspaceId
    );

    const comment = await prisma.comment.create({
      data: {
        todoId: input.todoId,
        workspaceId: input.workspaceId,
        authorId: input.authorId,
        content: input.content,
        mentions: mentionedUserIds.length
          ? JSON.stringify(mentionedUserIds)
          : null,
      },
    });

    // Notify mentioned users (stubbed for now)
    if (mentionedUserIds.length > 0) {
      await this.notifyMentionedUsers(comment, mentionedUserIds);
    }

    return comment;
  }

  /**
   * Update a comment
   */
  async update(
    commentId: number,
    userId: number,
    input: UpdateCommentInput
  ): Promise<Comment> {
    // Check if user is the author
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('You can only edit your own comments');
    }

    // Parse mentions from updated content
    const mentionedUserIds = await this.parseMentions(
      input.content,
      comment.workspaceId
    );

    const updated = await prisma.comment.update({
      where: { id: commentId },
      data: {
        content: input.content,
        mentions: mentionedUserIds.length
          ? JSON.stringify(mentionedUserIds)
          : null,
      },
    });

    // Notify newly mentioned users
    if (mentionedUserIds.length > 0) {
      const oldMentions = comment.mentions
        ? (JSON.parse(comment.mentions) as number[])
        : [];
      const newMentions = mentionedUserIds.filter(
        (id) => !oldMentions.includes(id)
      );
      if (newMentions.length > 0) {
        await this.notifyMentionedUsers(updated, newMentions);
      }
    }

    return updated;
  }

  /**
   * Delete a comment
   */
  async delete(commentId: number, userId: number): Promise<boolean> {
    const comment = await prisma.comment.findUnique({
      where: { id: commentId },
    });

    if (!comment) {
      throw new Error('Comment not found');
    }

    if (comment.authorId !== userId) {
      throw new Error('You can only delete your own comments');
    }

    await prisma.comment.delete({
      where: { id: commentId },
    });

    return true;
  }

  /**
   * Get all comments for a todo
   */
  async getCommentsForTodo(todoId: number): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: { todoId },
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
  }

  /**
   * Parse @mentions from comment content
   * Supports patterns like @email@domain.com or @username
   */
  async parseMentions(
    content: string,
    workspaceId: number
  ): Promise<number[]> {
    // Match @email@domain.com or @word patterns
    const mentionPattern = /@([\w.+-]+@[\w.-]+|[\w]+)/g;
    const matches = Array.from(content.matchAll(mentionPattern));

    if (matches.length === 0) {
      return [];
    }

    // Extract unique identifiers (emails or usernames)
    const identifiers = [
      ...new Set(matches.map((match) => match[1] ?? '').filter(Boolean)),
    ];

    // Get workspace members
    const members = await prisma.workspaceMember.findMany({
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
    });

    // Resolve identifiers to user IDs
    const userIds: number[] = [];
    for (const identifier of identifiers) {
      // Check if it's an email
      if (identifier.includes('@')) {
        const member = members.find(
          (m) => m.user.email.toLowerCase() === identifier.toLowerCase()
        );
        if (member) {
          userIds.push(member.userId);
        }
      } else {
        // Try to match by name
        const member = members.find(
          (m) =>
            m.user.name?.toLowerCase() === identifier.toLowerCase() ||
            m.user.email.toLowerCase().startsWith(identifier.toLowerCase())
        );
        if (member) {
          userIds.push(member.userId);
        }
      }
    }

    // Return unique user IDs
    return [...new Set(userIds)];
  }

  /**
   * Notify mentioned users
   * This is stubbed - in production would integrate with notification service
   */
  private async notifyMentionedUsers(
    comment: Comment,
    mentionedUserIds: number[]
  ): Promise<void> {
    // Get todo details for context
    const todo = await prisma.todo.findUnique({
      where: { id: comment.todoId },
      select: { title: true },
    });

    // Get author details
    const author = await prisma.user.findUnique({
      where: { id: comment.authorId },
      select: { name: true, email: true },
    });

    // In production, this would:
    // 1. Create in-app notifications
    // 2. Send email notifications (if user preferences allow)
    // 3. Send push notifications (if enabled)

    // For now, just log (stub implementation)
    console.log('Mention notifications:', {
      commentId: comment.id,
      todoTitle: todo?.title,
      authorName: author?.name ?? author?.email,
      mentionedUserCount: mentionedUserIds.length,
      mentionedUserIds,
    });

    // TODO: Integrate with actual notification service when implemented
    // await notificationService.createMentionNotifications(...)
  }

  /**
   * Get comments by user (for activity tracking)
   */
  async getCommentsByUser(
    userId: number,
    workspaceId: number,
    limit = 50
  ): Promise<CommentWithAuthor[]> {
    return prisma.comment.findMany({
      where: {
        authorId: userId,
        workspaceId,
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    });
  }

  /**
   * Get comments where user was mentioned
   */
  async getMentionedComments(
    userId: number,
    workspaceId: number,
    limit = 50
  ): Promise<CommentWithAuthor[]> {
    // Find all comments where user is mentioned
    const comments = await prisma.comment.findMany({
      where: {
        workspaceId,
        mentions: {
          not: null,
        },
      },
      include: {
        author: {
          select: {
            id: true,
            email: true,
            name: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit * 2, // Fetch more to account for filtering
    });

    // Filter to only comments where this user is mentioned
    const filtered = comments.filter((comment) => {
      if (!comment.mentions) return false;
      const mentionedIds = JSON.parse(comment.mentions) as number[];
      return mentionedIds.includes(userId);
    });

    return filtered.slice(0, limit);
  }
}

export const commentService = new CommentService();
