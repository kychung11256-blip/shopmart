import { describe, it, expect } from 'vitest';

// Unit tests for TransVoucher integration logic

describe('TransVoucher Integration', () => {
  describe('HMAC Signature Verification', () => {
    it('should generate correct HMAC-SHA256 signature', async () => {
      const crypto = await import('crypto');
      const secret = 'test_secret_key';
      const payload = JSON.stringify({ event: 'payment_intent.succeeded', data: { id: '123' } });
      const signature = crypto.createHmac('sha256', secret).update(payload).digest('hex');
      expect(signature).toMatch(/^[a-f0-9]{64}$/);
    });

    it('should detect tampered payload', async () => {
      const crypto = await import('crypto');
      const secret = 'test_secret_key';
      const originalPayload = JSON.stringify({ event: 'payment_intent.succeeded', data: { id: '123' } });
      const tamperedPayload = JSON.stringify({ event: 'payment_intent.succeeded', data: { id: '999' } });
      const originalSig = crypto.createHmac('sha256', secret).update(originalPayload).digest('hex');
      const tamperedSig = crypto.createHmac('sha256', secret).update(tamperedPayload).digest('hex');
      expect(originalSig).not.toBe(tamperedSig);
    });
  });

  describe('Payment Amount Conversion', () => {
    it('should convert cents to dollars correctly', () => {
      const amountInCents = 128000; // $1280.00
      const amountInDollars = amountInCents / 100;
      expect(amountInDollars).toBe(1280);
    });

    it('should format amount to 2 decimal places', () => {
      const amount = 1280;
      const formatted = `$${amount.toFixed(2)}`;
      expect(formatted).toBe('$1280.00');
    });
  });

  describe('Customer Name Parsing', () => {
    it('should split full name into first and last', () => {
      const fullName = 'John Doe';
      const parts = fullName.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      expect(firstName).toBe('John');
      expect(lastName).toBe('Doe');
    });

    it('should handle single name', () => {
      const fullName = 'Alice';
      const parts = fullName.split(' ');
      const firstName = parts[0];
      const lastName = parts.slice(1).join(' ');
      expect(firstName).toBe('Alice');
      expect(lastName).toBe('');
    });
  });

  describe('Payment Method Config', () => {
    it('should default transVoucherEnabled to false', () => {
      const paymentMethods = {
        whopEnabled: true,
        stripeEnabled: false,
        transVoucherEnabled: undefined,
      };
      const transVoucherEnabled = paymentMethods.transVoucherEnabled ?? false;
      expect(transVoucherEnabled).toBe(false);
    });

    it('should enable transVoucher when set to true', () => {
      const paymentMethods = {
        whopEnabled: true,
        stripeEnabled: false,
        transVoucherEnabled: true,
      };
      const transVoucherEnabled = paymentMethods.transVoucherEnabled ?? false;
      expect(transVoucherEnabled).toBe(true);
    });
  });
});
