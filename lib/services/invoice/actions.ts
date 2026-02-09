/**
 * Invoice service actions
 */

import { BrowserContext } from 'playwright';
import { ServiceAction } from '../types';
import { InvoiceData, InvoiceItem, getClientById, PREDEFINED_CLIENTS } from './types';
import {
  getFirstDayOfCurrentMonth,
  getPaymentDeadline,
  generateInvoiceNumber,
} from './dateUtils';
import { generateInvoicePDF } from './pdfGenerator';
import * as path from 'path';
import * as fs from 'fs';

/**
 * Action: Generate Invoice PDF
 */
export const generateInvoiceAction: ServiceAction = {
  id: 'generate_invoice',
  name: '請求書PDF生成',
  description: '請求書PDFを生成します',
  parameters: [
    {
      name: 'clientId',
      type: 'string',
      required: true,
      description: `請求先クライアントID (${PREDEFINED_CLIENTS.map(c => c.id).join(', ')})`,
    },
    {
      name: 'subject',
      type: 'string',
      required: false,
      description: '件名',
      default: '業務委託費について',
    },
    {
      name: 'items',
      type: 'array',
      required: true,
      description: '請求項目の配列 [{description, quantity, unitPrice}]',
    },
    {
      name: 'outputDir',
      type: 'string',
      required: false,
      description: '出力ディレクトリ',
      default: './invoices',
    },
    {
      name: 'useLastBusinessDay',
      type: 'boolean',
      required: false,
      description: '支払期限を月末営業日にするか（デフォルト: 25日）',
      default: false,
    },
  ],
  execute: async (context: BrowserContext, params: Record<string, any>) => {
    // Validate client
    const client = getClientById(params.clientId);
    if (!client) {
      throw new Error(`Client not found: ${params.clientId}`);
    }

    // Get environment variables
    const issuerName = process.env.NEXT_PUBLIC_USERNAME || 'Your Name';
    const issuerEmail = process.env.NEXT_PUBLIC_EMAIL || 'your@email.com';
    const issuerAddress = process.env.NEXT_PUBLIC_ADDRESS || 'Your Address';
    const issuerPhone = process.env.NEXT_PUBLIC_PHONE || 'Your Phone';

    const bankName = process.env.NEXT_PUBLIC_BANK_NAME || 'Bank Name';
    const bankBranch = process.env.NEXT_PUBLIC_BANK_BRANCH || 'Branch';
    const bankAccountType = process.env.NEXT_PUBLIC_BANK_TYPE || '普通';
    const bankAccountNumber = process.env.NEXT_PUBLIC_BANK_NUMBER || '0000000';

    // Calculate dates
    const invoiceDate = getFirstDayOfCurrentMonth();
    const paymentDeadline = getPaymentDeadline(
      invoiceDate,
      params.useLastBusinessDay || false
    );

    // Parse items
    const items: InvoiceItem[] = params.items.map((item: any) => ({
      description: item.description,
      quantity: item.quantity,
      unitPrice: item.unitPrice,
      amount: item.quantity * item.unitPrice,
    }));

    // Calculate totals
    const subtotal = items.reduce((sum, item) => sum + item.amount, 0);
    const tax = 0; // No tax in the example
    const total = subtotal + tax;

    // Generate invoice number
    const invoiceNumber = generateInvoiceNumber(invoiceDate, 1);

    // Prepare invoice data
    const invoiceData: InvoiceData = {
      clientId: client.name,
      invoiceDate,
      paymentDeadline,
      invoiceNumber,
      subject: params.subject || '業務委託費について',
      items,
      subtotal,
      tax,
      total,
      issuerName,
      issuerAddress,
      issuerPhone,
      issuerEmail,
      bankName,
      bankBranch,
      bankAccountType,
      bankAccountNumber,
    };

    // Ensure output directory exists
    const outputDir = params.outputDir || './invoices';
    if (!fs.existsSync(outputDir)) {
      fs.mkdirSync(outputDir, { recursive: true });
    }

    // Generate PDF
    const outputFileName = `invoice_${invoiceNumber}.pdf`;
    const outputPath = path.join(outputDir, outputFileName);

    await generateInvoicePDF(invoiceData, outputPath);

    return {
      success: true,
      message: '請求書PDFを生成しました',
      invoiceNumber,
      outputPath,
      total,
    };
  },
};

/**
 * Action: List available clients
 */
export const listClientsAction: ServiceAction = {
  id: 'list_clients',
  name: 'クライアント一覧',
  description: '請求先クライアントの一覧を取得します',
  parameters: [],
  execute: async (context: BrowserContext, params: Record<string, any>) => {
    return {
      success: true,
      clients: PREDEFINED_CLIENTS,
    };
  },
};

export const invoiceActions = [generateInvoiceAction, listClientsAction];
