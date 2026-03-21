import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';
import type { TrpcContext } from './_core/context';
import type { User } from '../drizzle/schema';

describe('Products API', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let adminContext: TrpcContext;
  let userContext: TrpcContext;

  beforeAll(async () => {
    // 創建 mock 上下文
    const mockReq = {
      headers: {},
    } as any;

    const mockRes = {
      clearCookie: () => {},
    } as any;

    // Admin 用戶上下文
    const adminUser: User = {
      id: 1,
      openId: 'admin-user-id',
      name: 'Admin User',
      email: 'admin@test.com',
      role: 'admin',
      loginMethod: 'email',
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    adminContext = {
      req: mockReq,
      res: mockRes,
      user: adminUser,
    };

    // 普通用戶上下文
    const regularUser: User = {
      id: 2,
      openId: 'regular-user-id',
      name: 'Regular User',
      email: 'user@test.com',
      role: 'user',
      loginMethod: 'email',
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    userContext = {
      req: mockReq,
      res: mockRes,
      user: regularUser,
    };

    // 創建 TRPC caller
    caller = appRouter.createCaller(adminContext);
  });

  it('should allow admin to create a product', async () => {
    const result = await caller.products.create({
      name: 'Test Product',
      price: 99.99,
      stock: 50,
      description: 'Test product description',
    });

    expect(result).toBeDefined();
    expect(result.success).toBe(true);
  });

  it('should reject non-admin user from creating a product', async () => {
    const userCaller = appRouter.createCaller(userContext);

    try {
      await userCaller.products.create({
        name: 'Unauthorized Product',
        price: 99.99,
        stock: 50,
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe('FORBIDDEN');
      expect(error.message).toContain('permission');
    }
  });

  it('should reject unauthenticated user from creating a product', async () => {
    const unauthContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };

    const unauthCaller = appRouter.createCaller(unauthContext);

    try {
      await unauthCaller.products.create({
        name: 'Unauthorized Product',
        price: 99.99,
        stock: 50,
      });
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe('UNAUTHORIZED');
    }
  });

  it('should list products publicly', async () => {
    const publicCaller = appRouter.createCaller({
      req: {} as any,
      res: {} as any,
      user: null,
    });

    const products = await publicCaller.products.list({ limit: 10 });
    expect(Array.isArray(products)).toBe(true);
  });
});
