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
      return res.status(400).send(getErrorPage('Whop API key not configured'));
    }

    const client = new Whop({ apiKey });
    const bodyText = typeof req.body === 'string' ? req.body : JSON.stringify(req.body);
    const headers = Object.fromEntries(Object.entries(req.headers).map(([k, v]) => [k, String(v)]));

    let event: any;
    try {
      event = client.webhooks.unwrap(bodyText, { headers });
    } catch (err: any) {
      console.error('[Whop Webhook] Signature verification failed:', err.message);
      return res.status(400).send(getErrorPage('Invalid webhook signature'));
    }

    console.log('[Whop Webhook] Event received:', event.type, event.data?.id);

    let orderId: string | null = null;
    let paymentId: string | null = null;

    if (event.type === 'payment.succeeded') {
      const payment = event.data;
      orderId = payment?.metadata?.order_id;
      paymentId = payment?.id;

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

    // Return success page
    return res.setHeader('Content-Type', 'text/html; charset=utf-8').send(
      getSuccessPage(orderId || 'Unknown', paymentId || 'Unknown')
    );
  } catch (error: any) {
    console.error('[Whop Webhook] Unexpected error:', error.message);
    return res.status(500).send(getErrorPage('Internal server error'));
  }
}

function getSuccessPage(orderId: string, paymentId: string): string {
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

function getErrorPage(message: string): string {
  return `
    <!DOCTYPE html>
    <html lang="zh-TW">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>支付失敗 - ShopMart</title>
      <style>
        * { margin: 0; padding: 0; box-sizing: border-box; }
        body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); min-height: 100vh; display: flex; align-items: center; justify-content: center; }
        .container { background: white; border-radius: 12px; box-shadow: 0 20px 60px rgba(0,0,0,0.3); padding: 40px; max-width: 500px; text-align: center; }
        .error-icon { width: 80px; height: 80px; background: #ef4444; border-radius: 50%; display: flex; align-items: center; justify-content: center; margin: 0 auto 24px; }
        .error-icon svg { width: 48px; height: 48px; color: white; }
        h1 { color: #1f2937; font-size: 28px; margin-bottom: 12px; }
        .subtitle { color: #6b7280; font-size: 16px; margin-bottom: 32px; }
        .message { background: #fee2e2; border-left: 4px solid #ef4444; padding: 16px; border-radius: 6px; margin-bottom: 24px; color: #991b1b; text-align: left; }
        .button { display: inline-block; background: #ef4444; color: white; padding: 12px 32px; border-radius: 6px; text-decoration: none; font-weight: 600; margin-top: 16px; transition: background 0.3s; }
        .button:hover { background: #dc2626; }
      </style>
    </head>
    <body>
      <div class="container">
        <div class="error-icon">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"></circle>
            <line x1="15" y1="9" x2="9" y2="15"></line>
            <line x1="9" y1="9" x2="15" y2="15"></line>
          </svg>
        </div>
        <h1>支付失敗</h1>
        <p class="subtitle">無法處理您的支付</p>
        <div class="message">${message}</div>
        <p style="color: #6b7280; font-size: 14px; margin-bottom: 24px;">請檢查您的支付信息並重試</p>
        <a href="/" class="button">返回首頁</a>
      </div>
    </body>
    </html>
  `;
}
