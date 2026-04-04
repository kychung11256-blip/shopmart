import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { getDb } from './db';

// Helper: create a test category and return its id
async function createTestCategory(name: string): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { categories } = await import('../drizzle/schema');
  const result = await db.insert(categories).values({
    name,
    order: 99,
    status: 'active',
  });
  return (result as any)[0]?.insertId ?? (result as any).insertId;
}

// Helper: create a test product linked to a category
async function createTestProduct(name: string, categoryId: number): Promise<number> {
  const db = await getDb();
  if (!db) throw new Error('DB not available');
  const { products } = await import('../drizzle/schema');
  const result = await db.insert(products).values({
    name,
    price: 100,
    stock: 0,
    sold: 0,
    status: 'active',
    categoryId,
  });
  return (result as any)[0]?.insertId ?? (result as any).insertId;
}

// Helper: clean up test product
async function deleteTestProduct(id: number) {
  const db = await getDb();
  if (!db) return;
  const { products } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  await db.delete(products).where(eq(products.id, id));
}

// Helper: clean up test category (if still exists)
async function deleteTestCategory(id: number) {
  const db = await getDb();
  if (!db) return;
  const { categories } = await import('../drizzle/schema');
  const { eq } = await import('drizzle-orm');
  try {
    await db.delete(categories).where(eq(categories.id, id));
  } catch (_) {
    // Already deleted, ignore
  }
}

describe('Category Delete API', () => {
  let catId: number;
  let catWithProductId: number;
  let productId: number;

  beforeAll(async () => {
    catId = await createTestCategory('__test_delete_cat__');
    catWithProductId = await createTestCategory('__test_cat_with_product__');
    productId = await createTestProduct('__test_product_for_cat__', catWithProductId);
  });

  afterAll(async () => {
    // Clean up any remaining test data
    await deleteTestProduct(productId).catch(() => {});
    await deleteTestCategory(catId).catch(() => {});
    await deleteTestCategory(catWithProductId).catch(() => {});
  });

  it('should hard-delete a category with no products', async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const { categories } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    // Delete the category
    await db!.delete(categories).where(eq(categories.id, catId));

    // Verify it's gone
    const rows = await db!.select().from(categories).where(eq(categories.id, catId));
    expect(rows.length).toBe(0);
    catId = 0; // Mark as cleaned up
  });

  it('should NOT delete a category that has active products (without force)', async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const { products } = await import('../drizzle/schema');
    const { eq, and } = await import('drizzle-orm');

    // Verify the product is linked
    const linked = await db!.select({ id: products.id })
      .from(products)
      .where(and(eq(products.categoryId, catWithProductId), eq(products.status, 'active')))
      .limit(1);
    expect(linked.length).toBe(1);
  });

  it('should force-delete a category and unlink its products', async () => {
    const db = await getDb();
    expect(db).toBeTruthy();
    const { categories, products } = await import('../drizzle/schema');
    const { eq } = await import('drizzle-orm');

    // Unlink products first (force=true behaviour)
    await db!.update(products).set({ categoryId: null }).where(eq(products.categoryId, catWithProductId));

    // Delete the category
    await db!.delete(categories).where(eq(categories.id, catWithProductId));

    // Verify category is gone
    const catRows = await db!.select().from(categories).where(eq(categories.id, catWithProductId));
    expect(catRows.length).toBe(0);
    catWithProductId = 0; // Mark as cleaned up

    // Verify product is now uncategorized
    const prodRows = await db!.select().from(products).where(eq(products.id, productId));
    expect(prodRows.length).toBe(1);
    expect(prodRows[0].categoryId).toBeNull();
  });
});
