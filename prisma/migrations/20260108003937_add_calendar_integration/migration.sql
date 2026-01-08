-- CreateTable
CREATE TABLE "CalendarConnection" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "provider" TEXT NOT NULL,
    "accessToken" TEXT NOT NULL,
    "refreshToken" TEXT,
    "tokenExpiresAt" DATETIME,
    "providerUserId" TEXT,
    "providerCalendarId" TEXT,
    "syncDirection" TEXT NOT NULL DEFAULT 'BIDIRECTIONAL',
    "syncStatus" TEXT NOT NULL DEFAULT 'ACTIVE',
    "lastSyncAt" DATETIME,
    "lastSyncError" TEXT,
    "syncEnabled" BOOLEAN NOT NULL DEFAULT true,
    "autoCreateEvents" BOOLEAN NOT NULL DEFAULT true,
    "syncCompletedTodos" BOOLEAN NOT NULL DEFAULT false,
    "eventDuration" INTEGER NOT NULL DEFAULT 60,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarConnection_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "CalendarEvent" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "connectionId" INTEGER NOT NULL,
    "todoId" INTEGER,
    "providerEventId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "startTime" DATETIME NOT NULL,
    "endTime" DATETIME NOT NULL,
    "location" TEXT,
    "lastSyncedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "syncedFromTodo" BOOLEAN NOT NULL DEFAULT false,
    "modifiedInCalendar" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "CalendarEvent_connectionId_fkey" FOREIGN KEY ("connectionId") REFERENCES "CalendarConnection" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "CalendarEvent_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "CalendarConnection_userId_idx" ON "CalendarConnection"("userId");

-- CreateIndex
CREATE INDEX "CalendarConnection_syncStatus_idx" ON "CalendarConnection"("syncStatus");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarConnection_userId_provider_key" ON "CalendarConnection"("userId", "provider");

-- CreateIndex
CREATE INDEX "CalendarEvent_connectionId_idx" ON "CalendarEvent"("connectionId");

-- CreateIndex
CREATE INDEX "CalendarEvent_todoId_idx" ON "CalendarEvent"("todoId");

-- CreateIndex
CREATE INDEX "CalendarEvent_startTime_idx" ON "CalendarEvent"("startTime");

-- CreateIndex
CREATE UNIQUE INDEX "CalendarEvent_connectionId_providerEventId_key" ON "CalendarEvent"("connectionId", "providerEventId");
