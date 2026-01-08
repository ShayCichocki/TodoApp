import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature, checkLimit } from '../middleware/limitEnforcement';
import { validateBody } from '../middleware/validate';
import { workspaceService } from '../services/workspaceService';
import { activityService } from '../services/activityService';
import { commentService } from '../services/commentService';
import { todoService } from '../services/todoService';
import {
  CreateWorkspaceSchema,
  UpdateWorkspaceSchema,
  AddMemberSchema,
  UpdateMemberRoleSchema,
  CreateCommentSchema,
  UpdateCommentSchema,
} from '../schemas/workspaceSchemas';

const router: Router = Router();

// All workspace routes require authentication and hasWorkspaces feature
router.use(requireAuth);
router.use(requireFeature('hasWorkspaces'));

/**
 * GET /api/workspaces
 * List all user's workspaces
 */
router.get('/', async (req: Request, res: Response): Promise<void> => {
  try {
    const workspaces = await workspaceService.getAllForUser(req.user!.id);
    res.json(workspaces);
  } catch (error) {
    console.error('Error getting workspaces:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces
 * Create a new workspace
 */
router.post(
  '/',
  checkLimit('workspaces'),
  validateBody(CreateWorkspaceSchema),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const workspace = await workspaceService.create(req.body, req.user!.id);
      res.status(201).json(workspace);
    } catch (error) {
      console.error('Error creating workspace:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/workspaces/:id
 * Get workspace details
 */
router.get('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    const workspace = await workspaceService.getById(id, req.user!.id);
    if (!workspace) {
      res.status(404).json({ error: 'Workspace not found' });
      return;
    }

    res.json(workspace);
  } catch (error) {
    console.error('Error getting workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/workspaces/:id
 * Update workspace
 */
router.put(
  '/:id',
  validateBody(UpdateWorkspaceSchema),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workspace ID' });
      return;
    }

    try {
      const updated = await workspaceService.update(id, req.user!.id, req.body);
      res.json(updated);
    } catch (error) {
      if ((error as Error).message.includes('permission')) {
        res.status(403).json({ error: (error as Error).message });
        return;
      }
      console.error('Error updating workspace:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/workspaces/:id
 * Delete workspace (owner only)
 */
router.delete('/:id', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    await workspaceService.delete(id, req.user!.id);
    res.status(204).send();
  } catch (error) {
    if ((error as Error).message.includes('owner')) {
      res.status(403).json({ error: (error as Error).message });
      return;
    }
    console.error('Error deleting workspace:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workspaces/:id/stats
 * Get workspace statistics
 */
router.get('/:id/stats', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    const stats = await workspaceService.getStats(id, req.user!.id);
    res.json(stats);
  } catch (error) {
    if ((error as Error).message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    console.error('Error getting workspace stats:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workspaces/:id/members
 * List workspace members
 */
router.get('/:id/members', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    const members = await workspaceService.getMembers(id, req.user!.id);
    res.json(members);
  } catch (error) {
    if ((error as Error).message === 'Access denied') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    console.error('Error getting workspace members:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces/:id/members
 * Add member to workspace (owner/admin only)
 */
router.post(
  '/:id/members',
  checkLimit('workspaceMembers'),
  validateBody(AddMemberSchema),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid workspace ID' });
      return;
    }

    try {
      const member = await workspaceService.addMember(id, req.body, req.user!.id);

      // Log activity
      await activityService.logMemberAdded(
        id,
        req.user!.id,
        req.body.email,
        req.body.role ?? 'MEMBER'
      );

      res.status(201).json(member);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('permission')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found') || message.includes('already a member')) {
        res.status(400).json({ error: message });
        return;
      }
      console.error('Error adding member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/workspaces/:id/members/:memberId
 * Update member role (owner/admin only)
 */
router.put(
  '/:id/members/:memberId',
  validateBody(UpdateMemberRoleSchema),
  async (req: Request<{ id: string; memberId: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    if (isNaN(id) || isNaN(memberId)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const updated = await workspaceService.updateMemberRole(
        id,
        memberId,
        req.body.role,
        req.user!.id
      );

      // Log activity (would need to fetch old role first for proper logging)
      await activityService.logMemberRoleChanged(
        id,
        req.user!.id,
        updated.userId.toString(), // Would need to fetch user email
        'OLD_ROLE',
        req.body.role
      );

      res.json(updated);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('permission') || message.includes('owner')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error updating member role:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/workspaces/:id/members/:memberId
 * Remove member from workspace (owner/admin only) or leave workspace
 */
router.delete(
  '/:id/members/:memberId',
  async (req: Request<{ id: string; memberId: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const memberId = parseInt(req.params.memberId, 10);

    if (isNaN(id) || isNaN(memberId)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      await workspaceService.removeMember(id, memberId, req.user!.id);

      // Log activity
      await activityService.logMemberRemoved(
        id,
        req.user!.id,
        'MEMBER_EMAIL' // Would need to fetch member email
      );

      res.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('permission') || message.includes('owner')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error removing member:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/workspaces/invitations/pending
 * Get user's pending invitations
 */
router.get('/invitations/pending', async (req: Request, res: Response): Promise<void> => {
  try {
    const invitations = await workspaceService.getPendingInvitations(req.user!.id);
    res.json(invitations);
  } catch (error) {
    console.error('Error getting pending invitations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces/invitations/:id/accept
 * Accept workspace invitation
 */
router.post(
  '/invitations/:id/accept',
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid invitation ID' });
      return;
    }

    try {
      const member = await workspaceService.acceptInvitation(id, req.user!.id);
      res.json(member);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('not found') || message.includes('not for you') || message.includes('already accepted')) {
        res.status(400).json({ error: message });
        return;
      }
      console.error('Error accepting invitation:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/workspaces/:id/todos
 * Get workspace todos (with filters)
 */
router.get('/:id/todos', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    const filters = {
      assignedToMe: req.query['assignedToMe'] === 'true',
      assignedToOthers: req.query['assignedToOthers'] === 'true',
      unassigned: req.query['unassigned'] === 'true',
      listId: req.query['listId'] ? parseInt(req.query['listId'] as string, 10) : undefined,
      completed: req.query['completed'] ? req.query['completed'] === 'true' : undefined,
    };

    const todos = await todoService.getAllForWorkspace(id, req.user!.id, filters);
    res.json(todos);
  } catch (error) {
    if ((error as Error).message === 'Access denied to workspace') {
      res.status(403).json({ error: 'Access denied' });
      return;
    }
    console.error('Error getting workspace todos:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/workspaces/:id/todos/:todoId/assign
 * Assign todo to member
 */
router.post(
  '/:id/todos/:todoId/assign',
  async (req: Request<{ id: string; todoId: string }>, res: Response): Promise<void> => {
    const todoId = parseInt(req.params.todoId, 10);
    const assigneeId = req.body.assigneeId;

    if (isNaN(todoId) || typeof assigneeId !== 'number') {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const todo = await todoService.assignTodo(todoId, assigneeId, req.user!.id);

      // Log activity
      if (todo.workspaceId && todo.assignedTo) {
        await activityService.logTodoAssigned(
          todo.workspaceId,
          req.user!.id,
          todoId,
          todo.title,
          todo.assignedTo.name ?? todo.assignedTo.email
        );
      }

      res.json(todo);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('permission') || message.includes('member')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error assigning todo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/workspaces/:id/todos/:todoId/assign
 * Unassign todo
 */
router.delete(
  '/:id/todos/:todoId/assign',
  async (req: Request<{ id: string; todoId: string }>, res: Response): Promise<void> => {
    const todoId = parseInt(req.params.todoId, 10);

    if (isNaN(todoId)) {
      res.status(400).json({ error: 'Invalid todo ID' });
      return;
    }

    try {
      const todo = await todoService.unassignTodo(todoId, req.user!.id);
      res.json(todo);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('permission')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error unassigning todo:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/workspaces/:id/activity
 * Get activity feed for workspace
 */
router.get('/:id/activity', async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid workspace ID' });
    return;
  }

  try {
    const limit = req.query['limit'] ? parseInt(req.query['limit'] as string, 10) : 50;
    const offset = req.query['offset'] ? parseInt(req.query['offset'] as string, 10) : 0;

    const result = await activityService.getActivityFeed(id, { limit, offset });
    res.json(result);
  } catch (error) {
    console.error('Error getting activity feed:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/workspaces/:id/todos/:todoId/comments
 * Get comments for a todo
 */
router.get(
  '/:id/todos/:todoId/comments',
  async (req: Request<{ id: string; todoId: string }>, res: Response): Promise<void> => {
    const todoId = parseInt(req.params.todoId, 10);

    if (isNaN(todoId)) {
      res.status(400).json({ error: 'Invalid todo ID' });
      return;
    }

    try {
      const comments = await commentService.getCommentsForTodo(todoId);
      res.json(comments);
    } catch (error) {
      console.error('Error getting comments:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/workspaces/:id/todos/:todoId/comments
 * Add comment to todo
 */
router.post(
  '/:id/todos/:todoId/comments',
  validateBody(CreateCommentSchema),
  async (req: Request<{ id: string; todoId: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);
    const todoId = parseInt(req.params.todoId, 10);

    if (isNaN(id) || isNaN(todoId)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const comment = await commentService.create({
        todoId,
        workspaceId: id,
        authorId: req.user!.id,
        content: req.body.content,
      });

      // Log activity
      const todo = await todoService.getByIdForUser(todoId, req.user!.id);
      if (todo) {
        await activityService.logCommentPosted(
          id,
          req.user!.id,
          todoId,
          todo.title,
          comment.id
        );
      }

      res.status(201).json(comment);
    } catch (error) {
      console.error('Error creating comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/workspaces/:id/comments/:commentId
 * Edit comment
 */
router.put(
  '/:id/comments/:commentId',
  validateBody(UpdateCommentSchema),
  async (req: Request<{ id: string; commentId: string }>, res: Response): Promise<void> => {
    const commentId = parseInt(req.params.commentId, 10);

    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid comment ID' });
      return;
    }

    try {
      const comment = await commentService.update(commentId, req.user!.id, req.body);
      res.json(comment);
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('only edit your own')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error updating comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/workspaces/:id/comments/:commentId
 * Delete comment
 */
router.delete(
  '/:id/comments/:commentId',
  async (req: Request<{ id: string; commentId: string }>, res: Response): Promise<void> => {
    const commentId = parseInt(req.params.commentId, 10);

    if (isNaN(commentId)) {
      res.status(400).json({ error: 'Invalid comment ID' });
      return;
    }

    try {
      await commentService.delete(commentId, req.user!.id);
      res.status(204).send();
    } catch (error) {
      const message = (error as Error).message;
      if (message.includes('only delete your own')) {
        res.status(403).json({ error: message });
        return;
      }
      if (message.includes('not found')) {
        res.status(404).json({ error: message });
        return;
      }
      console.error('Error deleting comment:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
