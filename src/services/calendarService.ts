import { prisma } from '../lib/prisma';
import {
  CalendarConnection,
  CalendarEvent,
  CalendarProvider,
  SyncDirection,
  SyncStatus,
} from '@prisma/client';
import { google } from 'googleapis';
import { Client } from '@microsoft/microsoft-graph-client';
import 'isomorphic-fetch';
import { env } from '../config/environment';

export {
  CalendarConnection,
  CalendarEvent,
  CalendarProvider,
  SyncDirection,
  SyncStatus,
} from '@prisma/client';

export type CreateConnectionInput = {
  userId: number;
  provider: CalendarProvider;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date;
  providerUserId?: string;
  providerCalendarId?: string;
};

export type UpdateConnectionInput = Partial<{
  accessToken: string;
  refreshToken: string;
  tokenExpiresAt: Date;
  syncDirection: SyncDirection;
  syncStatus: SyncStatus;
  syncEnabled: boolean;
  autoCreateEvents: boolean;
  syncCompletedTodos: boolean;
  eventDuration: number;
}>;

export type CalendarEventInput = {
  connectionId: number;
  todoId?: number;
  providerEventId: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
  syncedFromTodo?: boolean;
};

export type SyncResult = {
  todosToCalendar: number;
  calendarToTodos: number;
  conflicts: number;
  errors: string[];
};

export type ICalEvent = {
  uid: string;
  title: string;
  description?: string;
  startTime: Date;
  endTime: Date;
  location?: string;
};

class CalendarService {
  /**
   * Create a new calendar connection
   * In production, this would be called after OAuth flow completes
   */
  async createConnection(
    input: CreateConnectionInput
  ): Promise<CalendarConnection> {
    return prisma.calendarConnection.create({
      data: input,
    });
  }

  /**
   * Get all calendar connections for a user
   */
  async getAllConnections(userId: number): Promise<CalendarConnection[]> {
    return prisma.calendarConnection.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
    });
  }

  /**
   * Get a specific connection
   */
  async getConnection(
    id: number,
    userId: number
  ): Promise<CalendarConnection | null> {
    return prisma.calendarConnection.findFirst({
      where: { id, userId },
    });
  }

  /**
   * Update connection settings
   */
  async updateConnection(
    id: number,
    userId: number,
    updates: UpdateConnectionInput
  ): Promise<CalendarConnection> {
    return prisma.calendarConnection.update({
      where: { id, userId },
      data: updates,
    });
  }

  /**
   * Delete a calendar connection
   */
  async deleteConnection(id: number, userId: number): Promise<boolean> {
    const result = await prisma.calendarConnection.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  /**
   * Refresh OAuth token
   * Calls the provider's token refresh endpoint to get a new access token
   */
  async refreshToken(
    connectionId: number,
    userId: number
  ): Promise<CalendarConnection> {
    const connection = await this.getConnection(connectionId, userId);

    if (!connection) {
      throw new Error('Connection not found');
    }

    if (!connection.refreshToken) {
      throw new Error('No refresh token available');
    }

    switch (connection.provider) {
      case CalendarProvider.GOOGLE: {
        const oauth2Client = new google.auth.OAuth2(
          env.googleCalendar.clientId,
          env.googleCalendar.clientSecret,
          env.googleCalendar.redirectUri
        );

        oauth2Client.setCredentials({
          refresh_token: connection.refreshToken,
        });

        const { credentials } = await oauth2Client.refreshAccessToken();

        if (!credentials.access_token) {
          throw new Error('Failed to refresh Google access token');
        }

        const tokenExpiresAt = credentials.expiry_date
          ? new Date(credentials.expiry_date)
          : new Date(Date.now() + 3600 * 1000);

        return prisma.calendarConnection.update({
          where: { id: connectionId },
          data: {
            accessToken: credentials.access_token,
            refreshToken: credentials.refresh_token ?? connection.refreshToken,
            tokenExpiresAt,
            syncStatus: SyncStatus.ACTIVE,
          },
        });
      }

      case CalendarProvider.OUTLOOK: {
        const tokenEndpoint =
          'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const params = new URLSearchParams({
          client_id: env.outlookCalendar.clientId,
          client_secret: env.outlookCalendar.clientSecret,
          refresh_token: connection.refreshToken,
          grant_type: 'refresh_token',
        });

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to refresh Outlook token: ${error}`);
        }

        const tokens = (await response.json()) as {
          access_token: string;
          refresh_token?: string;
          expires_in: number;
        };

        const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        return prisma.calendarConnection.update({
          where: { id: connectionId },
          data: {
            accessToken: tokens.access_token,
            refreshToken: tokens.refresh_token ?? connection.refreshToken,
            tokenExpiresAt,
            syncStatus: SyncStatus.ACTIVE,
          },
        });
      }

      default:
        throw new Error(`Unsupported provider: ${connection.provider}`);
    }
  }

  /**
   * Helper: Create event in Google Calendar
   */
  private async createGoogleCalendarEvent(
    connection: CalendarConnection,
    todo: { id: number; title: string; description: string; dueDate: Date }
  ): Promise<string> {
    const oauth2Client = new google.auth.OAuth2(
      env.googleCalendar.clientId,
      env.googleCalendar.clientSecret,
      env.googleCalendar.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const event = await calendar.events.insert({
      calendarId: connection.providerCalendarId ?? 'primary',
      requestBody: {
        summary: todo.title,
        description: todo.description,
        start: {
          dateTime: todo.dueDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(
            todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
          ).toISOString(),
          timeZone: 'UTC',
        },
      },
    });

    return event.data.id!;
  }

  /**
   * Helper: Update event in Google Calendar
   */
  private async updateGoogleCalendarEvent(
    connection: CalendarConnection,
    providerEventId: string,
    todo: { title: string; description: string; dueDate: Date }
  ): Promise<void> {
    const oauth2Client = new google.auth.OAuth2(
      env.googleCalendar.clientId,
      env.googleCalendar.clientSecret,
      env.googleCalendar.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    await calendar.events.update({
      calendarId: connection.providerCalendarId ?? 'primary',
      eventId: providerEventId,
      requestBody: {
        summary: todo.title,
        description: todo.description,
        start: {
          dateTime: todo.dueDate.toISOString(),
          timeZone: 'UTC',
        },
        end: {
          dateTime: new Date(
            todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
          ).toISOString(),
          timeZone: 'UTC',
        },
      },
    });
  }

  /**
   * Helper: Create event in Outlook Calendar
   */
  private async createOutlookCalendarEvent(
    connection: CalendarConnection,
    todo: { id: number; title: string; description: string; dueDate: Date }
  ): Promise<string> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, connection.accessToken);
      },
    });

    const event = await client.api('/me/calendar/events').post({
      subject: todo.title,
      body: {
        contentType: 'Text',
        content: todo.description,
      },
      start: {
        dateTime: todo.dueDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(
          todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
        ).toISOString(),
        timeZone: 'UTC',
      },
    });

    return event.id;
  }

  /**
   * Helper: Update event in Outlook Calendar
   */
  private async updateOutlookCalendarEvent(
    connection: CalendarConnection,
    providerEventId: string,
    todo: { title: string; description: string; dueDate: Date }
  ): Promise<void> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, connection.accessToken);
      },
    });

    await client.api(`/me/calendar/events/${providerEventId}`).patch({
      subject: todo.title,
      body: {
        contentType: 'Text',
        content: todo.description,
      },
      start: {
        dateTime: todo.dueDate.toISOString(),
        timeZone: 'UTC',
      },
      end: {
        dateTime: new Date(
          todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
        ).toISOString(),
        timeZone: 'UTC',
      },
    });
  }

  /**
   * Sync todos to calendar
   * Creates or updates calendar events from todos
   */
  async syncTodosToCalendar(
    connectionId: number,
    userId: number
  ): Promise<SyncResult> {
    const result: SyncResult = {
      todosToCalendar: 0,
      calendarToTodos: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const connection = await this.getConnection(connectionId, userId);

      if (!connection) {
        result.errors.push('Connection not found');
        return result;
      }

      if (!connection.syncEnabled) {
        result.errors.push('Sync is disabled for this connection');
        return result;
      }

      // Get todos that need to be synced
      const todos = await prisma.todo.findMany({
        where: {
          userId,
          deletedAt: null,
          isComplete: connection.syncCompletedTodos ? undefined : false,
        },
      });

      for (const todo of todos) {
        try {
          // Check if event already exists
          const existingEvent = await prisma.calendarEvent.findFirst({
            where: {
              connectionId,
              todoId: todo.id,
            },
          });

          if (existingEvent) {
            // Update existing event in provider's calendar
            if (connection.provider === CalendarProvider.GOOGLE) {
              await this.updateGoogleCalendarEvent(
                connection,
                existingEvent.providerEventId,
                todo
              );
            } else if (connection.provider === CalendarProvider.OUTLOOK) {
              await this.updateOutlookCalendarEvent(
                connection,
                existingEvent.providerEventId,
                todo
              );
            }

            // Update local record
            await this.updateCalendarEvent(existingEvent.id, {
              title: todo.title,
              description: todo.description,
              startTime: todo.dueDate,
              endTime: new Date(
                todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
              ),
            });

            result.todosToCalendar++;
          } else if (connection.autoCreateEvents) {
            // Create new event in provider's calendar
            let providerEventId: string;

            if (connection.provider === CalendarProvider.GOOGLE) {
              providerEventId = await this.createGoogleCalendarEvent(
                connection,
                todo
              );
            } else if (connection.provider === CalendarProvider.OUTLOOK) {
              providerEventId = await this.createOutlookCalendarEvent(
                connection,
                todo
              );
            } else {
              throw new Error(`Unsupported provider: ${connection.provider}`);
            }

            // Create local record
            await this.createCalendarEvent({
              connectionId,
              todoId: todo.id,
              providerEventId,
              title: todo.title,
              description: todo.description,
              startTime: todo.dueDate,
              endTime: new Date(
                todo.dueDate.getTime() + connection.eventDuration * 60 * 1000
              ),
              syncedFromTodo: true,
            });

            result.todosToCalendar++;
          }
        } catch (error) {
          console.error(`Error syncing todo ${todo.id}:`, error);
          result.errors.push(
            `Failed to sync todo "${todo.title}": ${(error as Error).message}`
          );
        }
      }

      // Update last sync time
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          lastSyncAt: new Date(),
          syncStatus: SyncStatus.ACTIVE,
          lastSyncError: null,
        },
      });
    } catch (error) {
      result.errors.push((error as Error).message);

      // Update sync status to error
      await prisma.calendarConnection.update({
        where: { id: connectionId },
        data: {
          syncStatus: SyncStatus.ERROR,
          lastSyncError: (error as Error).message,
        },
      });
    }

    return result;
  }

  /**
   * Helper: Fetch events from Google Calendar
   */
  private async fetchGoogleCalendarEvents(
    connection: CalendarConnection,
    since?: Date
  ): Promise<any[]> {
    const oauth2Client = new google.auth.OAuth2(
      env.googleCalendar.clientId,
      env.googleCalendar.clientSecret,
      env.googleCalendar.redirectUri
    );

    oauth2Client.setCredentials({
      access_token: connection.accessToken,
      refresh_token: connection.refreshToken ?? undefined,
    });

    const calendar = google.calendar({ version: 'v3', auth: oauth2Client });

    const response = await calendar.events.list({
      calendarId: connection.providerCalendarId ?? 'primary',
      timeMin:
        since?.toISOString() ??
        new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
      maxResults: 100,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return response.data.items ?? [];
  }

  /**
   * Helper: Fetch events from Outlook Calendar
   */
  private async fetchOutlookCalendarEvents(
    connection: CalendarConnection,
    since?: Date
  ): Promise<any[]> {
    const client = Client.init({
      authProvider: (done) => {
        done(null, connection.accessToken);
      },
    });

    const sinceDate = since ?? new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
    const response = await client
      .api('/me/calendar/events')
      .filter(`start/dateTime ge '${sinceDate.toISOString()}'`)
      .top(100)
      .orderby('start/dateTime')
      .get();

    return response.value ?? [];
  }

  /**
   * Sync calendar events to todos
   * Creates or updates todos from calendar events
   */
  async syncCalendarToTodos(
    connectionId: number,
    userId: number
  ): Promise<SyncResult> {
    const result: SyncResult = {
      todosToCalendar: 0,
      calendarToTodos: 0,
      conflicts: 0,
      errors: [],
    };

    try {
      const connection = await this.getConnection(connectionId, userId);

      if (!connection) {
        result.errors.push('Connection not found');
        return result;
      }

      // Fetch events from the provider
      let providerEvents: any[];

      if (connection.provider === CalendarProvider.GOOGLE) {
        providerEvents = await this.fetchGoogleCalendarEvents(
          connection,
          connection.lastSyncAt ?? undefined
        );
      } else if (connection.provider === CalendarProvider.OUTLOOK) {
        providerEvents = await this.fetchOutlookCalendarEvents(
          connection,
          connection.lastSyncAt ?? undefined
        );
      } else {
        result.errors.push(`Unsupported provider: ${connection.provider}`);
        return result;
      }

      for (const providerEvent of providerEvents) {
        try {
          // Parse event data based on provider
          const eventId =
            connection.provider === CalendarProvider.GOOGLE
              ? providerEvent.id
              : providerEvent.id;
          const title =
            connection.provider === CalendarProvider.GOOGLE
              ? providerEvent.summary
              : providerEvent.subject;
          const description =
            connection.provider === CalendarProvider.GOOGLE
              ? (providerEvent.description ?? '')
              : (providerEvent.body?.content ?? '');
          const startTime =
            connection.provider === CalendarProvider.GOOGLE
              ? new Date(
                  providerEvent.start.dateTime || providerEvent.start.date
                )
              : new Date(providerEvent.start.dateTime);
          const endTime =
            connection.provider === CalendarProvider.GOOGLE
              ? new Date(providerEvent.end.dateTime || providerEvent.end.date)
              : new Date(providerEvent.end.dateTime);

          // Check if we already have this event tracked
          const existingEvent = await prisma.calendarEvent.findFirst({
            where: {
              connectionId,
              providerEventId: eventId,
            },
            include: {
              todo: true,
            },
          });

          if (existingEvent?.todo) {
            // Event exists and has a linked todo - check if it was modified in calendar
            const eventUpdated =
              connection.provider === CalendarProvider.GOOGLE
                ? new Date(providerEvent.updated)
                : new Date(providerEvent.lastModifiedDateTime);

            if (eventUpdated > existingEvent.lastSyncedAt) {
              // Event was modified in calendar after last sync
              await prisma.todo.update({
                where: { id: existingEvent.todo.id },
                data: {
                  title,
                  description,
                  dueDate: startTime,
                },
              });

              await prisma.calendarEvent.update({
                where: { id: existingEvent.id },
                data: {
                  title,
                  description,
                  startTime,
                  endTime,
                  lastSyncedAt: new Date(),
                  modifiedInCalendar: true,
                },
              });

              result.calendarToTodos++;
            }
          } else if (!existingEvent) {
            // New event in calendar not created by us - optionally create a todo
            // For now, just track the event but don't auto-create todos
            // This prevents cluttering the todo list with all calendar events
            await prisma.calendarEvent.create({
              data: {
                connectionId,
                providerEventId: eventId,
                title,
                description,
                startTime,
                endTime,
                syncedFromTodo: false,
              },
            });
          }
        } catch (error) {
          console.error(`Error syncing event:`, error);
          result.errors.push(
            `Failed to sync event: ${(error as Error).message}`
          );
        }
      }
    } catch (error) {
      result.errors.push((error as Error).message);
    }

    return result;
  }

  /**
   * Perform bidirectional sync
   */
  async performBidirectionalSync(
    connectionId: number,
    userId: number
  ): Promise<SyncResult> {
    const todosToCalResult = await this.syncTodosToCalendar(
      connectionId,
      userId
    );
    const calToTodosResult = await this.syncCalendarToTodos(
      connectionId,
      userId
    );

    return {
      todosToCalendar: todosToCalResult.todosToCalendar,
      calendarToTodos: calToTodosResult.calendarToTodos,
      conflicts: todosToCalResult.conflicts + calToTodosResult.conflicts,
      errors: [...todosToCalResult.errors, ...calToTodosResult.errors],
    };
  }

  /**
   * Create a calendar event
   */
  async createCalendarEvent(input: CalendarEventInput): Promise<CalendarEvent> {
    return prisma.calendarEvent.create({
      data: input,
    });
  }

  /**
   * Update a calendar event
   */
  async updateCalendarEvent(
    id: number,
    updates: Partial<CalendarEventInput>
  ): Promise<CalendarEvent> {
    return prisma.calendarEvent.update({
      where: { id },
      data: updates,
    });
  }

  /**
   * Get all events for a connection
   */
  async getEventsForConnection(connectionId: number): Promise<CalendarEvent[]> {
    return prisma.calendarEvent.findMany({
      where: { connectionId },
      include: {
        todo: {
          select: {
            id: true,
            title: true,
            isComplete: true,
          },
        },
      },
      orderBy: { startTime: 'asc' },
    });
  }

  /**
   * Export todos as iCal format
   */
  async exportToICal(userId: number): Promise<string> {
    const todos = await prisma.todo.findMany({
      where: {
        userId,
        deletedAt: null,
        isComplete: false,
      },
      orderBy: { dueDate: 'asc' },
    });

    const events: ICalEvent[] = todos.map((todo) => ({
      uid: `todo-${todo.id}@todoapp.local`,
      title: todo.title,
      description: todo.description,
      startTime: todo.dueDate,
      endTime: new Date(todo.dueDate.getTime() + 60 * 60 * 1000), // 1 hour default
    }));

    return this.generateICalString(events);
  }

  /**
   * Generate iCal format string
   */
  private generateICalString(events: ICalEvent[]): string {
    const lines: string[] = [];

    // Calendar header
    lines.push('BEGIN:VCALENDAR');
    lines.push('VERSION:2.0');
    lines.push('PRODID:-//Todo App//Calendar Export//EN');
    lines.push('CALSCALE:GREGORIAN');
    lines.push('METHOD:PUBLISH');

    // Add events
    for (const event of events) {
      lines.push('BEGIN:VEVENT');
      lines.push(`UID:${event.uid}`);
      lines.push(`DTSTAMP:${this.formatICalDate(new Date())}`);
      lines.push(`DTSTART:${this.formatICalDate(event.startTime)}`);
      lines.push(`DTEND:${this.formatICalDate(event.endTime)}`);
      lines.push(`SUMMARY:${this.escapeICalText(event.title)}`);

      if (event.description) {
        lines.push(`DESCRIPTION:${this.escapeICalText(event.description)}`);
      }

      if (event.location) {
        lines.push(`LOCATION:${this.escapeICalText(event.location)}`);
      }

      lines.push('END:VEVENT');
    }

    // Calendar footer
    lines.push('END:VCALENDAR');

    return lines.join('\r\n');
  }

  /**
   * Format date for iCal (YYYYMMDDTHHmmssZ)
   */
  private formatICalDate(date: Date): string {
    const pad = (n: number) => n.toString().padStart(2, '0');

    return (
      date.getUTCFullYear() +
      pad(date.getUTCMonth() + 1) +
      pad(date.getUTCDate()) +
      'T' +
      pad(date.getUTCHours()) +
      pad(date.getUTCMinutes()) +
      pad(date.getUTCSeconds()) +
      'Z'
    );
  }

  /**
   * Escape text for iCal format
   */
  private escapeICalText(text: string): string {
    return text.replace(/[\\,;]/g, '\\$&').replace(/\n/g, '\\n');
  }

  /**
   * Get OAuth authorization URL
   * Generates the actual OAuth URL for the provider
   */
  getOAuthUrl(provider: CalendarProvider, userId: number): string {
    const state = Buffer.from(JSON.stringify({ userId, provider })).toString(
      'base64'
    );

    switch (provider) {
      case CalendarProvider.GOOGLE: {
        const oauth2Client = new google.auth.OAuth2(
          env.googleCalendar.clientId,
          env.googleCalendar.clientSecret,
          env.googleCalendar.redirectUri
        );

        return oauth2Client.generateAuthUrl({
          access_type: 'offline',
          scope: [
            'https://www.googleapis.com/auth/calendar',
            'https://www.googleapis.com/auth/calendar.events',
          ],
          state,
          prompt: 'consent', // Force consent to get refresh token
        });
      }

      case CalendarProvider.OUTLOOK: {
        const scopes = ['Calendars.ReadWrite', 'offline_access'];
        const authUrl = new URL(
          'https://login.microsoftonline.com/common/oauth2/v2.0/authorize'
        );
        authUrl.searchParams.set('client_id', env.outlookCalendar.clientId);
        authUrl.searchParams.set('response_type', 'code');
        authUrl.searchParams.set(
          'redirect_uri',
          env.outlookCalendar.redirectUri
        );
        authUrl.searchParams.set('response_mode', 'query');
        authUrl.searchParams.set('scope', scopes.join(' '));
        authUrl.searchParams.set('state', state);

        return authUrl.toString();
      }

      case CalendarProvider.APPLE:
        // Apple Calendar uses CalDAV, not OAuth
        // For now, return a placeholder indicating not yet implemented
        throw new Error('Apple Calendar integration not yet implemented');

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }

  /**
   * Handle OAuth callback
   * Exchanges authorization code for access and refresh tokens
   */
  async handleOAuthCallback(
    provider: CalendarProvider,
    code: string,
    userId: number
  ): Promise<CalendarConnection> {
    switch (provider) {
      case CalendarProvider.GOOGLE: {
        const oauth2Client = new google.auth.OAuth2(
          env.googleCalendar.clientId,
          env.googleCalendar.clientSecret,
          env.googleCalendar.redirectUri
        );

        const { tokens } = await oauth2Client.getToken(code);

        if (!tokens.access_token) {
          throw new Error('Failed to obtain access token from Google');
        }

        const tokenExpiresAt = tokens.expiry_date
          ? new Date(tokens.expiry_date)
          : new Date(Date.now() + 3600 * 1000);

        // Get user's primary calendar ID
        oauth2Client.setCredentials(tokens);
        const calendar = google.calendar({ version: 'v3', auth: oauth2Client });
        const calendarList = await calendar.calendarList.list();
        const primaryCalendar = calendarList.data.items?.find(
          (cal) => cal.primary
        );

        return this.createConnection({
          userId,
          provider,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token ?? undefined,
          tokenExpiresAt,
          providerCalendarId: primaryCalendar?.id ?? 'primary',
        });
      }

      case CalendarProvider.OUTLOOK: {
        const tokenEndpoint =
          'https://login.microsoftonline.com/common/oauth2/v2.0/token';
        const params = new URLSearchParams({
          client_id: env.outlookCalendar.clientId,
          client_secret: env.outlookCalendar.clientSecret,
          code,
          redirect_uri: env.outlookCalendar.redirectUri,
          grant_type: 'authorization_code',
        });

        const response = await fetch(tokenEndpoint, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
          },
          body: params.toString(),
        });

        if (!response.ok) {
          const error = await response.text();
          throw new Error(`Failed to exchange code for tokens: ${error}`);
        }

        const tokens = (await response.json()) as {
          access_token: string;
          refresh_token: string;
          expires_in: number;
        };

        const tokenExpiresAt = new Date(Date.now() + tokens.expires_in * 1000);

        // Get user's primary calendar ID
        const client = Client.init({
          authProvider: (done) => {
            done(null, tokens.access_token);
          },
        });

        const user = await client.api('/me').get();

        return this.createConnection({
          userId,
          provider,
          accessToken: tokens.access_token,
          refreshToken: tokens.refresh_token,
          tokenExpiresAt,
          providerUserId: user.id,
          providerCalendarId: 'primary', // Outlook uses 'primary' for default calendar
        });
      }

      default:
        throw new Error(`Unsupported provider: ${provider}`);
    }
  }
}

export const calendarService = new CalendarService();
