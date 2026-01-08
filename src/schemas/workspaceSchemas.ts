import { z } from 'zod';
import { WorkspaceMemberRole } from '@prisma/client';

export const CreateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const UpdateWorkspaceSchema = z.object({
  name: z.string().min(1).max(100).optional(),
  description: z.string().max(500).optional(),
  settings: z.record(z.unknown()).optional(),
});

export const AddMemberSchema = z.object({
  email: z.string().email(),
  role: z.nativeEnum(WorkspaceMemberRole).optional(),
});

export const UpdateMemberRoleSchema = z.object({
  role: z.nativeEnum(WorkspaceMemberRole),
});

export const CreateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});

export const UpdateCommentSchema = z.object({
  content: z.string().min(1).max(5000),
});
