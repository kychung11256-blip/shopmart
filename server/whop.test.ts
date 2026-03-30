import { describe, it, expect } from 'vitest';
import Whop from '@whop/sdk';

describe('Whop API Key + Company ID Validation', () => {
  it('should list plans using WHOP_API_KEY and WHOP_COMPANY_ID', async () => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    expect(apiKey, 'WHOP_API_KEY must be set').toBeTruthy();
    expect(companyId, 'WHOP_COMPANY_ID must be set').toBeTruthy();

    const client = new Whop({ apiKey: apiKey! });
    const plans = await client.plans.list({ company_id: companyId! });
    expect(plans).toBeDefined();
    expect(Array.isArray(plans.data)).toBe(true);
    console.log('Whop API connected. Plans count:', plans.data.length);
  });

  it('should create a checkout configuration for a one-time payment', async () => {
    const apiKey = process.env.WHOP_API_KEY;
    const companyId = process.env.WHOP_COMPANY_ID;
    expect(apiKey, 'WHOP_API_KEY must be set').toBeTruthy();
    expect(companyId, 'WHOP_COMPANY_ID must be set').toBeTruthy();

    const client = new Whop({ apiKey: apiKey! });
    const checkoutConfig = await client.checkoutConfigurations.create({
      plan: {
        company_id: companyId!,
        currency: 'usd',
        initial_price: 9.99,
        plan_type: 'one_time',
        renewal_price: 0,
      },
      metadata: {
        order_id: 'test-order-999',
        customer_email: 'test@example.com',
      },
      redirect_url: 'https://example.com/confirmation',
    } as any);

    expect(checkoutConfig).toBeDefined();
    expect(checkoutConfig.id).toBeTruthy();
    const checkoutUrl = `https://whop.com/checkout/${checkoutConfig.id}`;
    console.log('Checkout config created. URL:', checkoutUrl);
  });
});
