-- CreateTable
CREATE TABLE "Workspace" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "ownerId" INTEGER NOT NULL,
    "settings" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Workspace_ownerId_fkey" FOREIGN KEY ("ownerId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceMember" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "userId" INTEGER NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'MEMBER',
    "invitedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "joinedAt" DATETIME,
    "invitedBy" INTEGER,
    CONSTRAINT "WorkspaceMember_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceMember_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "WorkspaceList" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "color" TEXT,
    "createdById" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "WorkspaceList_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "WorkspaceList_createdById_fkey" FOREIGN KEY ("createdById") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "ActivityFeedItem" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "actorId" INTEGER NOT NULL,
    "action" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" INTEGER,
    "metadata" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "ActivityFeedItem_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "ActivityFeedItem_actorId_fkey" FOREIGN KEY ("actorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Comment" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "workspaceId" INTEGER NOT NULL,
    "todoId" INTEGER NOT NULL,
    "authorId" INTEGER NOT NULL,
    "content" TEXT NOT NULL,
    "mentions" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Comment_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_todoId_fkey" FOREIGN KEY ("todoId") REFERENCES "Todo" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Comment_authorId_fkey" FOREIGN KEY ("authorId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE
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
    "workspaceId" INTEGER,
    "workspaceListId" INTEGER,
    "assignedToId" INTEGER,
    "deletedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Todo_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_listId_fkey" FOREIGN KEY ("listId") REFERENCES "SharedList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_recurringTodoId_fkey" FOREIGN KEY ("recurringTodoId") REFERENCES "RecurringTodo" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "Todo_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_workspaceListId_fkey" FOREIGN KEY ("workspaceListId") REFERENCES "WorkspaceList" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "Todo_assignedToId_fkey" FOREIGN KEY ("assignedToId") REFERENCES "User" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Todo" ("createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "listId", "priority", "recurringDate", "recurringTodoId", "title", "updatedAt", "userId") SELECT "createdAt", "deletedAt", "description", "dueDate", "id", "isComplete", "listId", "priority", "recurringDate", "recurringTodoId", "title", "updatedAt", "userId" FROM "Todo";
DROP TABLE "Todo";
ALTER TABLE "new_Todo" RENAME TO "Todo";
CREATE INDEX "Todo_dueDate_idx" ON "Todo"("dueDate");
CREATE INDEX "Todo_isComplete_idx" ON "Todo"("isComplete");
CREATE INDEX "Todo_priority_idx" ON "Todo"("priority");
CREATE INDEX "Todo_deletedAt_idx" ON "Todo"("deletedAt");
CREATE INDEX "Todo_userId_idx" ON "Todo"("userId");
CREATE INDEX "Todo_listId_idx" ON "Todo"("listId");
CREATE INDEX "Todo_recurringTodoId_idx" ON "Todo"("recurringTodoId");
CREATE INDEX "Todo_workspaceId_idx" ON "Todo"("workspaceId");
CREATE INDEX "Todo_workspaceListId_idx" ON "Todo"("workspaceListId");
CREATE INDEX "Todo_assignedToId_idx" ON "Todo"("assignedToId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "Workspace_ownerId_idx" ON "Workspace"("ownerId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_workspaceId_idx" ON "WorkspaceMember"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceMember_userId_idx" ON "WorkspaceMember"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceMember_workspaceId_userId_key" ON "WorkspaceMember"("workspaceId", "userId");

-- CreateIndex
CREATE INDEX "WorkspaceList_workspaceId_idx" ON "WorkspaceList"("workspaceId");

-- CreateIndex
CREATE INDEX "WorkspaceList_createdById_idx" ON "WorkspaceList"("createdById");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_workspaceId_idx" ON "ActivityFeedItem"("workspaceId");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_actorId_idx" ON "ActivityFeedItem"("actorId");

-- CreateIndex
CREATE INDEX "ActivityFeedItem_createdAt_idx" ON "ActivityFeedItem"("createdAt");

-- CreateIndex
CREATE INDEX "Comment_todoId_idx" ON "Comment"("todoId");

-- CreateIndex
CREATE INDEX "Comment_workspaceId_idx" ON "Comment"("workspaceId");

-- CreateIndex
CREATE INDEX "Comment_authorId_idx" ON "Comment"("authorId");
