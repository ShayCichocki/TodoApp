import axios, { AxiosInstance } from 'axios';
import { HelloResponse, Todo, CreateTodoInput, UpdateTodoInput, Tag, CreateTagInput, User, RegisterInput, LoginInput, AuthResponse } from '../types/api';

const API_BASE_URL = import.meta.env.VITE_API_URL
  ? `${import.meta.env.VITE_API_URL}/api`
  : '/api';

const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
  withCredentials: true,
});

apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    const publicPaths = ['/', '/login', '/register'];
    const isPublicPath = publicPaths.includes(window.location.pathname);

    if (error.response?.status === 401 && !isPublicPath) {
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

export const api = {
  getHello: async (): Promise<string> => {
    const response = await apiClient.get<string>('/');
    return response.data;
  },

  getHelloById: async (id: string): Promise<HelloResponse> => {
    const response = await apiClient.get<HelloResponse>(`/${id}`);
    return response.data;
  },

  getTodos: async (): Promise<Todo[]> => {
    const response = await apiClient.get<Todo[]>('/todos');
    return response.data;
  },

  getTodoById: async (id: number): Promise<Todo> => {
    const response = await apiClient.get<Todo>(`/todos/${id}`);
    return response.data;
  },

  getDeletedTodos: async (): Promise<Todo[]> => {
    const response = await apiClient.get<Todo[]>('/todos/deleted');
    return response.data;
  },

  createTodo: async (todo: CreateTodoInput): Promise<Todo> => {
    const response = await apiClient.post<Todo>('/todos', todo);
    return response.data;
  },

  updateTodo: async (id: number, updates: UpdateTodoInput): Promise<Todo> => {
    const response = await apiClient.put<Todo>(`/todos/${id}`, updates);
    return response.data;
  },

  deleteTodo: async (id: number): Promise<void> => {
    await apiClient.delete(`/todos/${id}`);
  },

  restoreTodo: async (id: number): Promise<Todo> => {
    const response = await apiClient.post<Todo>(`/todos/${id}/restore`);
    return response.data;
  },

  getTags: async (): Promise<Tag[]> => {
    const response = await apiClient.get<Tag[]>('/tags');
    return response.data;
  },

  createTag: async (tag: CreateTagInput): Promise<Tag> => {
    const response = await apiClient.post<Tag>('/tags', tag);
    return response.data;
  },

  deleteTag: async (id: number): Promise<void> => {
    await apiClient.delete(`/tags/${id}`);
  },

  register: async (input: RegisterInput): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/register', input);
    return response.data;
  },

  login: async (input: LoginInput): Promise<AuthResponse> => {
    const response = await apiClient.post<AuthResponse>('/auth/login', input);
    return response.data;
  },

  logout: async (): Promise<void> => {
    await apiClient.post('/auth/logout');
  },

  getMe: async (): Promise<User> => {
    const response = await apiClient.get<AuthResponse>('/auth/me');
    return response.data.user;
  },
};

export default apiClient;
