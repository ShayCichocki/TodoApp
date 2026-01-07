import { useQuery } from '@tanstack/react-query';
import { api } from '../lib/api';
import { TierLimits } from '../types/api';

export function useLimits() {
  return useQuery({
    queryKey: ['limits'],
    queryFn: api.getLimits,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

export function useSubscription() {
  return useQuery({
    queryKey: ['subscription'],
    queryFn: api.getSubscription,
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
}

interface UsageCheck {
  canCreate: boolean;
  limit: number | null;
  current: number;
  remaining: number | null;
  percentage: number;
  isNearLimit: boolean; // >= 80%
  isAtLimit: boolean; // >= 100%
}

export function useUsageCheck(
  resourceType: 'todos' | 'tags',
  currentCount: number,
  limits?: TierLimits
): UsageCheck {
  if (!limits) {
    return {
      canCreate: true,
      limit: null,
      current: 0,
      remaining: null,
      percentage: 0,
      isNearLimit: false,
      isAtLimit: false,
    };
  }

  const limit = resourceType === 'todos' ? limits.maxTodos : limits.maxTags;

  if (limit === null) {
    // Unlimited
    return {
      canCreate: true,
      limit: null,
      current: currentCount,
      remaining: null,
      percentage: 0,
      isNearLimit: false,
      isAtLimit: false,
    };
  }

  const remaining = Math.max(0, limit - currentCount);
  const percentage = (currentCount / limit) * 100;
  const canCreate = remaining > 0;
  const isNearLimit = percentage >= 80;
  const isAtLimit = percentage >= 100;

  return {
    canCreate,
    limit,
    current: currentCount,
    remaining,
    percentage,
    isNearLimit,
    isAtLimit,
  };
}
