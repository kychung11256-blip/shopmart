import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db';
import { orders, orderItems, products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';
import { ENV } from './_core/env';

/**
 * Verify EcomTrade24 webhook signature
 * Signature is HMAC-SHA256 of the raw payload body using the webhook secret
 * Header: X-Signature
 */
function verifyEcomTrade24Signature(payload: string, signature: string, secret: string): boolean {
  try {
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signature, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch (error) {
    console.error('[EcomTrade24 Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * EcomTrade24 Webhook Handler
 *
 * Supported events:
 * - payment.completed: Payment completed successfully
 */
export async function handleEcomTrade24Webhook(req: Request, res: Response) {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-signature'] as string || '';

    console.log('[EcomTrade24 Webhook] Received event, signature present:', !!signature);

    // Verify signature if secret is configured
    const webhookSecret = ENV.ecomTrade24WebhookSecret;
    if (webhookSecret && signature) {
      const isValid = verifyEcomTrade24Signature(rawBody, signature, webhookSecret);
      if (!isValid) {
        console.error('[EcomTrade24 Webhook] Signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else if (webhookSecret && !signature) {
      console.warn('[EcomTrade24 Webhook] No signature header present, proceeding without verification');
    }

    let event: any;
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (error) {
      console.error('[EcomTrade24 Webhook] Failed to parse body:', error);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const eventType = event.event || event.type;
    console.log('[EcomTrade24 Webhook] Event type:', eventType);

    // Handle payment completed
    if (eventType === 'payment.completed') {
      const sessionId = event.session_id;
      const orderId = event.order_id ? parseInt(event.order_id, 10) : null;
      const status = event.status;
      const amount = event.amount;
      const currency = event.currency;
      const customerEmail = event.email;

      console.log('[EcomTrade24 Webhook] Payment completed:', {
        sessionId,
        orderId,
        amount,
        currency,
        status,
      });

      if (!orderId || isNaN(orderId)) {
        console.error('[EcomTrade24 Webhook] Cannot extract orderId from event:', event);
        return res.status(400).json({ error: 'Cannot determine order ID' });
      }

      if (status !== 'paid') {
        console.log('[EcomTrade24 Webhook] Payment status is not paid:', status);
        return res.json({ success: true, message: 'Event received but payment not paid' });
      }

      const db = await getDb();
      if (!db) {
        console.error('[EcomTrade24 Webhook] Database not available');
        return res.status(500).json({ error: 'Database error' });
      }

      // Find the order
      const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (orderResult.length === 0) {
        console.error('[EcomTrade24 Webhook] Order not found:', orderId);
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult[0];

      // Only update if not already paid
      if (order.paymentStatus === 'paid') {
        console.log('[EcomTrade24 Webhook] Order already paid, skipping:', orderId);
        return res.json({ success: true, message: 'Order already processed' });
      }

      // Update order status
      await db.update(orders).set({
        paymentStatus: 'paid',
        status: 'processing',
        paymentMethod: 'ecomtrade24',
        updatedAt: new Date().toISOString(),
      }).where(eq(orders.id, orderId));

      console.log('[EcomTrade24 Webhook] Order updated to paid:', orderId);

      // Send confirmation email if customer email is available
      const emailToUse = customerEmail || order.guestEmail;
      const customerName = 'Customer';

      if (emailToUse && emailToUse.includes('@')) {
        try {
          const { sendOrderConfirmationEmail } = await import('./email-service');
          const { generateInvoicePDF } = await import('./invoice-service');
          const { loadInvoiceConfig } = await import('./invoice-config');

          const itemsWithProducts = await db
            .select({ name: products.name, quantity: orderItems.quantity, price: orderItems.price, qrCodeUrl: products.qrCodeUrl })
            .from(orderItems)
            .innerJoin(products, eq(orderItems.productId, products.id))
            .where(eq(orderItems.orderId, orderId));

          const itemsSummary = itemsWithProducts.map(i => `${i.name} × ${i.quantity}`).join(', ') || 'Order details';
          const totalPriceStr = `$${(order.totalPrice / 100).toFixed(2)}`;
          const qrCodeItems = itemsWithProducts.filter(i => i.qrCodeUrl).map(i => ({ name: i.name, qrCodeUrl: i.qrCodeUrl! }));

          let invoicePdfBuffer: Buffer | undefined;
          try {
            const invoiceConfig = await loadInvoiceConfig();
            invoicePdfBuffer = await generateInvoicePDF({
              invoiceNo: order.orderNumber,
              date: new Date().toISOString().split('T')[0],
              buyer: { name: customerName, email: emailToUse },
              items: itemsWithProducts.map(i => ({ nftTitle: i.name, quantity: i.quantity, unitPrice: Math.round(i.price * 100) })),
              paymentMethod: 'EcomTrade24',
              config: invoiceConfig,
            });
          } catch (pdfErr: any) {
            console.warn('[EcomTrade24 Webhook] Failed to generate invoice PDF:', pdfErr.message);
          }

          await sendOrderConfirmationEmail({
            toEmail: emailToUse,
            customerName,
            orderNumber: order.orderNumber,
            totalPrice: totalPriceStr,
            items: itemsSummary,
            invoicePdfBuffer,
            qrCodeItems: qrCodeItems.length > 0 ? qrCodeItems : undefined,
          });
          console.log('[EcomTrade24 Webhook] Confirmation email sent to:', emailToUse);
        } catch (emailError) {
          console.error('[EcomTrade24 Webhook] Failed to send confirmation email:', emailError);
        }
      }

      // Notify owner
      try {
        await notifyOwner({
          title: `EcomTrade24 Payment Received - Order #${orderId}`,
          content: `Order #${orderId} has been paid via EcomTrade24.\nSession ID: ${sessionId}\nAmount: ${amount} ${currency}`,
        });
      } catch (notifyError) {
        console.error('[EcomTrade24 Webhook] Failed to notify owner:', notifyError);
      }

      return res.json({ success: true });
    }

    // Unknown event type - acknowledge receipt
    console.log('[EcomTrade24 Webhook] Unhandled event type:', eventType);
    return res.json({ success: true, message: 'Event received but not processed' });

  } catch (error: any) {
    console.error('[EcomTrade24 Webhook] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
