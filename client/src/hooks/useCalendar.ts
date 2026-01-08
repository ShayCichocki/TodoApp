import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../lib/api';

export type CalendarProvider = 'GOOGLE' | 'OUTLOOK' | 'APPLE';
export type SyncDirection = 'TODO_TO_CALENDAR' | 'CALENDAR_TO_TODO' | 'BIDIRECTIONAL';
export type SyncStatus = 'ACTIVE' | 'PAUSED' | 'ERROR';

export interface CalendarConnection {
  id: number;
  userId: number;
  provider: CalendarProvider;
  syncDirection: SyncDirection;
  syncStatus: SyncStatus;
  lastSyncAt: string | null;
  lastSyncError: string | null;
  syncEnabled: boolean;
  autoCreateEvents: boolean;
  syncCompletedTodos: boolean;
  eventDuration: number;
  createdAt: string;
  updatedAt: string;
}

export interface CalendarEvent {
  id: number;
  connectionId: number;
  todoId: number | null;
  providerEventId: string;
  title: string;
  description: string | null;
  startTime: string;
  endTime: string;
  location: string | null;
  lastSyncedAt: string;
  syncedFromTodo: boolean;
  modifiedInCalendar: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SyncResult {
  todosToCalendar: number;
  calendarToTodos: number;
  conflicts: number;
  errors: string[];
}

export interface UpdateConnectionInput {
  syncDirection?: SyncDirection;
  syncEnabled?: boolean;
  autoCreateEvents?: boolean;
  syncCompletedTodos?: boolean;
  eventDuration?: number;
}

export const useCalendarConnections = () => {
  return useQuery<CalendarConnection[]>({
    queryKey: ['calendar', 'connections'],
    queryFn: async () => {
      const response = await api.get<CalendarConnection[]>('/api/calendar/connections');
      return response.data;
    },
  });
};

export const useCalendarConnection = (id: number) => {
  return useQuery<CalendarConnection>({
    queryKey: ['calendar', 'connections', id],
    queryFn: async () => {
      const response = await api.get<CalendarConnection>(`/api/calendar/connections/${id}`);
      return response.data;
    },
    enabled: id > 0,
  });
};

export const useUpdateCalendarConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ id, updates }: { id: number; updates: UpdateConnectionInput }) => {
      const response = await api.put<CalendarConnection>(`/api/calendar/connections/${id}`, updates);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'connections'] });
      queryClient.invalidateQueries({ queryKey: ['calendar', 'connections', data.id] });
    },
  });
};

export const useDeleteCalendarConnection = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (id: number) => {
      await api.delete(`/api/calendar/connections/${id}`);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'connections'] });
    },
  });
};

export const useSyncCalendar = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await api.post<SyncResult>(`/api/calendar/connections/${connectionId}/sync`);
      return response.data;
    },
    onSuccess: (_data, connectionId) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'connections', connectionId] });
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },
  });
};

export const useRefreshToken = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (connectionId: number) => {
      const response = await api.post<CalendarConnection>(`/api/calendar/connections/${connectionId}/refresh-token`);
      return response.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['calendar', 'connections', data.id] });
    },
  });
};

export const useCalendarEvents = (connectionId: number) => {
  return useQuery<CalendarEvent[]>({
    queryKey: ['calendar', 'connections', connectionId, 'events'],
    queryFn: async () => {
      const response = await api.get<CalendarEvent[]>(`/api/calendar/connections/${connectionId}/events`);
      return response.data;
    },
    enabled: connectionId > 0,
  });
};

export const useOAuthUrl = (provider: CalendarProvider) => {
  return useQuery<{ authUrl: string }>({
    queryKey: ['calendar', 'oauth', provider],
    queryFn: async () => {
      const response = await api.get<{ authUrl: string }>(`/api/calendar/oauth/authorize?provider=${provider}`);
      return response.data;
    },
    enabled: false, // Manual trigger only
  });
};

export const useExportIcal = () => {
  return useMutation({
    mutationFn: async () => {
      const response = await api.get('/api/calendar/export/ical', {
        responseType: 'blob',
      });

      // Create download link
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'todos.ics');
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    },
  });
};
