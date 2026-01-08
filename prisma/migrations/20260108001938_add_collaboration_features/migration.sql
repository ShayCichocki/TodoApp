-- CreateTable
CREATE TABLE "SharedList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "ownerId" INTEGER NOT NULL,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "SharedList_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Collaborator" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "listId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'VIEWER',
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "acceptedAt" DATETIME,
    CONSTRAINT "Collaborator_listId_fkey" FOREIGN KEY ("listId") REFERENCES "SharedList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Collaborator_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "listId" INTEGER,
    "recurringTodoId" INTEGER,
    "recurringDate" DATETIME,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_listId_fkey" FOREIGN KEY ("listId") REFERENCES "SharedList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_recurringTodoId_fkey" FOREIGN KEY ("recurringTodoId") REFERENCES "RecurringTodo" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Todo" ("createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "priority", "recurringDate", "recurringTodoId", "title", "updatedAt", "userId") SELECT "createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "priority", "recurringDate", "recurringTodoId", "title", "updatedAt", "userId" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
CREATE INDEX "Todo_dueDate_idx" ON "Todo"("dueDate");
CREATE INDEX "Todo_isComplete_idx" ON "Todo"("isComplete");
CREATE INDEX "Todo_priority_idx" ON "Todo"("priority");
CREATE INDEX "Todo_deletedAt_idx" ON "Todo"("deletedAt");
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");
CREATE INDEX "Todo_listId_idx" ON "Todo"("listId");
CREATE INDEX "Todo_recurringTodoId_idx" ON "Todo"("recurringTodoId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "SharedList_ownerId_idx" ON "SharedList"("ownerId");

-- CreateIndex
CREATE INDEX "SharedList_isPublic_idx" ON "SharedList"("isPublic");

-- CreateIndex
CREATE INDEX "Collaborator_listId_idx" ON "Collaborator"("listId");

-- CreateIndex
CREATE INDEX "Collaborator_userId_idx" ON "Collaborator"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Collaborator_listId_userId_key" ON "Collaborator"("listId", "userId");
