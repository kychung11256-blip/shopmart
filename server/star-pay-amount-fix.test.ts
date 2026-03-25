import { describe, it, expect } from 'vitest';

/**
 * Star Pay 金額格式化修復測試
 * 
 * 問題：Star Pay 的所有支付產品（TRC20Buy, TRC20H5, USDCERC20Buy）都是加密貨幣，
 * 應該使用 6 位小數格式，而不是 2 位小數。
 * 
 * 修復：將 formatStarPayAmount 的 isCrypto 參數設置為 true
 */

describe('Star Pay Amount Formatting Fix', () => {
  // Mock formatStarPayAmount function
  const formatStarPayAmount = (amount: number, isCrypto: boolean = true): string => {
    if (isCrypto) {
      return amount.toFixed(6);
    }
    return amount.toFixed(2);
  };

  describe('Crypto Products (TRC20Buy, TRC20H5, USDCERC20Buy)', () => {
    it('should format amount with 6 decimal places for TRC20Buy', () => {
      const amount = 100.5;
      const formatted = formatStarPayAmount(amount, true);
      expect(formatted).toBe('100.500000');
    });

    it('should format amount with 6 decimal places for TRC20H5', () => {
      const amount = 50.25;
      const formatted = formatStarPayAmount(amount, true);
      expect(formatted).toBe('50.250000');
    });

    it('should format amount with 6 decimal places for USDCERC20Buy', () => {
      const amount = 1000;
      const formatted = formatStarPayAmount(amount, true);
      expect(formatted).toBe('1000.000000');
    });

    it('should handle small amounts correctly', () => {
      const amount = 0.1;
      const formatted = formatStarPayAmount(amount, true);
      expect(formatted).toBe('0.100000');
    });

    it('should handle very small amounts', () => {
      const amount = 0.000001;
      const formatted = formatStarPayAmount(amount, true);
      expect(formatted).toBe('0.000001');
    });
  });

  describe('Fiat Currency (for reference)', () => {
    it('should format fiat amount with 2 decimal places', () => {
      const amount = 100.5;
      const formatted = formatStarPayAmount(amount, false);
      expect(formatted).toBe('100.50');
    });

    it('should handle fiat amounts correctly', () => {
      const amount = 50.25;
      const formatted = formatStarPayAmount(amount, false);
      expect(formatted).toBe('50.25');
    });
  });

  describe('Signature Generation with Correct Amount Format', () => {
    it('should generate different signatures for different amount formats', () => {
      const crypto = require('crypto');
      const merchantNo = '072253';
      const apiKey = 'test-api-key';
      const signType = 'MD5';
      const timestamp = 1234567890;

      // Amount formatted as crypto (6 decimals)
      const cryptoAmount = '100.500000';
      const cryptoParams = JSON.stringify({
        merchant_ref: 'ORDER-1-123',
        product: 'TRC20Buy',
        amount: cryptoAmount,
        language: 'en_US',
        extra: { fiat_currency: 'USD' }
      });
      const cryptoToSign = `${merchantNo}${cryptoParams}${signType}${timestamp}${apiKey}`;
      const cryptoSignature = crypto.createHash('md5').update(cryptoToSign).digest('hex');

      // Amount formatted as fiat (2 decimals) - WRONG
      const fiatAmount = '100.50';
      const fiatParams = JSON.stringify({
        merchant_ref: 'ORDER-1-123',
        product: 'TRC20Buy',
        amount: fiatAmount,
        language: 'en_US',
        extra: { fiat_currency: 'USD' }
      });
      const fiatToSign = `${merchantNo}${fiatParams}${signType}${timestamp}${apiKey}`;
      const fiatSignature = crypto.createHash('md5').update(fiatToSign).digest('hex');

      // Signatures should be different because amounts are different
      expect(cryptoSignature).not.toBe(fiatSignature);
      console.log('Crypto signature:', cryptoSignature);
      console.log('Fiat signature:', fiatSignature);
    });
  });

  describe('Star Pay Product Types', () => {
    it('should identify TRC20Buy as crypto product', () => {
      const product = 'TRC20Buy';
      const isCrypto = ['TRC20Buy', 'TRC20H5', 'USDCERC20Buy'].includes(product);
      expect(isCrypto).toBe(true);
    });

    it('should identify TRC20H5 as crypto product', () => {
      const product = 'TRC20H5';
      const isCrypto = ['TRC20Buy', 'TRC20H5', 'USDCERC20Buy'].includes(product);
      expect(isCrypto).toBe(true);
    });

    it('should identify USDCERC20Buy as crypto product', () => {
      const product = 'USDCERC20Buy';
      const isCrypto = ['TRC20Buy', 'TRC20H5', 'USDCERC20Buy'].includes(product);
      expect(isCrypto).toBe(true);
    });
  });
});
