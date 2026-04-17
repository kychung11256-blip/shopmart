import { describe, it, expect, beforeAll } from 'vitest';
import Whop from '@whop/sdk';

describe('Whop Webhook Configuration', () => {
  let whopClient: Whop;

  beforeAll(() => {
    const apiKey = process.env.WHOP_API_KEY;
    const webhookSecret = process.env.WHOP_WEBHOOK_SECRET;

    expect(apiKey).toBeDefined();
    expect(webhookSecret).toBeDefined();

    // Per Whop official docs: webhookKey must be btoa(secret)
    // Ref: https://docs.whop.com/developer/guides/webhooks
    whopClient = new Whop({
      apiKey,
      webhookKey: webhookSecret ? btoa(webhookSecret) : undefined,
    });
  });

  it('should have WHOP_API_KEY configured', () => {
    expect(process.env.WHOP_API_KEY).toBeDefined();
    expect(process.env.WHOP_API_KEY).toBeTruthy();
  });

  it('should have WHOP_WEBHOOK_SECRET configured', () => {
    expect(process.env.WHOP_WEBHOOK_SECRET).toBeDefined();
    expect(process.env.WHOP_WEBHOOK_SECRET).toBeTruthy();
  });

  it('should create Whop client with webhook key', () => {
    expect(whopClient).toBeDefined();
    // The client should have webhooks property for unwrap method
    expect(whopClient.webhooks).toBeDefined();
    expect(typeof whopClient.webhooks.unwrap).toBe('function');
  });

  it('should reject invalid webhook signatures', () => {
    const invalidPayload = JSON.stringify({ type: 'payment.succeeded', data: { id: 'test' } });
    const invalidHeaders = {
      'svix-id': 'msg_invalid',
      'svix-timestamp': '1234567890',
      'svix-signature': 'v1,invalid_signature',
    };

    expect(() => {
      whopClient.webhooks.unwrap(invalidPayload, { headers: invalidHeaders });
    }).toThrow();
  });
});
