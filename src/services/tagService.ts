import { prisma } from '../lib/prisma';
import { Tag } from '@prisma/client';

export type { Tag } from '@prisma/client';

export type CreateTagInput = {
  name: string;
  color?: string;
};

export type UpdateTagInput = Partial<CreateTagInput>;

class TagService {
  async getAll(): Promise<Tag[]> {
    return prisma.tag.findMany({
      orderBy: { name: 'asc' },
    });
  }

  async getById(id: number): Promise<Tag | null> {
    return prisma.tag.findUnique({ where: { id } });
  }

  async getByName(name: string): Promise<Tag | null> {
    return prisma.tag.findUnique({ where: { name } });
  }

  async create(input: CreateTagInput): Promise<Tag> {
    return prisma.tag.create({ data: input });
  }

  async update(id: number, updates: UpdateTagInput): Promise<Tag | null> {
    try {
      return await prisma.tag.update({
        where: { id },
        data: updates,
      });
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return null;
      }
      throw error;
    }
  }

  async delete(id: number): Promise<boolean> {
    try {
      await prisma.tag.delete({ where: { id } });
      return true;
    } catch (error) {
      if ((error as { code?: string }).code === 'P2025') {
        return false;
      }
      throw error;
    }
  }

  async findOrCreate(name: string, color?: string): Promise<Tag> {
    const existing = await this.getByName(name);
    if (existing) return existing;
    return this.create({ name, color });
  }
}

export const tagService = new TagService();
