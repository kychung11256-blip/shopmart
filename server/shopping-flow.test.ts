import { describe, it, expect, beforeAll } from 'vitest';
import { appRouter } from './routers';

describe('Complete Shopping Flow', () => {
  let caller: ReturnType<typeof appRouter.createCaller>;

  beforeAll(async () => {
    // 創建 TRPC caller
    caller = appRouter.createCaller({
      user: { id: 1, email: 'test@example.com', role: 'admin', name: 'Test User' },
    });
  });

  it('should add product to cart', async () => {
    const result = await caller.cart.add({
      productId: 1,
      quantity: 2,
    });
    expect(result.success).toBe(true);
  });

  it('should list cart items', async () => {
    // 先添加商品
    await caller.cart.add({
      productId: 1,
      quantity: 1,
    });

    // 獲取購物車
    const cartItems = await caller.cart.list();
    expect(cartItems.length).toBeGreaterThan(0);
    expect(cartItems[0]).toHaveProperty('productId');
    expect(cartItems[0]).toHaveProperty('quantity');
  });

  it('should calculate cart total correctly', async () => {
    // 清空購物車
    const existingItems = await caller.cart.list();
    for (const item of existingItems) {
      await caller.cart.remove(item.id);
    }

    // 添加多個商品
    await caller.cart.add({
      productId: 1,
      quantity: 2,
    });

    // 獲取購物車並驗證總數
    const cartItems = await caller.cart.list();
    const totalQuantity = cartItems.reduce((sum: number, item: any) => sum + item.quantity, 0);
    expect(totalQuantity).toBeGreaterThanOrEqual(2);
  });

  it('should remove item from cart', async () => {
    // 添加商品
    await caller.cart.add({
      productId: 1,
      quantity: 1,
    });

    // 獲取購物車
    let cartItems = await caller.cart.list();
    const itemToRemove = cartItems[0];
    expect(itemToRemove).toBeDefined();

    // 刪除商品
    const removeResult = await caller.cart.remove(itemToRemove.id);
    expect(removeResult.success).toBe(true);

    // 驗證商品已刪除
    cartItems = await caller.cart.list();
    const stillExists = cartItems.find((item: any) => item.id === itemToRemove.id);
    expect(stillExists).toBeUndefined();
  });

  it('should get product by id', async () => {
    const product = await caller.products.getById(1);
    expect(product).toBeDefined();
    expect(product.id).toBe(1);
    expect(product).toHaveProperty('name');
    expect(product).toHaveProperty('price');
  });

  it('should list products with filters', async () => {
    const products = await caller.products.list({
      limit: 10,
    });
    expect(Array.isArray(products)).toBe(true);
    expect(products.length).toBeGreaterThan(0);
  });

  it('should get categories', async () => {
    const categories = await caller.categories.list();
    expect(Array.isArray(categories)).toBe(true);
  });
});
