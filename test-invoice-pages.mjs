import { generateInvoicePDF } from './server/invoice-service.ts';
import { writeFileSync } from 'fs';

const data = {
  invoiceNo: 'ORD-1775139748502',
  date: '2026-04-02',
  buyer: { name: 'Guest', email: 'Annnavio_21@yahoo.com' },
  items: [
    { nftTitle: 'Sample NFT #1', quantity: 1, unitPrice: 500, platformFee: 25, artistRoyaltyPercent: 10 },
  ],
  paymentMethod: 'Whop',
};

const buf = await generateInvoicePDF(data);
writeFileSync('/tmp/test-invoice2.pdf', buf);
console.log('PDF generated, size:', buf.length);
