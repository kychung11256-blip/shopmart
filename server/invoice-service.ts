import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';
import type { InvoiceConfig } from './invoice-config';
import { DEFAULT_INVOICE_CONFIG } from './invoice-config';

export interface InvoiceData {
  invoiceNo: string;
  date: string;
  buyer: {
    name: string;
    email: string;
  };
  items: {
    nftTitle: string;
    quantity: number;
    unitPrice: number; // in USD cents
    platformFee?: number; // in USD cents
    artistRoyaltyPercent?: number;
  }[];
  paymentMethod: string;
  notes?: string;
  companyRep?: string;
  companyRepTitle?: string;
  config?: InvoiceConfig; // Optional: use database config if provided
}

export async function generateInvoicePDF(data: InvoiceData): Promise<Buffer> {
  return new Promise(async (resolve, reject) => {
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 30, bottom: 25, left: 35, right: 35 },
    });

    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    // Use config from database or fall back to defaults
    const cfg = data.config || DEFAULT_INVOICE_CONFIG;
    const companyName = cfg.companyName;
    const companyAddress = cfg.companyAddress;
    const companyEmail = cfg.companyEmail;
    const companyPhone = cfg.companyPhone;
    const companyLogoUrl = cfg.companyLogoUrl;
    const repName = data.companyRep || cfg.companyRepName;
    const repTitle = data.companyRepTitle || cfg.companyRepTitle;
    const sellerArtist = cfg.sellerArtistName;
    const disclaimerText = cfg.disclaimerText;

    // Fetch logo image if URL is provided
    let logoBuffer: Buffer | null = null;
    if (companyLogoUrl) {
      try {
        const response = await fetch(companyLogoUrl);
        if (response.ok) {
          const arrayBuffer = await response.arrayBuffer();
          logoBuffer = Buffer.from(arrayBuffer);
        }
      } catch (err) {
        // Silently fail if logo can't be fetched
      }
    }

    // ── Color palette ──
    const RED = '#C0392B';
    const DARK = '#1A1A2E';
    const GRAY = '#7F8C8D';
    const LIGHT_GRAY = '#ECF0F1';
    const WHITE = '#FFFFFF';

    const pageW = doc.page.width - 70; // usable width

    // ── Header band ──
    doc.rect(0, 0, doc.page.width, 65).fill(DARK);

    // Add company logo if available
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 45, 12, { width: 50, height: 50 });
      } catch (err) {
        // Silently fail if logo can't be rendered
      }
    }

    doc
      .fillColor(WHITE)
      .fontSize(18)
      .font('Helvetica-Bold')
      .text('INVOICE', logoBuffer ? 95 : 35, 18);

    doc
      .fillColor(RED)
      .fontSize(7.5)
      .font('Helvetica')
      .text(companyName, logoBuffer ? 95 : 35, 44);

    const headerSubLine = companyPhone
      ? `${companyAddress}  |  ${companyEmail}  |  ${companyPhone}`
      : `${companyAddress}  |  ${companyEmail}`;

    doc
      .fillColor('#BDC3C7')
      .fontSize(6.5)
      .text(headerSubLine, logoBuffer ? 95 : 35, 54);

    // Invoice meta (top-right)
    const metaX = 395;
    doc
      .fillColor(WHITE)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('Invoice No.:', metaX, 22)
      .font('Helvetica')
      .text(data.invoiceNo, metaX + 65, 22);

    doc
      .font('Helvetica-Bold')
      .text('Date:', metaX, 32)
      .font('Helvetica')
      .text(data.date, metaX + 65, 32);

    // ── Bill To / Sold By ──
    let y = 80;

    // Two-column layout
    const col1X = 35;
    const col2X = 285;

    // Bill To
    doc.fillColor(RED).fontSize(7.5).font('Helvetica-Bold').text('BILL TO', col1X, y);
    doc
      .moveTo(col1X, y + 9)
      .lineTo(col1X + 160, y + 9)
      .strokeColor(RED)
      .lineWidth(1)
      .stroke();

    doc
      .fillColor(DARK)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text(data.buyer.name || 'Guest', col1X, y + 12);
    doc.fillColor(GRAY).fontSize(7).font('Helvetica').text(data.buyer.email, col1X, y + 20);

    // Sold By
    doc.fillColor(RED).fontSize(7.5).font('Helvetica-Bold').text('SOLD BY', col2X, y);
    doc
      .moveTo(col2X, y + 9)
      .lineTo(col2X + 160, y + 9)
      .strokeColor(RED)
      .lineWidth(1)
      .stroke();

    doc
      .fillColor(DARK)
      .fontSize(7.5)
      .font('Helvetica-Bold')
      .text(companyName, col2X, y + 12, { width: 160 });
    doc
      .fillColor(GRAY)
      .fontSize(7)
      .font('Helvetica')
      .text(companyAddress, col2X, y + 24, { width: 160 });
    doc.text(companyEmail, col2X, y + 32, { width: 160 });

    // Seller / Artist - skip to save space
    y += 15;

    // ── Items table ──
    // Table header
    doc.rect(col1X, y, pageW, 12).fill(DARK);
    const cols = {
      nft: col1X + 3,
      qty: col1X + 230,
      unit: col1X + 280,
      fee: col1X + 340,
      royalty: col1X + 400,
    };

    doc
      .fillColor(WHITE)
      .fontSize(6.5)
      .font('Helvetica-Bold')
      .text('NFT TITLE', cols.nft, y + 3)
      .text('QTY', cols.qty, y + 3)
      .text('UNIT PRICE', cols.unit, y + 3)
      .text('PLATFORM FEE', cols.fee, y + 3)
      .text('ROYALTY %', cols.royalty, y + 3);

    y += 12;

    // Table rows
    let subtotal = 0;
    let totalFee = 0;

    data.items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? WHITE : '#F8F9FA';
      doc.rect(col1X, y, pageW, 13).fill(rowBg);

      const unitUSD = item.unitPrice / 100;
      const feeUSD = (item.platformFee ?? 0) / 100;
      subtotal += unitUSD * item.quantity;
      totalFee += feeUSD;

      doc
        .fillColor(DARK)
        .fontSize(6.5)
        .font('Helvetica-Bold')
        .text(item.nftTitle, cols.nft, y + 3, { width: 220 });

      doc
        .font('Helvetica')
        .fontSize(6.5)
        .text(String(item.quantity), cols.qty, y + 3)
        .text(`$${unitUSD.toFixed(2)}`, cols.unit, y + 3)
        .text(feeUSD > 0 ? `$${feeUSD.toFixed(2)}` : '—', cols.fee, y + 3)
        .text(
          item.artistRoyaltyPercent != null ? `${item.artistRoyaltyPercent}%` : '—',
          cols.royalty,
          y + 3
        );

      y += 13;
    });

    // ── Totals ──
    y += 2;
    const totalPaid = subtotal + totalFee;

    const drawTotalRow = (label: string, value: string, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(col1X + pageW - 180, y, 180, 11).fill(RED);
        doc.fillColor(WHITE).fontSize(6.5).font('Helvetica-Bold');
      } else {
        doc.fillColor(DARK).fontSize(6.5).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      }
      doc.text(label, col1X + pageW - 180 + 5, y + 2);
      doc.text(value, col1X + pageW - 80, y + 2, { width: 75, align: 'right' });
      y += 11;
    };

    drawTotalRow('Subtotal', `$${subtotal.toFixed(2)}`);
    drawTotalRow('Platform Fee', `$${totalFee.toFixed(2)}`);
    drawTotalRow('TOTAL PAID', `$${totalPaid.toFixed(2)}`, true, true);

    // ── Payment Method ──
    y += 3;
    doc
      .fillColor(DARK)
      .fontSize(7)
      .font('Helvetica-Bold')
      .text('Payment Method:', col1X, y)
      .font('Helvetica')
      .text(data.paymentMethod, col1X + 85, y);

    // Skip notes to save space
    // if (data.notes) {
    //   y += 8;
    //   doc
    //     .fillColor(DARK)
    //     .fontSize(7)
    //     .font('Helvetica-Bold')
    //     .text('Notes:', col1X, y)
    //     .font('Helvetica')
    //     .text(data.notes, col1X + 35, y, { width: pageW - 35 });
    // }

    // ── Disclaimer box ──
    y += 1;
    doc.rect(col1X, y, pageW, 1).fill(LIGHT_GRAY);
    y += 3;

    doc
      .fillColor(RED)
      .fontSize(6)
      .font('Helvetica-Bold')
      .text('LEGAL / DISCLAIMER', col1X, y);
    y += 6;

    // Parse disclaimer text - split by newlines, handle bullet points (limit to 2 lines)
    const disclaimerLines = disclaimerText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 2); // Limit to first 2 lines only

    disclaimerLines.forEach((line) => {
      // If line already starts with bullet, use as-is; otherwise add bullet
      const displayLine = line.startsWith('•') ? line : `• ${line}`;
      doc.fillColor(GRAY).fontSize(5).font('Helvetica').text(displayLine, col1X + 5, y, {
        width: pageW - 5,
      });
      y += 5;
    });

    // ── Authorized by ──
    y += 1;
    doc.rect(col1X, y, pageW, 1).fill(LIGHT_GRAY);
    y += 4;

    doc
      .fillColor(DARK)
      .fontSize(6.5)
      .font('Helvetica-Bold')
      .text('Authorized by:', col1X, y)
      .font('Helvetica')
      .text(`${repName}  |  ${repTitle}`, col1X + 75, y);

    y += 9;
    doc
      .moveTo(col1X, y)
      .lineTo(col1X + 130, y)
      .strokeColor(DARK)
      .lineWidth(0.5)
      .stroke();
    doc.fillColor(GRAY).fontSize(6).text('Signature', col1X, y + 1);

    // ── Footer ──
    const footerText = companyPhone
      ? `${companyName}  •  ${companyAddress}  •  ${companyEmail}  •  ${companyPhone}`
      : `${companyName}  •  ${companyAddress}  •  ${companyEmail}`;

    doc
      .fillColor(GRAY)
      .fontSize(6)
      .text(
        footerText,
        40,
        doc.page.height - 20,
        { align: 'center', width: pageW }
      );

    doc.end();
  });
}
