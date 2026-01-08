import { prisma } from '../lib/prisma';
import { SharedList, Collaborator, CollaboratorRole } from '@prisma/client';

export { SharedList, Collaborator, CollaboratorRole } from '@prisma/client';

export type CreateSharedListInput = {
  name: string;
  description?: string;
  color?: string;
  ownerId: number;
};

export type UpdateSharedListInput = {
  name?: string;
  description?: string;
  color?: string;
};

export type AddCollaboratorInput = {
  listId: number;
  userId: number;
  role?: CollaboratorRole;
};

export type SharedListWithDetails = SharedList & {
  owner: {
    id: number;
    email: string;
  };
  collaborators: (Collaborator & {
    user: {
      id: number;
      email: string;
    };
  })[];
  _count: {
    todos: number;
  };
};

class SharedListService {
  /**
   * Create a new shared list
   */
  async create(input: CreateSharedListInput): Promise<SharedList> {
    return prisma.sharedList.create({
      data: {
        name: input.name,
        description: input.description,
        color: input.color,
        ownerId: input.ownerId,
      },
    });
  }

  /**
   * Get all lists accessible by a user (owned + collaborated)
   */
  async getAllForUser(userId: number): Promise<SharedListWithDetails[]> {
    // Get owned lists
    const ownedLists = await prisma.sharedList.findMany({
      where: { ownerId: userId },
      include: {
        owner: {
          select: { id: true, email: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { todos: true },
        },
      },
    });

    // Get lists where user is a collaborator
    const collaboratedLists = await prisma.sharedList.findMany({
      where: {
        collaborators: {
          some: {
            userId,
            acceptedAt: { not: null },
          },
        },
      },
      include: {
        owner: {
          select: { id: true, email: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { todos: true },
        },
      },
    });

    return [...ownedLists, ...collaboratedLists];
  }

  /**
   * Get a specific list by ID (with permission check)
   */
  async getById(
    listId: number,
    userId: number
  ): Promise<SharedListWithDetails | null> {
    const list = await prisma.sharedList.findFirst({
      where: {
        id: listId,
        OR: [
          { ownerId: userId },
          {
            collaborators: {
              some: {
                userId,
                acceptedAt: { not: null },
              },
            },
          },
        ],
      },
      include: {
        owner: {
          select: { id: true, email: true },
        },
        collaborators: {
          include: {
            user: {
              select: { id: true, email: true },
            },
          },
        },
        _count: {
          select: { todos: true },
        },
      },
    });

    return list;
  }

  /**
   * Update a shared list (owner only)
   */
  async update(
    listId: number,
    ownerId: number,
    input: UpdateSharedListInput
  ): Promise<SharedList> {
    return prisma.sharedList.update({
      where: {
        id: listId,
        ownerId,
      },
      data: input,
    });
  }

  /**
   * Delete a shared list (owner only)
   */
  async delete(listId: number, ownerId: number): Promise<boolean> {
    const result = await prisma.sharedList.deleteMany({
      where: {
        id: listId,
        ownerId,
      },
    });
    return result.count > 0;
  }

  /**
   * Add a collaborator to a list
   */
  async addCollaborator(input: AddCollaboratorInput): Promise<Collaborator> {
    return prisma.collaborator.create({
      data: {
        listId: input.listId,
        userId: input.userId,
        role: input.role ?? CollaboratorRole.VIEWER,
      },
    });
  }

  /**
   * Update collaborator role
   */
  async updateCollaboratorRole(
    collaboratorId: number,
    role: CollaboratorRole
  ): Promise<Collaborator> {
    return prisma.collaborator.update({
      where: { id: collaboratorId },
      data: { role },
    });
  }

  /**
   * Accept a collaboration invitation
   */
  async acceptInvitation(collaboratorId: number, userId: number): Promise<Collaborator> {
    return prisma.collaborator.update({
      where: {
        id: collaboratorId,
        userId,
      },
      data: {
        acceptedAt: new Date(),
      },
    });
  }

  /**
   * Remove a collaborator from a list
   */
  async removeCollaborator(collaboratorId: number): Promise<void> {
    await prisma.collaborator.delete({
      where: { id: collaboratorId },
    });
  }

  /**
   * Check if user has permission to perform action on list
   */
  async checkPermission(
    listId: number,
    userId: number,
    requiredRole: 'owner' | 'editor' | 'viewer'
  ): Promise<boolean> {
    const list = await prisma.sharedList.findUnique({
      where: { id: listId },
      include: {
        collaborators: {
          where: {
            userId,
            acceptedAt: { not: null },
          },
        },
      },
    });

    if (!list) {
      return false;
    }

    // Owner has all permissions
    if (list.ownerId === userId) {
      return true;
    }

    const collaboration = list.collaborators[0];
    if (!collaboration) {
      return false;
    }

    // Check role hierarchy
    if (requiredRole === 'viewer') {
      return true; // Any collaborator can view
    }

    if (requiredRole === 'editor') {
      return collaboration.role === CollaboratorRole.EDITOR || collaboration.role === CollaboratorRole.OWNER;
    }

    return false;
  }

  /**
   * Get user's role in a list
   */
  async getUserRole(listId: number, userId: number): Promise<CollaboratorRole | 'owner' | null> {
    const list = await prisma.sharedList.findUnique({
      where: { id: listId },
      include: {
        collaborators: {
          where: {
            userId,
            acceptedAt: { not: null },
          },
        },
      },
    });

    if (!list) {
      return null;
    }

    if (list.ownerId === userId) {
      return 'owner';
    }

    const collaboration = list.collaborators[0];
    return collaboration?.role ?? null;
  }

  /**
   * Get pending invitations for a user
   */
  async getPendingInvitations(userId: number): Promise<Collaborator[]> {
    return prisma.collaborator.findMany({
      where: {
        userId,
        acceptedAt: null,
      },
      include: {
        list: {
          include: {
            owner: {
              select: { id: true, email: true },
            },
          },
        },
      },
    });
  }
}

export const sharedListService = new SharedListService();
