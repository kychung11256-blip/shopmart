import type { Request, Response } from 'express';
import Whop from '@whop/sdk';
import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { eq } from 'drizzle-orm';

export async function handleWhopWebhook(req: Request, res: Response) {
  try {
    const apiKey = process.env.WHOP_API_KEY;
    if (!apiKey) {
      console.error('[Whop Webhook] WHOP_API_KEY not configured');
      return res.status(400).json({ error: 'Whop API key not configured' });
    }

    const client = new Whop({ apiKey });
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));

    let event: any;
    try {
      event = client.webhooks.unwrap(bodyText, { headers });
    } catch (err: any) {
      console.error('[Whop Webhook] Signature verification failed:', err.message);
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('[Whop Webhook] Event received:', event.type, event.data?.id);

    if (event.type === 'payment.succeeded') {
      const payment = event.data;
      const orderId = payment?.metadata?.order_id;

      if (orderId) {
        const db = await getDb();
        if (db) {
          await db.update(orders)
            .set({
              paymentStatus: 'paid',
              status: 'processing',
              whopPaymentId: payment.id,
              updatedAt: new Date().toISOString(),
            })
            .where(eq(orders.id, parseInt(orderId)));
          console.log(`[Whop Webhook] Order ${orderId} marked as paid. Payment ID: ${payment.id}`);
        }
      } else {
        console.warn('[Whop Webhook] payment.succeeded event missing order_id in metadata');
      }
    }

    return res.json({ received: true });
  } catch (error: any) {
    console.error('[Whop Webhook] Unexpected error:', error.message);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
