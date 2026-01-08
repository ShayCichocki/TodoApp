import { useState, useEffect } from 'react';
import {
  useCalendarConnections,
  useUpdateCalendarConnection,
  useDeleteCalendarConnection,
  useSyncCalendar,
  useExportIcal,
  CalendarProvider,
  CalendarConnection,
  SyncDirection,
} from '../hooks/useCalendar';
import api from '../lib/api';

export default function CalendarIntegration() {
  const { data: connections, isLoading } = useCalendarConnections();
  const updateConnection = useUpdateCalendarConnection();
  const deleteConnection = useDeleteCalendarConnection();
  const syncCalendar = useSyncCalendar();
  const exportIcal = useExportIcal();

  const [editingConnection, setEditingConnection] = useState<number | null>(null);
  const [syncDirection, setSyncDirection] = useState<SyncDirection>('BIDIRECTIONAL');
  const [autoCreateEvents, setAutoCreateEvents] = useState(true);
  const [syncCompletedTodos, setSyncCompletedTodos] = useState(false);
  const [eventDuration, setEventDuration] = useState(60);

  // Handle OAuth callback
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const status = params.get('status');
    const provider = params.get('connected');

    if (status === 'success' && provider) {
      alert(`Successfully connected to ${provider}!`);
      window.history.replaceState({}, document.title, window.location.pathname);
    } else if (status === 'error') {
      alert('Failed to connect calendar. Please try again.');
      window.history.replaceState({}, document.title, window.location.pathname);
    }
  }, []);

  const handleConnect = async (provider: CalendarProvider) => {
    try {
      const response = await api.get<{ authUrl: string }>(
        `/api/calendar/oauth/authorize?provider=${provider}`
      );
      window.location.href = response.data.authUrl;
    } catch (error) {
      console.error('Error getting OAuth URL:', error);
      alert('Failed to initiate calendar connection');
    }
  };

  const handleDisconnect = async (connectionId: number) => {
    if (!confirm('Are you sure you want to disconnect this calendar?')) {
      return;
    }

    try {
      await deleteConnection.mutateAsync(connectionId);
    } catch (error) {
      console.error('Error disconnecting calendar:', error);
      alert('Failed to disconnect calendar');
    }
  };

  const handleSync = async (connectionId: number) => {
    try {
      const result = await syncCalendar.mutateAsync(connectionId);
      alert(
        `Sync complete!\nTodos → Calendar: ${result.todosToCalendar}\nCalendar → Todos: ${result.calendarToTodos}${
          result.errors.length > 0 ? `\n\nErrors: ${result.errors.join(', ')}` : ''
        }`
      );
    } catch (error) {
      console.error('Error syncing calendar:', error);
      alert('Failed to sync calendar');
    }
  };

  const handleSaveSettings = async (connection: CalendarConnection) => {
    try {
      await updateConnection.mutateAsync({
        id: connection.id,
        updates: {
          syncDirection,
          autoCreateEvents,
          syncCompletedTodos,
          eventDuration,
        },
      });
      setEditingConnection(null);
      alert('Settings saved successfully!');
    } catch (error) {
      console.error('Error updating connection:', error);
      alert('Failed to update settings');
    }
  };

  const startEditing = (connection: CalendarConnection) => {
    setEditingConnection(connection.id);
    setSyncDirection(connection.syncDirection);
    setAutoCreateEvents(connection.autoCreateEvents);
    setSyncCompletedTodos(connection.syncCompletedTodos);
    setEventDuration(connection.eventDuration);
  };

  const handleExportIcal = () => {
    exportIcal.mutate();
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-600">Loading calendar integrations...</p>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-3xl font-bold mb-6">Calendar Integration</h1>

      {/* Connect New Calendar */}
      <div className="bg-white rounded-lg shadow p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Connect a Calendar</h2>
        <p className="text-gray-600 mb-4">
          Sync your todos with your calendar. Tasks with due dates will appear as calendar events.
        </p>
        <div className="flex gap-3">
          <button
            onClick={() => handleConnect('GOOGLE')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              />
              <path
                fill="currentColor"
                d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              />
              <path
                fill="currentColor"
                d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
              />
              <path
                fill="currentColor"
                d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              />
            </svg>
            Google Calendar
          </button>
          <button
            onClick={() => handleConnect('OUTLOOK')}
            className="flex items-center gap-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition"
          >
            <svg className="w-5 h-5" viewBox="0 0 24 24">
              <path
                fill="currentColor"
                d="M24 7.387v9.226a.669.669 0 01-.668.668h-8.555a.668.668 0 01-.668-.668V7.387c0-.369.299-.668.668-.668h8.555c.369 0 .668.299.668.668zM7.387 2C5.512 2 4 3.512 4 5.387v13.226C4 20.488 5.512 22 7.387 22h9.226c1.875 0 3.387-1.512 3.387-3.387V7.387c0-.369-.299-.668-.668-.668h-8.555a2.005 2.005 0 00-2.004 2.004v9.054c0 .369.299.668.668.668h8.332a.668.668 0 00.668-.668v-9.054a.668.668 0 00-.668-.668H9.61a.668.668 0 00-.668.668v7.719a.668.668 0 00.668.668h6.665a.668.668 0 000-1.336H10.28V9.055c0-.737.598-1.336 1.336-1.336h8.106V5.387C19.722 3.512 18.21 2 16.336 2H7.387z"
              />
            </svg>
            Outlook Calendar
          </button>
        </div>
      </div>

      {/* Connected Calendars */}
      {connections && connections.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Connected Calendars</h2>
          <div className="space-y-4">
            {connections.map((connection) => (
              <div key={connection.id} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="text-2xl">
                      {connection.provider === 'GOOGLE' ? '📅' : '📆'}
                    </div>
                    <div>
                      <h3 className="font-semibold">{connection.provider} Calendar</h3>
                      <p className="text-sm text-gray-600">
                        Status:{' '}
                        <span
                          className={
                            connection.syncStatus === 'ACTIVE'
                              ? 'text-green-600'
                              : connection.syncStatus === 'ERROR'
                              ? 'text-red-600'
                              : 'text-gray-600'
                          }
                        >
                          {connection.syncStatus}
                        </span>
                      </p>
                      {connection.lastSyncAt && (
                        <p className="text-xs text-gray-500">
                          Last synced: {new Date(connection.lastSyncAt).toLocaleString()}
                        </p>
                      )}
                      {connection.lastSyncError && (
                        <p className="text-xs text-red-600">Error: {connection.lastSyncError}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleSync(connection.id)}
                      disabled={syncCalendar.isPending}
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50 transition"
                    >
                      {syncCalendar.isPending ? 'Syncing...' : 'Sync Now'}
                    </button>
                    <button
                      onClick={() => startEditing(connection)}
                      className="px-3 py-1 text-sm bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                    >
                      Settings
                    </button>
                    <button
                      onClick={() => handleDisconnect(connection.id)}
                      className="px-3 py-1 text-sm bg-red-600 text-white rounded hover:bg-red-700 transition"
                    >
                      Disconnect
                    </button>
                  </div>
                </div>

                {/* Settings Panel */}
                {editingConnection === connection.id && (
                  <div className="mt-4 pt-4 border-t space-y-4">
                    <div>
                      <label className="block text-sm font-medium mb-1">Sync Direction</label>
                      <select
                        value={syncDirection}
                        onChange={(e) => setSyncDirection(e.target.value as SyncDirection)}
                        className="w-full px-3 py-2 border rounded"
                      >
                        <option value="BIDIRECTIONAL">Two-way sync</option>
                        <option value="TODO_TO_CALENDAR">Todos → Calendar only</option>
                        <option value="CALENDAR_TO_TODO">Calendar → Todos only</option>
                      </select>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={autoCreateEvents}
                          onChange={(e) => setAutoCreateEvents(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Automatically create calendar events for new todos</span>
                      </label>
                    </div>

                    <div>
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={syncCompletedTodos}
                          onChange={(e) => setSyncCompletedTodos(e.target.checked)}
                          className="w-4 h-4"
                        />
                        <span className="text-sm">Sync completed todos</span>
                      </label>
                    </div>

                    <div>
                      <label className="block text-sm font-medium mb-1">
                        Default event duration (minutes)
                      </label>
                      <input
                        type="number"
                        value={eventDuration}
                        onChange={(e) => setEventDuration(parseInt(e.target.value, 10))}
                        min="15"
                        step="15"
                        className="w-full px-3 py-2 border rounded"
                      />
                    </div>

                    <div className="flex gap-2">
                      <button
                        onClick={() => handleSaveSettings(connection)}
                        disabled={updateConnection.isPending}
                        className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50 transition"
                      >
                        {updateConnection.isPending ? 'Saving...' : 'Save Settings'}
                      </button>
                      <button
                        onClick={() => setEditingConnection(null)}
                        className="px-4 py-2 bg-gray-200 text-gray-800 rounded hover:bg-gray-300 transition"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* iCal Export */}
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-4">Export to iCal</h2>
        <p className="text-gray-600 mb-4">
          Export your todos as an iCal file to import into any calendar app (Apple Calendar, etc.)
        </p>
        <button
          onClick={handleExportIcal}
          disabled={exportIcal.isPending}
          className="px-4 py-2 bg-purple-600 text-white rounded hover:bg-purple-700 disabled:opacity-50 transition"
        >
          {exportIcal.isPending ? 'Exporting...' : 'Download iCal File'}
        </button>
      </div>
    </div>
  );
}
