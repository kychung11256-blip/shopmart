import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';
import { createContext } from './_core/context';
import type { TrpcContext } from './_core/context';
import type { User } from '../drizzle/schema';

describe('Cart API', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;
  let userContext: TrpcContext;
  let mockUser: User;

  beforeAll(async () => {
    // 創建 mock 用戶
    mockUser = {
      id: 1,
      openId: 'test-user-id',
      name: 'Test User',
      email: 'test@example.com',
      role: 'user',
      loginMethod: 'email',
      lastSignedIn: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 創建上下文
    userContext = {
      req: {} as any,
      res: {} as any,
      user: mockUser,
    };

    // 創建 TRPC caller
    caller = appRouter.createCaller(userContext);
  });

  it('should list cart items for authenticated user', async () => {
    const cartItems = await caller.cart.list();
    expect(Array.isArray(cartItems)).toBe(true);
  });

  it('should add item to cart', async () => {
    const result = await caller.cart.add({
      productId: 1,
      quantity: 2,
    });

    expect(result.success).toBe(true);
  });

  it('should remove item from cart', async () => {
    // 首先添加一個項目
    const addResult = await caller.cart.add({
      productId: 2,
      quantity: 1,
    });
    expect(addResult.success).toBe(true);

    // 獲取購物車項目
    const cartItems = await caller.cart.list();
    const itemToRemove = cartItems.find((item: any) => item.productId === 2);

    if (itemToRemove) {
      // 刪除項目
      const removeResult = await caller.cart.remove(itemToRemove.id);
      expect(removeResult.success).toBe(true);

      // 驗證項目已被刪除
      const updatedCart = await caller.cart.list();
      const removedItem = updatedCart.find((item: any) => item.id === itemToRemove.id);
      expect(removedItem).toBeUndefined();
    }
  });

  it('should prevent unauthenticated user from accessing cart', async () => {
    const unauthContext: TrpcContext = {
      req: {} as any,
      res: {} as any,
      user: null,
    };

    const unauthCaller = appRouter.createCaller(unauthContext);

    try {
      await unauthCaller.cart.list();
      expect.fail('Should have thrown an error');
    } catch (error: any) {
      expect(error.code).toBe('UNAUTHORIZED');
    }
  });

  it('should handle duplicate cart items by updating quantity', async () => {
    // 添加第一個項目
    const result1 = await caller.cart.add({
      productId: 4,
      quantity: 1,
    });
    expect(result1.success).toBe(true);

    // 添加相同的項目（應該更新數量）
    const result2 = await caller.cart.add({
      productId: 4,
      quantity: 2,
    });
    expect(result2.success).toBe(true);

    // 驗證購物車中只有一個項目，數量已更新
    const cartItems = await caller.cart.list();
    const item = cartItems.find((item: any) => item.productId === 4);
    expect(item).toBeDefined();
    expect(item?.quantity).toBe(3); // 1 + 2 = 3
  });
});
