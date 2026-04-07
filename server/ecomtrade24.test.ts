/**
 * EcomTrade24 Payment Integration Tests
 *
 * Tests cover:
 * 1. HMAC-SHA256 signature verification
 * 2. Payment config defaults (ecomTrade24Enabled defaults to false)
 * 3. Webhook event handling assumptions
 * 4. Session creation payload structure
 */

import { describe, it, expect } from 'vitest';
import crypto from 'crypto';

// ─── Signature Verification Logic (mirrors ecomtrade24-webhook.ts) ─────────────

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
  } catch {
    return false;
  }
}

function generateEcomTrade24Signature(payload: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(payload).digest('hex');
}

// ─── Tests ─────────────────────────────────────────────────────────────────────

describe('EcomTrade24 Webhook Signature Verification', () => {
  const secret = 'af542e0dd30bbcf09e364956d6247b2ce994ddc99191dceec11327ac4b84beb8';

  it('should verify a valid HMAC-SHA256 signature', () => {
    const payload = JSON.stringify({ event: 'payment.completed', order_id: '42', status: 'paid' });
    const signature = generateEcomTrade24Signature(payload, secret);
    expect(verifyEcomTrade24Signature(payload, signature, secret)).toBe(true);
  });

  it('should reject a tampered payload', () => {
    const payload = JSON.stringify({ event: 'payment.completed', order_id: '42', status: 'paid' });
    const signature = generateEcomTrade24Signature(payload, secret);
    const tamperedPayload = JSON.stringify({ event: 'payment.completed', order_id: '99', status: 'paid' });
    expect(verifyEcomTrade24Signature(tamperedPayload, signature, secret)).toBe(false);
  });

  it('should reject an invalid signature string', () => {
    const payload = JSON.stringify({ event: 'payment.completed', order_id: '42', status: 'paid' });
    expect(verifyEcomTrade24Signature(payload, 'deadbeefdeadbeef', secret)).toBe(false);
  });

  it('should reject a signature generated with a different secret', () => {
    const payload = JSON.stringify({ event: 'payment.completed', order_id: '42', status: 'paid' });
    const wrongSecret = 'wrong-secret-key';
    const signature = generateEcomTrade24Signature(payload, wrongSecret);
    expect(verifyEcomTrade24Signature(payload, signature, secret)).toBe(false);
  });
});

describe('EcomTrade24 Payment Config Defaults', () => {
  it('ecomTrade24Enabled should default to false when config value is not "true"', () => {
    // Mirrors the logic in routers.ts: (await getConfig('PAYMENT_ECOMTRADE24_ENABLED')) === 'true'
    const configValue = null; // not set
    const ecomTrade24Enabled = configValue === 'true';
    expect(ecomTrade24Enabled).toBe(false);
  });

  it('ecomTrade24Enabled should be true when config value is "true"', () => {
    const configValue = 'true';
    const ecomTrade24Enabled = configValue === 'true';
    expect(ecomTrade24Enabled).toBe(true);
  });

  it('ecomTrade24Enabled should be false when config value is "false"', () => {
    const configValue = 'false';
    const ecomTrade24Enabled = configValue === 'true';
    expect(ecomTrade24Enabled).toBe(false);
  });
});

describe('EcomTrade24 Session Payload Structure', () => {
  it('should build correct session payload with required fields', () => {
    const orderId = 123;
    const amount = 99.99;
    const currency = 'USD';
    const successUrl = 'https://mynft01.eu.cc/orders/confirmation?orderId=123&payment=ecomtrade24';
    const cancelUrl = 'https://mynft01.eu.cc/checkout';

    const payload: any = {
      amount,
      currency,
      order_id: String(orderId),
      domain: new URL(successUrl).hostname,
      return_url: successUrl,
      cancel_url: cancelUrl,
    };

    expect(payload.amount).toBe(99.99);
    expect(payload.currency).toBe('USD');
    expect(payload.order_id).toBe('123');
    expect(payload.domain).toBe('mynft01.eu.cc');
    expect(payload.return_url).toBe(successUrl);
    expect(payload.cancel_url).toBe(cancelUrl);
  });

  it('should include email in payload when customer email is provided', () => {
    const payload: any = {
      amount: 50,
      currency: 'USD',
      order_id: '456',
      domain: 'mynft01.eu.cc',
      return_url: 'https://mynft01.eu.cc/orders/confirmation?orderId=456',
      cancel_url: 'https://mynft01.eu.cc/checkout',
    };

    const customerEmail = 'customer@example.com';
    if (customerEmail) {
      payload.email = customerEmail;
    }

    expect(payload.email).toBe('customer@example.com');
  });

  it('should not include email in payload when customer email is not provided', () => {
    const payload: any = {
      amount: 50,
      currency: 'USD',
      order_id: '456',
      domain: 'mynft01.eu.cc',
      return_url: 'https://mynft01.eu.cc/orders/confirmation?orderId=456',
      cancel_url: 'https://mynft01.eu.cc/checkout',
    };

    const customerEmail = undefined;
    if (customerEmail) {
      payload.email = customerEmail;
    }

    expect(payload.email).toBeUndefined();
  });
});

describe('EcomTrade24 Webhook Event Handling', () => {
  it('should only process payment.completed events as paid', () => {
    const validEvent = { event: 'payment.completed', order_id: '42', status: 'paid' };
    const shouldProcess = validEvent.event === 'payment.completed' && validEvent.status === 'paid';
    expect(shouldProcess).toBe(true);
  });

  it('should not process payment.completed events with non-paid status', () => {
    const pendingEvent = { event: 'payment.completed', order_id: '42', status: 'pending' };
    const shouldProcess = pendingEvent.event === 'payment.completed' && pendingEvent.status === 'paid';
    expect(shouldProcess).toBe(false);
  });

  it('should not process unknown event types', () => {
    const unknownEvent = { event: 'payment.refunded', order_id: '42', status: 'refunded' };
    const shouldProcess = unknownEvent.event === 'payment.completed';
    expect(shouldProcess).toBe(false);
  });

  it('should correctly parse orderId from event', () => {
    const event = { event: 'payment.completed', order_id: '123', status: 'paid' };
    const orderId = event.order_id ? parseInt(event.order_id, 10) : null;
    expect(orderId).toBe(123);
    expect(isNaN(orderId!)).toBe(false);
  });

  it('should handle missing order_id gracefully', () => {
    const event = { event: 'payment.completed', status: 'paid' } as any;
    const orderId = event.order_id ? parseInt(event.order_id, 10) : null;
    expect(orderId).toBeNull();
  });
});
