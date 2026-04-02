/**
 * Invoice Configuration Keys & Defaults
 * Follows the same pattern as email-service.ts
 */

export const INVOICE_CONFIG_KEYS = {
  COMPANY_NAME: 'invoice_company_name',
  COMPANY_ADDRESS: 'invoice_company_address',
  COMPANY_EMAIL: 'invoice_company_email',
  COMPANY_PHONE: 'invoice_company_phone',
  COMPANY_REP_NAME: 'invoice_company_rep_name',
  COMPANY_REP_TITLE: 'invoice_company_rep_title',
  DISCLAIMER_TEXT: 'invoice_disclaimer_text',
  SELLER_ARTIST_NAME: 'invoice_seller_artist_name',
  COMPANY_LOGO_URL: 'invoice_company_logo_url',
} as const;

export interface InvoiceConfig {
  companyName: string;
  companyAddress: string;
  companyEmail: string;
  companyPhone: string;
  companyRepName: string;
  companyRepTitle: string;
  disclaimerText: string;
  sellerArtistName: string;
  companyLogoUrl?: string; // Optional: CDN URL to company logo
}

export const DEFAULT_INVOICE_CONFIG: InvoiceConfig = {
  companyName: 'First Priority Asset Management LLC',
  companyAddress: '1640 Palm Ave, San Mateo, CA 94402',
  companyEmail: 'triumph.ali@itm-email.com',
  companyPhone: '+1 (650) 555-0123',
  companyRepName: 'Amina Karim',
  companyRepTitle: 'CEO',
  sellerArtistName: 'Amina Karim',
  companyLogoUrl: undefined,
  disclaimerText: `• All NFT sales are final and non-refundable.
• NFTs are created and provided by third-party artists; First Priority Asset Management LLC acts only as a platform to facilitate the sale.
• The Company does not guarantee authenticity, ownership, or future value of the NFT. NFTs are not investment products.
• Platform does not resell NFTs on behalf of clients unless under separate written agreement.
• Legal / Tax Disclaimer: Buyer is responsible for any taxes, duties, or reporting obligations. Retain this invoice for your records.`,
};

/**
 * Load invoice configuration from database
 */
export async function loadInvoiceConfig(): Promise<InvoiceConfig> {
  const { getConfig } = await import('./db');
  
  return {
    companyName: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_NAME) || DEFAULT_INVOICE_CONFIG.companyName,
    companyAddress: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_ADDRESS) || DEFAULT_INVOICE_CONFIG.companyAddress,
    companyEmail: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_EMAIL) || DEFAULT_INVOICE_CONFIG.companyEmail,
    companyPhone: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_PHONE) || DEFAULT_INVOICE_CONFIG.companyPhone,
    companyRepName: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_NAME) || DEFAULT_INVOICE_CONFIG.companyRepName,
    companyRepTitle: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_REP_TITLE) || DEFAULT_INVOICE_CONFIG.companyRepTitle,
    disclaimerText: await getConfig(INVOICE_CONFIG_KEYS.DISCLAIMER_TEXT) || DEFAULT_INVOICE_CONFIG.disclaimerText,
    sellerArtistName: await getConfig(INVOICE_CONFIG_KEYS.SELLER_ARTIST_NAME) || DEFAULT_INVOICE_CONFIG.sellerArtistName,
    companyLogoUrl: await getConfig(INVOICE_CONFIG_KEYS.COMPANY_LOGO_URL) || DEFAULT_INVOICE_CONFIG.companyLogoUrl,
  };
}
