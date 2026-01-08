-- CreateTable
CREATE TABLE "RecurringTodo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "userId" INTEGER NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "frequency" TEXT NOT NULL,
    "interval" INTEGER NOT NULL DEFAULT 1,
    "byWeekDay" TEXT,
    "byMonthDay" INTEGER,
    "startDate" DATETIME NOT NULL,
    "endType" TEXT NOT NULL DEFAULT 'NEVER',
    "endDate" DATETIME,
    "count" INTEGER,
    "lastGenerated" DATETIME,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "RecurringTodo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "RecurrenceException" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "recurringTodoId" INTEGER NOT NULL,
    "originalDate" DATETIME NOT NULL,
    "action" TEXT NOT NULL,
    "newDate" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "RecurrenceException_recurringTodoId_fkey" FOREIGN KEY ("recurringTodoId") REFERENCES "RecurringTodo" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Todo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "title" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "dueDate" DATETIME NOT NULL,
    "isComplete" BOOLEAN NOT NULL DEFAULT false,
    "priority" TEXT NOT NULL DEFAULT 'MEDIUM',
    "userId" INTEGER NOT NULL,
    "recurringTodoId" INTEGER,
    "recurringDate" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_recurringTodoId_fkey" FOREIGN KEY ("recurringTodoId") REFERENCES "RecurringTodo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Todo" ("createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "priority", "title", "updatedAt", "userId") SELECT "createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "priority", "title", "updatedAt", "userId" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
CREATE INDEX "Todo_dueDate_idx" ON "Todo"("dueDate");
CREATE INDEX "Todo_isComplete_idx" ON "Todo"("isComplete");
CREATE INDEX "Todo_priority_idx" ON "Todo"("priority");
CREATE INDEX "Todo_deletedAt_idx" ON "Todo"("deletedAt");
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");
CREATE INDEX "Todo_recurringTodoId_idx" ON "Todo"("recurringTodoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "RecurringTodo_userId_idx" ON "RecurringTodo"("userId");

-- CreateIndex
CREATE INDEX "RecurringTodo_startDate_idx" ON "RecurringTodo"("startDate");

-- CreateIndex
CREATE INDEX "RecurringTodo_isActive_idx" ON "RecurringTodo"("isActive");

-- CreateIndex
CREATE INDEX "RecurrenceException_recurringTodoId_idx" ON "RecurrenceException"("recurringTodoId");

-- CreateIndex
CREATE INDEX "RecurrenceException_originalDate_idx" ON "RecurrenceException"("originalDate");

-- CreateIndex
CREATE UNIQUE INDEX "RecurrenceException_recurringTodoId_originalDate_key" ON "RecurrenceException"("recurringTodoId", "originalDate");
