/**
 * Test script for invoice PDF generation
 */

import { chromium } from 'playwright';
import { invoiceService } from '../lib/services/invoice';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

async function testInvoiceGeneration() {
  console.log('🧪 Testing Invoice PDF Generation\n');

  // Create a browser context (required by action interface, but not used)
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext();

  try {
    // Test 1: List available clients
    console.log('📋 Test 1: List Available Clients');
    const listClientsAction = invoiceService.actions.find(
      (action) => action.id === 'list_clients'
    );

    if (listClientsAction) {
      const clientsResult = await listClientsAction.execute(context, {});
      console.log('Available clients:', JSON.stringify(clientsResult, null, 2));
      console.log('✅ Test 1 passed\n');
    }

    // Test 2: Generate invoice for Trey Link
    console.log('📄 Test 2: Generate Invoice for Trey Link');
    const generateAction = invoiceService.actions.find(
      (action) => action.id === 'generate_invoice'
    );

    if (generateAction) {
      const result = await generateAction.execute(context, {
        clientId: 'trey-link',
        subject: '業務委託費について',
        items: [
          {
            description: 'Home Logソフトウェア開発業務委託費用',
            quantity: 1,
            unitPrice: 175000,
          },
        ],
        outputDir: './invoices',
        useLastBusinessDay: false, // Use 25th as deadline
      });

      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('✅ Test 2 passed\n');
    }

    // Test 3: Generate invoice with multiple items
    console.log('📄 Test 3: Generate Invoice with Multiple Items');
    if (generateAction) {
      const result = await generateAction.execute(context, {
        clientId: 'sample-corp',
        subject: 'システム開発費用について',
        items: [
          {
            description: 'フロントエンド開発',
            quantity: 2,
            unitPrice: 80000,
          },
          {
            description: 'バックエンド開発',
            quantity: 1,
            unitPrice: 100000,
          },
          {
            description: 'デザイン作成',
            quantity: 1,
            unitPrice: 50000,
          },
        ],
        outputDir: './invoices',
        useLastBusinessDay: true, // Use last business day as deadline
      });

      console.log('Result:', JSON.stringify(result, null, 2));
      console.log('✅ Test 3 passed\n');
    }

    console.log('🎉 All tests completed successfully!');
    console.log('\n📂 Check the ./invoices directory for generated PDFs');
  } catch (error) {
    console.error('❌ Test failed:', error);
    throw error;
  } finally {
    await context.close();
    await browser.close();
  }
}

// Run tests
testInvoiceGeneration().catch(console.error);
