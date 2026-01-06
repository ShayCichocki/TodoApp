export interface HelloResponse {
  message: string;
}

export interface ApiError {
  error: string;
  message?: string;
}

export interface User {
  id: number;
  email: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterInput {
  email: string;
  password: string;
}

export interface LoginInput {
  email: string;
  password: string;
}

export interface AuthResponse {
  user: User;
}

export type Priority = 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT';

export interface Tag {
  id: number;
  name: string;
  color?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TodoTag {
  tag: Tag;
  assignedAt: string;
}

export interface Todo {
  id: number;
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
  priority: Priority;
  userId: number;
  deletedAt: string | null;
  createdAt: string;
  updatedAt: string;
  tags: TodoTag[];
}

export interface CreateTodoInput {
  title: string;
  description: string;
  dueDate: string;
  isComplete: boolean;
  priority?: Priority;
  tagIds?: number[];
}

export interface UpdateTodoInput {
  title?: string;
  description?: string;
  dueDate?: string;
  isComplete?: boolean;
  priority?: Priority;
  tagIds?: number[];
}

export interface CreateTagInput {
  name: string;
  color?: string;
}
