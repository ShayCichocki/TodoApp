import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export interface Comment {
  id: number;
  todoId: number;
  workspaceId: number;
  authorId: number;
  content: string;
  mentions: string | null;
  createdAt: string;
  updatedAt: string;
  author: {
    id: number;
    email: string;
    name: string | null;
  };
}

export interface CreateCommentInput {
  content: string;
}

export interface UpdateCommentInput {
  content: string;
}

/**
 * Get comments for a todo
 */
export const useComments = (workspaceId: number, todoId: number) => {
  return useQuery<Comment[]>({
    queryKey: ['workspaces', workspaceId, 'todos', todoId, 'comments'],
    queryFn: async () => {
      const response = await api.get<Comment[]>(
        `/api/workspaces/${workspaceId}/todos/${todoId}/comments`
      );
      return response.data;
    },
    enabled: workspaceId > 0 && todoId > 0,
  });
};

/**
 * Create a comment
 */
export const useCreateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      todoId,
      input,
    }: {
      workspaceId: number;
      todoId: number;
      input: CreateCommentInput;
    }) => {
      const response = await api.post<Comment>(
        `/api/workspaces/${workspaceId}/todos/${todoId}/comments`,
        input
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'todos', variables.todoId, 'comments'],
      });
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'activity'],
      });
    },
  });
};

/**
 * Update a comment
 */
export const useUpdateComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      commentId,
      input,
    }: {
      workspaceId: number;
      commentId: number;
      input: UpdateCommentInput;
    }) => {
      const response = await api.put<Comment>(
        `/api/workspaces/${workspaceId}/comments/${commentId}`,
        input
      );
      return response.data;
    },
    onSuccess: (data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'todos', data.todoId, 'comments'],
      });
    },
  });
};

/**
 * Delete a comment
 */
export const useDeleteComment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      todoId,
      commentId,
    }: {
      workspaceId: number;
      todoId: number;
      commentId: number;
    }) => {
      await api.delete(`/api/workspaces/${workspaceId}/comments/${commentId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({
        queryKey: ['workspaces', variables.workspaceId, 'todos', variables.todoId, 'comments'],
      });
    },
  });
};
