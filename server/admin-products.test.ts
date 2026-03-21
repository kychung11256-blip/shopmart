import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { appRouter } from './routers';
import { getDb } from './db';
import { products, categories } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Products Management', () => {
  let db: any;
  let adminCaller: any;
  let testCategoryId: number;
  let testProductId: number;

  beforeAll(async () => {
    db = await getDb();
    if (!db) throw new Error('Database not available');

    // Create admin context
    const adminCtx = {
      user: {
        id: 'test-admin',
        email: 'admin@test.com',
        role: 'admin',
        name: 'Test Admin',
      },
      req: {} as any,
      res: {} as any,
    };

    adminCaller = appRouter.createCaller(adminCtx);

    // Create a test category
    const catResult = await db.insert(categories).values({
      name: 'Test Category',
      description: 'Test category for admin products',
    });
    testCategoryId = 1; // Use default category ID
  });

  afterAll(async () => {
    if (db) {
      // Clean up test data
      await db.delete(products).where(eq(products.id, testProductId));
      await db.delete(categories).where(eq(categories.id, testCategoryId));
    }
  });

  it('should create a new product with admin privileges', async () => {
    const result = await adminCaller.products.create({
      name: 'Test Product',
      price: 9999, // $99.99
      stock: 10,
      categoryId: testCategoryId,
      description: 'A test product',
      image: 'https://example.com/test.jpg',
    });

    expect(result).toHaveProperty('success', true);
  });

  it('should update an existing product', async () => {
    // First create a product
    const createResult = await adminCaller.products.create({
      name: 'Update Test Product',
      price: 5000,
      stock: 5,
      categoryId: testCategoryId,
      description: 'Original description',
    });

    expect(createResult.success).toBe(true);

    // Get the product ID
    const allProducts = await adminCaller.products.list({ limit: 100 });
    const product = allProducts.find((p: any) => p.name === 'Update Test Product');
    testProductId = product.id;

    // Update the product
    const updateResult = await adminCaller.products.update({
      id: testProductId,
      name: 'Updated Product Name',
      price: 7500,
      description: 'Updated description',
      stock: 15,
    });

    expect(updateResult).toHaveProperty('success', true);

    // Verify the update
    const updated = await adminCaller.products.getById(testProductId);
    expect(updated.name).toBe('Updated Product Name');
    expect(updated.price).toBe(750000);
    expect(updated.stock).toBe(15);
  });

  it('should delete a product', async () => {
    // Create a product to delete
    const createResult = await adminCaller.products.create({
      name: 'Delete Test Product',
      price: 3000,
      stock: 3,
      categoryId: testCategoryId,
    });

    expect(createResult.success).toBe(true);

    // Get the product ID
    const allProducts = await adminCaller.products.list({ limit: 100 });
    const product = allProducts.find((p: any) => p.name === 'Delete Test Product');
    const productId = product.id;

    // Delete the product
    const deleteResult = await adminCaller.products.delete(productId);
    expect(deleteResult).toHaveProperty('success', true);
  });

  it('should handle price conversion correctly (cents to dollars)', async () => {
    const createResult = await adminCaller.products.create({
      name: 'Price Conversion Test',
      price: 12345, // Should be stored as 123.45
      stock: 1,
      categoryId: testCategoryId,
    });

    expect(createResult.success).toBe(true);

    // Get the product
    const allProducts = await adminCaller.products.list({ limit: 100 });
    const product = allProducts.find((p: any) => p.name === 'Price Conversion Test');
    
    // Price should be stored in cents (1234500 = $12345.00)
    expect(product.price).toBe(1234500);
  });

  it('should list products with pagination', async () => {
    const result = await adminCaller.products.list({ limit: 10, offset: 0 });
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeLessThanOrEqual(10);
  });
});
