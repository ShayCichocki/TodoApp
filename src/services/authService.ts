import { userService, UserWithoutPassword } from './userService';
import { subscriptionService } from './subscriptionService';

export type RegisterInput = {
  email: string;
  password: string;
};

export type LoginInput = {
  email: string;
  password: string;
};

export type AuthResult = {
  success: boolean;
  user?: UserWithoutPassword;
  error?: string;
};

class AuthService {
  async register(input: RegisterInput): Promise<AuthResult> {
    const existingUser = await userService.findByEmail(input.email);
    if (existingUser) {
      return {
        success: false,
        error: 'An account with this email already exists',
      };
    }

    try {
      const user = await userService.create(input);

      // Create FREE subscription for new user
      await subscriptionService.create({ userId: user.id });

      return {
        success: true,
        user,
      };
    } catch (error) {
      return {
        success: false,
        error: 'Failed to create account',
      };
    }
  }

  async login(input: LoginInput): Promise<AuthResult> {
    const user = await userService.findByEmail(input.email);
    if (!user) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    const isValidPassword = await userService.verifyPassword(
      user,
      input.password
    );
    if (!isValidPassword) {
      return {
        success: false,
        error: 'Invalid email or password',
      };
    }

    const { password, ...userWithoutPassword } = user;
    return {
      success: true,
      user: userWithoutPassword,
    };
  }
}

export const authService = new AuthService();
