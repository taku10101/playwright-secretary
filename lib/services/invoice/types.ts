/**
 * Invoice-specific types and client definitions
 */

export interface ClientInfo {
  id: string;
  name: string;
  address?: string;
  honorific?: string; // 様、御中、etc.
}

export interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface InvoiceData {
  // Client information
  clientId: string;

  // Dates
  invoiceDate: Date;
  paymentDeadline: Date;

  // Invoice details
  invoiceNumber: string;
  subject: string;
  items: InvoiceItem[];

  // Amounts
  subtotal: number;
  tax: number;
  total: number;

  // User/Business information (from .env)
  issuerName: string;
  issuerAddress: string;
  issuerPhone: string;
  issuerEmail: string;

  // Bank information
  bankName: string;
  bankBranch: string;
  bankAccountType: string;
  bankAccountNumber: string;
}

// Predefined client list
export const PREDEFINED_CLIENTS: ClientInfo[] = [
  {
    id: 'trey-link',
    name: '株式会社Trey Link',
    honorific: '様 御中',
  },
  {
    id: 'sample-corp',
    name: '株式会社サンプル',
    honorific: '様 御中',
  },
  {
    id: 'example-inc',
    name: '株式会社エグザンプル',
    honorific: '様 御中',
  },
];

export function getClientById(clientId: string): ClientInfo | undefined {
  return PREDEFINED_CLIENTS.find(client => client.id === clientId);
}
