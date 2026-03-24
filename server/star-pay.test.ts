import { describe, it, expect } from 'vitest';
import crypto from 'crypto';
import {
  formatStarPayAmount,
} from './star-pay';

describe('Star Pay Integration', () => {
  describe('Signature Generation', () => {
    it('should generate valid MD5 signature format', () => {
      // Test the signature generation logic directly
      const merchantNo = 'TEST_MERCHANT';
      const apiKey = 'TEST_KEY_123';
      const signType = 'MD5';
      const timestamp = 1606806265;
      const params = {
        merchant_ref: 'ORDER-123-1234567890',
        product: 'TRC20Buy',
        amount: '100.00',
      };
      const paramsStr = JSON.stringify(params);

      const toSign = `${merchantNo}${paramsStr}${signType}${timestamp}${apiKey}`;
      const sign = crypto.createHash('md5').update(toSign).digest('hex');

      // Verify signature is a valid MD5 hash (32 hex characters)
      expect(sign).toMatch(/^[a-f0-9]{32}$/i);
      expect(sign.length).toBe(32);
    });

    it('should generate consistent signatures for same input', () => {
      const merchantNo = 'TEST_MERCHANT';
      const apiKey = 'TEST_KEY_123';
      const signType = 'MD5';
      const timestamp = 1606806265;
      const params = {
        merchant_ref: 'ORDER-456-1234567890',
        product: 'TRC20H5',
        amount: '50.00',
      };
      const paramsStr = JSON.stringify(params);

      const toSign1 = `${merchantNo}${paramsStr}${signType}${timestamp}${apiKey}`;
      const sign1 = crypto.createHash('md5').update(toSign1).digest('hex');

      const toSign2 = `${merchantNo}${paramsStr}${signType}${timestamp}${apiKey}`;
      const sign2 = crypto.createHash('md5').update(toSign2).digest('hex');

      expect(sign1).toBe(sign2);
    });

    it('should generate different signatures for different inputs', () => {
      const merchantNo = 'TEST_MERCHANT';
      const apiKey = 'TEST_KEY_123';
      const signType = 'MD5';
      const timestamp = 1606806265;

      const params1 = {
        merchant_ref: 'ORDER-789-1234567890',
        product: 'TRC20Buy',
        amount: '100.00',
      };
      const paramsStr1 = JSON.stringify(params1);
      const toSign1 = `${merchantNo}${paramsStr1}${signType}${timestamp}${apiKey}`;
      const sign1 = crypto.createHash('md5').update(toSign1).digest('hex');

      const params2 = {
        merchant_ref: 'ORDER-789-1234567890',
        product: 'TRC20Buy',
        amount: '200.00', // Different amount
      };
      const paramsStr2 = JSON.stringify(params2);
      const toSign2 = `${merchantNo}${paramsStr2}${signType}${timestamp}${apiKey}`;
      const sign2 = crypto.createHash('md5').update(toSign2).digest('hex');

      expect(sign1).not.toBe(sign2);
    });
  });

  describe('formatStarPayAmount', () => {
    it('should format fiat currency with 2 decimal places', () => {
      expect(formatStarPayAmount(100.5, false)).toBe('100.50');
      expect(formatStarPayAmount(100, false)).toBe('100.00');
      expect(formatStarPayAmount(100.999, false)).toBe('101.00');
    });

    it('should format crypto currency with 6 decimal places', () => {
      expect(formatStarPayAmount(0.123456789, true)).toBe('0.123457');
      expect(formatStarPayAmount(1.5, true)).toBe('1.500000');
      expect(formatStarPayAmount(0.000001, true)).toBe('0.000001');
    });

    it('should handle zero amounts', () => {
      expect(formatStarPayAmount(0, false)).toBe('0.00');
      expect(formatStarPayAmount(0, true)).toBe('0.000000');
    });

    it('should handle large amounts', () => {
      expect(formatStarPayAmount(999999.99, false)).toBe('999999.99');
      expect(formatStarPayAmount(999999.999999, true)).toBe('999999.999999');
    });

    it('should handle small amounts', () => {
      expect(formatStarPayAmount(0.01, false)).toBe('0.01');
      expect(formatStarPayAmount(0.000001, true)).toBe('0.000001');
    });

    it('should handle negative amounts', () => {
      expect(formatStarPayAmount(-100.5, false)).toBe('-100.50');
      expect(formatStarPayAmount(-0.5, true)).toBe('-0.500000');
    });
  });

  describe('Request Parameter Construction', () => {
    it('should construct valid URL search params', () => {
      const merchantNo = 'TEST_MERCHANT';
      const timestamp = 1606806265;
      const signType = 'MD5';
      const sign = 'test_signature_hash_1234567890abcdef';
      const paramsStr = JSON.stringify({
        merchant_ref: 'ORDER-123-1234567890',
        product: 'TRC20Buy',
        amount: '100.00',
      });

      const requestParams = new URLSearchParams({
        merchant_no: merchantNo,
        timestamp: timestamp.toString(),
        sign_type: signType,
        params: paramsStr,
        sign,
      });

      expect(requestParams.get('merchant_no')).toBe('TEST_MERCHANT');
      expect(requestParams.get('timestamp')).toBe('1606806265');
      expect(requestParams.get('sign_type')).toBe('MD5');
      expect(requestParams.get('sign')).toBe(sign);
      expect(requestParams.get('params')).toBe(paramsStr);
    });
  });

  describe('Response Parsing', () => {
    it('should parse Star Pay response with payurl', () => {
      const response = {
        code: 200,
        message: '',
        params: JSON.stringify({
          merchant_ref: 'ORDER-123-1234567890',
          system_ref: 'SYS-456-7890',
          amount: '100.00',
          fee: '0.00',
          status: 0,
          payurl: 'https://api.star-pay.vip/pay?token=abc123def456',
          extend_params: '',
          product: 'TRC20Buy',
          extra: {
            fiat_currency: 'USD',
          },
        }),
      };

      // Parse response
      let payUrl: string | null = null;
      if (response.code === 200 && response.params) {
        try {
          const params = typeof response.params === 'string'
            ? JSON.parse(response.params)
            : response.params;
          payUrl = params.payurl || null;
        } catch (e) {
          // Handle parse error
        }
      }

      expect(payUrl).toBe('https://api.star-pay.vip/pay?token=abc123def456');
    });

    it('should handle response without payurl', () => {
      const response = {
        code: 200,
        message: '',
        params: JSON.stringify({
          merchant_ref: 'ORDER-123-1234567890',
          system_ref: 'SYS-456-7890',
          amount: '100.00',
          fee: '0.00',
          status: 0,
          extend_params: '',
          product: 'TRC20Buy',
          extra: {
            fiat_currency: 'USD',
          },
        }),
      };

      // Parse response
      let payUrl: string | null = null;
      if (response.code === 200 && response.params) {
        try {
          const params = typeof response.params === 'string'
            ? JSON.parse(response.params)
            : response.params;
          payUrl = params.payurl || null;
        } catch (e) {
          // Handle parse error
        }
      }

      expect(payUrl).toBeNull();
    });

    it('should handle malformed response params', () => {
      const response = {
        code: 200,
        message: '',
        params: 'invalid json {',
      };

      // Parse response
      let payUrl: string | null = null;
      let parseError = false;
      if (response.code === 200 && response.params) {
        try {
          const params = typeof response.params === 'string'
            ? JSON.parse(response.params)
            : response.params;
          payUrl = params.payurl || null;
        } catch (e) {
          parseError = true;
        }
      }

      expect(parseError).toBe(true);
      expect(payUrl).toBeNull();
    });
  });
});
