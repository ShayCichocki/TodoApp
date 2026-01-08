import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Workspace {
  id: number;
  name: string;
  description: string | null;
  ownerId: number;
  settings: string | null;
  createdAt: string;
  updatedAt: string;
  members: WorkspaceMemberWithUser[];
  _count?: {
    todos: number;
    lists: number;
    members: number;
  };
}

export interface WorkspaceMemberWithUser {
  id: number;
  workspaceId: number;
  userId: number;
  role: WorkspaceMemberRole;
  invitedAt: string;
  joinedAt: string | null;
  invitedBy: number | null;
  user: {
    id: number;
    email: string;
    name: string | null;
  };
}

export type WorkspaceMemberRole = 'OWNER' | 'ADMIN' | 'MEMBER' | 'VIEWER';

export interface CreateWorkspaceInput {
  name: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface UpdateWorkspaceInput {
  name?: string;
  description?: string;
  settings?: Record<string, unknown>;
}

export interface WorkspaceStats {
  totalTodos: number;
  completedTodos: number;
  completionRate: number;
  totalMembers: number;
  totalLists: number;
}

/**
 * Get all workspaces for the current user
 */
export const useWorkspaces = () => {
  return useQuery<Workspace[]>({
    queryKey: ['workspaces'],
    queryFn: async () => {
      const response = await api.get<Workspace[]>('/api/workspaces');
      return response.data;
    },
  });
};

/**
 * Get a specific workspace by ID
 */
export const useWorkspace = (id: number) => {
  return useQuery<Workspace>({
    queryKey: ['workspaces', id],
    queryFn: async () => {
      const response = await api.get<Workspace>(`/api/workspaces/${id}`);
      return response.data;
    },
    enabled: id > 0,
  });
};

/**
 * Create a new workspace
 */
export const useCreateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (input: CreateWorkspaceInput) => {
      const response = await api.post<Workspace>('/api/workspaces', input);
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

/**
 * Update a workspace
 */
export const useUpdateWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateWorkspaceInput }) => {
      const response = await api.put<Workspace>(`/api/workspaces/${id}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', data.id] });
    },
  });
};

/**
 * Delete a workspace
 */
export const useDeleteWorkspace = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/workspaces/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};

/**
 * Get workspace statistics
 */
export const useWorkspaceStats = (id: number) => {
  return useQuery<WorkspaceStats>({
    queryKey: ['workspaces', id, 'stats'],
    queryFn: async () => {
      const response = await api.get<WorkspaceStats>(`/api/workspaces/${id}/stats`);
      return response.data;
    },
    enabled: id > 0,
  });
};
