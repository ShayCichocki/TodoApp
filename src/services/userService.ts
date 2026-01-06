import { prisma } from '../lib/prisma';
import { User } from '@prisma/client';
import { passwordService } from './passwordService';

export type { User } from '@prisma/client';

export type CreateUserInput = {
  email: string;
  password: string;
};

export type UserWithoutPassword = Omit<User, 'password'>;

class UserService {
  async create(input: CreateUserInput): Promise<UserWithoutPassword> {
    const hashedPassword = await passwordService.hash(input.password);

    const user = await prisma.user.create({
      data: {
        email: input.email.toLowerCase().trim(),
        password: hashedPassword,
      },
    });

    return this.sanitizeUser(user);
  }

  async findByEmail(email: string): Promise<User | null> {
    return prisma.user.findUnique({
      where: { email: email.toLowerCase().trim() },
    });
  }

  async findById(id: number): Promise<UserWithoutPassword | null> {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    return user ? this.sanitizeUser(user) : null;
  }

  async verifyPassword(user: User, password: string): Promise<boolean> {
    return passwordService.verify(password, user.password);
  }

  private sanitizeUser(user: User): UserWithoutPassword {
    const { password, ...userWithoutPassword } = user;
    return userWithoutPassword;
  }
}

export const userService = new UserService();
