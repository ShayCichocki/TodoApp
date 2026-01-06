import { useQuery, useMutation, useQueryClient, UseQueryResult } from '@tanstack/react-query';
import { api } from '../lib/api';
import { HelloResponse, Todo, UpdateTodoInput, Tag } from '../types/api';

export const useHello = (): UseQueryResult<string, Error> => {
  return useQuery({
    queryKey: ['hello'],
    queryFn: api.getHello,
  });
};

export const useHelloById = (
  id: string,
  enabled = true
): UseQueryResult<HelloResponse, Error> => {
  return useQuery({
    queryKey: ['hello', id],
    queryFn: () => api.getHelloById(id),
    enabled: enabled && id.length > 0,
  });
};

export const useTodos = (): UseQueryResult<Todo[], Error> => {
  return useQuery({
    queryKey: ['todos'],
    queryFn: api.getTodos,
  });
};

export const useTodoById = (id: number): UseQueryResult<Todo, Error> => {
  return useQuery({
    queryKey: ['todos', id],
    queryFn: () => api.getTodoById(id),
    enabled: id > 0,
  });
};

export const useCreateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useUpdateTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ id, updates }: { id: number; updates: UpdateTodoInput }) =>
      api.updateTodo(id, updates),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useDeleteTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['deletedTodos'] });
    },
  });
};

export const useDeletedTodos = (): UseQueryResult<Todo[], Error> => {
  return useQuery({
    queryKey: ['deletedTodos'],
    queryFn: api.getDeletedTodos,
  });
};

export const useRestoreTodo = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.restoreTodo,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['deletedTodos'] });
    },
  });
};

export const useTags = (): UseQueryResult<Tag[], Error> => {
  return useQuery({
    queryKey: ['tags'],
    queryFn: api.getTags,
  });
};

export const useCreateTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.createTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
    },
  });
};

export const useDeleteTag = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: api.deleteTag,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['tags'] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};
