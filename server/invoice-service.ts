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
    // Use autoFirstPage: false so we control page creation
    const doc = new PDFDocument({
      size: 'A4',
      margins: { top: 50, bottom: 50, left: 60, right: 60 },
      autoFirstPage: false,
    });

    const chunks: Buffer[] = [];
    const stream = new PassThrough();

    stream.on('data', (chunk: Buffer) => chunks.push(chunk));
    stream.on('end', () => resolve(Buffer.concat(chunks)));
    stream.on('error', reject);

    doc.pipe(stream);

    // Add the first (and only) page
    doc.addPage();

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

    const pageW = doc.page.width - 120; // usable width
    const pageH = doc.page.height;

    // ── Header band ──
    doc.rect(0, 0, doc.page.width, 110).fill(DARK);

    // Add company logo if available
    if (logoBuffer) {
      try {
        doc.image(logoBuffer, 60, 20, { width: 70, height: 70 });
      } catch (err) {
        // Silently fail if logo can't be rendered
      }
    }

    doc
      .fillColor(WHITE)
      .fontSize(28)
      .font('Helvetica-Bold')
      .text('INVOICE', logoBuffer ? 140 : 60, 35);

    doc
      .fillColor(RED)
      .fontSize(11)
      .font('Helvetica')
      .text(companyName, logoBuffer ? 140 : 60, 68);

    const headerSubLine = companyPhone
      ? `${companyAddress}  |  ${companyEmail}  |  ${companyPhone}`
      : `${companyAddress}  |  ${companyEmail}`;

    doc
      .fillColor('#BDC3C7')
      .fontSize(9)
      .text(headerSubLine, logoBuffer ? 140 : 60, 84);

    // Invoice meta (top-right)
    const metaX = 370;
    doc
      .fillColor(WHITE)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Invoice No.:', metaX, 38)
      .font('Helvetica')
      .text(data.invoiceNo, metaX + 70, 38);

    doc
      .font('Helvetica-Bold')
      .text('Date:', metaX, 54)
      .font('Helvetica')
      .text(data.date, metaX + 70, 54);

    // ── Bill To / Sold By ──
    let y = 130;

    // Two-column layout
    const col1X = 60;
    const col2X = 310;

    // Bill To
    doc.fillColor(RED).fontSize(10).font('Helvetica-Bold').text('BILL TO', col1X, y);
    doc
      .moveTo(col1X, y + 13)
      .lineTo(col1X + 200, y + 13)
      .strokeColor(RED)
      .lineWidth(1)
      .stroke();

    doc
      .fillColor(DARK)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(data.buyer.name || 'Guest', col1X, y + 20);
    doc.fillColor(GRAY).fontSize(9).font('Helvetica').text(data.buyer.email, col1X, y + 35);

    // Sold By
    doc.fillColor(RED).fontSize(10).font('Helvetica-Bold').text('SOLD BY', col2X, y);
    doc
      .moveTo(col2X, y + 13)
      .lineTo(col2X + 200, y + 13)
      .strokeColor(RED)
      .lineWidth(1)
      .stroke();

    doc
      .fillColor(DARK)
      .fontSize(10)
      .font('Helvetica-Bold')
      .text(companyName, col2X, y + 20, { width: 200 });
    doc
      .fillColor(GRAY)
      .fontSize(9)
      .font('Helvetica')
      .text(companyAddress, col2X, y + 40, { width: 200 });
    doc.text(companyEmail, col2X, y + 53, { width: 200 });

    // Seller / Artist
    if (sellerArtist) {
      y += 80;
      doc.fillColor(RED).fontSize(10).font('Helvetica-Bold').text('SELLER / ARTIST', col1X, y);
      doc
        .moveTo(col1X, y + 13)
        .lineTo(col1X + 200, y + 13)
        .strokeColor(RED)
        .lineWidth(1)
        .stroke();
      doc
        .fillColor(DARK)
        .fontSize(10)
        .font('Helvetica-Bold')
        .text(sellerArtist, col1X, y + 20);
      y += 65;
    } else {
      y += 80;
    }

    // ── Items table ──
    // Table header
    doc.rect(col1X, y, pageW, 22).fill(DARK);
    const cols = {
      nft: col1X + 6,
      qty: col1X + 270,
      unit: col1X + 330,
      fee: col1X + 400,
      royalty: col1X + 470,
    };

    doc
      .fillColor(WHITE)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('NFT TITLE', cols.nft, y + 7)
      .text('QTY', cols.qty, y + 7)
      .text('UNIT PRICE', cols.unit, y + 7)
      .text('PLATFORM FEE', cols.fee, y + 7)
      .text('ROYALTY %', cols.royalty, y + 7);

    y += 22;

    // Table rows
    let subtotal = 0;
    let totalFee = 0;

    data.items.forEach((item, idx) => {
      const rowBg = idx % 2 === 0 ? WHITE : '#F8F9FA';
      doc.rect(col1X, y, pageW, 28).fill(rowBg);

      const unitUSD = item.unitPrice / 100;
      const feeUSD = (item.platformFee ?? 0) / 100;
      subtotal += unitUSD * item.quantity;
      totalFee += feeUSD;

      doc
        .fillColor(DARK)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text(item.nftTitle, cols.nft, y + 9, { width: 255 });

      doc
        .font('Helvetica')
        .text(String(item.quantity), cols.qty, y + 9)
        .text(`$${unitUSD.toFixed(2)}`, cols.unit, y + 9)
        .text(feeUSD > 0 ? `$${feeUSD.toFixed(2)}` : '—', cols.fee, y + 9)
        .text(
          item.artistRoyaltyPercent != null ? `${item.artistRoyaltyPercent}%` : '—',
          cols.royalty,
          y + 9
        );

      y += 28;
    });

    // ── Totals ──
    y += 10;
    const totalPaid = subtotal + totalFee;

    const drawTotalRow = (label: string, value: string, bold = false, highlight = false) => {
      if (highlight) {
        doc.rect(col1X + pageW - 220, y, 220, 22).fill(RED);
        doc.fillColor(WHITE).fontSize(10).font('Helvetica-Bold');
      } else {
        doc.fillColor(DARK).fontSize(9).font(bold ? 'Helvetica-Bold' : 'Helvetica');
      }
      doc.text(label, col1X + pageW - 220 + 8, y + 6);
      doc.text(value, col1X + pageW - 100, y + 6, { width: 90, align: 'right' });
      y += 22;
    };

    drawTotalRow('Subtotal', `$${subtotal.toFixed(2)}`);
    drawTotalRow('Platform Fee', `$${totalFee.toFixed(2)}`);
    drawTotalRow('TOTAL PAID', `$${totalPaid.toFixed(2)}`, true, true);

    // ── Payment Method ──
    y += 15;
    doc
      .fillColor(DARK)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Payment Method:', col1X, y)
      .font('Helvetica')
      .text(data.paymentMethod, col1X + 100, y);

    if (data.notes) {
      y += 18;
      doc
        .fillColor(DARK)
        .fontSize(9)
        .font('Helvetica-Bold')
        .text('Notes:', col1X, y)
        .font('Helvetica')
        .text(data.notes, col1X + 50, y, { width: pageW - 50 });
    }

    // ── Disclaimer box ──
    y += 30;
    doc.rect(col1X, y, pageW, 1).fill(LIGHT_GRAY);
    y += 8;

    doc
      .fillColor(RED)
      .fontSize(8.5)
      .font('Helvetica-Bold')
      .text('LEGAL / DISCLAIMER', col1X, y);
    y += 14;

    // Parse disclaimer text - split by newlines, handle bullet points
    const disclaimerLines = disclaimerText
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);

    disclaimerLines.forEach((line) => {
      // If line already starts with bullet, use as-is; otherwise add bullet
      const displayLine = line.startsWith('•') ? line : `• ${line}`;
      doc.fillColor(GRAY).fontSize(7.5).font('Helvetica').text(displayLine, col1X + 8, y, {
        width: pageW - 8,
      });
      y += 13;
    });

    // ── Authorized by ──
    y += 12;
    doc.rect(col1X, y, pageW, 1).fill(LIGHT_GRAY);
    y += 10;

    doc
      .fillColor(DARK)
      .fontSize(9)
      .font('Helvetica-Bold')
      .text('Authorized by:', col1X, y)
      .font('Helvetica')
      .text(`${repName}  |  ${repTitle}`, col1X + 90, y);

    y += 20;
    doc
      .moveTo(col1X, y)
      .lineTo(col1X + 160, y)
      .strokeColor(DARK)
      .lineWidth(0.5)
      .stroke();
    doc.fillColor(GRAY).fontSize(8).text('Signature', col1X, y + 4);

    // ── Footer: render right after content, not at fixed page bottom ──
    y += 25;
    const footerText = companyPhone
      ? `${companyName}  •  ${companyAddress}  •  ${companyEmail}  •  ${companyPhone}`
      : `${companyName}  •  ${companyAddress}  •  ${companyEmail}`;

    doc
      .fillColor(GRAY)
      .fontSize(7.5)
      .text(
        footerText,
        col1X,
        y,
        { align: 'center', width: pageW }
      );

    doc.end();
  });
}
