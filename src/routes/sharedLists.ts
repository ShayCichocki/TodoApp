import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { sharedListService, CollaboratorRole } from '../services/sharedListService';
import { userService } from '../services/userService';

const router: Router = Router();

/**
 * GET /api/shared-lists
 * Get all lists accessible by current user
 */
router.get('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const lists = await sharedListService.getAllForUser(req.user!.id);
    res.json(lists);
  } catch (error) {
    console.error('Error fetching shared lists:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/shared-lists/:id
 * Get a specific shared list
 */
router.get('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const list = await sharedListService.getById(id, req.user!.id);

    if (!list) {
      res.status(404).json({ error: 'List not found or access denied' });
      return;
    }

    res.json(list);
  } catch (error) {
    console.error('Error fetching shared list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shared-lists
 * Create a new shared list
 */
router.post('/', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const { name, description, color } = req.body;

    if (!name) {
      res.status(400).json({ error: 'Name is required' });
      return;
    }

    const list = await sharedListService.create({
      name,
      description,
      color,
      ownerId: req.user!.id,
    });

    res.status(201).json(list);
  } catch (error) {
    console.error('Error creating shared list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/shared-lists/:id
 * Update a shared list (owner only)
 */
router.put('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const { name, description, color } = req.body;

    const updated = await sharedListService.update(id, req.user!.id, {
      name,
      description,
      color,
    });

    res.json(updated);
  } catch (error) {
    console.error('Error updating shared list:', error);

    if ((error as any).code === 'P2025') {
      res.status(404).json({ error: 'List not found or you are not the owner' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/shared-lists/:id
 * Delete a shared list (owner only)
 */
router.delete('/:id', requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const id = parseInt(req.params.id, 10);

  if (isNaN(id)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const deleted = await sharedListService.delete(id, req.user!.id);

    if (!deleted) {
      res.status(404).json({ error: 'List not found or you are not the owner' });
      return;
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting shared list:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shared-lists/:id/collaborators
 * Add a collaborator to a list (owner only)
 */
router.post('/:id/collaborators', requireAuth, async (req: Request<{ id: string }>, res: Response): Promise<void> => {
  const listId = parseInt(req.params.id, 10);

  if (isNaN(listId)) {
    res.status(400).json({ error: 'Invalid list ID' });
    return;
  }

  try {
    const { email, role } = req.body;

    if (!email) {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    // Check if user is owner
    const list = await sharedListService.getById(listId, req.user!.id);
    if (!list || list.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Only the owner can add collaborators' });
      return;
    }

    // Find user by email
    const collaboratorUser = await userService.findByEmail(email);
    if (!collaboratorUser) {
      res.status(404).json({ error: 'User not found' });
      return;
    }

    // Don't allow owner to add themselves
    if (collaboratorUser.id === req.user!.id) {
      res.status(400).json({ error: 'Cannot add yourself as a collaborator' });
      return;
    }

    // Add collaborator
    const collaborator = await sharedListService.addCollaborator({
      listId,
      userId: collaboratorUser.id,
      role: role || CollaboratorRole.VIEWER,
    });

    res.status(201).json(collaborator);
  } catch (error) {
    console.error('Error adding collaborator:', error);

    if ((error as any).code === 'P2002') {
      res.status(409).json({ error: 'User is already a collaborator on this list' });
      return;
    }

    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * PUT /api/shared-lists/:listId/collaborators/:collabId
 * Update collaborator role (owner only)
 */
router.put('/:listId/collaborators/:collabId', requireAuth, async (req: Request<{ listId: string; collabId: string }>, res: Response): Promise<void> => {
  const listId = parseInt(req.params.listId, 10);
  const collabId = parseInt(req.params.collabId, 10);

  if (isNaN(listId) || isNaN(collabId)) {
    res.status(400).json({ error: 'Invalid IDs' });
    return;
  }

  try {
    const { role } = req.body;

    if (!role || !Object.values(CollaboratorRole).includes(role)) {
      res.status(400).json({ error: 'Valid role is required' });
      return;
    }

    // Check if user is owner
    const list = await sharedListService.getById(listId, req.user!.id);
    if (!list || list.ownerId !== req.user!.id) {
      res.status(403).json({ error: 'Only the owner can update collaborator roles' });
      return;
    }

    const updated = await sharedListService.updateCollaboratorRole(collabId, role);
    res.json(updated);
  } catch (error) {
    console.error('Error updating collaborator role:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * DELETE /api/shared-lists/:listId/collaborators/:collabId
 * Remove a collaborator (owner or the collaborator themselves)
 */
router.delete('/:listId/collaborators/:collabId', requireAuth, async (req: Request<{ listId: string; collabId: string }>, res: Response): Promise<void> => {
  const listId = parseInt(req.params.listId, 10);
  const collabId = parseInt(req.params.collabId, 10);

  if (isNaN(listId) || isNaN(collabId)) {
    res.status(400).json({ error: 'Invalid IDs' });
    return;
  }

  try {
    const list = await sharedListService.getById(listId, req.user!.id);
    if (!list) {
      res.status(404).json({ error: 'List not found' });
      return;
    }

    // Check permissions: owner can remove anyone, collaborator can remove themselves
    const collaborator = list.collaborators.find((c) => c.id === collabId);
    if (!collaborator) {
      res.status(404).json({ error: 'Collaborator not found' });
      return;
    }

    const isOwner = list.ownerId === req.user!.id;
    const isSelf = collaborator.userId === req.user!.id;

    if (!isOwner && !isSelf) {
      res.status(403).json({ error: 'You can only remove yourself or you must be the owner' });
      return;
    }

    await sharedListService.removeCollaborator(collabId);
    res.status(204).send();
  } catch (error) {
    console.error('Error removing collaborator:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * GET /api/shared-lists/invitations/pending
 * Get pending invitations for current user
 */
router.get('/invitations/pending', requireAuth, async (req: Request, res: Response): Promise<void> => {
  try {
    const invitations = await sharedListService.getPendingInvitations(req.user!.id);
    res.json(invitations);
  } catch (error) {
    console.error('Error fetching pending invitations:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * POST /api/shared-lists/invitations/:collabId/accept
 * Accept a collaboration invitation
 */
router.post('/invitations/:collabId/accept', requireAuth, async (req: Request<{ collabId: string }>, res: Response): Promise<void> => {
  const collabId = parseInt(req.params.collabId, 10);

  if (isNaN(collabId)) {
    res.status(400).json({ error: 'Invalid ID' });
    return;
  }

  try {
    const accepted = await sharedListService.acceptInvitation(collabId, req.user!.id);
    res.json(accepted);
  } catch (error) {
    console.error('Error accepting invitation:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
