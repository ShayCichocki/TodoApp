import { PrismaClient, Priority } from '@prisma/client';
import { PrismaLibSql } from '@prisma/adapter-libsql';

const adapter = new PrismaLibSql({
  url: process.env['DATABASE_URL'] || 'file:./prisma/dev.db',
});

const prisma = new PrismaClient({ adapter });

async function main() {
  await prisma.todoTag.deleteMany();
  await prisma.todo.deleteMany();
  await prisma.tag.deleteMany();

  console.log('Database cleared');

  const workTag = await prisma.tag.create({
    data: { name: 'Work', color: '#3B82F6' }
  });

  const personalTag = await prisma.tag.create({
    data: { name: 'Personal', color: '#10B981' }
  });

  const urgentTag = await prisma.tag.create({
    data: { name: 'Urgent', color: '#EF4444' }
  });

  const shoppingTag = await prisma.tag.create({
    data: { name: 'Shopping', color: '#F59E0B' }
  });

  console.log('Tags created');

  await prisma.todo.create({
    data: {
      title: 'Complete Prisma integration',
      description: 'Integrate Prisma with SQLite for the TODO app',
      dueDate: new Date('2025-01-10'),
      isComplete: false,
      priority: Priority.HIGH,
      tags: {
        create: [
          { tagId: workTag.id },
          { tagId: urgentTag.id }
        ]
      }
    }
  });

  await prisma.todo.create({
    data: {
      title: 'Buy groceries',
      description: 'Milk, eggs, bread, vegetables',
      dueDate: new Date('2025-01-06'),
      isComplete: false,
      priority: Priority.MEDIUM,
      tags: {
        create: [{ tagId: shoppingTag.id }]
      }
    }
  });

  await prisma.todo.create({
    data: {
      title: 'Review pull requests',
      description: 'Review pending PRs from the team',
      dueDate: new Date('2025-01-07'),
      isComplete: false,
      priority: Priority.HIGH,
      tags: {
        create: [{ tagId: workTag.id }]
      }
    }
  });

  await prisma.todo.create({
    data: {
      title: 'Schedule dentist appointment',
      description: 'Call Dr. Smith\'s office',
      dueDate: new Date('2025-01-08'),
      isComplete: false,
      priority: Priority.LOW,
      tags: {
        create: [{ tagId: personalTag.id }]
      }
    }
  });

  await prisma.todo.create({
    data: {
      title: 'Completed task example',
      description: 'This task is already done',
      dueDate: new Date('2025-01-05'),
      isComplete: true,
      priority: Priority.MEDIUM,
      tags: {
        create: [{ tagId: workTag.id }]
      }
    }
  });

  console.log('Sample todos created');
}

main()
  .catch((e) => {
    console.error('Error seeding database:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
