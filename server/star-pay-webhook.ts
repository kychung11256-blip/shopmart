import { Request, Response } from 'express';
import { verifyStarPaySignature } from './star-pay';
import { getDb } from './db';
import { orders } from '../drizzle/schema';
import { eq } from 'drizzle-orm';
import { notifyOwner } from './_core/notification';

/**
 * Star Pay Webhook 回調處理
 * 
 * 支持的事件：
 * - payment_success: 支付成功
 * - payment_failed: 支付失敗
 * - payment_pending: 支付待處理
 */
export async function handleStarPayWebhook(req: Request, res: Response) {
  try {
    const { merchant_no, timestamp, sign_type, params, sign } = req.body;

    console.log('[Star Pay Webhook] Received:', {
      merchantNo: merchant_no,
      timestamp,
      signType: sign_type,
    });

    // 驗證簽名
    if (!verifyStarPaySignature(merchant_no, params, timestamp, sign)) {
      console.error('[Star Pay Webhook] Signature verification failed');
      return res.status(400).json({ code: 'INVALID_SIGN', message: 'Invalid signature' });
    }

    // 解析 params
    let parsedParams: any;
    try {
      parsedParams = typeof params === 'string' ? JSON.parse(params) : params;
    } catch (error) {
      console.error('[Star Pay Webhook] Failed to parse params:', error);
      return res.status(400).json({ code: 'INVALID_PARAMS', message: 'Invalid params' });
    }

    const { merchant_ref, status, order_id, amount, product, extra } = parsedParams;

    console.log('[Star Pay Webhook] Parsed params:', {
      merchantRef: merchant_ref,
      status,
      orderId: order_id,
      amount,
      product,
    });

    // 提取訂單 ID（格式：ORDER-{orderId}-{timestamp}）
    const orderIdMatch = merchant_ref?.match(/ORDER-(\d+)-/);
    if (!orderIdMatch) {
      console.error('[Star Pay Webhook] Invalid merchant_ref format:', merchant_ref);
      return res.status(400).json({ code: 'INVALID_REF', message: 'Invalid merchant_ref' });
    }

    const orderId = parseInt(orderIdMatch[1], 10);
    const db = await getDb();

    if (!db) {
      console.error('[Star Pay Webhook] Database not available');
      return res.status(500).json({ code: 'DB_ERROR', message: 'Database error' });
    }

    // 查詢訂單
    const orderResult = await db.select().from(orders).where(eq(orders.id, orderId)).limit(1);
    if (orderResult.length === 0) {
      console.error('[Star Pay Webhook] Order not found:', orderId);
      return res.status(404).json({ code: 'ORDER_NOT_FOUND', message: 'Order not found' });
    }

    const order = orderResult[0];

    // 根據支付狀態更新訂單
    let paymentStatus: 'paid' | 'failed' | 'unpaid' = 'unpaid';
    let orderStatus: 'pending' | 'processing' | 'cancelled' = 'pending';

    switch (status) {
      case 'success':
      case 'completed':
        paymentStatus = 'paid';
        orderStatus = 'processing';
        break;
      case 'failed':
      case 'error':
        paymentStatus = 'failed';
        orderStatus = 'cancelled';
        break;
      case 'pending':
      case 'processing':
        paymentStatus = 'unpaid';
        orderStatus = 'pending';
        break;
      default:
        console.warn('[Star Pay Webhook] Unknown status:', status);
    }

    // 更新訂單
    await db.update(orders).set({
      paymentStatus,
      status: orderStatus,
      stripePaymentIntentId: merchant_ref,
      updatedAt: new Date(),
    }).where(eq(orders.id, orderId));

    console.log('[Star Pay Webhook] Order updated:', {
      orderId,
      paymentStatus,
      orderStatus,
      starPayStatus: status,
    });

    // 如果支付成功，發送通知
    if (paymentStatus === 'paid') {
      try {
        await notifyOwner({
          title: '✅ Star Pay 支付成功',
          content: `訂單 #${orderId} 已支付成功\n金額: ${amount} ${product}\n商戶訂單號: ${merchant_ref}`,
        });
      } catch (error) {
        console.error('[Star Pay Webhook] Failed to send notification:', error);
      }
    }

    // 返回成功響應
    return res.json({
      code: 'SUCCESS',
      message: 'Webhook processed successfully',
      data: {
        orderId,
        paymentStatus,
        orderStatus,
      },
    });
  } catch (error: any) {
    console.error('[Star Pay Webhook] Error:', error?.message || error);
    return res.status(500).json({
      code: 'ERROR',
      message: error?.message || 'Internal server error',
    });
  }
}
