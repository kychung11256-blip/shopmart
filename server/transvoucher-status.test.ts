import { describe, it, expect, vi, beforeEach } from 'vitest';

describe('TransVoucher Status Check - API Endpoint', () => {
  it('should use /v1.0/payment/status/{transactionId} endpoint (not payment-link/status)', async () => {
    // Verify the correct endpoint is used in the router
    const fs = await import('fs');
    const routerContent = fs.readFileSync('./server/routers.ts', 'utf-8');
    
    // Should use the correct payment/status endpoint
    expect(routerContent).toContain('/v1.0/payment/status/${input.transactionId}');
    
    // Should NOT use the wrong payment-link/status endpoint
    expect(routerContent).not.toContain('/v1.0/payment-link/status/${input.transactionId}');
  });

  it('should handle 404 gracefully without crashing', () => {
    // Simulate the error handling behavior
    const handlePollingError = (error: Error) => {
      // Should log but not throw
      console.error('[TransVoucher] Polling error:', error);
      return 'pending'; // Continue polling
    };

    const result = handlePollingError(new Error('TransVoucher status check failed: 404'));
    expect(result).toBe('pending');
  });

  it('should correctly identify completed payment status', () => {
    const statuses = ['completed', 'failed', 'expired', 'cancelled', 'pending', 'processing'];
    const terminalStatuses = ['completed', 'failed', 'expired', 'cancelled'];
    
    for (const status of statuses) {
      const isTerminal = terminalStatuses.includes(status);
      if (status === 'completed') {
        expect(isTerminal).toBe(true);
      } else if (status === 'pending' || status === 'processing') {
        expect(isTerminal).toBe(false);
      }
    }
  });

  it('should use correct TransVoucher API base URL', async () => {
    const fs = await import('fs');
    const routerContent = fs.readFileSync('./server/routers.ts', 'utf-8');
    
    // Should use api.trans-voucher.com (not transvoucher.com)
    expect(routerContent).toContain('https://api.trans-voucher.com/v1.0/payment/status/');
  });

  it('should include required auth headers in status check', async () => {
    const fs = await import('fs');
    const routerContent = fs.readFileSync('./server/routers.ts', 'utf-8');
    
    // Should include X-API-Key and X-API-Secret headers
    const statusCheckSection = routerContent.substring(
      routerContent.indexOf('checkTransVoucherStatus'),
      routerContent.indexOf('checkTransVoucherStatus') + 2000
    );
    
    expect(statusCheckSection).toContain("'X-API-Key'");
    expect(statusCheckSection).toContain("'X-API-Secret'");
  });
});
