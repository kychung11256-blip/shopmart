import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db';
import { orders, orderItems } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function handleNexapayWebhook(req: Request, res: Response) {
  try {
    const signature = req.headers['x-nexapay-signature'] as string;
    const timestamp = req.headers['x-nexapay-timestamp'] as string;
    const payload = JSON.stringify(req.body);

    // Verify HMAC signature
    const webhookSecret = process.env.NEXAPAY_WEBHOOK_SECRET;
    if (!webhookSecret) {
      console.error('[Nexapay Webhook] NEXAPAY_WEBHOOK_SECRET not configured');
      return res.status(400).json({ error: 'Webhook secret not configured' });
    }

    if (!signature || !timestamp) {
      console.error('[Nexapay Webhook] Missing signature or timestamp headers');
      return res.status(401).json({ error: 'Missing signature or timestamp' });
    }

    // Verify signature
    const expectedSig = 'sha256=' + crypto
      .createHmac('sha256', webhookSecret)
      .update(timestamp + '.' + payload)
      .digest('hex');

    if (signature !== expectedSig) {
      console.error('[Nexapay Webhook] Invalid signature');
      return res.status(401).json({ error: 'Invalid signature' });
    }

    // Reject old webhooks (replay protection)
    const maxAge = 5 * 60 * 1000; // 5 minutes
    if (Math.abs(Date.now() - parseInt(timestamp)) > maxAge) {
      console.error('[Nexapay Webhook] Webhook expired');
      return res.status(401).json({ error: 'Webhook expired' });
    }

    const { order_id, payment_id, status, amount, txid } = req.body;

    console.log(`[Nexapay Webhook] Received webhook: order_id=${order_id}, status=${status}`);

    if (status === 'completed') {
      // Update order status to paid
      const db = await getDb();
      if (!db) {
        console.error('[Nexapay Webhook] Database not available');
        return res.status(500).json({ error: 'Database not available' });
      }

      // Find order by order_id (which is the Nexapay order_id)
      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(order_id)))
        .limit(1);

      if (existingOrders.length === 0) {
        console.warn(`[Nexapay Webhook] Order not found: ${order_id}`);
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = existingOrders[0];

      // Update order status
      await db
        .update(orders)
        .set({
          status: 'paid',
          paymentMethod: 'nexapay',
          transactionId: txid || payment_id,
          updatedAt: new Date(),
        })
        .where(eq(orders.id, order.id));

      console.log(`[Nexapay Webhook] Order ${order_id} marked as paid. Transaction ID: ${txid}`);
      return res.json({ received: true, status: 'Order marked as paid' });
    } else if (status === 'failed') {
      // Update order status to failed
      const db = await getDb();
      if (!db) {
        console.error('[Nexapay Webhook] Database not available');
        return res.status(500).json({ error: 'Database not available' });
      }

      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(order_id)))
        .limit(1);

      if (existingOrders.length > 0) {
        await db
          .update(orders)
          .set({
            status: 'failed',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, existingOrders[0].id));

        console.log(`[Nexapay Webhook] Order ${order_id} marked as failed`);
      }

      return res.json({ received: true, status: 'Order marked as failed' });
    } else if (status === 'expired') {
      // Update order status to cancelled
      const db = await getDb();
      if (!db) {
        console.error('[Nexapay Webhook] Database not available');
        return res.status(500).json({ error: 'Database not available' });
      }

      const existingOrders = await db
        .select()
        .from(orders)
        .where(eq(orders.id, parseInt(order_id)))
        .limit(1);

      if (existingOrders.length > 0) {
        await db
          .update(orders)
          .set({
            status: 'cancelled',
            updatedAt: new Date(),
          })
          .where(eq(orders.id, existingOrders[0].id));

        console.log(`[Nexapay Webhook] Order ${order_id} marked as cancelled (expired)`);
      }

      return res.json({ received: true, status: 'Order marked as cancelled' });
    }

    console.log(`[Nexapay Webhook] Unknown status: ${status}`);
    return res.json({ received: true, status: 'Unknown status' });
  } catch (error: any) {
    console.error('[Nexapay Webhook] Error processing webhook:', error);
    res.status(500).json({ error: error.message || 'Internal server error' });
  }
}
