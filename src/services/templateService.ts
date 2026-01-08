import { prisma } from '../lib/prisma';
import {
  Template,
  TemplateVariable,
  TemplateCategory,
  TemplateVariableType,
  Priority,
} from '@prisma/client';
import { todoService } from './todoService';

export {
  Template,
  TemplateVariable,
  TemplateCategory,
  TemplateVariableType,
} from '@prisma/client';

export type CreateTemplateInput = {
  name: string;
  description?: string;
  title: string;
  content: string;
  priority?: Priority;
  userId?: number;
  categoryId?: number;
  isPublic?: boolean;
  variables?: CreateTemplateVariableInput[];
};

export type CreateTemplateVariableInput = {
  name: string;
  label: string;
  type?: TemplateVariableType;
  defaultValue?: string;
  required?: boolean;
  options?: string[];
  order?: number;
};

export type InstantiateTemplateInput = {
  templateId: number;
  userId: number;
  variables: Record<string, any>;
  dueDate?: string;
  listId?: number;
};

export type TemplateWithDetails = Template & {
  variables: TemplateVariable[];
  category?: TemplateCategory | null;
};

class TemplateService {
  /**
   * Create a new template
   */
  async create(input: CreateTemplateInput): Promise<Template> {
    const { variables, ...templateData } = input;

    return prisma.template.create({
      data: {
        ...templateData,
        variables: variables
          ? {
              create: variables.map((v) => ({
                ...v,
                options: v.options ? JSON.stringify(v.options) : null,
              })),
            }
          : undefined,
      },
      include: {
        variables: true,
      },
    });
  }

  /**
   * Get all templates accessible to a user (own + public + system)
   */
  async getAllForUser(userId: number): Promise<TemplateWithDetails[]> {
    return prisma.template.findMany({
      where: {
        OR: [
          { userId }, // User's own templates
          { isPublic: true }, // Public templates
          { isSystem: true }, // System templates
        ],
      },
      include: {
        variables: {
          orderBy: { order: 'asc' },
        },
        category: true,
      },
      orderBy: [
        { isSystem: 'desc' },
        { useCount: 'desc' },
        { createdAt: 'desc' },
      ],
    });
  }

  /**
   * Get a specific template by ID
   */
  async getById(id: number): Promise<TemplateWithDetails | null> {
    return prisma.template.findUnique({
      where: { id },
      include: {
        variables: {
          orderBy: { order: 'asc' },
        },
        category: true,
      },
    });
  }

  /**
   * Update a template (owner only)
   */
  async update(
    id: number,
    userId: number,
    input: Partial<CreateTemplateInput>
  ): Promise<Template> {
    const { variables, ...updateData } = input;

    return prisma.template.update({
      where: {
        id,
        userId, // Only owner can update
      },
      data: updateData,
    });
  }

  /**
   * Delete a template (owner only)
   */
  async delete(id: number, userId: number): Promise<boolean> {
    const result = await prisma.template.deleteMany({
      where: { id, userId },
    });
    return result.count > 0;
  }

  /**
   * Instantiate a template - create a todo from template with variable substitution
   */
  async instantiate(input: InstantiateTemplateInput): Promise<any> {
    const template = await this.getById(input.templateId);

    if (!template) {
      throw new Error('Template not found');
    }

    // Interpolate variables
    let title = template.title;
    let description = template.content;

    template.variables.forEach((variable) => {
      const value =
        input.variables[variable.name] ?? variable.defaultValue ?? '';
      const placeholder = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g');

      title = title.replace(placeholder, String(value));
      description = description.replace(placeholder, String(value));
    });

    // Create the todo
    const todo = await todoService.createForUser(
      {
        title,
        description,
        dueDate: input.dueDate
          ? new Date(input.dueDate)
          : new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
        isComplete: false,
        priority: template.priority,
      },
      input.userId
    );

    // Increment use count
    await prisma.template.update({
      where: { id: template.id },
      data: {
        useCount: { increment: 1 },
      },
    });

    return todo;
  }

  /**
   * Get all categories
   */
  async getAllCategories(): Promise<TemplateCategory[]> {
    return prisma.templateCategory.findMany({
      orderBy: [{ isSystem: 'desc' }, { name: 'asc' }],
    });
  }

  /**
   * Create a category
   */
  async createCategory(input: {
    name: string;
    description?: string;
    icon?: string;
    color?: string;
  }): Promise<TemplateCategory> {
    return prisma.templateCategory.create({
      data: input,
    });
  }

  /**
   * Seed system templates (call once on setup)
   */
  async seedSystemTemplates(): Promise<void> {
    // Create categories
    const categories = await Promise.all([
      prisma.templateCategory.upsert({
        where: { name: 'Work' },
        update: {},
        create: { name: 'Work', icon: '💼', isSystem: true },
      }),
      prisma.templateCategory.upsert({
        where: { name: 'Personal' },
        update: {},
        create: { name: 'Personal', icon: '👤', isSystem: true },
      }),
      prisma.templateCategory.upsert({
        where: { name: 'Projects' },
        update: {},
        create: { name: 'Projects', icon: '📁', isSystem: true },
      }),
    ]);

    const workCategory = categories[0];
    const personalCategory = categories[1];
    const projectsCategory = categories[2];

    // Create system templates
    await prisma.template.upsert({
      where: { id: 1 },
      update: {},
      create: {
        name: 'Client Onboarding',
        description: 'Template for onboarding new clients',
        title: 'Onboard {{client_name}}',
        content:
          `Welcome {{client_name}}!\n\n` +
          `Kickoff meeting scheduled for {{meeting_date}}.\n\n` +
          `Deliverables:\n- Project brief\n- Timeline\n- Contract`,
        priority: Priority.HIGH,
        categoryId: workCategory.id,
        isSystem: true,
        isPublic: true,
        variables: {
          create: [
            {
              name: 'client_name',
              label: 'Client Name',
              type: TemplateVariableType.TEXT,
              required: true,
              order: 0,
            },
            {
              name: 'meeting_date',
              label: 'Meeting Date',
              type: TemplateVariableType.DATE,
              order: 1,
            },
          ],
        },
      },
    });

    await prisma.template.upsert({
      where: { id: 2 },
      update: {},
      create: {
        name: 'Weekly Review',
        description: 'Weekly reflection and planning',
        title: 'Weekly Review - Week {{week_number}}',
        content: `Review:\n- What went well?\n- What needs improvement?\n\nPlan:\n- Top 3 priorities for next week`,
        priority: Priority.MEDIUM,
        categoryId: personalCategory.id,
        isSystem: true,
        isPublic: true,
        variables: {
          create: [
            {
              name: 'week_number',
              label: 'Week Number',
              type: TemplateVariableType.NUMBER,
              order: 0,
            },
          ],
        },
      },
    });

    await prisma.template.upsert({
      where: { id: 3 },
      update: {},
      create: {
        name: 'Bug Report',
        description: 'Template for reporting bugs',
        title: '[BUG] {{bug_title}}',
        content:
          `**Severity:** {{severity}}\n\n` +
          `**Description:**\n{{description}}\n\n` +
          `**Steps to Reproduce:**\n1. {{steps}}\n\n` +
          `**Expected Behavior:**\n{{expected}}\n\n` +
          `**Actual Behavior:**\n{{actual}}`,
        priority: Priority.HIGH,
        categoryId: projectsCategory.id,
        isSystem: true,
        isPublic: true,
        variables: {
          create: [
            {
              name: 'bug_title',
              label: 'Bug Title',
              type: TemplateVariableType.TEXT,
              required: true,
              order: 0,
            },
            {
              name: 'severity',
              label: 'Severity',
              type: TemplateVariableType.SELECT,
              options: JSON.stringify(['Critical', 'High', 'Medium', 'Low']),
              defaultValue: 'Medium',
              order: 1,
            },
            {
              name: 'description',
              label: 'Description',
              type: TemplateVariableType.TEXT,
              required: true,
              order: 2,
            },
            {
              name: 'steps',
              label: 'Steps to Reproduce',
              type: TemplateVariableType.TEXT,
              order: 3,
            },
            {
              name: 'expected',
              label: 'Expected Behavior',
              type: TemplateVariableType.TEXT,
              order: 4,
            },
            {
              name: 'actual',
              label: 'Actual Behavior',
              type: TemplateVariableType.TEXT,
              order: 5,
            },
          ],
        },
      },
    });
  }
}

export const templateService = new TemplateService();
