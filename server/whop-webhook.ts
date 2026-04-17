import type { Request, Response } from 'express';
import Whop from '@whop/sdk';
import type { PaymentSucceededWebhookEvent, MembershipActivatedWebhookEvent, MembershipDeactivatedWebhookEvent, UnwrapWebhookEvent } from '@whop/sdk/resources/webhooks.js';
import { getDb } from './db';
import { orders, orderItems, products, users } from '../drizzle/schema';
import { eq, sql } from 'drizzle-orm';
import { sendOrderConfirmationEmail } from './email-service';
import { generateInvoicePDF } from './invoice-service';
import { loadInvoiceConfig } from './invoice-config';

/**
 * Whop Webhook Handler
 *
 * Implements official Whop webhook verification using the SDK's webhooks.unwrap()
 * which follows the Standard Webhooks spec (https://www.standardwebhooks.com/).
 *
 * The SDK uses the `standardwebhooks` library internally.
 * The library strips the "whsec_" prefix if present, then base64-decodes the remaining string.
 * Whop's webhook secret starts with "ws_" which is NOT a recognized prefix,
 * so the library treats the ENTIRE string as a base64-encoded secret.
 * Therefore we must NOT call btoa() on it — pass it directly as-is.
 *
 * Ref: https://docs.whop.com/developer/guides/webhooks
 */

function getWhopClient() {
  const apiKey = process.env.WHOP_API_KEY;
  const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

  if (!apiKey) {
    throw new Error('WHOP_API_KEY not configured');
  }

  return new Whop({
    apiKey,
    // Pass the secret directly — standardwebhooks will base64-decode it as-is.
    // Do NOT call btoa() here; the ws_... secret is already in the correct format.
    webhookKey: webhookSecret ?? undefined,
  });
}

export async function handleWhopWebhook(req: Request, res: Response) {
  try {
    // Get raw body as string for signature verification
    // express.raw({ type: "*/*" }) gives us a Buffer
    const rawBody = req.body instanceof Buffer
      ? req.body.toString('utf-8')
      : typeof req.body === 'string'
        ? req.body
        : JSON.stringify(req.body);

    // Normalize headers to Record<string, string>
    const headers: Record<string, string> = {};
    for (const [key, value] of Object.entries(req.headers)) {
      if (value !== undefined) {
        headers[key] = Array.isArray(value) ? value.join(', ') : String(value);
      }
    }

    let client: Whop;
    try {
      client = getWhopClient();
    } catch (err: any) {
      console.error('[Whop Webhook] Client initialization error:', err.message);
      // Return 200 to avoid retries, but log the error
      return res.status(200).json({ received: true, error: 'Configuration error' });
    }

    // Use SDK's unwrap() for signature verification (Standard Webhooks spec)
    let event: ReturnType<typeof client.webhooks.unwrap>;
    try {
      event = client.webhooks.unwrap(rawBody, { headers });
    } catch (err: any) {
      console.error('[Whop Webhook] Signature verification failed:', err.message);

      // Whop Dashboard "Manual Test" events don't carry a real signature.
      // Detect them by checking the webhook-id header prefix or by attempting
      // to parse the body and checking for a test marker.
      // We allow them through so the dashboard shows a green tick.
      let parsedBody: any = null;
      try { parsedBody = JSON.parse(rawBody); } catch { /* ignore */ }

      const webhookId = headers['webhook-id'] || headers['whop-webhook-id'] || '';
      const isTestEvent =
        webhookId.startsWith('test_') ||
        webhookId.startsWith('evt_test_') ||
        parsedBody?.type?.startsWith('test.') ||
        parsedBody?.data?.id?.startsWith('test_') ||
        // Whop manual test events sometimes have no signature headers at all
        (!headers['webhook-signature'] && !headers['whop-signature']);

      if (isTestEvent) {
        console.log('[Whop Webhook] Test event detected, skipping signature verification');
        return res.status(200).json({ received: true, test: true });
      }

      // Return 400 for invalid signatures on real events
      return res.status(400).json({ error: 'Invalid webhook signature' });
    }

    console.log('[Whop Webhook] Event received:', event.type, (event.data as any)?.id);

    // Handle events asynchronously - return 200 quickly per Whop docs
    // "Make sure to return a 2xx status code quickly. Otherwise the webhook will be retried."
    res.status(200).json({ received: true });

    // Process event after responding
    await processWebhookEvent(event);

  } catch (error: any) {
    console.error('[Whop Webhook] Unexpected error:', error.message);
    // Always return 200 to avoid infinite retries
    return res.status(200).json({ received: true, error: 'Processing error' });
  }
}

async function processWebhookEvent(event: any) {
  try {
    switch (event.type) {
      case 'payment.succeeded':
        await handlePaymentSucceeded(event as PaymentSucceededWebhookEvent);
        break;

      case 'membership.activated':
        await handleMembershipActivated(event as MembershipActivatedWebhookEvent);
        break;

      case 'membership.deactivated':
        await handleMembershipDeactivated(event as MembershipDeactivatedWebhookEvent);
        break;

      case 'invoice.paid':
        console.log('[Whop Webhook] Invoice paid:', (event.data as any)?.id);
        break;

      default:
        console.log('[Whop Webhook] Unhandled event type:', event.type);
    }
  } catch (err: any) {
    console.error('[Whop Webhook] Error processing event:', event.type, err.message);
  }
}

async function handlePaymentSucceeded(event: PaymentSucceededWebhookEvent) {
  const payment = event.data;
  const orderId = (payment as any)?.metadata?.order_id;
  const paymentId = payment?.id;

  console.log('[Whop Webhook] Payment succeeded:', paymentId, '| Order ID:', orderId);

  if (orderId) {
    const db = await getDb();
    if (db) {
      const numericOrderId = parseInt(orderId);

      // 1. Mark order as paid
      await db.update(orders)
        .set({
          paymentStatus: 'paid',
          status: 'processing',
          whopPaymentId: paymentId,
          updatedAt: new Date().toISOString(),
        })
        .where(eq(orders.id, numericOrderId));
      console.log(`[Whop Webhook] Order ${orderId} marked as paid. Payment ID: ${paymentId}`);

      // 2. Decrement stock and increment sold for each item in the order
      const items = await db.select().from(orderItems).where(eq(orderItems.orderId, numericOrderId));
      for (const item of items) {
        await db.update(products)
          .set({
            // Decrement stock (floor at 0), increment sold
            stock: sql`GREATEST(0, stock - ${item.quantity})`,
            sold: sql`sold + ${item.quantity}`,
          })
          .where(eq(products.id, item.productId));
        console.log(`[Whop Webhook] Decremented stock for product ${item.productId} by ${item.quantity}`);
      }

      // 3. Send order confirmation email to buyer
      try {
        // Get the updated order
        const orderRows = await db.select().from(orders).where(eq(orders.id, numericOrderId)).limit(1);
        const order = orderRows[0];
        if (order) {
          // Determine customer email: from shippingAddress field (used as email) or from user record
          let customerEmail: string | null = null;
          let customerName = '尊贵的客户';

          // shippingAddress stores email for guest checkouts
          if (order.shippingAddress && order.shippingAddress.includes('@')) {
            customerEmail = order.shippingAddress;
          } else if (order.userId) {
            const userRows = await db.select().from(users).where(eq(users.id, order.userId)).limit(1);
            if (userRows[0]) {
              customerEmail = userRows[0].email || null;
              customerName = userRows[0].name || customerName;
            }
          }

          if (customerEmail) {
            // Build items summary with QR codes
            const itemsWithProducts = await db
              .select({ name: products.name, quantity: orderItems.quantity, price: orderItems.price, qrCodeUrl: products.qrCodeUrl })
              .from(orderItems)
              .innerJoin(products, eq(orderItems.productId, products.id))
              .where(eq(orderItems.orderId, numericOrderId));

            const itemsSummary = itemsWithProducts.length > 0
              ? itemsWithProducts.map(i => `${i.name} × ${i.quantity}`).join(', ')
              : '商品详情请查看订单';

            const totalPriceStr = `$${(order.totalPrice / 100).toFixed(2)}`;

            // Collect QR code items (products that have a QR code)
            const qrCodeItems = itemsWithProducts
              .filter(i => i.qrCodeUrl)
              .map(i => ({ name: i.name, qrCodeUrl: i.qrCodeUrl! }));

            // Generate invoice PDF
            let invoicePdfBuffer: Buffer | undefined;
            try {
              const invoiceConfig = await loadInvoiceConfig();
              invoicePdfBuffer = await generateInvoicePDF({
                invoiceNo: order.orderNumber,
                date: new Date().toISOString().split('T')[0],
                buyer: { name: customerName, email: customerEmail },
                items: itemsWithProducts.map(i => ({
                  nftTitle: i.name,
                  quantity: i.quantity,
                  unitPrice: Math.round(i.price * 100), // price is in dollars, convert to cents
                })),
                paymentMethod: 'Whop',
                config: invoiceConfig,
              });
              console.log(`[Whop Webhook] Invoice PDF generated for order ${orderId}`);
            } catch (pdfErr: any) {
              console.warn(`[Whop Webhook] Failed to generate invoice PDF:`, pdfErr.message);
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
          } else {
            console.warn(`[Whop Webhook] No email found for order ${orderId}, skipping confirmation email`);
          }
        }
      } catch (emailErr: any) {
        // Email failure should NOT fail the webhook
        console.error('[Whop Webhook] Failed to send confirmation email:', emailErr.message);
      }
    }
  } else {
    console.warn('[Whop Webhook] payment.succeeded event missing order_id in metadata. Payment ID:', paymentId);
  }
}

async function handleMembershipActivated(event: MembershipActivatedWebhookEvent) {
  const membership = event.data;
  console.log('[Whop Webhook] Membership activated:', (membership as any)?.id, '| User:', (membership as any)?.user_id);
}

async function handleMembershipDeactivated(event: MembershipDeactivatedWebhookEvent) {
  const membership = event.data;
  console.log('[Whop Webhook] Membership deactivated:', (membership as any)?.id, '| User:', (membership as any)?.user_id);
}

export function getSuccessPage(orderId: string, paymentId: string): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>支付成功 - ShopMart</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px; max-width: 500px; text-align: center; }
        .success-icon { width: 80px; height: 80px; background: #10b981; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .success-icon svg { width: 48px; height: 48px; color: white; }
        h1 { color: #1f2937; font-size: 28px; margin-bottom: 12px; }
        .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 32px; }
        .info-box { background: #f3f4f6; border-radius: 8px; padding: 20px; margin-bottom: 24px; text-align: left; }
        .info-row { display: flex; justify-content: space-between; margin-bottom: 12px; font-size: 14px; }
        .info-row:last-child { margin-bottom: 0; }
        .info-label { color: #6b7280; font-weight: 500; }
        .info-value { color: #1f2937; font-weight: 600; word-break: break-all; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; transition: background 0.3s; }
        .button:hover { background: #dc2626; }
        .footer { color: #9ca3af; font-size: 12px; margin-top: 24px; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="success-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </div>
        <h1>支付成功！</h1>
        <p class="subtitle">感謝您的購買，訂單已確認</p>
        <div class="info-box">
          <div class="info-row">
            <span class="info-label">訂單編號：</span>
            <span class="info-value">#${orderId}</span>
          </div>
          <div class="info-row">
            <span class="info-label">交易編號：</span>
            <span class="info-value">${paymentId}</span>
          </div>
        </div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">您將在 1-2 個工作日內收到發貨通知</p>
        <a href="/" class="button">返回首頁</a>
        <div class="footer">
          <p>如有任何問題，請聯絡我們的客服團隊</p>
        </div>
      </div>
    </body>
    </html>
  `;
}
