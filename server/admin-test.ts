import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';
import { products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

describe('Admin Products API', () => {
  let db: any;

  beforeAll(async () => {
    db = await getDb();
  });

  it('should create a new product directly in database', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    try {
      const testProduct = {
        name: 'Test Admin Product Direct',
        description: 'Created directly via test',
        price: 2999, // $29.99 in cents
        originalPrice: 3999, // $39.99 in cents
        stock: 100,
        sold: 0,
        rating: 0,
        status: 'active' as const,
        categoryId: 1,
      };

      // Insert product
      const result = await db.insert(products).values(testProduct);
      console.log('Insert result:', result);

      // Verify product was created
      const created = await db.select().from(products).where(eq(products.name, 'Test Admin Product Direct'));
      console.log('Created product:', created);

      expect(created.length).toBeGreaterThan(0);
      expect(created[0].name).toBe('Test Admin Product Direct');
      expect(created[0].price).toBe(2999);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });

  it('should list all products', async () => {
    if (!db) {
      console.log('Database not available, skipping test');
      return;
    }

    try {
      const allProducts = await db.select().from(products);
      console.log(`Total products in database: ${allProducts.length}`);
      expect(allProducts.length).toBeGreaterThan(0);
    } catch (error) {
      console.error('Test error:', error);
      throw error;
    }
  });
});
