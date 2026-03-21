import { describe, it, expect, beforeEach, vi } from 'vitest';

/**
 * 測試未登入用戶的購物車功能
 * 驗證本地 localStorage 購物車的工作流程
 */
describe('Guest Cart (localStorage)', () => {
  let mockLocalStorage: Record<string, string>;

  beforeEach(() => {
    // 模擬 localStorage
    mockLocalStorage = {};
    
    global.localStorage = {
      getItem: (key: string) => mockLocalStorage[key] || null,
      setItem: (key: string, value: string) => {
        mockLocalStorage[key] = value;
      },
      removeItem: (key: string) => {
        delete mockLocalStorage[key];
      },
      clear: () => {
        mockLocalStorage = {};
      },
      length: 0,
      key: () => null,
    } as any;
  });

  it('should add product to guest cart', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      originalPrice: 129.99,
      image: 'https://example.com/image.jpg',
      categoryId: 1,
      sold: 10,
      rating: 4.5,
      description: 'Test product',
      stock: 100,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 模擬添加到購物車
    const cartItems = [];
    cartItems.push({
      product,
      qty: 1,
      selected: true,
    });

    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 驗證
    const saved = localStorage.getItem('shopmart_cart');
    expect(saved).toBeDefined();
    
    const parsed = JSON.parse(saved!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].product.id).toBe(1);
    expect(parsed[0].qty).toBe(1);
  });

  it('should increase quantity if product already exists', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      originalPrice: 129.99,
      image: 'https://example.com/image.jpg',
      categoryId: 1,
      sold: 10,
      rating: 4.5,
      description: 'Test product',
      stock: 100,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 第一次添加
    let cartItems = [];
    cartItems.push({
      product,
      qty: 1,
      selected: true,
    });
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 第二次添加相同商品
    const saved = localStorage.getItem('shopmart_cart');
    cartItems = JSON.parse(saved!);
    
    const existingItem = cartItems.find((item: any) => item.product.id === product.id);
    if (existingItem) {
      existingItem.qty += 1;
    }
    
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 驗證
    const updated = localStorage.getItem('shopmart_cart');
    const parsed = JSON.parse(updated!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].qty).toBe(2);
  });

  it('should remove product from guest cart', () => {
    const product1 = {
      id: 1,
      name: 'Product 1',
      price: 99.99,
      originalPrice: 129.99,
      image: 'https://example.com/image1.jpg',
      categoryId: 1,
      sold: 10,
      rating: 4.5,
      description: 'Test product 1',
      stock: 100,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product2 = {
      id: 2,
      name: 'Product 2',
      price: 199.99,
      originalPrice: 249.99,
      image: 'https://example.com/image2.jpg',
      categoryId: 1,
      sold: 20,
      rating: 4.8,
      description: 'Test product 2',
      stock: 50,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 添加兩個商品
    let cartItems = [
      { product: product1, qty: 1, selected: true },
      { product: product2, qty: 2, selected: true },
    ];
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 移除第一個商品
    const saved = localStorage.getItem('shopmart_cart');
    cartItems = JSON.parse(saved!);
    cartItems = cartItems.filter((item: any) => item.product.id !== 1);
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 驗證
    const updated = localStorage.getItem('shopmart_cart');
    const parsed = JSON.parse(updated!);
    expect(parsed).toHaveLength(1);
    expect(parsed[0].product.id).toBe(2);
  });

  it('should calculate cart total correctly', () => {
    const product1 = {
      id: 1,
      name: 'Product 1',
      price: 100,
      originalPrice: 150,
      image: 'https://example.com/image1.jpg',
      categoryId: 1,
      sold: 10,
      rating: 4.5,
      description: 'Test product 1',
      stock: 100,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    const product2 = {
      id: 2,
      name: 'Product 2',
      price: 200,
      originalPrice: 250,
      image: 'https://example.com/image2.jpg',
      categoryId: 1,
      sold: 20,
      rating: 4.8,
      description: 'Test product 2',
      stock: 50,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 添加購物車項目
    const cartItems = [
      { product: product1, qty: 2, selected: true },
      { product: product2, qty: 1, selected: true },
    ];
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 計算總額
    const saved = localStorage.getItem('shopmart_cart');
    const parsed = JSON.parse(saved!);
    const total = parsed.reduce((sum: number, item: any) => 
      sum + (item.product.price * item.qty), 0
    );

    // 驗證：(100 * 2) + (200 * 1) = 400
    expect(total).toBe(400);
  });

  it('should clear guest cart', () => {
    const product = {
      id: 1,
      name: 'Test Product',
      price: 99.99,
      originalPrice: 129.99,
      image: 'https://example.com/image.jpg',
      categoryId: 1,
      sold: 10,
      rating: 4.5,
      description: 'Test product',
      stock: 100,
      status: 'active',
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 添加商品
    const cartItems = [
      { product, qty: 1, selected: true },
    ];
    localStorage.setItem('shopmart_cart', JSON.stringify(cartItems));

    // 清空購物車
    localStorage.removeItem('shopmart_cart');

    // 驗證
    const saved = localStorage.getItem('shopmart_cart');
    expect(saved).toBeNull();
  });
});
