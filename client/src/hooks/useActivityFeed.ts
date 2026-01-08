import { useQuery } from '@tanstack/react-query';
import api from '../lib/api';

export type ActivityAction =
  | 'CREATED'
  | 'UPDATED'
  | 'DELETED'
  | 'COMPLETED'
  | 'ASSIGNED'
  | 'COMMENTED'
  | 'MEMBER_ADDED'
  | 'MEMBER_REMOVED'
  | 'MEMBER_ROLE_CHANGED';

export interface ActivityFeedItem {
  id: number;
  workspaceId: number;
  actorId: number;
  action: ActivityAction;
  entityType: string;
  entityId: number | null;
  metadata: string | null;
  createdAt: string;
  actor: {
    id: number;
    email: string;
    name: string | null;
  };
}

export interface ActivityFeedResponse {
  activities: ActivityFeedItem[];
  total: number;
  hasMore: boolean;
}

export interface ActivityFeedOptions {
  limit?: number;
  offset?: number;
  actionFilter?: ActivityAction[];
}

/**
 * Get activity feed for a workspace
 */
export const useActivityFeed = (workspaceId: number, options: ActivityFeedOptions = {}) => {
  const limit = options.limit ?? 50;
  const offset = options.offset ?? 0;

  const queryParams = new URLSearchParams({
    limit: limit.toString(),
    offset: offset.toString(),
  });

  if (options.actionFilter && options.actionFilter.length > 0) {
    options.actionFilter.forEach((action) => {
      queryParams.append('actionFilter', action);
    });
  }

  return useQuery<ActivityFeedResponse>({
    queryKey: ['workspaces', workspaceId, 'activity', options],
    queryFn: async () => {
      const response = await api.get<ActivityFeedResponse>(
        `/api/workspaces/${workspaceId}/activity?${queryParams.toString()}`
      );
      return response.data;
    },
    enabled: workspaceId > 0,
  });
};
