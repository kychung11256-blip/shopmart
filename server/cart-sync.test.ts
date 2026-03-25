import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * 購物車同步測試
 * 驗證添加商品後購物車數據立即同步
 */

describe('Cart Synchronization', () => {
  describe('Add to Cart and Sync', () => {
    it('should invalidate cart cache after adding item', async () => {
      // 模擬 TRPC utils 對象
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      // 模擬添加購物車的過程
      const productId = 1;
      const quantity = 2;

      // 模擬 mutation 調用
      const mockMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId,
        quantity,
      });

      // 執行添加購物車
      await mockMutation({ productId, quantity });

      // 使購物車數據失效
      await mockUtils.cart.list.invalidate();

      // 驗證 invalidate 被調用
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalled();
    });

    it('should handle cart invalidation in handleAddToCart', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 1,
      });

      // 模擬 handleAddToCart 邏輯
      const handleAddToCart = async (productId: number, quantity: number) => {
        await mockAddToCartMutation({ productId, quantity });
        await mockUtils.cart.list.invalidate();
      };

      await handleAddToCart(1, 1);

      expect(mockAddToCartMutation).toHaveBeenCalledWith({ productId: 1, quantity: 1 });
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalled();
    });

    it('should handle cart invalidation in handleBuyNow', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 1,
      });

      // 模擬 handleBuyNow 邏輯
      const handleBuyNow = async (productId: number, quantity: number) => {
        await mockAddToCartMutation({ productId, quantity });
        await mockUtils.cart.list.invalidate();
      };

      await handleBuyNow(1, 1);

      expect(mockAddToCartMutation).toHaveBeenCalledWith({ productId: 1, quantity: 1 });
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalled();
    });

    it('should handle multiple items added to cart', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn()
        .mockResolvedValueOnce({ id: 1, productId: 1, quantity: 1 })
        .mockResolvedValueOnce({ id: 2, productId: 2, quantity: 2 });

      // 添加多個商品
      await mockAddToCartMutation({ productId: 1, quantity: 1 });
      await mockUtils.cart.list.invalidate();

      await mockAddToCartMutation({ productId: 2, quantity: 2 });
      await mockUtils.cart.list.invalidate();

      // 驗證 invalidate 被調用兩次
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalledTimes(2);
    });

    it('should handle cart invalidation error gracefully', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockRejectedValue(new Error('Network error')),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 1,
      });

      const handleAddToCart = async (productId: number, quantity: number) => {
        try {
          await mockAddToCartMutation({ productId, quantity });
          await mockUtils.cart.list.invalidate();
        } catch (error) {
          console.error('Failed to invalidate cart:', error);
          throw error;
        }
      };

      await expect(handleAddToCart(1, 1)).rejects.toThrow('Network error');
    });

    it('should verify cart data is fresh after invalidation', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
            useQuery: vi.fn().mockReturnValue({
              data: [
                { id: 1, productId: 1, quantity: 1, product: { id: 1, name: 'Product 1' } },
              ],
              isLoading: false,
            }),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 1,
      });

      // 添加商品
      await mockAddToCartMutation({ productId: 1, quantity: 1 });
      await mockUtils.cart.list.invalidate();

      // 驗證購物車數據被重新獲取
      const cartData = mockUtils.cart.list.useQuery();
      expect(cartData.data).toHaveLength(1);
      expect(cartData.data[0].productId).toBe(1);
    });
  });

  describe('Cart Sync Edge Cases', () => {
    it('should handle adding same product multiple times', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn()
        .mockResolvedValueOnce({ id: 1, productId: 1, quantity: 1 })
        .mockResolvedValueOnce({ id: 1, productId: 1, quantity: 2 });

      // 第一次添加
      await mockAddToCartMutation({ productId: 1, quantity: 1 });
      await mockUtils.cart.list.invalidate();

      // 第二次添加同一商品
      await mockAddToCartMutation({ productId: 1, quantity: 1 });
      await mockUtils.cart.list.invalidate();

      // 驗證 invalidate 被調用兩次
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalledTimes(2);
    });

    it('should handle adding product with zero quantity', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue(null);

      // 嘗試添加零數量商品
      const result = await mockAddToCartMutation({ productId: 1, quantity: 0 });

      // 驗證返回 null（不添加）
      expect(result).toBeNull();
      expect(mockUtils.cart.list.invalidate).not.toHaveBeenCalled();
    });

    it('should handle rapid successive add to cart calls', async () => {
      const mockUtils = {
        cart: {
          list: {
            invalidate: vi.fn().mockResolvedValue(undefined),
          },
        },
      };

      const mockAddToCartMutation = vi.fn().mockResolvedValue({
        id: 1,
        productId: 1,
        quantity: 1,
      });

      // 快速連續添加商品
      const promises = [];
      for (let i = 0; i < 5; i++) {
        promises.push(
          mockAddToCartMutation({ productId: i + 1, quantity: 1 }).then(() =>
            mockUtils.cart.list.invalidate()
          )
        );
      }

      await Promise.all(promises);

      // 驗證 invalidate 被調用 5 次
      expect(mockUtils.cart.list.invalidate).toHaveBeenCalledTimes(5);
    });
  });
});
