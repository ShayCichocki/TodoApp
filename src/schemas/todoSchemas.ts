import { z } from 'zod';

export const PrioritySchema = z.enum(['LOW', 'MEDIUM', 'HIGH', 'URGENT']);

export const CreateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less'),
  description: z.string().max(500, 'Description must be 500 characters or less'),
  dueDate: z.string().datetime('Invalid date format'),
  isComplete: z.boolean(),
  priority: PrioritySchema.optional().default('MEDIUM'),
  tagIds: z.array(z.number()).optional(),
});

export const UpdateTodoSchema = z.object({
  title: z.string().min(1, 'Title is required').max(100, 'Title must be 100 characters or less').optional(),
  description: z.string().max(500, 'Description must be 500 characters or less').optional(),
  dueDate: z.string().datetime('Invalid date format').optional(),
  isComplete: z.boolean().optional(),
  priority: PrioritySchema.optional(),
  tagIds: z.array(z.number()).optional(),
});

export const CreateTagSchema = z.object({
  name: z.string().min(1, 'Name is required').max(50, 'Name must be 50 characters or less'),
  color: z.string().regex(/^#[0-9A-Fa-f]{6}$/, 'Color must be a valid hex color').optional(),
});

export const TodoParamsSchema = z.object({
  id: z.string().regex(/^\d+$/, 'ID must be a number'),
});

export type CreateTodoInput = z.infer<typeof CreateTodoSchema>;
export type UpdateTodoInput = z.infer<typeof UpdateTodoSchema>;
export type CreateTagInput = z.infer<typeof CreateTagSchema>;
export type TodoParams = z.infer<typeof TodoParamsSchema>;
