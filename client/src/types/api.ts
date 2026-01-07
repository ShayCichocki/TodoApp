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

// Billing & Subscription Types

export type SubscriptionTier = 'FREE' | 'PRO' | 'TEAM';
export type SubscriptionStatus = 'ACTIVE' | 'CANCELLED' | 'PAST_DUE' | 'TRIALING' | 'EXPIRED';

export interface BillingHistory {
  id: number;
  subscriptionId: number;
  amount: number;
  currency: string;
  status: string;
  description: string;
  stripeInvoiceId?: string;
  stripeChargeId?: string;
  billingDate: string;
  paidAt?: string;
  createdAt: string;
}

export interface Subscription {
  id: number;
  userId: number;
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  stripeCustomerId?: string;
  stripeSubscriptionId?: string;
  stripePriceId?: string;
  currentPeriodStart: string;
  currentPeriodEnd?: string;
  cancelAtPeriodEnd: boolean;
  trialEndsAt?: string;
  createdAt: string;
  updatedAt: string;
  billingHistory?: BillingHistory[];
}

export interface TierLimits {
  maxTodos: number | null;
  maxCollaborators: number | null;
  maxTags: number | null;
  hasRecurringTasks: boolean;
  hasTimeTracking: boolean;
  hasCalendarIntegration: boolean;
  hasAdvancedNotifications: boolean;
  hasTemplates: boolean;
  hasAnalytics: boolean;
  hasApiAccess: boolean;
}

export interface TierConfig {
  name: string;
  price: number;
  billingPeriod: 'lifetime' | 'month';
  stripePriceId?: string;
  limits: TierLimits;
}

export interface TierConfigs {
  FREE: TierConfig;
  PRO: TierConfig;
  TEAM: TierConfig;
}

export interface LimitCheckResult {
  allowed: boolean;
  limit: number | null;
  remaining: number | null;
}

export interface UpgradeSubscriptionInput {
  tier: SubscriptionTier;
}
