import { Request, Response } from 'express';
import crypto from 'crypto';
import { getDb } from './db';
import { orders, orderItems, products } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';
import { ENV } from './_core/env';

/**
 * Verify TransVoucher webhook signature
 * Signature is HMAC-SHA256 of the raw payload body using the API secret
 */
function verifyTransVoucherSignature(payload: string, signature: string, secret: string): boolean {
  try {
    if (!signature.startsWith('sha256=')) {
      console.error('[TransVoucher Webhook] Invalid signature format');
      return false;
    }
    const signatureHex = signature.slice(7); // strip 'sha256=' prefix
    const computedSignature = crypto
      .createHmac('sha256', secret)
      .update(payload)
      .digest('hex');
    return crypto.timingSafeEqual(
      Buffer.from(signatureHex, 'hex'),
      Buffer.from(computedSignature, 'hex')
    );
  } catch (error) {
    console.error('[TransVoucher Webhook] Signature verification error:', error);
    return false;
  }
}

/**
 * TransVoucher Webhook Handler
 *
 * Supported events:
 * - payment_intent.succeeded: Payment completed successfully
 * - payment_intent.failed: Payment failed
 * - payment_intent.expired: Payment link expired
 * - system.health_check: Health check from TransVoucher dashboard
 */
export async function handleTransVoucherWebhook(req: Request, res: Response) {
  try {
    const rawBody = req.body instanceof Buffer ? req.body.toString('utf8') : JSON.stringify(req.body);
    const signature = req.headers['x-webhook-signature'] as string || req.headers['x-signature'] as string || '';

    console.log('[TransVoucher Webhook] Received event, signature present:', !!signature);

    // Verify signature if secret is configured
    const apiSecret = ENV.transVoucherApiSecret;
    if (apiSecret && signature) {
      const isValid = verifyTransVoucherSignature(rawBody, signature, apiSecret);
      if (!isValid) {
        console.error('[TransVoucher Webhook] Signature verification failed');
        return res.status(400).json({ error: 'Invalid signature' });
      }
    } else if (apiSecret && !signature) {
      console.warn('[TransVoucher Webhook] No signature header present, proceeding without verification');
    }

    let event: any;
    try {
      event = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
    } catch (error) {
      console.error('[TransVoucher Webhook] Failed to parse body:', error);
      return res.status(400).json({ error: 'Invalid JSON body' });
    }

    const eventType = event.event;
    console.log('[TransVoucher Webhook] Event type:', eventType);

    // Handle health check
    if (eventType === 'system.health_check') {
      console.log('[TransVoucher Webhook] Health check received');
      return res.json({ success: true, message: 'Webhook endpoint is healthy' });
    }

    // Handle payment succeeded
    if (eventType === 'payment_intent.succeeded') {
      const transaction = event.data?.transaction;
      const metadata = event.data?.metadata;
      const customerDetails = event.data?.customer_details;

      if (!transaction) {
        console.error('[TransVoucher Webhook] No transaction data in event');
        return res.status(400).json({ error: 'Missing transaction data' });
      }

      const transactionId = transaction.id;
      const orderId = metadata?.order_id ? parseInt(metadata.order_id, 10) : null;

      console.log('[TransVoucher Webhook] Payment succeeded:', {
        transactionId,
        orderId,
        amount: transaction.fiat_total_amount,
        currency: transaction.fiat_currency,
      });

      if (!orderId || isNaN(orderId)) {
        console.error('[TransVoucher Webhook] Cannot extract orderId from metadata:', metadata);
        return res.status(400).json({ error: 'Cannot determine order ID' });
      }

      const db = await getDb();
      if (!db) {
        console.error('[TransVoucher Webhook] Database not available');
        return res.status(500).json({ error: 'Database error' });
      }

      // Find the order
      const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
      if (orderResult.length === 0) {
        console.error('[TransVoucher Webhook] Order not found:', orderId);
        return res.status(404).json({ error: 'Order not found' });
      }

      const order = orderResult[0];

      // Only update if not already paid
      if (order.paymentStatus === 'paid') {
        console.log('[TransVoucher Webhook] Order already paid, skipping:', orderId);
        return res.json({ success: true, message: 'Order already processed' });
      }

      // Update order status
      await db.update(orders).set({
        paymentStatus: 'paid',
        status: 'processing',
        paymentMethod: 'transvoucher',
        updatedAt: new Date().toISOString(),
      }).where(eq(orders.id, orderId));

      console.log('[TransVoucher Webhook] Order updated to paid:', orderId);

      // Send confirmation email if customer email is available
      const customerEmail = customerDetails?.email || order.guestEmail;
      const customerName = customerDetails?.first_name
        ? `${customerDetails.first_name} ${customerDetails.last_name || ''}`.trim()
        : 'Customer';

      if (customerEmail && customerEmail.includes('@')) {
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
              buyer: { name: customerName, email: customerEmail },
              items: itemsWithProducts.map(i => ({ nftTitle: i.name, quantity: i.quantity, unitPrice: Math.round(i.price * 100) })),
              paymentMethod: 'TransVoucher',
              config: invoiceConfig,
            });
          } catch (pdfErr: any) {
            console.warn('[TransVoucher Webhook] Failed to generate invoice PDF:', pdfErr.message);
          }

          await sendOrderConfirmationEmail({
            toEmail: customerEmail,
            customerName,
            orderNumber: order.orderNumber,
            totalPrice: totalPriceStr,
            items: itemsSummary,
            invoicePdfBuffer,
            qrCodeItems: qrCodeItems.length > 0 ? qrCodeItems : undefined,
          });
          console.log('[TransVoucher Webhook] Confirmation email sent to:', customerEmail);
        } catch (emailError) {
          console.error('[TransVoucher Webhook] Failed to send confirmation email:', emailError);
        }
      }

      // Notify owner
      try {
        await notifyOwner({
          title: `TransVoucher Payment Received - Order #${orderId}`,
          content: `Order #${orderId} has been paid via TransVoucher.\nTransaction ID: ${transactionId}\nAmount: ${transaction.fiat_total_amount} ${transaction.fiat_currency}`,
        });
      } catch (notifyError) {
        console.error('[TransVoucher Webhook] Failed to notify owner:', notifyError);
      }

      return res.json({ success: true });
    }

    // Handle payment failed
    if (eventType === 'payment_intent.failed') {
      const transaction = event.data?.transaction;
      const metadata = event.data?.metadata;
      const failReason = event.data?.fail_reason;

      const orderId = metadata?.order_id ? parseInt(metadata.order_id, 10) : null;
      console.log('[TransVoucher Webhook] Payment failed:', {
        orderId,
        transactionId: transaction?.id,
        failReason,
      });

      if (orderId && !isNaN(orderId)) {
        const db = await getDb();
        if (db) {
      await db.update(orders).set({
        paymentStatus: 'failed',
        updatedAt: new Date().toISOString(),
      }).where(eq(orders.id, orderId));
        }
      }

      return res.json({ success: true });
    }

    // Handle payment link expired
    if (eventType === 'payment_link.expired') {
      const metadata = event.data?.metadata;
      const orderId = metadata?.order_id ? parseInt(metadata.order_id, 10) : null;
      console.log('[TransVoucher Webhook] Payment link expired, orderId:', orderId);
      return res.json({ success: true });
    }

    // Unknown event type - acknowledge receipt
    console.log('[TransVoucher Webhook] Unhandled event type:', eventType);
    return res.json({ success: true, message: 'Event received but not processed' });

  } catch (error: any) {
    console.error('[TransVoucher Webhook] Unexpected error:', error);
    return res.status(500).json({ error: 'Internal server error' });
  }
}
