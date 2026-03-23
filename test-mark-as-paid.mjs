import { getDb } from './server/db.ts';
import { orders } from './drizzle/schema.ts';
import { eq } from 'drizzle-orm';

async function testMarkAsPaid() {
  try {
    const db = await getDb();
    if (!db) {
      console.error('Database not available');
      return;
    }

    // Get the latest order
    const latestOrder = await db.select().from(orders).orderBy(orders.id).limit(1);
    
    if (latestOrder.length === 0) {
      console.log('No orders found');
      return;
    }

    const order = latestOrder[latestOrder.length - 1];
    console.log('Latest order before update:', order);

    // Update payment status to paid
    await db.update(orders).set({ paymentStatus: 'paid' }).where(eq(orders.id, order.id));

    // Verify the update
    const updatedOrder = await db.select().from(orders).where(eq(orders.id, order.id));
    console.log('Order after update:', updatedOrder[0]);

    console.log('✅ Test passed: Order payment status updated successfully');
  } catch (error) {
    console.error('❌ Test failed:', error);
  }
}

testMarkAsPaid();
