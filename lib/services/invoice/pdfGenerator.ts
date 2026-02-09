/**
 * PDF Invoice Generator using PDFKit
 */

import PDFDocument from 'pdfkit';
import { InvoiceData } from './types';
import { formatDate } from './dateUtils';
import * as fs from 'fs';
import * as path from 'path';

export class InvoicePDFGenerator {
  private doc: PDFKit.PDFDocument;
  private readonly pageMargin = 50;
  private currentY = 50;
  private readonly fontPath: string;

  constructor() {
    // Path to Japanese font file
    this.fontPath = path.join(process.cwd(), 'assets', 'fonts', 'ipaexg.ttf');

    this.doc = new PDFDocument({
      size: 'A4',
      margin: this.pageMargin,
    });

    // Register Japanese font
    if (fs.existsSync(this.fontPath)) {
      this.doc.registerFont('Japanese', this.fontPath);
      this.doc.font('Japanese');
    } else {
      console.warn(`Japanese font not found at ${this.fontPath}, using default font`);
    }
  }

  /**
   * Generate invoice PDF and save to file
   */
  async generate(invoiceData: InvoiceData, outputPath: string): Promise<string> {
    const stream = fs.createWriteStream(outputPath);
    this.doc.pipe(stream);

    // Draw invoice content
    this.drawHeader(invoiceData);
    this.drawClientInfo(invoiceData);
    this.drawIssuerInfo(invoiceData);
    this.drawSubject(invoiceData);
    this.drawSummaryTable(invoiceData);
    this.drawPaymentInfo(invoiceData);
    this.drawItemsTable(invoiceData);

    // Finalize PDF
    this.doc.end();

    return new Promise((resolve, reject) => {
      stream.on('finish', () => resolve(outputPath));
      stream.on('error', reject);
    });
  }

  /**
   * Draw invoice title header
   */
  private drawHeader(data: InvoiceData): void {
    this.doc
      .fontSize(24)
      .text('請求書', { align: 'center' });

    this.currentY = 100;
  }

  /**
   * Draw client information (left side)
   */
  private drawClientInfo(data: InvoiceData): void {
    const clientInfo = `${data.clientId} 様 御中`;

    this.doc
      .fontSize(14)
      .text(clientInfo, this.pageMargin, this.currentY, { width: 250 });

    this.currentY += 60;
  }

  /**
   * Draw invoice date and number (right side)
   */
  private drawIssuerInfo(data: InvoiceData): void {
    const rightX = 400;
    let y = 100;

    this.doc.fontSize(10);

    // Invoice date
    this.doc.text('請求日', rightX, y, { width: 80, align: 'left' });
    this.doc.text(formatDate(data.invoiceDate), rightX + 80, y, { align: 'right' });
    y += 20;

    // Invoice number
    this.doc.text('請求書番号', rightX, y, { width: 80, align: 'left' });
    this.doc.text(data.invoiceNumber, rightX + 80, y, { align: 'right' });
    y += 40;

    // Issuer info
    this.doc.fontSize(10);
    this.doc.text('事業所名（未設定）', rightX, y);
    y += 15;
    this.doc.text(data.issuerAddress, rightX, y, { width: 150 });
    y += 30;
  }

  /**
   * Draw subject line
   */
  private drawSubject(data: InvoiceData): void {
    this.doc
      .fontSize(12)
      .text(`件名　　${data.subject}`, this.pageMargin, this.currentY);

    this.currentY += 30;
  }

  /**
   * Draw summary table (subtotal, tax, total)
   */
  private drawSummaryTable(data: InvoiceData): void {
    const tableTop = this.currentY;
    const colWidths = [150, 150, 200];
    const rowHeight = 30;

    // Headers
    this.doc.fontSize(10);
    let x = this.pageMargin;

    this.drawTableCell('小計', x, tableTop, colWidths[0], rowHeight, true);
    x += colWidths[0];
    this.drawTableCell('消費税', x, tableTop, colWidths[1], rowHeight, true);
    x += colWidths[1];
    this.drawTableCell('請求金額', x, tableTop, colWidths[2], rowHeight, true);

    // Values
    x = this.pageMargin;
    const valueY = tableTop + rowHeight;

    this.drawTableCell(
      `${data.subtotal.toLocaleString()}円`,
      x,
      valueY,
      colWidths[0],
      rowHeight
    );
    x += colWidths[0];
    this.drawTableCell(
      `${data.tax.toLocaleString()}円`,
      x,
      valueY,
      colWidths[1],
      rowHeight
    );
    x += colWidths[1];
    this.doc.fontSize(14);
    this.drawTableCell(
      `${data.total.toLocaleString()}円`,
      x,
      valueY,
      colWidths[2],
      rowHeight
    );

    this.currentY = valueY + rowHeight + 20;
    this.doc.fontSize(10);
  }

  /**
   * Draw payment information table
   */
  private drawPaymentInfo(data: InvoiceData): void {
    const tableTop = this.currentY;
    const colWidths = [150, 350];
    const rowHeight = 30;

    // Headers and values
    let x = this.pageMargin;

    this.drawTableCell('入金期日', x, tableTop, colWidths[0], rowHeight, true);
    x += colWidths[0];
    this.drawTableCell('振込先', x, tableTop, colWidths[1], rowHeight, true);

    x = this.pageMargin;
    const valueY = tableTop + rowHeight;

    this.drawTableCell(formatDate(data.paymentDeadline), x, valueY, colWidths[0], rowHeight);
    x += colWidths[0];

    const bankInfo = `${data.bankName} ${data.bankBranch} ${data.bankAccountType} ${data.bankAccountNumber}`;
    this.drawTableCell(bankInfo, x, valueY, colWidths[1], rowHeight);

    this.currentY = valueY + rowHeight + 30;
  }

  /**
   * Draw items table
   */
  private drawItemsTable(data: InvoiceData): void {
    const tableTop = this.currentY;
    const colWidths = [200, 100, 100, 100];
    const rowHeight = 30;

    // Headers
    const headers = ['摘要', '数量', '単価', '明細金額'];
    let x = this.pageMargin;

    headers.forEach((header, i) => {
      this.drawTableCell(header, x, tableTop, colWidths[i], rowHeight, true);
      x += colWidths[i];
    });

    // Items
    let y = tableTop + rowHeight;

    data.items.forEach((item) => {
      x = this.pageMargin;

      this.drawTableCell(item.description, x, y, colWidths[0], rowHeight);
      x += colWidths[0];

      this.drawTableCell(`${item.quantity} 個`, x, y, colWidths[1], rowHeight);
      x += colWidths[1];

      this.drawTableCell(item.unitPrice.toLocaleString(), x, y, colWidths[2], rowHeight);
      x += colWidths[2];

      this.drawTableCell(item.amount.toLocaleString(), x, y, colWidths[3], rowHeight);

      y += rowHeight;
    });

    this.currentY = y + 20;
  }

  /**
   * Helper: Draw a table cell with border
   */
  private drawTableCell(
    text: string,
    x: number,
    y: number,
    width: number,
    height: number,
    isHeader: boolean = false
  ): void {
    // Draw border
    this.doc
      .rect(x, y, width, height)
      .stroke();

    // Draw text
    const textY = y + (height - 10) / 2;
    this.doc.text(text, x + 5, textY, {
      width: width - 10,
      align: isHeader ? 'center' : 'left',
    });
  }
}

/**
 * Generate invoice PDF from data
 */
export async function generateInvoicePDF(
  invoiceData: InvoiceData,
  outputPath: string
): Promise<string> {
  const generator = new InvoicePDFGenerator();
  return generator.generate(invoiceData, outputPath);
}
