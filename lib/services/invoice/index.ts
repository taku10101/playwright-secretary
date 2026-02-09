/**
 * Invoice service definition
 */

import { ServiceDefinition } from '../types';
import { invoiceActions } from './actions';

export const invoiceService: ServiceDefinition = {
  id: 'invoice',
  name: 'Invoice Generator',
  description: '請求書PDF生成サービス',
  icon: '📄',
  actions: invoiceActions,
  settings: {
    issuerName: {
      type: 'string',
      required: true,
      description: '事業者名',
      default: process.env.NEXT_PUBLIC_USERNAME,
    },
    issuerEmail: {
      type: 'string',
      required: true,
      description: 'メールアドレス',
      default: process.env.NEXT_PUBLIC_EMAIL,
    },
    issuerAddress: {
      type: 'string',
      required: true,
      description: '住所',
      default: process.env.NEXT_PUBLIC_ADDRESS,
    },
    issuerPhone: {
      type: 'string',
      required: true,
      description: '電話番号',
      default: process.env.NEXT_PUBLIC_PHONE,
    },
    bankName: {
      type: 'string',
      required: true,
      description: '銀行名',
      default: process.env.NEXT_PUBLIC_BANK_NAME,
    },
    bankBranch: {
      type: 'string',
      required: true,
      description: '支店名',
      default: process.env.NEXT_PUBLIC_BANK_BRANCH,
    },
    bankAccountType: {
      type: 'string',
      required: true,
      description: '口座種別',
      default: process.env.NEXT_PUBLIC_BANK_TYPE,
    },
    bankAccountNumber: {
      type: 'string',
      required: true,
      description: '口座番号',
      default: process.env.NEXT_PUBLIC_BANK_NUMBER,
    },
  },
};
