import { Router, Request, Response } from 'express';
import { requireAuth } from '../middleware/auth';
import { requireFeature } from '../middleware/limitEnforcement';
import { templateService } from '../services/templateService';

const router: Router = Router();

/**
 * GET /api/templates
 * Get all templates accessible to current user
 */
router.get(
  '/',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const templates = await templateService.getAllForUser(req.user!.id);
      res.json(templates);
    } catch (error) {
      console.error('Error fetching templates:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/templates/:id
 * Get a specific template
 */
router.get(
  '/:id',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const template = await templateService.getById(id);

      if (!template) {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.json(template);
    } catch (error) {
      console.error('Error fetching template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/templates
 * Create a new template
 */
router.post(
  '/',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const {
        name,
        description,
        title,
        content,
        priority,
        categoryId,
        isPublic,
        variables,
      } = req.body;

      if (!name || !title || !content) {
        res
          .status(400)
          .json({ error: 'Missing required fields: name, title, content' });
        return;
      }

      const template = await templateService.create({
        name,
        description,
        title,
        content,
        priority,
        userId: req.user!.id,
        categoryId,
        isPublic: isPublic || false,
        variables,
      });

      res.status(201).json(template);
    } catch (error) {
      console.error('Error creating template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * PUT /api/templates/:id
 * Update a template
 */
router.put(
  '/:id',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const {
        name,
        description,
        title,
        content,
        priority,
        categoryId,
        isPublic,
      } = req.body;

      const updated = await templateService.update(id, req.user!.id, {
        name,
        description,
        title,
        content,
        priority,
        categoryId,
        isPublic,
      });

      res.json(updated);
    } catch (error) {
      console.error('Error updating template:', error);

      if ((error as any).code === 'P2025') {
        res
          .status(404)
          .json({ error: 'Template not found or you are not the owner' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * DELETE /api/templates/:id
 * Delete a template
 */
router.delete(
  '/:id',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const id = parseInt(req.params.id, 10);

    if (isNaN(id)) {
      res.status(400).json({ error: 'Invalid ID' });
      return;
    }

    try {
      const deleted = await templateService.delete(id, req.user!.id);

      if (!deleted) {
        res
          .status(404)
          .json({ error: 'Template not found or you are not the owner' });
        return;
      }

      res.status(204).send();
    } catch (error) {
      console.error('Error deleting template:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/templates/:id/instantiate
 * Create a todo from a template
 */
router.post(
  '/:id/instantiate',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request<{ id: string }>, res: Response): Promise<void> => {
    const templateId = parseInt(req.params.id, 10);

    if (isNaN(templateId)) {
      res.status(400).json({ error: 'Invalid template ID' });
      return;
    }

    try {
      const { variables, dueDate, listId } = req.body;

      if (!variables || typeof variables !== 'object') {
        res.status(400).json({ error: 'Variables object is required' });
        return;
      }

      const todo = await templateService.instantiate({
        templateId,
        userId: req.user!.id,
        variables,
        dueDate,
        listId,
      });

      res.status(201).json(todo);
    } catch (error) {
      console.error('Error instantiating template:', error);

      if ((error as Error).message === 'Template not found') {
        res.status(404).json({ error: 'Template not found' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * GET /api/templates/categories/all
 * Get all template categories
 */
router.get(
  '/categories/all',
  requireAuth,
  requireFeature('hasTemplates'),
  async (_req: Request, res: Response): Promise<void> => {
    try {
      const categories = await templateService.getAllCategories();
      res.json(categories);
    } catch (error) {
      console.error('Error fetching categories:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

/**
 * POST /api/templates/categories
 * Create a new category
 */
router.post(
  '/categories',
  requireAuth,
  requireFeature('hasTemplates'),
  async (req: Request, res: Response): Promise<void> => {
    try {
      const { name, description, icon, color } = req.body;

      if (!name) {
        res.status(400).json({ error: 'Name is required' });
        return;
      }

      const category = await templateService.createCategory({
        name,
        description,
        icon,
        color,
      });

      res.status(201).json(category);
    } catch (error) {
      console.error('Error creating category:', error);

      if ((error as any).code === 'P2002') {
        res
          .status(409)
          .json({ error: 'Category with this name already exists' });
        return;
      }

      res.status(500).json({ error: 'Internal server error' });
    }
  }
);

export default router;
