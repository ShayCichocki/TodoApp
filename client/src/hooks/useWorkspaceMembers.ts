import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';
import { WorkspaceMemberRole, WorkspaceMemberWithUser, Workspace } from './useWorkspaces';

export interface AddMemberInput {
  email: string;
  role?: WorkspaceMemberRole;
}

export interface UpdateMemberRoleInput {
  role: WorkspaceMemberRole;
}

export interface PendingInvitation extends WorkspaceMemberWithUser {
  workspace: Workspace;
}

/**
 * Get all members of a workspace
 */
export const useWorkspaceMembers = (workspaceId: number) => {
  return useQuery<WorkspaceMemberWithUser[]>({
    queryKey: ['workspaces', workspaceId, 'members'],
    queryFn: async () => {
      const response = await api.get<WorkspaceMemberWithUser[]>(
        `/api/workspaces/${workspaceId}/members`
      );
      return response.data;
    },
    enabled: workspaceId > 0,
  });
};

/**
 * Add a member to a workspace
 */
export const useAddMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, input }: { workspaceId: number; input: AddMemberInput }) => {
      const response = await api.post<WorkspaceMemberWithUser>(
        `/api/workspaces/${workspaceId}/members`,
        input
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'activity'] });
    },
  });
};

/**
 * Update a member's role
 */
export const useUpdateMemberRole = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({
      workspaceId,
      memberId,
      input,
    }: {
      workspaceId: number;
      memberId: number;
      input: UpdateMemberRoleInput;
    }) => {
      const response = await api.put<WorkspaceMemberWithUser>(
        `/api/workspaces/${workspaceId}/members/${memberId}`,
        input
      );
      return response.data;
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'activity'] });
    },
  });
};

/**
 * Remove a member from a workspace
 */
export const useRemoveMember = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ workspaceId, memberId }: { workspaceId: number; memberId: number }) => {
      await api.delete(`/api/workspaces/${workspaceId}/members/${memberId}`);
    },
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'members'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId] });
      queryClient.invalidateQueries({ queryKey: ['workspaces', variables.workspaceId, 'activity'] });
    },
  });
};

/**
 * Get pending invitations for the current user
 */
export const usePendingInvitations = () => {
  return useQuery<PendingInvitation[]>({
    queryKey: ['workspaces', 'invitations', 'pending'],
    queryFn: async () => {
      const response = await api.get<PendingInvitation[]>('/api/workspaces/invitations/pending');
      return response.data;
    },
  });
};

/**
 * Accept a workspace invitation
 */
export const useAcceptInvitation = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (invitationId: number) => {
      const response = await api.post<WorkspaceMemberWithUser>(
        `/api/workspaces/invitations/${invitationId}/accept`
      );
      return response.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['workspaces', 'invitations', 'pending'] });
      queryClient.invalidateQueries({ queryKey: ['workspaces'] });
    },
  });
};
