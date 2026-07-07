import {
  normalizeInvoiceExtraction,
  rawInvoiceExtractionSchema,
  validateInvoiceExtractionResult,
} from '@/lib/invoice-parsing/schema';

const VENDOR_ID = '11111111-1111-4111-8111-111111111111';
const CATEGORY_ID = '22222222-2222-4222-9222-222222222222';

describe('invoice parsing schema', () => {
  it('normalizes the LLM envelope into CreateBillInput data', () => {
    const raw = rawInvoiceExtractionSchema.parse({
      data: {
        vendorId: VENDOR_ID,
        invoiceNumber: ' INV-42 ',
        invoiceDate: '2026-07-01',
        dueDate: '2026-07-31',
        amount: '150.00',
        currency: 'usd',
        description: ' July services ',
        invoiceUrl: null,
        lineItems: [
          {
            description: 'Services',
            amount: '150.00',
            categoryId: CATEGORY_ID,
          },
        ],
      },
      confidence: 0.91,
      warnings: ['Review due date.'],
      rawTextNotes: 'Visible invoice fields extracted.',
    });

    const result = normalizeInvoiceExtraction(raw);

    expect(result).toEqual({
      data: {
        vendorId: VENDOR_ID,
        invoiceNumber: 'INV-42',
        invoiceDate: '2026-07-01',
        dueDate: '2026-07-31',
        amount: '150.00',
        currency: 'USD',
        description: 'July services',
        lineItems: [
          {
            description: 'Services',
            amount: '150.00',
            categoryId: CATEGORY_ID,
          },
        ],
      },
      confidence: 0.91,
      warnings: ['Review due date.'],
      rawTextNotes: 'Visible invoice fields extracted.',
    });
  });

  it('rejects normalized data unless it passes createBillSchema', () => {
    const raw = rawInvoiceExtractionSchema.parse({
      data: {
        vendorId: VENDOR_ID,
        invoiceNumber: null,
        invoiceDate: null,
        dueDate: null,
        amount: '150.00',
        currency: 'USD',
        description: null,
        invoiceUrl: null,
        lineItems: [
          { description: 'A', amount: '100.00', categoryId: null },
        ],
      },
      confidence: null,
      warnings: null,
      rawTextNotes: null,
    });

    expect(() => validateInvoiceExtractionResult(normalizeInvoiceExtraction(raw))).toThrow(
      /sum/i,
    );
  });
});
